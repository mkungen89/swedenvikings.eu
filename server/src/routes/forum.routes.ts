// ============================================
// Forum Routes
// ============================================

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { isAuthenticated, hasPermission, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess, sendPaginated, errors } from '../utils/apiResponse';
import { prisma } from '../utils/prisma';
import { notificationService } from '../services/notification.service';
import { getIO } from '../socket';

const router = Router();

// Helper to generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

// ============================================
// Public Routes
// ============================================

// Get all categories with thread counts
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.forumCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { threads: true } },
        threads: {
          take: 1,
          orderBy: { lastPostAt: 'desc' },
          include: {
            author: {
              select: { id: true, username: true, avatar: true },
            },
          },
        },
      },
    });

    const result = categories.map((cat) => ({
      ...cat,
      threadCount: cat._count.threads,
      latestThread: cat.threads[0] || null,
      threads: undefined,
      _count: undefined,
    }));

    sendSuccess(res, result);
  } catch (error) {
    errors.serverError(res);
  }
});

// Get category with threads
router.get('/categories/:slug',
  param('slug').isString().trim(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const category = await prisma.forumCategory.findUnique({
        where: { slug: req.params.slug },
      });

      if (!category) {
        return errors.notFound(res, 'Category');
      }

      const [threads, total] = await Promise.all([
        prisma.forumThread.findMany({
          where: { categoryId: category.id },
          include: {
            author: {
              select: { id: true, username: true, avatar: true },
            },
            _count: { select: { posts: true } },
          },
          orderBy: [
            { isPinned: 'desc' },
            { lastPostAt: 'desc' },
          ],
          skip,
          take: limit,
        }),
        prisma.forumThread.count({ where: { categoryId: category.id } }),
      ]);

      sendSuccess(res, {
        category,
        threads: threads.map((t) => ({
          ...t,
          postCount: t._count.posts,
          _count: undefined,
        })),
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

// Get thread with posts
router.get('/threads/:id',
  param('id').isUUID(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const thread = await prisma.forumThread.findUnique({
        where: { id: req.params.id },
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
          category: true,
        },
      });

      if (!thread) {
        return errors.notFound(res, 'Thread');
      }

      // Increment view count
      await prisma.forumThread.update({
        where: { id: req.params.id },
        data: { viewCount: { increment: 1 } },
      });

      const [posts, total] = await Promise.all([
        prisma.forumPost.findMany({
          where: { threadId: thread.id },
          include: {
            author: {
              select: { id: true, username: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'asc' },
          skip,
          take: limit,
        }),
        prisma.forumPost.count({ where: { threadId: thread.id } }),
      ]);

      sendSuccess(res, {
        thread: { ...thread, viewCount: thread.viewCount + 1 },
        posts,
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

// ============================================
// Authenticated Routes
// ============================================

// Create thread
router.post('/threads',
  isAuthenticated,
  body('categoryId').isUUID(),
  body('title').isString().trim().isLength({ min: 5, max: 200 }),
  body('content').isString().trim().isLength({ min: 10, max: 50000 }),
  validate,
  async (req, res) => {
    try {
      const { categoryId, title, content } = req.body;

      // Check if category exists and is not locked
      const category = await prisma.forumCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return errors.notFound(res, 'Category');
      }

      if (category.isLocked) {
        return errors.forbidden(res, 'This category is locked');
      }

      // Generate unique slug
      let slug = generateSlug(title);
      const existingThread = await prisma.forumThread.findUnique({
        where: { categoryId_slug: { categoryId, slug } },
      });
      if (existingThread) {
        slug = `${slug}-${Date.now()}`;
      }

      const thread = await prisma.forumThread.create({
        data: {
          title,
          slug,
          content,
          categoryId,
          authorId: req.user!.id,
        },
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
          category: true,
        },
      });

      sendSuccess(res, thread, undefined, 201);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Create post (reply to thread)
router.post('/threads/:id/posts',
  isAuthenticated,
  param('id').isUUID(),
  body('content').isString().trim().isLength({ min: 1, max: 50000 }),
  validate,
  async (req, res) => {
    try {
      const thread = await prisma.forumThread.findUnique({
        where: { id: req.params.id },
        include: {
          author: {
            select: { id: true, username: true },
          },
        },
      });

      if (!thread) {
        return errors.notFound(res, 'Thread');
      }

      if (thread.isLocked) {
        return errors.forbidden(res, 'This thread is locked');
      }

      const post = await prisma.forumPost.create({
        data: {
          content: req.body.content,
          threadId: thread.id,
          authorId: req.user!.id,
        },
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
        },
      });

      // Update thread's lastPostAt
      await prisma.forumThread.update({
        where: { id: thread.id },
        data: { lastPostAt: new Date() },
      });

      // Notify thread author if not the same user
      if (thread.authorId !== req.user!.id) {
        notificationService.notifyForumReply(
          thread.authorId,
          thread.title,
          thread.id,
          req.user!.username
        );
      }

      // Emit socket event
      const io = getIO();
      if (io) {
        io.emit('forum:new-post', { threadId: thread.id, post });
      }

      sendSuccess(res, post, undefined, 201);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Edit post
router.patch('/posts/:id',
  isAuthenticated,
  param('id').isUUID(),
  body('content').isString().trim().isLength({ min: 1, max: 50000 }),
  validate,
  async (req, res) => {
    try {
      const post = await prisma.forumPost.findUnique({
        where: { id: req.params.id },
      });

      if (!post) {
        return errors.notFound(res, 'Post');
      }

      // Check ownership or permission
      const userPermissions = req.user!.roles.flatMap((r: any) => r.permissions.map((p: any) => p.key));
      const canModerate = userPermissions.includes('forum.moderate');

      if (post.authorId !== req.user!.id && !canModerate) {
        return errors.forbidden(res);
      }

      const updatedPost = await prisma.forumPost.update({
        where: { id: req.params.id },
        data: { content: req.body.content },
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
        },
      });

      sendSuccess(res, updatedPost);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Edit thread
router.patch('/threads/:id',
  isAuthenticated,
  param('id').isUUID(),
  body('title').optional().isString().trim().isLength({ min: 5, max: 200 }),
  body('content').optional().isString().trim().isLength({ min: 10, max: 50000 }),
  validate,
  async (req, res) => {
    try {
      const thread = await prisma.forumThread.findUnique({
        where: { id: req.params.id },
      });

      if (!thread) {
        return errors.notFound(res, 'Thread');
      }

      // Check ownership or permission
      const userPermissions = req.user!.roles.flatMap((r: any) => r.permissions.map((p: any) => p.key));
      const canModerate = userPermissions.includes('forum.moderate');

      if (thread.authorId !== req.user!.id && !canModerate) {
        return errors.forbidden(res);
      }

      const updatedThread = await prisma.forumThread.update({
        where: { id: req.params.id },
        data: {
          title: req.body.title,
          content: req.body.content,
        },
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
          category: true,
        },
      });

      sendSuccess(res, updatedThread);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// ============================================
// Admin Routes
// ============================================

// Create category
router.post('/categories',
  isAuthenticated,
  hasPermission('forum.admin'),
  body('name').isString().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().isString().trim().isLength({ max: 500 }),
  body('icon').optional().isString().trim(),
  body('sortOrder').optional().isInt({ min: 0 }),
  validate,
  async (req, res) => {
    try {
      const { name, description, icon, sortOrder } = req.body;

      // Generate slug
      let slug = generateSlug(name);
      const existing = await prisma.forumCategory.findUnique({ where: { slug } });
      if (existing) {
        slug = `${slug}-${Date.now()}`;
      }

      const category = await prisma.forumCategory.create({
        data: {
          name,
          slug,
          description,
          icon,
          sortOrder: sortOrder || 0,
        },
      });

      sendSuccess(res, category, undefined, 201);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Update category
router.patch('/categories/:id',
  isAuthenticated,
  hasPermission('forum.admin'),
  param('id').isUUID(),
  body('name').optional().isString().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().isString().trim().isLength({ max: 500 }),
  body('icon').optional().isString().trim(),
  body('sortOrder').optional().isInt({ min: 0 }),
  body('isLocked').optional().isBoolean(),
  validate,
  async (req, res) => {
    try {
      const category = await prisma.forumCategory.update({
        where: { id: req.params.id },
        data: req.body,
      });

      sendSuccess(res, category);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Delete category
router.delete('/categories/:id',
  isAuthenticated,
  hasPermission('forum.admin'),
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      await prisma.forumCategory.delete({
        where: { id: req.params.id },
      });

      sendSuccess(res, { message: 'Category deleted' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Pin/unpin thread
router.patch('/threads/:id/pin',
  isAuthenticated,
  hasPermission('forum.moderate'),
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const thread = await prisma.forumThread.findUnique({
        where: { id: req.params.id },
      });

      if (!thread) {
        return errors.notFound(res, 'Thread');
      }

      const updatedThread = await prisma.forumThread.update({
        where: { id: req.params.id },
        data: { isPinned: !thread.isPinned },
      });

      sendSuccess(res, updatedThread);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Lock/unlock thread
router.patch('/threads/:id/lock',
  isAuthenticated,
  hasPermission('forum.moderate'),
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const thread = await prisma.forumThread.findUnique({
        where: { id: req.params.id },
      });

      if (!thread) {
        return errors.notFound(res, 'Thread');
      }

      const updatedThread = await prisma.forumThread.update({
        where: { id: req.params.id },
        data: { isLocked: !thread.isLocked },
      });

      sendSuccess(res, updatedThread);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Delete thread
router.delete('/threads/:id',
  isAuthenticated,
  hasPermission('forum.moderate'),
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      await prisma.forumThread.delete({
        where: { id: req.params.id },
      });

      sendSuccess(res, { message: 'Thread deleted' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Delete post
router.delete('/posts/:id',
  isAuthenticated,
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const post = await prisma.forumPost.findUnique({
        where: { id: req.params.id },
      });

      if (!post) {
        return errors.notFound(res, 'Post');
      }

      // Check ownership or permission
      const userPermissions = req.user!.roles.flatMap((r: any) => r.permissions.map((p: any) => p.key));
      const canModerate = userPermissions.includes('forum.moderate');

      if (post.authorId !== req.user!.id && !canModerate) {
        return errors.forbidden(res);
      }

      await prisma.forumPost.delete({
        where: { id: req.params.id },
      });

      sendSuccess(res, { message: 'Post deleted' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

export default router;
