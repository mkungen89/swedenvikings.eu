// ============================================
// GDPR Routes - Data Privacy & Compliance
// ============================================

import { Router } from 'express';
import { body, param } from 'express-validator';
import { gdprService } from '../services/gdpr.service';
import { validate } from '../middleware/validate';
import { sendSuccess, errors } from '../utils/apiResponse';
import { isAuthenticated } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import path from 'path';

const router = Router();

/**
 * @route   GET /api/gdpr/consent/:userId
 * @desc    Get cookie consent for user
 * @access  Public (user can only see their own)
 */
router.get('/consent/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Ensure user can only access their own consent
    if (req.user?.id !== userId) {
      return errors.forbidden(res);
    }

    const consent = await gdprService.getCookieConsent(userId);
    sendSuccess(res, consent);
  } catch (error) {
    console.error('Get cookie consent error:', error);
    errors.serverError(res);
  }
});

/**
 * @route   POST /api/gdpr/consent
 * @desc    Save cookie consent
 * @access  Public
 */
router.post(
  '/consent',
  body('necessary').isBoolean(),
  body('analytics').isBoolean(),
  body('marketing').isBoolean(),
  body('preferences').isBoolean(),
  validate,
  async (req, res) => {
    try {
      const { necessary, analytics, marketing, preferences } = req.body;
      const userId = req.user?.id || null;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      const consent = await gdprService.saveCookieConsent(
        userId,
        { necessary, analytics, marketing, preferences },
        ipAddress,
        userAgent
      );

      sendSuccess(res, consent, 'Cookie consent saved');
    } catch (error) {
      console.error('Save cookie consent error:', error);
      errors.serverError(res);
    }
  }
);

/**
 * @route   GET /api/gdpr/requests
 * @desc    Get user's GDPR requests (exports and deletions)
 * @access  Private
 */
router.get('/requests', isAuthenticated, async (req, res) => {
  try {
    if (!req.user) {
      return errors.unauthorized(res);
    }

    const requests = await gdprService.getUserGDPRRequests(req.user.id);
    sendSuccess(res, requests);
  } catch (error) {
    console.error('Get GDPR requests error:', error);
    errors.serverError(res);
  }
});

/**
 * @route   POST /api/gdpr/export
 * @desc    Request data export
 * @access  Private
 */
router.post('/export', isAuthenticated, async (req, res) => {
  try {
    if (!req.user) {
      return errors.unauthorized(res);
    }

    const exportRequest = await gdprService.createExportRequest(req.user.id);
    sendSuccess(
      res,
      exportRequest,
      'Data export request created. You will be notified when it is ready.'
    );
  } catch (error: any) {
    console.error('Create export request error:', error);

    if (error.message === 'Export request already in progress') {
      return errors.badRequest(res, error.message);
    }

    errors.serverError(res);
  }
});

/**
 * @route   GET /api/gdpr/export/:requestId/download
 * @desc    Download data export
 * @access  Private
 */
router.get(
  '/export/:requestId/download',
  isAuthenticated,
  param('requestId').isUUID(),
  validate,
  async (req, res) => {
    try {
      if (!req.user) {
        return errors.unauthorized(res);
      }

      const { requestId } = req.params;

      // Verify this is the user's export
      const exportRequest = await prisma.dataExportRequest.findUnique({
        where: { id: requestId },
      });

      if (!exportRequest || exportRequest.userId !== req.user.id) {
        return errors.forbidden(res);
      }

      const filepath = await gdprService.getExportFilePath(requestId);

      if (!filepath) {
        return errors.notFound(res, 'Export file not found or expired');
      }

      const filename = path.basename(filepath);

      res.download(filepath, filename, (err) => {
        if (err) {
          console.error('Download error:', err);
          if (!res.headersSent) {
            errors.serverError(res);
          }
        }
      });
    } catch (error) {
      console.error('Download export error:', error);
      errors.serverError(res);
    }
  }
);

/**
 * @route   POST /api/gdpr/delete
 * @desc    Request account deletion
 * @access  Private
 */
router.post(
  '/delete',
  isAuthenticated,
  body('reason').optional().isString().trim(),
  validate,
  async (req, res) => {
    try {
      if (!req.user) {
        return errors.unauthorized(res);
      }

      const { reason } = req.body;

      const deletionRequest = await gdprService.createDeletionRequest(
        req.user.id,
        reason
      );

      sendSuccess(res, deletionRequest);
    } catch (error: any) {
      console.error('Create deletion request error:', error);

      if (error.message === 'Deletion request already exists') {
        return errors.badRequest(res, error.message);
      }

      errors.serverError(res);
    }
  }
);

/**
 * @route   POST /api/gdpr/delete/verify/:token
 * @desc    Verify deletion request
 * @access  Public
 */
router.post(
  '/delete/verify/:token',
  param('token').isString(),
  validate,
  async (req, res) => {
    try {
      const { token } = req.params;

      const result = await gdprService.verifyDeletionRequest(token);
      sendSuccess(res, result);
    } catch (error: any) {
      console.error('Verify deletion request error:', error);

      if (
        error.message === 'Invalid verification token' ||
        error.message === 'Request already verified'
      ) {
        return errors.badRequest(res, error.message);
      }

      errors.serverError(res);
    }
  }
);

/**
 * @route   DELETE /api/gdpr/delete/:requestId
 * @desc    Cancel deletion request
 * @access  Private
 */
router.delete(
  '/delete/:requestId',
  isAuthenticated,
  param('requestId').isUUID(),
  validate,
  async (req, res) => {
    try {
      if (!req.user) {
        return errors.unauthorized(res);
      }

      const { requestId } = req.params;

      const result = await gdprService.cancelDeletionRequest(
        requestId,
        req.user.id
      );

      sendSuccess(res, result);
    } catch (error: any) {
      console.error('Cancel deletion request error:', error);

      if (
        error.message === 'Deletion request not found' ||
        error.message === 'Cannot cancel completed deletion'
      ) {
        return errors.badRequest(res, error.message);
      }

      errors.serverError(res);
    }
  }
);

export default router;
