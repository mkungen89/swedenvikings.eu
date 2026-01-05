// ============================================
// Arma Reforger Server Manager
// ============================================

import { EventEmitter } from 'events';
import * as path from 'path';
import {
  ExecutorInterface,
  ServerConfig,
  ServerStatusInfo,
  ServerStatus,
  OnlinePlayer,
  ServerLogEntry,
  ProcessInfo,
} from './types';
import { logger } from '../../utils/logger';

const DEFAULT_CONFIG: ServerConfig = {
  name: 'Sweden Vikings Server',
  password: '',
  adminPassword: '',
  admins: [],
  bindAddress: '0.0.0.0',
  bindPort: 2001,
  publicAddress: '',
  publicPort: 2001,
  a2sQueryEnabled: true,
  steamQueryPort: 17777,
  steamQueryAddress: '',
  rconEnabled: false,
  rconPort: 19999,
  rconPassword: '',
  scenarioId: '{ECC61978EDCC2B5A}Missions/23_Campaign.conf',
  maxPlayers: 64,
  visible: true,
  crossPlatform: false,
  supportedPlatforms: [],
  serverMaxViewDistance: 2500,
  serverMinGrassDistance: 50,
  networkViewDistance: 1000,
  disableThirdPerson: false,
  fastValidation: true,
  battlEye: true,
  lobbyPlayerSynchronise: false,
  aiLimit: -1,
  playerSaveTime: 120,
  vonDisableUI: false,
  vonDisableDirectSpeechUI: false,
  missionHeader: {},
  mods: [],
};

export class ArmaReforgerServer extends EventEmitter {
  private executor: ExecutorInterface;
  private serverPath: string;
  private config: ServerConfig;
  private platform: 'linux' | 'windows';
  private serverPid: number | null = null;
  private status: ServerStatus = 'offline';
  private logWatcher: any = null;

