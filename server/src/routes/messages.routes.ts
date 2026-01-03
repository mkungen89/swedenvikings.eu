// ============================================
// Direct Messages Routes
// ============================================

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { isAuthenticated } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess, sendPaginated, errors } from '../utils/apiResponse';
import { prisma } from '../utils/prisma';
import { notificationService } from '../services/notification.service';
import { getIO } from '../socket';

const router = Router();

// All message routes require authentication
router.use(isAuthenticated);

// ============================================
// Conversations
// ============================================

// Get my conversations
router.get('/conversations',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Get conversation IDs where user is a participant
      const participations = await prisma.conversationParticipant.findMany({
        where: { userId: req.user!.id },
        select: { conversationId: true, lastReadAt: true },
      });

      const conversationIds = participations.map((p) => p.conversationId);
      const lastReadMap = new Map(participations.map((p) => [p.conversationId, p.lastReadAt]));

      const [conversations, total] = await Promise.all([
        prisma.conversation.findMany({
          where: { id: { in: conversationIds } },
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, username: true, avatar: true },
                },
              },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: {
                sender: {
                  select: { id: true, username: true },
                },
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.conversation.count({ where: { id: { in: conversationIds } } }),
      ]);

      // Add unread count and format response
      const result = await Promise.all(
        conversations.map(async (conv) => {
          const lastReadAt = lastReadMap.get(conv.id) || new Date(0);
          const unreadCount = await prisma.directMessage.count({
            where: {
              conversationId: conv.id,
              createdAt: { gt: lastReadAt },
              senderId: { not: req.user!.id },
            },
          });

          return {
            id: conv.id,
            participants: conv.participants
              .filter((p) => p.userId !== req.user!.id)
              .map((p) => p.user),
            lastMessage: conv.messages[0] || null,
            unreadCount,
            updatedAt: conv.updatedAt,
          };
        })
      );

      sendPaginated(res, result, page, limit, total);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Get or create conversation with user
router.post('/conversations',
  body('userId').isUUID(),
  validate,
  async (req, res) => {
    try {
      const { userId } = req.body;

      if (userId === req.user!.id) {
        return errors.validation(res, { userId: ['Cannot create conversation with yourself'] });
      }

      // Check if user exists
      const otherUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, avatar: true },
      });

      if (!otherUser) {
        return errors.notFound(res, 'User');
      }

      // Check if blocked
      const blocked = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: req.user!.id, friendId: userId, status: 'BLOCKED' },
            { userId: userId, friendId: req.user!.id, status: 'BLOCKED' },
          ],
        },
      });

      if (blocked) {
        return errors.forbidden(res, 'Cannot message this user');
      }

      // Check if conversation already exists
      const existingConversations = await prisma.conversation.findMany({
        where: {
          AND: [
            { participants: { some: { userId: req.user!.id } } },
            { participants: { some: { userId } } },
          ],
        },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, username: true, avatar: true },
              },
            },
          },
        },
      });

      // Find a conversation with exactly these two participants
      const existingConv = existingConversations.find(
        (conv) => conv.participants.length === 2
      );

      if (existingConv) {
        return sendSuccess(res, {
          id: existingConv.id,
          participants: existingConv.participants
            .filter((p) => p.userId !== req.user!.id)
            .map((p) => p.user),
          isNew: false,
        });
      }

      // Create new conversation
      const conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [
              { userId: req.user!.id },
              { userId },
            ],
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, username: true, avatar: true },
              },
            },
          },
        },
      });

      sendSuccess(res, {
        id: conversation.id,
        participants: conversation.participants
          .filter((p) => p.userId !== req.user!.id)
          .map((p) => p.user),
        isNew: true,
      }, undefined, 201);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Get conversation messages
router.get('/conversations/:id',
  param('id').isUUID(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      // Verify user is participant
      const participant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId: req.params.id,
            userId: req.user!.id,
          },
        },
      });

      if (!participant) {
        return errors.notFound(res, 'Conversation');
      }

      const conversation = await prisma.conversation.findUnique({
        where: { id: req.params.id },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, username: true, avatar: true },
              },
            },
          },
        },
      });

      if (!conversation) {
        return errors.notFound(res, 'Conversation');
      }

      const [messages, total] = await Promise.all([
        prisma.directMessage.findMany({
          where: { conversationId: req.params.id },
          include: {
            sender: {
              select: { id: true, username: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.directMessage.count({ where: { conversationId: req.params.id } }),
      ]);

      // Update last read timestamp
      await prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId: req.params.id,
            userId: req.user!.id,
          },
        },
        data: { lastReadAt: new Date() },
      });

      sendSuccess(res, {
        conversation: {
          id: conversation.id,
          participants: conversation.participants
            .filter((p) => p.userId !== req.user!.id)
            .map((p) => p.user),
        },
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Send message in conversation
router.post('/conversations/:id',
  param('id').isUUID(),
  body('content').isString().trim().isLength({ min: 1, max: 10000 }),
  validate,
  async (req, res) => {
    try {
      // Verify user is participant
      const participant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId: req.params.id,
            userId: req.user!.id,
          },
        },
      });

      if (!participant) {
        return errors.notFound(res, 'Conversation');
      }

      // Get other participants for notifications
      const otherParticipants = await prisma.conversationParticipant.findMany({
        where: {
          conversationId: req.params.id,
          userId: { not: req.user!.id },
        },
        include: {
          user: { select: { id: true } },
        },
      });

      // Create message
      const message = await prisma.directMessage.create({
        data: {
          content: req.body.content,
          conversationId: req.params.id,
          senderId: req.user!.id,
        },
        include: {
          sender: {
            select: { id: true, username: true, avatar: true },
          },
        },
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: req.params.id },
        data: { updatedAt: new Date() },
      });

      // Notify other participants
      for (const p of otherParticipants) {
        notificationService.notifyNewMessage(
          p.userId,
          req.user!.username,
          req.params.id
        );
      }

      // Emit socket event
      const io = getIO();
      if (io) {
        io.to(`conversation:${req.params.id}`).emit('message:new', message);
        // Also emit to user rooms for participants not currently in conversation
        for (const p of otherParticipants) {
          io.to(`user:${p.userId}`).emit('message:new', {
            conversationId: req.params.id,
            message,
          });
        }
      }

      sendSuccess(res, message, undefined, 201);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Mark conversation as read
router.patch('/conversations/:id/read',
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      await prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId: req.params.id,
            userId: req.user!.id,
          },
        },
        data: { lastReadAt: new Date() },
      });

      sendSuccess(res, { message: 'Marked as read' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Get total unread message count
router.get('/unread-count', async (req, res) => {
  try {
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId: req.user!.id },
      select: { conversationId: true, lastReadAt: true },
    });

    let totalUnread = 0;
    for (const p of participations) {
      const count = await prisma.directMessage.count({
        where: {
          conversationId: p.conversationId,
          createdAt: { gt: p.lastReadAt },
          senderId: { not: req.user!.id },
        },
      });
      totalUnread += count;
    }

    sendSuccess(res, { count: totalUnread });
  } catch (error) {
    errors.serverError(res);
  }
});

export default router;
