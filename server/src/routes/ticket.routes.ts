// ============================================
// Ticket Routes
// ============================================

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { isAuthenticated, hasPermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess, sendPaginated, errors } from '../utils/apiResponse';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// All ticket routes require authentication
router.use(isAuthenticated);

// Get my tickets
router.get('/my',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['open', 'in_progress', 'waiting', 'resolved', 'closed']),
  validate,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const skip = (page - 1) * limit;

      const where: any = { createdById: req.user!.id };
      if (status) where.status = status;

      const [tickets, total] = await Promise.all([
        prisma.ticket.findMany({
          where,
          include: {
            assignedTo: {
              select: { id: true, username: true, avatar: true },
            },
            _count: { select: { messages: true } },
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.ticket.count({ where }),
      ]);

      sendPaginated(res, tickets, page, limit, total);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Get single ticket
router.get('/:id',
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: req.params.id },
        include: {
          createdBy: {
            select: { id: true, username: true, avatar: true },
          },
          assignedTo: {
            select: { id: true, username: true, avatar: true },
          },
          messages: {
            include: {
              author: {
                select: { id: true, username: true, avatar: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!ticket) {
        return errors.notFound(res, 'Ticket');
      }

      // Check if user has permission to view
      const isOwner = ticket.createdById === req.user!.id;
      const userPermissions = req.user!.roles.flatMap(r => r.permissions.map(p => p.key));
      const canViewAll = userPermissions.includes('tickets.view');

      if (!isOwner && !canViewAll) {
        return errors.forbidden(res);
      }

      sendSuccess(res, ticket);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Create ticket
router.post('/',
  body('title').isString().trim().isLength({ min: 5, max: 200 }),
  body('description').isString().trim().isLength({ min: 20, max: 5000 }),
  body('category').isIn(['bug', 'question', 'report', 'appeal', 'other']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  validate,
  async (req, res) => {
    try {
      const { title, description, category, priority } = req.body;

      const ticket = await prisma.ticket.create({
        data: {
          title,
          description,
          category,
          priority: priority || 'medium',
          createdById: req.user!.id,
        },
        include: {
          createdBy: {
            select: { id: true, username: true, avatar: true },
          },
        },
      });

      // Send notifications asynchronously
      const notifyNewTicket = async () => {
        try {
          const settings = await prisma.siteSettings.findUnique({
            where: { id: 'main' },
          });

          if (!settings || !settings.notifyOnNewTicket) return;

          // Email notification
          if (settings.enableEmailNotifications) {
            const { emailService } = await import('../services/email.service');
            await emailService.sendNewTicketNotification({
              id: ticket.id,
              title: ticket.title,
              priority: ticket.priority,
              user: { username: ticket.createdBy.username },
            });
          }

          // Discord notification
          if (settings.enableDiscordNotifications) {
            const { discordService } = await import('../services/discord.service');
            await discordService.sendNewTicketNotification({
              id: ticket.id,
              title: ticket.title,
              priority: ticket.priority,
              category: ticket.category,
              user: { username: ticket.createdBy.username },
            });
          }
        } catch (error) {
          logger.error('Failed to send ticket notifications:', error);
        }
      };

      // Run notifications in background
      notifyNewTicket().catch((error) => {
        logger.error('Ticket notification error:', error);
      });

      sendSuccess(res, ticket, undefined, 201);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Add message to ticket
router.post('/:id/messages',
  param('id').isUUID(),
  body('content').isString().trim().isLength({ min: 1, max: 5000 }),
  validate,
  async (req, res) => {
    try {
      const { content } = req.body;

      const ticket = await prisma.ticket.findUnique({
        where: { id: req.params.id },
      });

      if (!ticket) {
        return errors.notFound(res, 'Ticket');
      }

      // Check permission
      const isOwner = ticket.createdById === req.user!.id;
      const userPermissions = req.user!.roles.flatMap(r => r.permissions.map(p => p.key));
      const canRespond = userPermissions.includes('tickets.respond');

      if (!isOwner && !canRespond) {
        return errors.forbidden(res);
      }

      const message = await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          content,
          isStaff: canRespond && !isOwner,
          authorId: req.user!.id,
        },
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
        },
      });

      // Update ticket status if staff responds
      if (canRespond && !isOwner && ticket.status === 'open') {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { status: 'in_progress' },
        });
      }

      sendSuccess(res, message, undefined, 201);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Close ticket (owner or staff)
router.patch('/:id/close',
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: req.params.id },
      });

      if (!ticket) {
        return errors.notFound(res, 'Ticket');
      }

      const isOwner = ticket.createdById === req.user!.id;
      const userPermissions = req.user!.roles.flatMap(r => r.permissions.map(p => p.key));
      const canClose = userPermissions.includes('tickets.close');

      if (!isOwner && !canClose) {
        return errors.forbidden(res);
      }

      const updatedTicket = await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: 'closed',
          closedAt: new Date(),
        },
      });

      sendSuccess(res, updatedTicket);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Staff routes

// Get all tickets (staff)
router.get('/',
  hasPermission('tickets.view'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['open', 'in_progress', 'waiting', 'resolved', 'closed']),
  query('category').optional().isIn(['bug', 'question', 'report', 'appeal', 'other']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  validate,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (req.query.status) where.status = req.query.status;
      if (req.query.category) where.category = req.query.category;
      if (req.query.priority) where.priority = req.query.priority;

      const [tickets, total] = await Promise.all([
        prisma.ticket.findMany({
          where,
          include: {
            createdBy: {
              select: { id: true, username: true, avatar: true },
            },
            assignedTo: {
              select: { id: true, username: true, avatar: true },
            },
            _count: { select: { messages: true } },
          },
          orderBy: [
            { priority: 'desc' },
            { updatedAt: 'desc' },
          ],
          skip,
          take: limit,
        }),
        prisma.ticket.count({ where }),
      ]);

      sendPaginated(res, tickets, page, limit, total);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Assign ticket (staff)
router.patch('/:id/assign',
  hasPermission('tickets.assign'),
  param('id').isUUID(),
  body('assignedToId').optional().isUUID(),
  validate,
  async (req, res) => {
    try {
      const { assignedToId } = req.body;

      const ticket = await prisma.ticket.update({
        where: { id: req.params.id },
        data: {
          assignedToId: assignedToId || req.user!.id,
          status: 'in_progress',
        },
        include: {
          assignedTo: {
            select: { id: true, username: true, avatar: true },
          },
        },
      });

      sendSuccess(res, ticket);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Update ticket status (staff)
router.patch('/:id/status',
  hasPermission('tickets.respond'),
  param('id').isUUID(),
  body('status').isIn(['open', 'in_progress', 'waiting', 'resolved', 'closed']),
  validate,
  async (req, res) => {
    try {
      const { status } = req.body;

      const ticket = await prisma.ticket.update({
        where: { id: req.params.id },
        data: {
          status,
          closedAt: status === 'closed' ? new Date() : null,
        },
      });

      sendSuccess(res, ticket);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

export default router;

