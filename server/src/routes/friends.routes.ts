// ============================================
// Friends Routes
// ============================================

import { Router } from 'express';
import { param, query } from 'express-validator';
import { isAuthenticated } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess, sendPaginated, errors } from '../utils/apiResponse';
import { prisma } from '../utils/prisma';
import { notificationService } from '../services/notification.service';

const router = Router();

// All friend routes require authentication
router.use(isAuthenticated);

// ============================================
// Friend List
// ============================================

// Get my friends
router.get('/',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [friendships, total] = await Promise.all([
        prisma.friendship.findMany({
          where: {
            OR: [
              { userId: req.user!.id, status: 'ACCEPTED' },
              { friendId: req.user!.id, status: 'ACCEPTED' },
            ],
          },
          include: {
            user: {
              select: { id: true, username: true, avatar: true, lastSeenAt: true },
            },
            friend: {
              select: { id: true, username: true, avatar: true, lastSeenAt: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.friendship.count({
          where: {
            OR: [
              { userId: req.user!.id, status: 'ACCEPTED' },
              { friendId: req.user!.id, status: 'ACCEPTED' },
            ],
          },
        }),
      ]);

      // Return the friend (not self) from each friendship
      const friends = friendships.map((f) => {
        const friend = f.userId === req.user!.id ? f.friend : f.user;
        return {
          friendshipId: f.id,
          ...friend,
          friendsSince: f.updatedAt,
        };
      });

      sendPaginated(res, friends, page, limit, total);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Get pending friend requests (received)
router.get('/requests',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [requests, total] = await Promise.all([
        prisma.friendship.findMany({
          where: {
            friendId: req.user!.id,
            status: 'PENDING',
          },
          include: {
            user: {
              select: { id: true, username: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.friendship.count({
          where: {
            friendId: req.user!.id,
            status: 'PENDING',
          },
        }),
      ]);

      const result = requests.map((r) => ({
        requestId: r.id,
        from: r.user,
        sentAt: r.createdAt,
      }));

      sendPaginated(res, result, page, limit, total);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Get sent friend requests (sent by me)
router.get('/requests/sent',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [requests, total] = await Promise.all([
        prisma.friendship.findMany({
          where: {
            userId: req.user!.id,
            status: 'PENDING',
          },
          include: {
            friend: {
              select: { id: true, username: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.friendship.count({
          where: {
            userId: req.user!.id,
            status: 'PENDING',
          },
        }),
      ]);

      const result = requests.map((r) => ({
        requestId: r.id,
        to: r.friend,
        sentAt: r.createdAt,
      }));

      sendPaginated(res, result, page, limit, total);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Get friendship status with a user
router.get('/status/:userId',
  param('userId').isUUID(),
  validate,
  async (req, res) => {
    try {
      const { userId } = req.params;

      if (userId === req.user!.id) {
        return sendSuccess(res, { status: 'self' });
      }

      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: req.user!.id, friendId: userId },
            { userId: userId, friendId: req.user!.id },
          ],
        },
      });

      if (!friendship) {
        return sendSuccess(res, { status: 'none' });
      }

      if (friendship.status === 'BLOCKED') {
        // Don't reveal who blocked whom
        return sendSuccess(res, { status: 'blocked' });
      }

      if (friendship.status === 'PENDING') {
        const isPendingFromMe = friendship.userId === req.user!.id;
        return sendSuccess(res, {
          status: 'pending',
          direction: isPendingFromMe ? 'sent' : 'received',
          requestId: friendship.id,
        });
      }

      return sendSuccess(res, {
        status: 'friends',
        friendshipId: friendship.id,
        since: friendship.updatedAt,
      });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// ============================================
// Friend Actions
// ============================================

// Send friend request
router.post('/:userId',
  param('userId').isUUID(),
  validate,
  async (req, res) => {
    try {
      const { userId } = req.params;

      if (userId === req.user!.id) {
        return errors.validation(res, { userId: ['Cannot send friend request to yourself'] });
      }

      // Check if user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true },
      });

      if (!targetUser) {
        return errors.notFound(res, 'User');
      }

      // Check if friendship already exists
      const existing = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: req.user!.id, friendId: userId },
            { userId: userId, friendId: req.user!.id },
          ],
        },
      });

      if (existing) {
        if (existing.status === 'ACCEPTED') {
          return errors.validation(res, { userId: ['Already friends'] });
        }
        if (existing.status === 'PENDING') {
          return errors.validation(res, { userId: ['Friend request already pending'] });
        }
        if (existing.status === 'BLOCKED') {
          return errors.forbidden(res, 'Cannot send friend request to this user');
        }
      }

      // Create friend request
      const friendship = await prisma.friendship.create({
        data: {
          userId: req.user!.id,
          friendId: userId,
          status: 'PENDING',
        },
      });

      // Notify the target user
      notificationService.notifyFriendRequest(
        userId,
        req.user!.username,
        req.user!.id
      );

      sendSuccess(res, { message: 'Friend request sent', requestId: friendship.id }, undefined, 201);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Accept friend request
router.patch('/:requestId/accept',
  param('requestId').isUUID(),
  validate,
  async (req, res) => {
    try {
      const friendship = await prisma.friendship.findUnique({
        where: { id: req.params.requestId },
        include: {
          user: { select: { id: true, username: true } },
        },
      });

      if (!friendship) {
        return errors.notFound(res, 'Friend request');
      }

      // Only the recipient can accept
      if (friendship.friendId !== req.user!.id) {
        return errors.forbidden(res);
      }

      if (friendship.status !== 'PENDING') {
        return errors.validation(res, { requestId: ['Request is no longer pending'] });
      }

      await prisma.friendship.update({
        where: { id: req.params.requestId },
        data: { status: 'ACCEPTED' },
      });

      // Notify the sender
      notificationService.notifyFriendAccepted(
        friendship.userId,
        req.user!.username,
        req.user!.id
      );

      sendSuccess(res, { message: 'Friend request accepted' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Reject/cancel friend request
router.delete('/requests/:requestId',
  param('requestId').isUUID(),
  validate,
  async (req, res) => {
    try {
      const friendship = await prisma.friendship.findUnique({
        where: { id: req.params.requestId },
      });

      if (!friendship) {
        return errors.notFound(res, 'Friend request');
      }

      // Either sender or recipient can cancel/reject
      if (friendship.userId !== req.user!.id && friendship.friendId !== req.user!.id) {
        return errors.forbidden(res);
      }

      if (friendship.status !== 'PENDING') {
        return errors.validation(res, { requestId: ['Request is no longer pending'] });
      }

      await prisma.friendship.delete({
        where: { id: req.params.requestId },
      });

      sendSuccess(res, { message: 'Friend request cancelled' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Remove friend
router.delete('/:userId',
  param('userId').isUUID(),
  validate,
  async (req, res) => {
    try {
      const { userId } = req.params;

      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: req.user!.id, friendId: userId },
            { userId: userId, friendId: req.user!.id },
          ],
          status: 'ACCEPTED',
        },
      });

      if (!friendship) {
        return errors.notFound(res, 'Friendship');
      }

      await prisma.friendship.delete({
        where: { id: friendship.id },
      });

      sendSuccess(res, { message: 'Friend removed' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Block user
router.post('/:userId/block',
  param('userId').isUUID(),
  validate,
  async (req, res) => {
    try {
      const { userId } = req.params;

      if (userId === req.user!.id) {
        return errors.validation(res, { userId: ['Cannot block yourself'] });
      }

      // Check if friendship exists
      const existing = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: req.user!.id, friendId: userId },
            { userId: userId, friendId: req.user!.id },
          ],
        },
      });

      if (existing) {
        if (existing.status === 'BLOCKED' && existing.userId === req.user!.id) {
          return errors.validation(res, { userId: ['User already blocked'] });
        }

        // Update existing to blocked
        await prisma.friendship.update({
          where: { id: existing.id },
          data: {
            userId: req.user!.id,
            friendId: userId,
            status: 'BLOCKED',
          },
        });
      } else {
        // Create new blocked relationship
        await prisma.friendship.create({
          data: {
            userId: req.user!.id,
            friendId: userId,
            status: 'BLOCKED',
          },
        });
      }

      sendSuccess(res, { message: 'User blocked' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Unblock user
router.delete('/:userId/block',
  param('userId').isUUID(),
  validate,
  async (req, res) => {
    try {
      const { userId } = req.params;

      const blocked = await prisma.friendship.findFirst({
        where: {
          userId: req.user!.id,
          friendId: userId,
          status: 'BLOCKED',
        },
      });

      if (!blocked) {
        return errors.notFound(res, 'Block');
      }

      await prisma.friendship.delete({
        where: { id: blocked.id },
      });

      sendSuccess(res, { message: 'User unblocked' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Get blocked users
router.get('/blocked',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [blocked, total] = await Promise.all([
        prisma.friendship.findMany({
          where: {
            userId: req.user!.id,
            status: 'BLOCKED',
          },
          include: {
            friend: {
              select: { id: true, username: true, avatar: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.friendship.count({
          where: {
            userId: req.user!.id,
            status: 'BLOCKED',
          },
        }),
      ]);

      const result = blocked.map((b) => ({
        ...b.friend,
        blockedAt: b.updatedAt,
      }));

      sendPaginated(res, result, page, limit, total);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

export default router;
