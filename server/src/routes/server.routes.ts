// ============================================
// Server Management Routes - Real Implementation
// ============================================

import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { isAuthenticated, hasPermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess, sendPaginated, errors } from '../utils/apiResponse';
import { prisma } from '../utils/prisma';
import { cache } from '../utils/redis';
import { gameServerManager, ServerConnection, fetchModData, searchMods, WorkshopModData } from '../services/gameServer';
import { logger } from '../utils/logger';

const router = Router();

// All server routes require authentication
router.use(isAuthenticated);

// ============================================
// Server Connections Management
// ============================================

// Get all server connections
router.get('/connections', hasPermission('server.config'), async (req, res) => {
  try {
    const connections = await prisma.serverConnection.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    sendSuccess(res, connections);
  } catch (error) {
    errors.serverError(res);
  }
});

// Add new server connection
router.post('/connections',
  hasPermission('server.config'),
  body('name').isString().trim().isLength({ min: 2, max: 100 }),
  body('type').isIn(['local', 'remote']),
  body('host').optional().isString(),
  body('port').optional().isInt({ min: 1, max: 65535 }),
  body('username').optional().isString(),
  body('password').optional().isString(),
  body('privateKey').optional().isString(),
  body('serverPath').isString().trim(),
  body('steamCmdPath').optional().isString(),
  body('platform').optional().isIn(['linux', 'windows']),
  body('isDefault').optional().isBoolean(),
  validate,
  async (req, res) => {
    try {
      const { name, type, host, port, username, password, privateKey, serverPath, steamCmdPath, platform, isDefault } = req.body;

      // If setting as default, unset other defaults
      if (isDefault) {
        await prisma.serverConnection.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      const connection = await prisma.serverConnection.create({
        data: {
          name,
          type,
          host: type === 'remote' ? host : null,
          port: type === 'remote' ? (port || 22) : null,
          username: type === 'remote' ? username : null,
          password: type === 'remote' && password ? password : null,
          privateKey: type === 'remote' && privateKey ? privateKey : null,
          serverPath,
          steamCmdPath,
          platform: platform || 'linux',
          isDefault: isDefault || false,
        },
      });

      // Try to add to manager
      const connData: ServerConnection = {
        ...connection,
        type: connection.type as 'local' | 'remote',
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt,
      };

      const added = await gameServerManager.addConnection(connData, false);
      
      if (added) {
        await prisma.serverConnection.update({
          where: { id: connection.id },
          data: { status: 'connected', lastConnected: new Date() },
        });
      }

      await prisma.activityLog.create({
        data: {
          userId: req.user!.id,
          action: 'server.connection.create',
          category: 'server',
          details: { name, type },
          ip: req.ip,
        },
      });

      sendSuccess(res, connection, undefined, 201);
    } catch (error: any) {
      logger.error('Failed to create connection:', error);
      errors.serverError(res);
    }
  }
);

// Test server connection
router.post('/connections/:id/test',
  hasPermission('server.config'),
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const connection = await prisma.serverConnection.findUnique({
        where: { id: req.params.id },
      });

      if (!connection) {
        return errors.notFound(res, 'Connection');
      }

      // Try to connect
      const managed = gameServerManager.getConnection(connection.id);
      if (managed && managed.executor.isConnected()) {
        const sysInfo = await managed.executor.getSystemInfo();
        sendSuccess(res, { 
          success: true, 
          message: 'Connection successful',
          systemInfo: {
            platform: sysInfo.platform,
            hostname: sysInfo.hostname,
            cpuUsage: sysInfo.cpuUsage,
            memoryUsed: Math.round(sysInfo.memoryUsed / 1024 / 1024 / 1024 * 100) / 100,
            memoryTotal: Math.round(sysInfo.memoryTotal / 1024 / 1024 / 1024 * 100) / 100,
          }
        });
      } else {
        // Try fresh connection
        const connData: ServerConnection = {
          ...connection,
          type: connection.type as 'local' | 'remote',
          createdAt: connection.createdAt,
          updatedAt: connection.updatedAt,
        };
        
        const added = await gameServerManager.addConnection(connData, false);
        if (added) {
          await prisma.serverConnection.update({
            where: { id: connection.id },
            data: { status: 'connected', lastConnected: new Date() },
          });
          sendSuccess(res, { success: true, message: 'Connection successful' });
        } else {
          sendSuccess(res, { success: false, message: 'Failed to connect' });
        }
      }
    } catch (error: any) {
      sendSuccess(res, { success: false, message: error.message });
    }
  }
);