  constructor(
    executor: ExecutorInterface,
    serverPath: string,
    platform: 'linux' | 'windows' = 'linux',
    config?: Partial<ServerConfig>
  ) {
    super();
    this.executor = executor;
    this.serverPath = serverPath;
    this.platform = platform;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getConfig(): ServerConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ServerConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  private getExecutablePath(): string {
    const exe = this.platform === 'windows' ? 'ArmaReforgerServer.exe' : 'ArmaReforgerServer';
    return path.join(this.serverPath, exe);
  }

  private getConfigPath(): string {
    return path.join(this.serverPath, 'server.json');
  }

  private getLogPath(): string {
    // Arma Reforger stores logs in profile/logs/logs_YYYY-MM-DD_HH-MM-SS/console.log
    return path.join(this.serverPath, 'profile', 'logs');
  }

  async getLatestLogDir(): Promise<string | null> {
    try {
      const logsDir = this.getLogPath();
      if (!(await this.executor.fileExists(logsDir))) {
        return null;
      }

      // List directories and find the latest one
      const command = this.platform === 'windows'
        ? `powershell -Command "Get-ChildItem '${logsDir}' -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName"`
        : `ls -td "${logsDir}"/logs_* 2>/dev/null | head -1`;

      const result = await this.executor.exec(command);
      if (result.success && result.output.trim()) {
        return result.output.trim();
      }
      return null;
    } catch {
      return null;
    }
  }

  async getLatestConsoleLog(): Promise<string | null> {
    const logDir = await this.getLatestLogDir();
    if (!logDir) return null;

    const consolePath = path.join(logDir, 'console.log');
    if (await this.executor.fileExists(consolePath)) {
      return consolePath;
    }
    return null;
  }

  // Get server game version from console log
  async getGameVersion(): Promise<string | null> {
    try {
      const logPath = await this.getLatestConsoleLog();
      if (!logPath) {
        logger.debug('No console log found for version detection');
        return null;
      }

      // Read first 200 lines to find version
      const command = this.platform === 'windows'
        ? `powershell -Command "Get-Content '${logPath}' -Head 200 | Select-String -Pattern 'version [0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+' | Select-Object -First 1"`
        : `head -200 "${logPath}" | grep -oE 'version [0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+' | head -1`;

      const result = await this.executor.exec(command);
      if (result.success && result.output.trim()) {
        // Extract version number from output like "version 1.6.0.95"
        const match = result.output.match(/version\s*(\d+\.\d+\.\d+\.\d+)/i);
        if (match) {
          logger.info(`Detected server version: ${match[1]}`);
          return match[1];
        }
      }

      logger.debug('Could not find version in console log');
      return null;
    } catch (error) {
      logger.error('Failed to get game version:', error);
      return null;
    }
  }

  // Parse players from console log
  async getPlayersFromLog(): Promise<OnlinePlayer[]> {
    try {
      const logPath = await this.getLatestConsoleLog();
      if (!logPath) {
        return [];
      }

      // Read last 1000 lines to find player connect/disconnect events
      const command = this.platform === 'windows'
        ? `powershell -Command "Get-Content '${logPath}' -Tail 1000"`
        : `tail -1000 "${logPath}"`;

      const result = await this.executor.exec(command);
      if (!result.success || !result.output.trim()) {
        return [];
      }

      // Track players by connectionID and their info
      const connections = new Map<number, { name: string; identityId: string; playerId?: number }>();
      const activeConnections = new Set<number>();
      const lines = result.output.trim().split('\n');

      for (const line of lines) {
        // Arma Reforger actual log formats:
        // Connect: "[NETWORK][NETWORK] Player connected: connectionID=0"
        // Connecting: "[NETWORK][NETWORK] ### Connecting player: connectionID=0, Name="
        // Update: "[NETWORK][NETWORK] ### Updating player: PlayerId=1, Name=ExiliM, rplIdentity=0x00000000, IdentityId=a3918e8f-6b89-440c-bebf-4f2a018af702"
        // Disconnect: "[NETWORK][NETWORK] Player disconnected: connectionID=0"

        // Match player connected
        let match = line.match(/Player connected:\s*connectionID=(\d+)/i);
        if (match) {
          const connectionId = parseInt(match[1]);
          activeConnections.add(connectionId);
          continue;
        }

        // Match player disconnected
        match = line.match(/Player disconnected:\s*connectionID=(\d+)/i);
        if (match) {
          const connectionId = parseInt(match[1]);
          activeConnections.delete(connectionId);
          connections.delete(connectionId);
          continue;
        }

        // Match "Connecting player" with name
        match = line.match(/###\s*Connecting player:\s*connectionID=(\d+),\s*Name=(.+?)(?:\s|$)/i);
        if (match) {
          const [, connectionId, name] = match;
          const connId = parseInt(connectionId);
          if (name && name.trim()) {
            connections.set(connId, {
              name: name.trim(),
              identityId: '',
            });
          }
          continue;
        }

        // Match "Updating player" with full details
        match = line.match(/###\s*Updating player:\s*PlayerId=(\d+),\s*Name=([^,]+),.*?IdentityId=([a-f0-9-]+)/i);
        if (match) {
          const [, playerId, name, identityId] = match;
          const playerIdNum = parseInt(playerId);

          // Find connection for this player
          // Usually PlayerId matches connectionID, or it's the most recent connection
          let targetConnection = playerIdNum;
          if (!activeConnections.has(targetConnection) && activeConnections.size > 0) {
            targetConnection = Math.max(...Array.from(activeConnections));
          }

          if (activeConnections.has(targetConnection)) {
            connections.set(targetConnection, {
              name: name.trim(),
              identityId: identityId.trim(),
              playerId: playerIdNum,
            });
          }
          continue;
        }
      }

      // Convert to OnlinePlayer format
      const players: OnlinePlayer[] = [];
      for (const [connectionId, info] of connections.entries()) {
        if (activeConnections.has(connectionId) && info.name) {
          players.push({
            name: info.name,
            steamId: info.identityId || `conn_${connectionId}`,
            joinedAt: new Date(),
            ping: 0,
          });
        }
      }

      return players;
    } catch (error) {
      logger.error('Failed to get players from log:', error);
      return [];
    }
  }

  async getAllLogDirs(): Promise<string[]> {
    try {
      const logsDir = this.getLogPath();
      if (!(await this.executor.fileExists(logsDir))) {
        return [];
      }

      const command = this.platform === 'windows'
        ? `powershell -Command "Get-ChildItem '${logsDir}' -Directory | Sort-Object LastWriteTime -Descending | Select-Object -ExpandProperty Name"`
        : `ls -td "${logsDir}"/logs_* 2>/dev/null | xargs -n1 basename`;

      const result = await this.executor.exec(command);
      if (result.success && result.output.trim()) {
        return result.output.trim().split('\n').filter(d => d.startsWith('logs_'));
      }
      return [];
    } catch {
      return [];
    }
  }

  async getLogFiles(logDir: string): Promise<string[]> {
    try {
      const fullPath = path.join(this.getLogPath(), logDir);
      const command = this.platform === 'windows'
        ? `powershell -Command "Get-ChildItem '${fullPath}' -File | Select-Object -ExpandProperty Name"`
        : `ls "${fullPath}" 2>/dev/null`;

      const result = await this.executor.exec(command);
      if (result.success && result.output.trim()) {
        return result.output.trim().split('\n').filter(f => f.endsWith('.log'));
      }
      return [];
    } catch {
      return [];
    }
  }

  async readLogFile(logDir: string, fileName: string, lines: number = 500): Promise<string> {
    try {
      const fullPath = path.join(this.getLogPath(), logDir, fileName);
      if (!(await this.executor.fileExists(fullPath))) {
        return '';
      }

      const command = this.platform === 'windows'
        ? `powershell -Command "Get-Content '${fullPath}' -Tail ${lines}"`
        : `tail -n ${lines} "${fullPath}"`;

      const result = await this.executor.exec(command);
      return result.success ? result.output : '';
    } catch {
      return '';
    }
  }

  private generateConfigJson(): string {
    // Generate Arma Reforger server.json format
    // Reference: https://community.bistudio.com/wiki/Arma_Reforger:Server_Config
    const config: any = {
      bindAddress: this.config.bindAddress || '0.0.0.0',
      bindPort: this.config.bindPort || 2001,
      publicAddress: this.config.publicAddress || '',
      publicPort: this.config.publicPort || this.config.bindPort || 2001,
      a2s: {
        address: this.config.steamQueryAddress || this.config.publicAddress || '',
        port: this.config.steamQueryPort || 17777,
      },
      game: {
        name: this.config.name,
        password: this.config.password || '',
        passwordAdmin: this.config.adminPassword || '',
        admins: this.config.admins || [],
        scenarioId: this.config.scenarioId,
        maxPlayers: this.config.maxPlayers,
        visible: this.config.visible,
        supportedPlatforms: this.config.supportedPlatforms || [],
        gameProperties: {
          serverMaxViewDistance: this.config.serverMaxViewDistance,
          serverMinGrassDistance: this.config.serverMinGrassDistance,
          networkViewDistance: this.config.networkViewDistance,
          disableThirdPerson: this.config.disableThirdPerson,
          fastValidation: this.config.fastValidation,
          battlEye: this.config.battlEye,
          VONDisableUI: this.config.vonDisableUI,
          VONDisableDirectSpeechUI: this.config.vonDisableDirectSpeechUI,
          missionHeader: this.config.missionHeader || {},
        },
        mods: this.config.mods.filter(m => m.enabled).map(m => ({
          modId: m.modId,
          name: m.name,
          version: m.version || '',
        })),
      },
      operating: {
        lobbyPlayerSynchronise: this.config.lobbyPlayerSynchronise,
        playerSaveTime: this.config.playerSaveTime || 120,
        aiLimit: this.config.aiLimit ?? -1,
      },
    };

    // Add RCON if enabled
    if (this.config.rconEnabled && this.config.rconPassword) {
      config.rcon = {
        address: this.config.rconAddress || '',
        port: this.config.rconPort || 19999,
        password: this.config.rconPassword,
        permission: this.config.rconPermission || 'monitor',
        blacklist: this.config.rconBlacklist || [],
        whitelist: this.config.rconWhitelist || [],
      };

      // Add maxClients if specified
      if (this.config.rconMaxClients) {
        config.rcon.maxClients = this.config.rconMaxClients;
      }
    }

    return JSON.stringify(config, null, 2);
  }

  async saveConfig(): Promise<void> {
    const configJson = this.generateConfigJson();
    await this.executor.writeFile(this.getConfigPath(), configJson);
    logger.info('Server config saved');
  }

  async loadConfig(): Promise<ServerConfig | null> {
    try {
      const configPath = this.getConfigPath();
      if (await this.executor.fileExists(configPath)) {
        const content = await this.executor.readFile(configPath);
        const json = JSON.parse(content);
        
        // Map Arma Reforger server.json format to our config format
        this.config = {
          name: json.game?.name || DEFAULT_CONFIG.name,
          password: json.game?.password || '',
          adminPassword: json.game?.passwordAdmin || '',
          admins: json.game?.admins || [],
          bindAddress: json.bindAddress || DEFAULT_CONFIG.bindAddress,
          bindPort: json.bindPort || DEFAULT_CONFIG.bindPort,
          publicAddress: json.publicAddress || '',
          publicPort: json.publicPort || json.bindPort || DEFAULT_CONFIG.publicPort,
          a2sQueryEnabled: !!json.a2s,
          steamQueryPort: json.a2s?.port || DEFAULT_CONFIG.steamQueryPort,
          steamQueryAddress: json.a2s?.address || '',
          rconEnabled: !!json.rcon,
          rconAddress: json.rcon?.address || '',
          rconPort: json.rcon?.port || DEFAULT_CONFIG.rconPort,
          rconPassword: json.rcon?.password || '',
          rconPermission: json.rcon?.permission || 'monitor',
          rconMaxClients: json.rcon?.maxClients,
          rconBlacklist: json.rcon?.blacklist || [],
          rconWhitelist: json.rcon?.whitelist || [],
          scenarioId: json.game?.scenarioId || DEFAULT_CONFIG.scenarioId,
          maxPlayers: json.game?.maxPlayers || DEFAULT_CONFIG.maxPlayers,
          visible: json.game?.visible ?? DEFAULT_CONFIG.visible,
          crossPlatform: false,
          supportedPlatforms: json.game?.supportedPlatforms || DEFAULT_CONFIG.supportedPlatforms,
          serverMaxViewDistance: json.game?.gameProperties?.serverMaxViewDistance || DEFAULT_CONFIG.serverMaxViewDistance,
          serverMinGrassDistance: json.game?.gameProperties?.serverMinGrassDistance || DEFAULT_CONFIG.serverMinGrassDistance,
          networkViewDistance: json.game?.gameProperties?.networkViewDistance || DEFAULT_CONFIG.networkViewDistance,
          disableThirdPerson: json.game?.gameProperties?.disableThirdPerson ?? DEFAULT_CONFIG.disableThirdPerson,
          fastValidation: json.game?.gameProperties?.fastValidation ?? DEFAULT_CONFIG.fastValidation,
          battlEye: json.game?.gameProperties?.battlEye ?? DEFAULT_CONFIG.battlEye,
          vonDisableUI: json.game?.gameProperties?.VONDisableUI ?? DEFAULT_CONFIG.vonDisableUI,
          vonDisableDirectSpeechUI: json.game?.gameProperties?.VONDisableDirectSpeechUI ?? DEFAULT_CONFIG.vonDisableDirectSpeechUI,
          lobbyPlayerSynchronise: json.operating?.lobbyPlayerSynchronise ?? DEFAULT_CONFIG.lobbyPlayerSynchronise,
          aiLimit: json.operating?.aiLimit ?? DEFAULT_CONFIG.aiLimit,
          playerSaveTime: json.operating?.playerSaveTime ?? DEFAULT_CONFIG.playerSaveTime,
          missionHeader: json.game?.gameProperties?.missionHeader || {},
          mods: (json.game?.mods || []).map((m: any, i: number) => ({
            modId: m.modId,
            name: m.name,
            version: m.version,
            enabled: true,
            loadOrder: i,
          })),
        };
        
        return this.config;
      }
      return null;
    } catch (error) {
      logger.error('Failed to load config:', error);
      return null;
    }
  }

  async isRunning(): Promise<boolean> {
    if (this.serverPid) {
      const procInfo = await this.executor.getProcessInfo(this.serverPid);
      if (procInfo) return true;
      this.serverPid = null;
    }

    // Try to find by process name
    const result = await this.executor.exec(
      this.platform === 'windows'
        ? 'tasklist /FI "IMAGENAME eq ArmaReforgerServer.exe" /FO CSV /NH'
        : 'pgrep -f ArmaReforgerServer'
    );

    if (result.success && result.output.trim()) {
      if (this.platform === 'windows') {
        const match = result.output.match(/"ArmaReforgerServer\.exe","(\d+)"/);
        if (match) {
          this.serverPid = parseInt(match[1]);
          return true;
        }
      } else {
        const pids = result.output.trim().split('\n');
        if (pids.length > 0 && pids[0]) {
          this.serverPid = parseInt(pids[0]);
          return true;
        }
      }
    }

    return false;
  }

  async start(): Promise<boolean> {
    if (await this.isRunning()) {
      logger.warn('Server is already running');
      return true;
    }

    logger.info('Starting Arma Reforger server...');
    this.status = 'starting';
    this.emit('status', this.status);

    try {
      // Save config before starting
      await this.saveConfig();

      // Create logs directory
      await this.executor.mkdir(path.join(this.serverPath, 'logs'));

      // Build start command
      const executable = this.getExecutablePath();
      const configPath = this.getConfigPath();
      const profilePath = path.join(this.serverPath, 'profile');

      let command: string;
      if (this.platform === 'windows') {
        command = `start /B "" "${executable}" -config "${configPath}" -profile "${profilePath}" -logStats 10000`;
      } else {
        command = `nohup "${executable}" -config "${configPath}" -profile "${profilePath}" -logStats 10000 > "${this.getLogPath()}" 2>&1 &`;
      }

      const result = await this.executor.exec(command, { cwd: this.serverPath });

      if (!result.success && this.platform !== 'windows') {
        throw new Error(`Failed to start server: ${result.error}`);
      }

      // Wait briefly and check if server started
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (await this.isRunning()) {
        this.status = 'online';
        this.emit('status', this.status);
        logger.info(`Server started with PID: ${this.serverPid}`);
        return true;
      } else {
        // Give it one more chance with a shorter wait
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (await this.isRunning()) {
          this.status = 'online';
          this.emit('status', this.status);
          logger.info(`Server started with PID: ${this.serverPid}`);
          return true;
        }
        throw new Error('Server process did not start');
      }
    } catch (error: any) {
      this.status = 'error';
      this.emit('status', this.status);
      logger.error('Failed to start server:', error.message);
      return false;
    }
  }

  async stop(force: boolean = false): Promise<boolean> {
    if (!(await this.isRunning())) {
      logger.warn('Server is not running');
      this.status = 'offline';
      return true;
    }

    logger.info('Stopping Arma Reforger server...');
    this.status = 'stopping';
    this.emit('status', this.status);

    try {
      // On Windows, always use taskkill for reliable process termination
      if (this.platform === 'windows') {
        const forceFlag = force ? '/F' : '';
        if (this.serverPid) {
          await this.executor.exec(`taskkill ${forceFlag} /PID ${this.serverPid}`);
        }
        // Also try by name to ensure it's stopped
        await this.executor.exec('taskkill /F /IM ArmaReforgerServer.exe');
      } else {
        const signal = force ? 'SIGKILL' : 'SIGTERM';
        if (this.serverPid) {
          await this.executor.killProcess(this.serverPid, signal);
        } else {
          await this.executor.exec('pkill -f ArmaReforgerServer');
        }
      }

      // Wait for process to stop (faster checks)
      for (let i = 0; i < 6; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!(await this.isRunning())) {
          this.status = 'offline';
          this.emit('status', this.status);
          this.serverPid = null;
          logger.info('Server stopped');
          return true;
        }
      }

      // Force kill if still running
      if (!force) {
        return this.stop(true);
      }

      throw new Error('Failed to stop server');
    } catch (error: any) {
      // Even if taskkill throws an error, check if server is actually stopped
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!(await this.isRunning())) {
        this.status = 'offline';
        this.emit('status', this.status);
        this.serverPid = null;
        logger.info('Server stopped');
        return true;
      }
      
      this.status = 'error';
      this.emit('status', this.status);
      logger.error('Failed to stop server:', error.message);
      return false;
    }
  }

  async restart(): Promise<boolean> {
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 2000));
    return this.start();
  }

  async getStatus(): Promise<ServerStatusInfo> {
    const isRunning = await this.isRunning();
    let procInfo: ProcessInfo | null = null;
    let systemInfo = null;

    if (isRunning && this.serverPid) {
      procInfo = await this.executor.getProcessInfo(this.serverPid);
      systemInfo = await this.executor.getSystemInfo();
    }

    return {
      status: this.status,
      isOnline: isRunning,
      players: 0, // Will be populated by query service
      maxPlayers: this.config.maxPlayers,
      map: 'Everon', // Will be populated by query service
      mission: this.config.scenarioId.split('/').pop()?.replace('.conf', '') || 'Unknown',
      version: '', // Will be populated elsewhere
      uptime: procInfo?.uptime || 0,
      cpu: procInfo?.cpu || 0,
      memory: procInfo?.memory || 0,
      memoryUsed: systemInfo ? (systemInfo.memoryUsed / 1024 / 1024) : 0,
      memoryTotal: systemInfo ? (systemInfo.memoryTotal / 1024 / 1024) : 0,
      ping: 0,
      lastUpdated: new Date(),
    };
  }

  async getLogs(lines: number = 100): Promise<ServerLogEntry[]> {
    try {
      const consolePath = await this.getLatestConsoleLog();
      if (!consolePath) {
        return [];
      }

      const command = this.platform === 'windows'
        ? `powershell -Command "Get-Content '${consolePath}' -Tail ${lines}"`
        : `tail -n ${lines} "${consolePath}"`;

      const result = await this.executor.exec(command);
      if (!result.success) return [];

      return result.output.split('\n')
        .filter(line => line.trim())
        .map(line => this.parseLogLine(line));
    } catch {
      return [];
    }
  }

  private parseLogLine(line: string): ServerLogEntry {
    // Parse Arma Reforger log format
    // Example: "18:25:31.506  WORLD        : Frame"
    // Or: "18:17:35.327  BACKEND   (E): JSON is invalid!"
    
    // Try to match time at start
    const timeMatch = line.match(/^(\d{2}:\d{2}:\d{2}\.\d{3})\s+(\w+)\s*(\([EWI]\))?\s*:\s*(.*)/);
    
    if (timeMatch) {
      const category = timeMatch[2];
      const levelIndicator = timeMatch[3]; // (E), (W), or (I)
      const message = timeMatch[4];
      
      let level: 'debug' | 'info' | 'warning' | 'error' = 'info';
      if (levelIndicator === '(E)') level = 'error';
      else if (levelIndicator === '(W)') level = 'warning';
      else if (category === 'DEFAULT' || category === 'WORLD') level = 'debug';
      
      return {
        timestamp: new Date(),
        level,
        message: `[${category}] ${message}`,
        category,
      };
    }

    // Try alternative format with date
    const altMatch = line.match(/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]\s*\[(\w+)\]\s*(.*)/);
    if (altMatch) {
      return {
        timestamp: new Date(altMatch[1]),
        level: altMatch[2].toLowerCase() as any || 'info',
        message: altMatch[3],
      };
    }

    return {
      timestamp: new Date(),
      level: 'info',
      message: line,
    };
  }

  async sendCommand(command: string): Promise<string> {
    // This would use RCON to send commands
    // For now, log and return placeholder
    logger.info(`RCON command: ${command}`);
    return `Command sent: ${command}`;
  }

  getServerPid(): number | null {
    return this.serverPid;
  }

  getCurrentStatus(): ServerStatus {
    return this.status;
  }
}

