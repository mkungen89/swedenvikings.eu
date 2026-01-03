// ============================================
// Game Server Manager - Main orchestrator
// ============================================

import { EventEmitter } from 'events';
import { prisma } from '../../utils/prisma';
import { logger } from '../../utils/logger';
import { cache } from '../../utils/redis';
import {
  ServerConnection,
  ServerLocationType,
  ServerStatusInfo,
  OnlinePlayer,
  InstallProgress,
  ServerConfig,
  ExecutorInterface,
  ServerLogEntry,
} from './types';
import { LocalExecutor } from './LocalExecutor';
import { SSHExecutor } from './SSHExecutor';
import { SteamCMDService } from './SteamCMDService';
import { ArmaReforgerServer } from './ArmaReforgerServer';
import { GameServerQuery } from './GameServerQuery';

interface ManagedServer {
  connection: ServerConnection;
  executor: ExecutorInterface;
  steamCmd: SteamCMDService;
  server: ArmaReforgerServer;
  query: GameServerQuery;
}

class GameServerManager extends EventEmitter {
  private servers: Map<string, ManagedServer> = new Map();
  private statusInterval: NodeJS.Timeout | null = null;
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    logger.info('Initializing Game Server Manager...');

    // Load server connections from database
    await this.loadConnections();

    // Start status polling
    this.startStatusPolling();

