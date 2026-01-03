// ============================================
// Socket.io Server
// ============================================

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { gameServerManager } from '../services/gameServer';

let io: Server;

export function initializeSocket(httpServer: HttpServer): void {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Connect GameServerManager events to socket
  gameServerManager.on('status-update', ({ connectionId, status }) => {
    io.to('server').emit('server:status', { connectionId, ...status });
  });

  gameServerManager.on('install-progress', ({ connectionId, progress }) => {
    io.to('server').emit('server:install-progress', { connectionId, ...progress });
  });

  gameServerManager.on('server-status', ({ connectionId, status }) => {
    io.to('server').emit('server:status-change', { connectionId, status });
  });

  io.on('connection', (socket: Socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    // Join room for server updates
    socket.on('join:server', () => {
      socket.join('server');
      logger.debug(`Socket ${socket.id} joined server room`);
    });

    // Leave server room
    socket.on('leave:server', () => {
      socket.leave('server');
      logger.debug(`Socket ${socket.id} left server room`);
    });

    // Join room for user-specific updates
    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
      logger.debug(`Socket ${socket.id} joined user room: ${userId}`);
    });

    // Leave user room
    socket.on('leave:user', (userId: string) => {
      socket.leave(`user:${userId}`);
    });

    // Join conversation room for direct messages
    socket.on('join:conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      logger.debug(`Socket ${socket.id} joined conversation: ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave:conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Join forum thread room
    socket.on('join:thread', (threadId: string) => {
      socket.join(`thread:${threadId}`);
      logger.debug(`Socket ${socket.id} joined thread: ${threadId}`);
    });

    // Leave forum thread room
    socket.on('leave:thread', (threadId: string) => {
      socket.leave(`thread:${threadId}`);
    });

    // Typing indicator for messages
    socket.on('typing:start', (data: { conversationId: string; userId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing:start', { userId: data.userId });
    });

    socket.on('typing:stop', (data: { conversationId: string; userId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing:stop', { userId: data.userId });
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });
}

// Emit functions
export function emitServerStatus(status: any): void {
  if (io) {
    io.to('server').emit('server:status', status);
  }
}

export function emitServerLog(log: any): void {
  if (io) {
    io.to('server').emit('server:log', log);
  }
}

export function emitPlayerUpdate(data: any): void {
  if (io) {
    io.to('server').emit('server:player', data);
  }
}

export function emitNotification(userId: string, notification: any): void {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
  }
}

export function emitToAll(event: string, data: any): void {
  if (io) {
    io.emit(event, data);
  }
}

export function getIO(): Server {
  return io;
}

