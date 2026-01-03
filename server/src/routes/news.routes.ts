// ============================================
// News Routes
// ============================================

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { isAuthenticated, hasPermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess, sendPaginated, errors } from '../utils/apiResponse';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Get all published news (public)
router.get('/',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('category').optional().isString(),
  validate,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const category = req.query.category as string;
      const skip = (page - 1) * limit;

      const where: any = { isPublished: true };
      if (category) where.category = category;

      const [news, total] = await Promise.all([
        prisma.news.findMany({
          where,
          include: {
            author: {
              select: { id: true, username: true, avatar: true },
            },
          },
          orderBy: [
            { isPinned: 'desc' },
            { publishedAt: 'desc' },
          ],
          skip,
          take: limit,
        }),
        prisma.news.count({ where }),
      ]);

      sendPaginated(res, news, page, limit, total);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Get single news by slug (public)
router.get('/:slug',
  param('slug').isString(),
  validate,
  async (req, res) => {
    try {
      const news = await prisma.news.findUnique({
        where: { slug: req.params.slug },
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
        },
      });

      if (!news || !news.isPublished) {
        return errors.notFound(res, 'News article');
      }

      sendSuccess(res, news);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Admin routes
// Get all news (including unpublished)
router.get('/admin/all',
  isAuthenticated,
  hasPermission('content.news.view'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [news, total] = await Promise.all([
        prisma.news.findMany({
          include: {
            author: {
              select: { id: true, username: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.news.count(),
      ]);

      sendPaginated(res, news, page, limit, total);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Create news
router.post('/',
  isAuthenticated,
  hasPermission('content.news.create'),
  body('title').isString().trim().isLength({ min: 3, max: 200 }),
  body('excerpt').isString().trim().isLength({ min: 10, max: 500 }),
  body('content').isString().trim().isLength({ min: 20 }),
  body('category').optional().isIn(['update', 'event', 'announcement', 'changelog', 'community']),
  body('image').optional().isURL(),
  body('isPinned').optional().isBoolean(),
  body('isPublished').optional().isBoolean(),
  validate,
  async (req, res) => {
    try {
      const { title, excerpt, content, category, image, isPinned, isPublished } = req.body;

      // Generate slug
      let slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if slug exists and make unique
      const existingSlug = await prisma.news.findUnique({ where: { slug } });
      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }

      const news = await prisma.news.create({
        data: {
          title,
          slug,
          excerpt,
          content,
          category: category || 'announcement',
          image,
          isPinned: isPinned || false,
          isPublished: isPublished || false,
          publishedAt: isPublished ? new Date() : null,
          authorId: req.user!.id,
        },
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
        },
      });

      // Send notifications if published
      if (news.isPublished) {
        const notifyNewNews = async () => {
          try {
            const settings = await prisma.siteSettings.findUnique({
              where: { id: 'main' },
            });

            if (!settings || !settings.notifyOnNewNews) return;

            // Discord notification
            if (settings.enableDiscordNotifications) {
              const { discordService } = await import('../services/discord.service');
              await discordService.sendNewNewsNotification({
                id: news.id,
                title: news.title,
                excerpt: news.excerpt,
                author: { username: news.author.username },
              });
            }
          } catch (error) {
            logger.error('Failed to send news notifications:', error);
          }
        };

        // Run notifications in background
        notifyNewNews().catch((error) => {
          logger.error('News notification error:', error);
        });
      }

      sendSuccess(res, news, undefined, 201);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Update news
router.patch('/:id',
  isAuthenticated,
  hasPermission('content.news.edit'),
  param('id').isUUID(),
  body('title').optional().isString().trim().isLength({ min: 3, max: 200 }),
  body('excerpt').optional().isString().trim().isLength({ min: 10, max: 500 }),
  body('content').optional().isString().trim().isLength({ min: 20 }),
  body('category').optional().isIn(['update', 'event', 'announcement', 'changelog', 'community']),
  body('image').optional().isURL(),
  body('isPinned').optional().isBoolean(),
  body('isPublished').optional().isBoolean(),
  validate,
  async (req, res) => {
    try {
      const { title, excerpt, content, category, image, isPinned, isPublished } = req.body;

      const existing = await prisma.news.findUnique({
        where: { id: req.params.id },
      });

      if (!existing) {
        return errors.notFound(res, 'News article');
      }

      const news = await prisma.news.update({
        where: { id: req.params.id },
        data: {
          ...(title && { title }),
          ...(excerpt && { excerpt }),
          ...(content && { content }),
          ...(category && { category }),
          ...(image !== undefined && { image }),
          ...(isPinned !== undefined && { isPinned }),
          ...(isPublished !== undefined && {
            isPublished,
            publishedAt: isPublished && !existing.publishedAt ? new Date() : existing.publishedAt,
          }),
        },
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
        },
      });

      sendSuccess(res, news);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Delete news
router.delete('/:id',
  isAuthenticated,
  hasPermission('content.news.delete'),
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const news = await prisma.news.findUnique({
        where: { id: req.params.id },
      });

      if (!news) {
        return errors.notFound(res, 'News article');
      }

      await prisma.news.delete({
        where: { id: req.params.id },
      });

      sendSuccess(res, { message: 'News article deleted' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

export default router;