// Delete server connection
router.delete('/connections/:id',
  hasPermission('server.config'),
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const connection = await prisma.serverConnection.findUnique({
        where: { id: req.params.id },
      });

      if (!connection) {
        return errors.notFound(res, 'Connection');
      }

      await gameServerManager.removeConnection(connection.id);
      await prisma.serverConnection.delete({
        where: { id: req.params.id },
      });

      sendSuccess(res, { message: 'Connection deleted' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// ============================================
// Server Status & Control
// ============================================

// Get server status
router.get('/status', hasPermission('server.view'), async (req, res) => {
  try {
    const connectionId = req.query.connectionId as string | undefined;
    const status = await gameServerManager.getServerStatus(connectionId);
    
    // Get version info
    const managed = connectionId 
      ? gameServerManager.getConnection(connectionId)
      : gameServerManager.getDefaultConnection();
    
    if (managed) {
      const isInstalled = await gameServerManager.isServerInstalled(connectionId);
      (status as any).isInstalled = isInstalled;
      
      const config = await gameServerManager.getServerConfig(connectionId);
      if (config) {
        status.maxPlayers = config.maxPlayers;
        (status as any).serverName = config.name;
      }
    }

    sendSuccess(res, status);
  } catch (error) {
    logger.error('Failed to get server status:', error);
    errors.serverError(res);
  }
});

// Install/Update server
router.post('/install', hasPermission('server.config'), async (req, res) => {
  try {
    const connectionId = req.query.connectionId as string | undefined;
    
    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'server.install',
        category: 'server',
        ip: req.ip,
      },
    });

    // Start installation in background
    gameServerManager.installServer(connectionId)
      .then(success => {
        logger.info(`Server installation ${success ? 'completed' : 'failed'}`);
      })
      .catch(err => {
        logger.error('Server installation error:', err);
      });

    sendSuccess(res, { message: 'Server installation started' });
  } catch (error) {
    errors.serverError(res);
  }
});

// Start server
router.post('/start', hasPermission('server.start'), async (req, res) => {
  try {
    const connectionId = req.query.connectionId as string | undefined;

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'server.start',
        category: 'server',
        ip: req.ip,
      },
    });

    const success = await gameServerManager.startServer(connectionId);
    
    if (success) {
      sendSuccess(res, { message: 'Server started successfully' });
    } else {
      errors.serverError(res, 'Failed to start server');
    }
  } catch (error: any) {
    logger.error('Failed to start server:', error);
    errors.serverError(res, error.message);
  }
});

// Stop server
router.post('/stop', hasPermission('server.stop'), async (req, res) => {
  try {
    const connectionId = req.query.connectionId as string | undefined;

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'server.stop',
        category: 'server',
        ip: req.ip,
      },
    });

    const success = await gameServerManager.stopServer(connectionId);
    
    if (success) {
      sendSuccess(res, { message: 'Server stopped successfully' });
    } else {
      errors.serverError(res, 'Failed to stop server');
    }
  } catch (error: any) {
    logger.error('Failed to stop server:', error);
    errors.serverError(res, error.message);
  }
});

