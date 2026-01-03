// ============================================
// Notification Routes
// ============================================

import { Router } from 'express';
import { param, query } from 'express-validator';
import { isAuthenticated } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess, sendPaginated, errors } from '../utils/apiResponse';
import { notificationService } from '../services/notification.service';

const router = Router();

// All notification routes require authentication
router.use(isAuthenticated);

// Get my notifications
router.get('/',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('unread').optional().isBoolean(),
  validate,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const unreadOnly = req.query.unread === 'true';

      const filters = unreadOnly ? { isRead: false } : {};

      const result = await notificationService.getByUserId(
        req.user!.id,
        page,
        limit,
        filters
      );

      sendPaginated(res, result.notifications, page, limit, result.total);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Get unread count
router.get('/unread-count', async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user!.id);
    sendSuccess(res, { count });
  } catch (error) {
    errors.serverError(res);
  }
});

// Mark a notification as read
router.patch('/:id/read',
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      await notificationService.markAsRead(req.params.id, req.user!.id);
      sendSuccess(res, { message: 'Notification marked as read' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Mark all notifications as read
router.patch('/read-all', async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user!.id);
    sendSuccess(res, { count: result.count });
  } catch (error) {
    errors.serverError(res);
  }
});

// Delete a notification
router.delete('/:id',
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      await notificationService.delete(req.params.id, req.user!.id);
      sendSuccess(res, { message: 'Notification deleted' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

export default router;