    this.initialized = true;
    logger.info('Game Server Manager initialized');
  }

  private async loadConnections(): Promise<void> {
    try {
      // Check if ServerConnection table exists (it might not in initial schema)
      const connections = await prisma.$queryRaw<ServerConnection[]>`
        SELECT * FROM "ServerConnection" ORDER BY "isDefault" DESC, "createdAt" ASC
      `.catch(() => []);

      for (const conn of connections) {
        await this.addConnection(conn, false);
      }
    } catch (error) {
      logger.warn('No server connections configured yet');
    }
  }

  async addConnection(connection: ServerConnection, save: boolean = true): Promise<boolean> {
    try {
      // Create executor based on type
      let executor: ExecutorInterface;
      if (connection.type === 'local') {
        executor = new LocalExecutor();
      } else {
        executor = new SSHExecutor(connection);
      }

      // Connect
      await executor.connect();

      // Determine platform
      const sysInfo = await executor.getSystemInfo();
      const platform = sysInfo.platform.toLowerCase().includes('win') ? 'windows' : 'linux';

      // Create services
      const steamCmdPath = connection.steamCmdPath || 
        (platform === 'windows' ? 'C:\\steamcmd' : '/opt/steamcmd');
      
      const steamCmd = new SteamCMDService(
        executor,
        steamCmdPath,
        connection.serverPath,
        platform
      );

      const server = new ArmaReforgerServer(
        executor,
        connection.serverPath,
        platform
      );

      const query = new GameServerQuery(
        connection.type === 'local' ? '127.0.0.1' : connection.host
      );

      // Forward events
      steamCmd.on('progress', (progress: InstallProgress) => {
        this.emit('install-progress', { connectionId: connection.id, progress });
      });

      server.on('status', (status: string) => {
        this.emit('server-status', { connectionId: connection.id, status });
      });

      // Store
      this.servers.set(connection.id, {
        connection,
        executor,
        steamCmd,
        server,
        query,
      });

      // Save to database if requested
      if (save) {
        await this.saveConnection(connection);
      }

      logger.info(`Added server connection: ${connection.name} (${connection.type})`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to add connection ${connection.name}:`, error.message);
      return false;
    }
  }

  private async saveConnection(connection: ServerConnection): Promise<void> {
    // This would save to database - for now we'll use ServerConfig table
    const configData = JSON.stringify(connection);
    await prisma.serverConfig.upsert({
      where: { key: `connection_${connection.id}` },
      update: { value: configData },
      create: { key: `connection_${connection.id}`, value: configData },
    });
  }

  async removeConnection(connectionId: string): Promise<boolean> {
    const managed = this.servers.get(connectionId);
    if (!managed) return false;

    try {
      // Stop server if running
      if (await managed.server.isRunning()) {
        await managed.server.stop();
      }

      // Disconnect executor
      await managed.executor.disconnect();

      // Remove from map
      this.servers.delete(connectionId);

      // Remove from database
      await prisma.serverConfig.delete({
        where: { key: `connection_${connectionId}` },
      }).catch(() => {});

      logger.info(`Removed server connection: ${connectionId}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to remove connection:`, error.message);
      return false;
    }
  }

  getConnection(connectionId: string): ManagedServer | undefined {
    return this.servers.get(connectionId);
  }

  getDefaultConnection(): ManagedServer | undefined {
    for (const [, managed] of this.servers) {
      if (managed.connection.isDefault) {
        return managed;
      }
    }
    // Return first if no default
    return this.servers.values().next().value;
  }

  getAllConnections(): ServerConnection[] {
    return Array.from(this.servers.values()).map(m => m.connection);
  }

  // ============ Server Operations ============

  async installServer(connectionId?: string): Promise<boolean> {
    const managed = connectionId 
      ? this.servers.get(connectionId) 
      : this.getDefaultConnection();

    if (!managed) {
      throw new Error('No server connection configured');
    }

    return managed.steamCmd.installOrUpdateServer();
  }

  async updateServer(connectionId?: string): Promise<boolean> {
    return this.installServer(connectionId); // Same as install with validate
  }

  async startServer(connectionId?: string): Promise<boolean> {
    const managed = connectionId 
      ? this.servers.get(connectionId) 
      : this.getDefaultConnection();

    if (!managed) {
      throw new Error('No server connection configured');
    }

    return managed.server.start();
  }

  async stopServer(connectionId?: string): Promise<boolean> {
    const managed = connectionId 
      ? this.servers.get(connectionId) 
      : this.getDefaultConnection();

    if (!managed) {
      throw new Error('No server connection configured');
    }

    return managed.server.stop();
  }

  async restartServer(connectionId?: string): Promise<boolean> {
    const managed = connectionId 
      ? this.servers.get(connectionId) 
      : this.getDefaultConnection();

    if (!managed) {
      throw new Error('No server connection configured');
    }

    return managed.server.restart();
  }

  async getServerStatus(connectionId?: string): Promise<ServerStatusInfo> {
    const managed = connectionId 
      ? this.servers.get(connectionId) 
      : this.getDefaultConnection();

    if (!managed) {
      return {
        status: 'offline',
        isOnline: false,
        players: 0,
        maxPlayers: 64,
        map: 'Unknown',
        mission: 'Unknown',
        version: '',
        uptime: 0,
        cpu: 0,
        memory: 0,
        memoryUsed: 0,
        memoryTotal: 0,
        ping: 0,
        lastUpdated: new Date(),
      };
    }

    // Try cache first
    const cacheKey = `server:status:${managed.connection.id}`;
    const cached = await cache.get<ServerStatusInfo>(cacheKey);
    if (cached) return cached;

    // Get status from server
    const status = await managed.server.getStatus();

    // Try to get player info from query
    try {
      const queryResult = await managed.query.query();
      if (queryResult.online) {
        status.players = queryResult.info.players || 0;
        status.ping = queryResult.info.ping || 0;
        status.map = queryResult.info.map || status.map;
      }
    } catch {
      // Query failed, use process-based status
    }

    // Cache for 5 seconds
    await cache.set(cacheKey, status, 5);

    return status;
  }

  async getOnlinePlayers(connectionId?: string): Promise<OnlinePlayer[]> {
    const managed = connectionId
      ? this.servers.get(connectionId)
      : this.getDefaultConnection();

    if (!managed) return [];

    try {
      // First, try to get players from query
      const queryPlayers = await managed.query.getPlayers();

      // If query returned players with SteamIDs, use those
      if (queryPlayers.length > 0 && queryPlayers.some(p => p.steamId)) {
        return queryPlayers;
      }

      // Otherwise, try to parse from log files (better for Arma Reforger)
      const logPlayers = await managed.server.getPlayersFromLog();
      if (logPlayers.length > 0) {
        return logPlayers;
      }

      // Fallback to query players (even without SteamID)
      return queryPlayers;
    } catch (error) {
      logger.error('Failed to get online players:', error);
      return [];
    }
  }

  async getServerConfig(connectionId?: string): Promise<ServerConfig | null> {
    const managed = connectionId 
      ? this.servers.get(connectionId) 
      : this.getDefaultConnection();

    if (!managed) return null;

    await managed.server.loadConfig();
    return managed.server.getConfig();
  }

  async updateServerConfig(config: Partial<ServerConfig>, connectionId?: string): Promise<boolean> {
    const managed = connectionId 
      ? this.servers.get(connectionId) 
      : this.getDefaultConnection();

    if (!managed) return false;

    managed.server.updateConfig(config);
    await managed.server.saveConfig();
    return true;
  }

  async getServerLogs(lines: number = 100, connectionId?: string): Promise<ServerLogEntry[]> {
    const managed = connectionId 
      ? this.servers.get(connectionId) 
      : this.getDefaultConnection();

    if (!managed) return [];

    return managed.server.getLogs(lines);
  }

  async getLogDirs(connectionId?: string): Promise<string[]> {
    const managed = connectionId 
      ? this.servers.get(connectionId) 
      : this.getDefaultConnection();

    if (!managed) return [];

    return managed.server.getAllLogDirs();
  }

  async getLogFiles(dir: string, connectionId?: string): Promise<string[]> {
    const managed = connectionId 
      ? this.servers.get(connectionId) 
      : this.getDefaultConnection();

    if (!managed) return [];

    return managed.server.getLogFiles(dir);
  }

  async readLogFile(dir: string, file: string, lines: number = 500, connectionId?: string): Promise<string> {
    const managed = connectionId 
      ? this.servers.get(connectionId) 
      : this.getDefaultConnection();

    if (!managed) return '';

    return managed.server.readLogFile(dir, file, lines);
  }

  async sendCommand(command: string, connectionId?: string): Promise<string> {
    const managed = connectionId 
      ? this.servers.get(connectionId) 
      : this.getDefaultConnection();

    if (!managed) {
      throw new Error('No server connection configured');
    }

    return managed.server.sendCommand(command);
  }

  async isServerInstalled(connectionId?: string): Promise<boolean> {
    const managed = connectionId 
      ? this.servers.get(connectionId) 
      : this.getDefaultConnection();

    if (!managed) return false;

    return managed.steamCmd.isServerInstalled();
  }

  async isSteamCMDInstalled(connectionId?: string): Promise<boolean> {
    const managed = connectionId
      ? this.servers.get(connectionId)
      : this.getDefaultConnection();

    if (!managed) return false;

    return managed.steamCmd.isSteamCMDInstalled();
  }

  async getGameVersion(connectionId?: string): Promise<string | null> {
    const managed = connectionId
      ? this.servers.get(connectionId)
      : this.getDefaultConnection();

    if (!managed) return null;

    return managed.server.getGameVersion();
  }

  // ============ Status Polling ============

  private startStatusPolling(): void {
    if (this.statusInterval) return;

    this.statusInterval = setInterval(async () => {
      for (const [id, managed] of this.servers) {
        try {
          const status = await this.getServerStatus(id);
          this.emit('status-update', { connectionId: id, status });
        } catch (error) {
          logger.debug(`Status poll failed for ${id}`);
        }
      }
    }, 10000); // Poll every 10 seconds
  }

  stopStatusPolling(): void {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = null;
    }
  }

  // ============ Cleanup ============

  async shutdown(): Promise<void> {
    this.stopStatusPolling();

    for (const [, managed] of this.servers) {
      try {
        await managed.executor.disconnect();
      } catch {}
    }

    this.servers.clear();
    this.initialized = false;
    logger.info('Game Server Manager shut down');
  }
}

// Singleton instance
export const gameServerManager = new GameServerManager();