// Restart server
router.post('/restart', hasPermission('server.restart'), async (req, res) => {
  try {
    const connectionId = req.query.connectionId as string | undefined;

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'server.restart',
        category: 'server',
        ip: req.ip,
      },
    });

    const success = await gameServerManager.restartServer(connectionId);
    
    if (success) {
      sendSuccess(res, { message: 'Server restarted successfully' });
    } else {
      errors.serverError(res, 'Failed to restart server');
    }
  } catch (error: any) {
    logger.error('Failed to restart server:', error);
    errors.serverError(res, error.message);
  }
});

// ============================================
// Server Configuration
// ============================================

// Get server config
router.get('/config', hasPermission('server.config'), async (req, res) => {
  try {
    const connectionId = req.query.connectionId as string | undefined;
    const config = await gameServerManager.getServerConfig(connectionId);
    
    if (config) {
      sendSuccess(res, config);
    } else {
      // Return default config
      sendSuccess(res, {
        name: 'Sweden Vikings Server',
        password: '',
        adminPassword: '',
        maxPlayers: 64,
        visible: true,
        crossPlatform: false,
        supportedPlatforms: [],
        scenarioId: '{ECC61978EDCC2B5A}Missions/23_Campaign.conf',
        bindAddress: '0.0.0.0',
        bindPort: 2001,
        publicAddress: '',
        publicPort: 2001,
        a2sQueryEnabled: true,
        steamQueryPort: 17777,
        rconEnabled: false,
        rconPort: 19999,
        rconPassword: '',
        battlEye: true,
        disableThirdPerson: false,
        fastValidation: true,
        serverMaxViewDistance: 2500,
        serverMinGrassDistance: 50,
        networkViewDistance: 1000,
        lobbyPlayerSynchronise: false,
        aiLimit: -1,
        playerSaveTime: 120,
        vonDisableUI: false,
        vonDisableDirectSpeechUI: false,
        missionHeader: {},
        mods: [],
      });
    }
  } catch (error) {
    errors.serverError(res);
  }
});

