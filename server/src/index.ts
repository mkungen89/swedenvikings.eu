// ============================================
// Sweden Vikings CMS - Server Entry Point
// ============================================

import 'dotenv/config';
import app from './app';
import { createServer } from 'http';
import { initializeSocket } from './socket';
import { logger } from './utils/logger';
import { prisma } from './utils/prisma';
import { gameServerManager } from './services/gameServer';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.io
    initializeSocket(httpServer);
    logger.info('✅ Socket.io initialized');

    // Initialize Game Server Manager
    await gameServerManager.initialize();
    logger.info('✅ Game Server Manager initialized');

    // Start server
    httpServer.listen(PORT, () => {
      logger.info(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   🎮 Sweden Vikings CMS Server                     ║
║                                                    ║
║   Server running on: http://localhost:${PORT}        ║
║   Environment: ${process.env.NODE_ENV || 'development'}                       ║
║                                                    ║
╚════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down server...');
      await gameServerManager.shutdown();
      httpServer.close();
      await prisma.$disconnect();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

