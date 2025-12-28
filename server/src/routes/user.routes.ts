// ============================================
// User Routes
// ============================================

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { isAuthenticated, isOwnerOrAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess, sendPaginated, errors } from '../utils/apiResponse';
import { prisma } from '../utils/prisma';

const router = Router();

// Get user profile by ID
router.get('/:id',
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
          socialLinks: true,
        },
      });

      if (!user) {
        return errors.notFound(res, 'User');
      }

      // Check if profile is private
      if (user.isPrivate && (!req.user || req.user.id !== user.id)) {
        return sendSuccess(res, {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          isPrivate: true,
          roles: user.roles.map(ur => ({
            id: ur.role.id,
            name: ur.role.name,
            color: ur.role.color,
          })),
        });
      }

      sendSuccess(res, {
        id: user.id,
        steamId: user.steamId,
        username: user.username,
        avatar: user.avatar,
        banner: user.banner,
        bio: user.bio,
        isPrivate: user.isPrivate,
        createdAt: user.createdAt,
        lastSeenAt: user.lastSeenAt,
        roles: user.roles.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
          color: ur.role.color,
          icon: ur.role.icon,
        })),
        socialLinks: user.socialLinks,
      });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Update own profile
router.patch('/me',
  isAuthenticated,
  body('username').optional().isString().trim().isLength({ min: 2, max: 32 }),
  body('bio').optional().isString().trim().isLength({ max: 500 }),
  body('isPrivate').optional().isBoolean(),
  validate,
  async (req, res) => {
    try {
      const { username, bio, isPrivate } = req.body;

      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          ...(username && { username }),
          ...(bio !== undefined && { bio }),
          ...(isPrivate !== undefined && { isPrivate }),
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
          socialLinks: true,
        },
      });

      sendSuccess(res, {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        banner: user.banner,
        bio: user.bio,
        isPrivate: user.isPrivate,
        roles: user.roles.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
          color: ur.role.color,
        })),
        socialLinks: user.socialLinks,
      });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Update settings
router.patch('/me/settings',
  isAuthenticated,
  body('theme').optional().isIn(['light', 'dark', 'system']),
  body('language').optional().isIn(['sv', 'en']),
  body('emailNotifications').optional().isBoolean(),
  body('discordNotifications').optional().isBoolean(),
  validate,
  async (req, res) => {
    try {
      const { theme, language, emailNotifications, discordNotifications } = req.body;

      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          ...(theme && { theme }),
          ...(language && { language }),
          ...(emailNotifications !== undefined && { emailNotifications }),
          ...(discordNotifications !== undefined && { discordNotifications }),
        },
      });

      sendSuccess(res, {
        theme: user.theme,
        language: user.language,
        emailNotifications: user.emailNotifications,
        discordNotifications: user.discordNotifications,
      });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Add social link
router.post('/me/social',
  isAuthenticated,
  body('platform').isIn(['discord', 'twitter', 'youtube', 'twitch', 'instagram', 'website']),
  body('url').isURL(),
  validate,
  async (req, res) => {
    try {
      const { platform, url } = req.body;

      // Check if link already exists
      const existing = await prisma.socialLink.findFirst({
        where: {
          userId: req.user!.id,
          platform,
        },
      });

      if (existing) {
        // Update existing
        const link = await prisma.socialLink.update({
          where: { id: existing.id },
          data: { url },
        });
        return sendSuccess(res, link);
      }

      // Create new
      const link = await prisma.socialLink.create({
        data: {
          userId: req.user!.id,
          platform,
          url,
        },
      });

      sendSuccess(res, link, undefined, 201);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Delete social link
router.delete('/me/social/:id',
  isAuthenticated,
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const link = await prisma.socialLink.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id,
        },
      });

      if (!link) {
        return errors.notFound(res, 'Social link');
      }

      await prisma.socialLink.delete({
        where: { id: link.id },
      });

      sendSuccess(res, { message: 'Social link deleted' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Get notifications
router.get('/me/notifications',
  isAuthenticated,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId: req.user!.id },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({
          where: { userId: req.user!.id },
        }),
      ]);

      sendPaginated(res, notifications, page, limit, total);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Mark notification as read
router.patch('/me/notifications/:id/read',
  isAuthenticated,
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id: req.params.id,
          userId: req.user!.id,
        },
        data: { isRead: true },
      });

      if (notification.count === 0) {
        return errors.notFound(res, 'Notification');
      }

      sendSuccess(res, { message: 'Notification marked as read' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Mark all notifications as read
router.patch('/me/notifications/read-all',
  isAuthenticated,
  async (req, res) => {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: req.user!.id,
          isRead: false,
        },
        data: { isRead: true },
      });

      sendSuccess(res, { message: 'All notifications marked as read' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

export default router;