// Update server config
router.patch('/config',
  hasPermission('server.config'),
  validate,
  async (req, res) => {
    try {
      const connectionId = req.query.connectionId as string | undefined;
      const updates = req.body;

      await gameServerManager.updateServerConfig(updates, connectionId);

      await prisma.activityLog.create({
        data: {
          userId: req.user!.id,
          action: 'server.config.update',
          category: 'server',
          details: updates,
          ip: req.ip,
        },
      });

      const config = await gameServerManager.getServerConfig(connectionId);
      sendSuccess(res, config);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// ============================================
// Mods Management
// ============================================

// Helper to convert BigInt to Number for JSON serialization
const serializeMod = (mod: any) => ({
  ...mod,
  size: mod.size ? Number(mod.size) : null,
});

// Get mods
router.get('/mods', hasPermission('server.mods'), async (req, res) => {
  try {
    const mods = await prisma.mod.findMany({
      orderBy: { loadOrder: 'asc' },
    });
    sendSuccess(res, mods.map(serializeMod));
  } catch (error) {
    logger.error('Failed to get mods:', error);
    errors.serverError(res);
  }
});

// Add mod (fetches metadata from workshop automatically)
router.post('/mods',
  hasPermission('server.mods'),
  body('workshopId').isString().trim(),
  validate,
  async (req, res) => {
    try {
      const { workshopId } = req.body;

      // Check if already installed
      const existing = await prisma.mod.findUnique({
        where: { workshopId },
      });

      if (existing) {
        return errors.validation(res, {
          workshopId: ['Mod already installed'],
        });
      }

      // Fetch metadata from workshop
      const workshopData = await fetchModData(workshopId);
      if (!workshopData) {
        return errors.validation(res, {
          workshopId: ['Could not find mod in workshop'],
        });
      }

      const maxOrder = await prisma.mod.aggregate({
        _max: { loadOrder: true },
      });

      const mod = await prisma.mod.create({
        data: {
          workshopId,
          name: workshopData.name,
          description: workshopData.description,
          author: workshopData.author,
          imageUrl: workshopData.imageUrl,
          version: workshopData.version,
          gameVersion: workshopData.gameVersion,
          size: BigInt(workshopData.size),
          dependencies: workshopData.dependencies,
          rating: workshopData.rating,
          subscribers: workshopData.subscribers,
          lastSyncedAt: new Date(),
          loadOrder: (maxOrder._max.loadOrder || 0) + 1,
        },
      });

      // Update server config with new mod
      const connectionId = req.query.connectionId as string | undefined;
      const config = await gameServerManager.getServerConfig(connectionId);
      if (config) {
        config.mods.push({
          modId: workshopId,
          name: workshopData.name,
          version: workshopData.version,
          enabled: true,
          loadOrder: mod.loadOrder,
        });
        await gameServerManager.updateServerConfig({ mods: config.mods }, connectionId);
      }

      await prisma.activityLog.create({
        data: {
          userId: req.user!.id,
          action: 'server.mod.install',
          category: 'server',
          details: { modId: mod.id, workshopId, name: workshopData.name },
          ip: req.ip,
        },
      });

      sendSuccess(res, serializeMod(mod), undefined, 201);
    } catch (error) {
      logger.error('Failed to add mod:', error);
      errors.serverError(res);
    }
  }
);

// Update mod
router.patch('/mods/:id',
  hasPermission('server.mods'),
  body('enabled').optional().isBoolean(),
  body('loadOrder').optional().isInt({ min: 0 }),
  validate,
  async (req, res) => {
    try {
      const mod = await prisma.mod.update({
        where: { id: req.params.id },
        data: req.body,
      });
      sendSuccess(res, serializeMod(mod));
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Delete mod
router.delete('/mods/:id', hasPermission('server.mods'), async (req, res) => {
  try {
    const mod = await prisma.mod.findUnique({
      where: { id: req.params.id },
    });

    if (!mod) {
      return errors.notFound(res, 'Mod');
    }

    await prisma.mod.delete({
      where: { id: req.params.id },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'server.mod.remove',
        category: 'server',
        details: { modId: mod.id, name: mod.name },
        ip: req.ip,
      },
    });

    sendSuccess(res, { message: 'Mod removed' });
  } catch (error) {
    errors.serverError(res);
  }
});

// Reorder mods
router.post('/mods/reorder',
  hasPermission('server.mods'),
  body('order').isArray(),
  body('order.*').isUUID(),
  validate,
  async (req, res) => {
    try {
      const { order } = req.body;

      await Promise.all(
        order.map((modId: string, index: number) =>
          prisma.mod.update({
            where: { id: modId },
            data: { loadOrder: index },
          })
        )
      );

      // Update server config with new mod order
      const connectionId = req.query.connectionId as string | undefined;
      const mods = await prisma.mod.findMany({
        where: { enabled: true },
        orderBy: { loadOrder: 'asc' },
      });

      const config = await gameServerManager.getServerConfig(connectionId);
      if (config) {
        config.mods = mods.map(m => ({
          modId: m.workshopId,
          name: m.name,
          version: m.version || undefined,
          enabled: m.enabled,
          loadOrder: m.loadOrder,
        }));
        await gameServerManager.updateServerConfig({ mods: config.mods }, connectionId);
      }

      sendSuccess(res, { message: 'Mod order updated' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Sync mod metadata from workshop
router.post('/mods/:id/sync',
  hasPermission('server.mods'),
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const mod = await prisma.mod.findUnique({
        where: { id: req.params.id },
      });

      if (!mod) {
        return errors.notFound(res, 'Mod');
      }

      const workshopData = await fetchModData(mod.workshopId);
      if (!workshopData) {
        return errors.serverError(res, 'Failed to fetch mod data from workshop');
      }

      const updatedMod = await prisma.mod.update({
        where: { id: req.params.id },
        data: {
          name: workshopData.name,
          description: workshopData.description,
          author: workshopData.author,
          imageUrl: workshopData.imageUrl,
          version: workshopData.version,
          gameVersion: workshopData.gameVersion,
          size: BigInt(workshopData.size),
          dependencies: workshopData.dependencies,
          rating: workshopData.rating,
          subscribers: workshopData.subscribers,
          lastSyncedAt: new Date(),
        },
      });

      sendSuccess(res, serializeMod(updatedMod));
    } catch (error) {
      logger.error('Failed to sync mod:', error);
      errors.serverError(res);
    }
  }
);

// Sync all mods metadata
router.post('/mods/sync-all',
  hasPermission('server.mods'),
  async (req, res) => {
    try {
      const mods = await prisma.mod.findMany();
      const results: { id: string; success: boolean; error?: string }[] = [];

      for (const mod of mods) {
        try {
          const workshopData = await fetchModData(mod.workshopId);
          if (workshopData) {
            await prisma.mod.update({
              where: { id: mod.id },
              data: {
                name: workshopData.name,
                description: workshopData.description,
                author: workshopData.author,
                imageUrl: workshopData.imageUrl,
                version: workshopData.version,
                gameVersion: workshopData.gameVersion,
                size: BigInt(workshopData.size),
                dependencies: workshopData.dependencies,
                rating: workshopData.rating,
                subscribers: workshopData.subscribers,
                lastSyncedAt: new Date(),
              },
            });
            results.push({ id: mod.id, success: true });
          } else {
            results.push({ id: mod.id, success: false, error: 'Could not fetch workshop data' });
          }
        } catch (error: any) {
          results.push({ id: mod.id, success: false, error: error.message });
        }
      }

      sendSuccess(res, {
        synced: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      });
    } catch (error) {
      logger.error('Failed to sync all mods:', error);
      errors.serverError(res);
    }
  }
);

// ============================================
// Workshop Search & Lookup
// ============================================

// Search workshop for mods
router.get('/workshop/search',
  hasPermission('server.mods'),
  query('q').optional().isString().trim(),
  query('page').optional().isInt({ min: 1 }),
  validate,
  async (req, res) => {
    try {
      const q = (req.query.q as string) || '';
      const page = parseInt(req.query.page as string) || 1;

      const result = await searchMods(q, page);

      // Mark mods that are already installed
      const installedIds = await prisma.mod.findMany({
        select: { workshopId: true },
      });
      const installedSet = new Set(installedIds.map(m => m.workshopId));

      const modsWithInstallStatus = result.mods.map(mod => ({
        ...mod,
        isInstalled: installedSet.has(mod.modId),
      }));

      sendSuccess(res, {
        ...result,
        mods: modsWithInstallStatus,
      });
    } catch (error) {
      logger.error('Workshop search failed:', error);
      errors.serverError(res);
    }
  }
);

// Get single mod from workshop
router.get('/workshop/:modId',
  hasPermission('server.mods'),
  param('modId').isString().trim(),
  validate,
  async (req, res) => {
    try {
      const { modId } = req.params;
      const mod = await fetchModData(modId);

      if (!mod) {
        return errors.notFound(res, 'Mod');
      }

      // Check if already installed
      const installed = await prisma.mod.findUnique({
        where: { workshopId: modId },
      });

      sendSuccess(res, {
        ...mod,
        isInstalled: !!installed,
        installedId: installed?.id,
      });
    } catch (error) {
      logger.error('Workshop lookup failed:', error);
      errors.serverError(res);
    }
  }
);

// Get server game version
router.get('/version',
  hasPermission('server.view'),
  async (req, res) => {
    try {
      const connectionId = req.query.connectionId as string | undefined;
      const status = await gameServerManager.getServerStatus(connectionId);

      // Try to get real version from server logs
      let version = status.version || 'unknown';
      if (status.isOnline || await gameServerManager.isServerInstalled(connectionId)) {
        const logVersion = await gameServerManager.getGameVersion(connectionId);
        if (logVersion) {
          version = logVersion;
        }
      }

      sendSuccess(res, {
        version,
        isOnline: status.isOnline,
      });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// ============================================
// Players
// ============================================

// Get online players
router.get('/players', hasPermission('server.players'), async (req, res) => {
  try {
    const connectionId = req.query.connectionId as string | undefined;
    const players = await gameServerManager.getOnlinePlayers(connectionId);
    sendSuccess(res, players);
  } catch (error) {
    errors.serverError(res);
  }
});

// Kick player
router.post('/players/:steamId/kick',
  hasPermission('moderation.kick'),
  body('reason').optional().isString().trim().isLength({ max: 200 }),
  validate,
  async (req, res) => {
    try {
      const { steamId } = req.params;
      const { reason } = req.body;
      const connectionId = req.query.connectionId as string | undefined;

      await prisma.activityLog.create({
        data: {
          userId: req.user!.id,
          action: 'server.player.kick',
          category: 'moderation',
          details: { steamId, reason },
          ip: req.ip,
        },
      });

      // Send kick command via RCON
      await gameServerManager.sendCommand(`kick ${steamId} ${reason || ''}`, connectionId);

      sendSuccess(res, { message: 'Player kick command sent' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// ============================================
// Logs & Console
// ============================================

// Get server logs (real-time console)
router.get('/logs',
  hasPermission('server.logs'),
  query('lines').optional().isInt({ min: 1, max: 1000 }),
  validate,
  async (req, res) => {
    try {
      const lines = parseInt(req.query.lines as string) || 100;
      const connectionId = req.query.connectionId as string | undefined;
      
      const logs = await gameServerManager.getServerLogs(lines, connectionId);
      sendSuccess(res, logs);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Get list of log directories
router.get('/logs/dirs',
  hasPermission('server.logs'),
  async (req, res) => {
    try {
      const connectionId = req.query.connectionId as string | undefined;
      const dirs = await gameServerManager.getLogDirs(connectionId);
      sendSuccess(res, dirs);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Get list of log files in a directory
router.get('/logs/files/:dir',
  hasPermission('server.logs'),
  param('dir').isString(),
  validate,
  async (req, res) => {
    try {
      const { dir } = req.params;
      const connectionId = req.query.connectionId as string | undefined;
      const files = await gameServerManager.getLogFiles(dir, connectionId);
      sendSuccess(res, files);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Get content of a specific log file
router.get('/logs/file/:dir/:file',
  hasPermission('server.logs'),
  param('dir').isString(),
  param('file').isString(),
  query('lines').optional().isInt({ min: 1, max: 5000 }),
  validate,
  async (req, res) => {
    try {
      const { dir, file } = req.params;
      const lines = parseInt(req.query.lines as string) || 500;
      const connectionId = req.query.connectionId as string | undefined;
      const content = await gameServerManager.readLogFile(dir, file, lines, connectionId);
      sendSuccess(res, { content, dir, file });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Send console command
router.post('/command',
  hasPermission('server.console'),
  body('command').isString().trim().isLength({ min: 1, max: 500 }),
  validate,
  async (req, res) => {
    try {
      const { command } = req.body;
      const connectionId = req.query.connectionId as string | undefined;

      await prisma.activityLog.create({
        data: {
          userId: req.user!.id,
          action: 'server.command',
          category: 'server',
          details: { command },
          ip: req.ip,
        },
      });

      const result = await gameServerManager.sendCommand(command, connectionId);
      sendSuccess(res, { result });
    } catch (error: any) {
      errors.serverError(res, error.message);
    }
  }
);

// ============================================
// Scheduled Tasks
// ============================================

// Get scheduled tasks
router.get('/tasks', hasPermission('server.config'), async (req, res) => {
  try {
    const tasks = await prisma.scheduledTask.findMany({
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, tasks);
  } catch (error) {
    errors.serverError(res);
  }
});

export default router;
