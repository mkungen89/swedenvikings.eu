// ============================================
// Event Routes
// ============================================

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { isAuthenticated, hasPermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess, sendPaginated, errors } from '../utils/apiResponse';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Get upcoming events (public)
router.get('/',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('past').optional().isBoolean(),
  validate,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const showPast = req.query.past === 'true';
      const skip = (page - 1) * limit;

      const where: any = {
        isPublished: true,
        startDate: showPast ? { lt: new Date() } : { gte: new Date() },
      };

      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where,
          include: {
            organizer: {
              select: { id: true, username: true, avatar: true },
            },
            _count: {
              select: { participants: true },
            },
          },
          orderBy: { startDate: showPast ? 'desc' : 'asc' },
          skip,
          take: limit,
        }),
        prisma.event.count({ where }),
      ]);

      const formattedEvents = events.map(event => ({
        ...event,
        participantCount: event._count.participants,
        _count: undefined,
      }));

      sendPaginated(res, formattedEvents, page, limit, total);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Get single event by slug (public)
router.get('/:slug',
  param('slug').isString(),
  validate,
  async (req, res) => {
    try {
      const event = await prisma.event.findUnique({
        where: { slug: req.params.slug },
        include: {
          organizer: {
            select: { id: true, username: true, avatar: true },
          },
          participants: {
            include: {
              user: {
                select: { id: true, username: true, avatar: true },
              },
            },
            orderBy: { joinedAt: 'asc' },
          },
        },
      });

      if (!event || !event.isPublished) {
        return errors.notFound(res, 'Event');
      }

      sendSuccess(res, event);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Join event
router.post('/:slug/join',
  isAuthenticated,
  param('slug').isString(),
  body('status').optional().isIn(['going', 'maybe', 'not_going']),
  validate,
  async (req, res) => {
    try {
      const { status = 'going' } = req.body;

      const event = await prisma.event.findUnique({
        where: { slug: req.params.slug },
        include: {
          _count: { select: { participants: true } },
        },
      });

      if (!event || !event.isPublished) {
        return errors.notFound(res, 'Event');
      }

      // Check if event has max participants
      if (event.maxParticipants && event._count.participants >= event.maxParticipants) {
        return errors.validation(res, {
          event: ['Event is full'],
        });
      }

      // Check if already participating
      const existing = await prisma.eventParticipant.findUnique({
        where: {
          eventId_userId: {
            eventId: event.id,
            userId: req.user!.id,
          },
        },
      });

      if (existing) {
        // Update status
        const participant = await prisma.eventParticipant.update({
          where: { id: existing.id },
          data: { status },
          include: {
            user: {
              select: { id: true, username: true, avatar: true },
            },
          },
        });
        return sendSuccess(res, participant);
      }

      // Create new participation
      const participant = await prisma.eventParticipant.create({
        data: {
          eventId: event.id,
          userId: req.user!.id,
          status,
        },
        include: {
          user: {
            select: { id: true, username: true, avatar: true },
          },
        },
      });

      sendSuccess(res, participant, undefined, 201);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Leave event
router.delete('/:slug/leave',
  isAuthenticated,
  param('slug').isString(),
  validate,
  async (req, res) => {
    try {
      const event = await prisma.event.findUnique({
        where: { slug: req.params.slug },
      });

      if (!event) {
        return errors.notFound(res, 'Event');
      }

      await prisma.eventParticipant.deleteMany({
        where: {
          eventId: event.id,
          userId: req.user!.id,
        },
      });

      sendSuccess(res, { message: 'Left event successfully' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Admin: Create event
router.post('/',
  isAuthenticated,
  hasPermission('content.events.create'),
  body('title').isString().trim().isLength({ min: 3, max: 200 }),
  body('description').isString().trim().isLength({ min: 10, max: 500 }),
  body('content').isString().trim().isLength({ min: 20 }),
  body('startDate').isISO8601(),
  body('endDate').optional().isISO8601(),
  body('location').optional().isString().trim(),
  body('maxParticipants').optional().isInt({ min: 1 }),
  body('image').optional().isURL(),
  body('isPublished').optional().isBoolean(),
  validate,
  async (req, res) => {
    try {
      const { title, description, content, startDate, endDate, location, maxParticipants, image, isPublished } = req.body;

      // Generate slug
      let slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const existingSlug = await prisma.event.findUnique({ where: { slug } });
      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }

      const event = await prisma.event.create({
        data: {
          title,
          slug,
          description,
          content,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          location,
          maxParticipants,
          image,
          isPublished: isPublished || false,
          organizerId: req.user!.id,
        },
        include: {
          organizer: {
            select: { id: true, username: true, avatar: true },
          },
        },
      });

      // Send notifications if published
      if (event.isPublished) {
        const notifyNewEvent = async () => {
          try {
            const settings = await prisma.siteSettings.findUnique({
              where: { id: 'main' },
            });

            if (!settings || !settings.notifyOnNewEvent) return;

            // Discord notification
            if (settings.enableDiscordNotifications) {
              const { discordService } = await import('../services/discord.service');
              await discordService.sendNewEventNotification({
                id: event.id,
                title: event.title,
                description: event.description,
                startDate: event.startDate,
                maxParticipants: event.maxParticipants || undefined,
              });
            }
          } catch (error) {
            logger.error('Failed to send event notifications:', error);
          }
        };

        // Run notifications in background
        notifyNewEvent().catch((error) => {
          logger.error('Event notification error:', error);
        });
      }

      sendSuccess(res, event, undefined, 201);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Admin: Update event
router.patch('/:id',
  isAuthenticated,
  hasPermission('content.events.edit'),
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const event = await prisma.event.findUnique({
        where: { id: req.params.id },
      });

      if (!event) {
        return errors.notFound(res, 'Event');
      }

      const updatedEvent = await prisma.event.update({
        where: { id: req.params.id },
        data: req.body,
        include: {
          organizer: {
            select: { id: true, username: true, avatar: true },
          },
        },
      });

      sendSuccess(res, updatedEvent);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Admin: Delete event
router.delete('/:id',
  isAuthenticated,
  hasPermission('content.events.delete'),
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const event = await prisma.event.findUnique({
        where: { id: req.params.id },
      });

      if (!event) {
        return errors.notFound(res, 'Event');
      }

      await prisma.event.delete({
        where: { id: req.params.id },
      });

      sendSuccess(res, { message: 'Event deleted' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

export default router;

