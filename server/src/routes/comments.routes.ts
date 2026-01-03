// ============================================
// Comments Routes
// ============================================

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { isAuthenticated, hasPermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess, sendPaginated, errors } from '../utils/apiResponse';
import { prisma } from '../utils/prisma';
import { notificationService } from '../services/notification.service';
import { getIO } from '../socket';

const router = Router();

// ============================================
// News Comments
// ============================================

// Get comments for a news article
router.get('/news/:slug',
  param('slug').isString().trim(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const news = await prisma.news.findUnique({
        where: { slug: req.params.slug },
      });

      if (!news) {
        return errors.notFound(res, 'News');
      }

      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where: { newsId: news.id, parentId: null },
          include: {
            author: {
              select: { id: true, username: true, avatar: true },
            },
            replies: {
              include: {
                author: {
                  select: { id: true, username: true, avatar: true },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.comment.count({ where: { newsId: news.id, parentId: null } }),
      ]);

      sendPaginated(res, comments, page, limit, total);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Create comment on news
router.post('/news/:slug',
  isAuthenticated,
  param('slug').isString().trim(),
  body('content').isString().trim().isLength({ min: 1, max: 5000 }),
  body('parentId').optional().isUUID(),
  validate,
  async (req, res) => {
    try {
      const news = await prisma.news.findUnique({
        where: { slug: req.params.slug },
      });

      if (!news) {
        return errors.notFound(res, 'News');
      }

      const { content, parentId } = req.body;

      // If replying to a comment, verify parent exists
      let parentComment = null;
      if (parentId) {
        parentComment = await prisma.comment.findUnique({
          where: { id: parentId },
          include: { author: { select: { id: true, username: true } } },
        });
        if (!parentComment || parentComment.newsId !== news.id) {
          return errors.validation(res, { parentId: ['Invalid parent comment'] });
        }
      }

      const comment = await prisma.comment.create({
        data: {
          content,
          authorId: req.user!.id,
          newsId: news.id,
          parentId,
        },
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
        },
      });

      // Notify parent comment author if replying
      if (parentComment && parentComment.author.id !== req.user!.id) {
        notificationService.notifyCommentReply(
          parentComment.author.id,
          news.title,
          'news',
          news.slug,
          req.user!.username
        );
      }

      // Emit socket event
      const io = getIO();
      if (io) {
        io.emit('comment:new', { type: 'news', slug: news.slug, comment });
      }

      sendSuccess(res, comment, undefined, 201);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// ============================================
// Event Comments
// ============================================

// Get comments for an event
router.get('/events/:slug',
  param('slug').isString().trim(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const event = await prisma.event.findUnique({
        where: { slug: req.params.slug },
      });

      if (!event) {
        return errors.notFound(res, 'Event');
      }

      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where: { eventId: event.id, parentId: null },
          include: {
            author: {
              select: { id: true, username: true, avatar: true },
            },
            replies: {
              include: {
                author: {
                  select: { id: true, username: true, avatar: true },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.comment.count({ where: { eventId: event.id, parentId: null } }),
      ]);

      sendPaginated(res, comments, page, limit, total);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Create comment on event
router.post('/events/:slug',
  isAuthenticated,
  param('slug').isString().trim(),
  body('content').isString().trim().isLength({ min: 1, max: 5000 }),
  body('parentId').optional().isUUID(),
  validate,
  async (req, res) => {
    try {
      const event = await prisma.event.findUnique({
        where: { slug: req.params.slug },
      });

      if (!event) {
        return errors.notFound(res, 'Event');
      }

      const { content, parentId } = req.body;

      // If replying to a comment, verify parent exists
      let parentComment = null;
      if (parentId) {
        parentComment = await prisma.comment.findUnique({
          where: { id: parentId },
          include: { author: { select: { id: true, username: true } } },
        });
        if (!parentComment || parentComment.eventId !== event.id) {
          return errors.validation(res, { parentId: ['Invalid parent comment'] });
        }
      }

      const comment = await prisma.comment.create({
        data: {
          content,
          authorId: req.user!.id,
          eventId: event.id,
          parentId,
        },
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
        },
      });

      // Notify parent comment author if replying
      if (parentComment && parentComment.author.id !== req.user!.id) {
        notificationService.notifyCommentReply(
          parentComment.author.id,
          event.title,
          'event',
          event.slug,
          req.user!.username
        );
      }

      // Emit socket event
      const io = getIO();
      if (io) {
        io.emit('comment:new', { type: 'event', slug: event.slug, comment });
      }

      sendSuccess(res, comment, undefined, 201);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// ============================================
// Comment Management
// ============================================

// Edit comment
router.patch('/:id',
  isAuthenticated,
  param('id').isUUID(),
  body('content').isString().trim().isLength({ min: 1, max: 5000 }),
  validate,
  async (req, res) => {
    try {
      const comment = await prisma.comment.findUnique({
        where: { id: req.params.id },
      });

      if (!comment) {
        return errors.notFound(res, 'Comment');
      }

      // Check ownership or permission
      const userPermissions = req.user!.roles.flatMap((r: any) => r.permissions.map((p: any) => p.key));
      const canModerate = userPermissions.includes('comments.moderate');

      if (comment.authorId !== req.user!.id && !canModerate) {
        return errors.forbidden(res);
      }

      const updatedComment = await prisma.comment.update({
        where: { id: req.params.id },
        data: { content: req.body.content },
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
        },
      });

      sendSuccess(res, updatedComment);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Delete comment
router.delete('/:id',
  isAuthenticated,
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const comment = await prisma.comment.findUnique({
        where: { id: req.params.id },
      });

      if (!comment) {
        return errors.notFound(res, 'Comment');
      }

      // Check ownership or permission
      const userPermissions = req.user!.roles.flatMap((r: any) => r.permissions.map((p: any) => p.key));
      const canModerate = userPermissions.includes('comments.moderate');

      if (comment.authorId !== req.user!.id && !canModerate) {
        return errors.forbidden(res);
      }

      await prisma.comment.delete({
        where: { id: req.params.id },
      });

      sendSuccess(res, { message: 'Comment deleted' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

export default router;
