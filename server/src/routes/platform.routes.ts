// ============================================
// Platform Account Linking Routes
// ============================================

import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth';
import { sendSuccess, errors } from '../utils/apiResponse';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// ============================================
// Generate Linking Code (Called by Arma Reforger Mod)
// ============================================

/**
 * POST /api/platform/generate-code
 * Body: { platform, platformId, platformUsername, serverApiKey }
 *
 * Called by the Arma Reforger server mod when a player joins
 * and doesn't have a linked account yet.
 */
router.post('/generate-code', async (req, res) => {
  try {
    const { platform, platformId, platformUsername, serverApiKey } = req.body;

    // Validate server API key
    if (serverApiKey !== process.env.SERVER_API_KEY) {
      return errors.unauthorized(res, 'Invalid server API key');
    }

    // Validate platform
    if (!['steam', 'xbox', 'psn'].includes(platform)) {
      return errors.badRequest(res, 'Invalid platform. Must be steam, xbox, or psn');
    }

    if (!platformId) {
      return errors.badRequest(res, 'platformId is required');
    }

    // Check if this platform account is already linked
    const existingAccount = await prisma.platformAccount.findUnique({
      where: {
        platform_platformId: {
          platform,
          platformId,
        },
      },
      include: {
        user: true,
      },
    });

    if (existingAccount) {
      return sendSuccess(res, {
        alreadyLinked: true,
        username: existingAccount.user.username,
        message: 'This account is already linked',
      });
    }

    // Check if there's an existing unused code for this platform account
    const existingCode = await prisma.linkingCode.findFirst({
      where: {
        platform,
        platformId,
        userId: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingCode) {
      return sendSuccess(res, {
        code: existingCode.code,
        expiresAt: existingCode.expiresAt,
      });
    }

    // Generate a unique 6-character code (e.g., "VIKING-A7X9")
    const generateCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars
      let code = 'VIKING-';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let code = generateCode();
    let codeExists = true;

    // Ensure uniqueness
    while (codeExists) {
      const existing = await prisma.linkingCode.findUnique({
        where: { code },
      });
      if (!existing) {
        codeExists = false;
      } else {
        code = generateCode();
      }
    }

    // Create linking code (expires in 24 hours)
    const linkingCode = await prisma.linkingCode.create({
      data: {
        code,
        platform,
        platformId,
        platformUsername,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    logger.info(`Generated linking code ${code} for ${platform}:${platformId}`);

    sendSuccess(res, {
      code: linkingCode.code,
      expiresAt: linkingCode.expiresAt,
    });
  } catch (error) {
    logger.error('Error generating linking code:', error);
    errors.serverError(res);
  }
});

// ============================================
// Verify and Link Code (Called by User on Website)
// ============================================

/**
 * POST /api/platform/link-code
 * Body: { code }
 * Requires authentication
 *
 * User enters the code they received in-game to link their gaming account
 */
router.post('/link-code', isAuthenticated, async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user!.id;

    if (!code) {
      return errors.badRequest(res, 'Code is required');
    }

    // Find the linking code
    const linkingCode = await prisma.linkingCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!linkingCode) {
      return errors.notFound(res, 'Invalid code');
    }

    // Check if expired
    if (linkingCode.expiresAt < new Date()) {
      return errors.badRequest(res, 'Code has expired');
    }

    // Check if already used
    if (linkingCode.userId) {
      return errors.badRequest(res, 'Code has already been used');
    }

    // Check if user already has this platform linked
    const existingPlatformAccount = await prisma.platformAccount.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: linkingCode.platform,
        },
      },
    });

    if (existingPlatformAccount) {
      return errors.badRequest(res, `You already have a ${linkingCode.platform} account linked`);
    }

    // Check if this platform ID is already linked to another user
    const platformIdInUse = await prisma.platformAccount.findUnique({
      where: {
        platform_platformId: {
          platform: linkingCode.platform,
          platformId: linkingCode.platformId,
        },
      },
    });

    if (platformIdInUse) {
      return errors.badRequest(res, 'This gaming account is already linked to another user');
    }

    // Check if this is the user's first platform account
    const existingAccounts = await prisma.platformAccount.count({
      where: { userId },
    });

    const isPrimary = existingAccounts === 0;

    // Link the account
    const platformAccount = await prisma.platformAccount.create({
      data: {
        userId,
        platform: linkingCode.platform,
        platformId: linkingCode.platformId,
        platformUsername: linkingCode.platformUsername,
        isPrimary,
      },
    });

    // Mark linking code as used
    await prisma.linkingCode.update({
      where: { id: linkingCode.id },
      data: {
        userId,
        usedAt: new Date(),
      },
    });

    // Link existing PlayerStats if they exist
    await prisma.playerStats.updateMany({
      where: {
        platform: linkingCode.platform,
        platformId: linkingCode.platformId,
        userId: null,
      },
      data: {
        userId,
        platformUsername: linkingCode.platformUsername,
      },
    });

    logger.info(`User ${userId} linked ${linkingCode.platform} account ${linkingCode.platformId}`);

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'platform.linked',
        category: 'account',
        details: {
          platform: linkingCode.platform,
          platformId: linkingCode.platformId,
        },
      },
    });

    sendSuccess(res, {
      message: 'Account linked successfully',
      platformAccount,
    });
  } catch (error) {
    logger.error('Error linking code:', error);
    errors.serverError(res);
  }
});

// ============================================
// Get Linked Platforms
// ============================================

router.get('/accounts', isAuthenticated, async (req, res) => {
  try {
    const platformAccounts = await prisma.platformAccount.findMany({
      where: { userId: req.user!.id },
      orderBy: [
        { isPrimary: 'desc' },
        { linkedAt: 'asc' },
      ],
    });

    sendSuccess(res, platformAccounts);
  } catch (error) {
    logger.error('Error fetching platform accounts:', error);
    errors.serverError(res);
  }
});

// ============================================
// Set Primary Platform
// ============================================

router.put('/accounts/:id/primary', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verify the account belongs to the user
    const account = await prisma.platformAccount.findUnique({
      where: { id },
    });

    if (!account || account.userId !== userId) {
      return errors.notFound(res, 'Platform account not found');
    }

    // Remove primary from all other accounts
    await prisma.platformAccount.updateMany({
      where: { userId },
      data: { isPrimary: false },
    });

    // Set this account as primary
    const updatedAccount = await prisma.platformAccount.update({
      where: { id },
      data: { isPrimary: true },
    });

    logger.info(`User ${userId} set ${account.platform} as primary platform`);

    sendSuccess(res, updatedAccount);
  } catch (error) {
    logger.error('Error setting primary platform:', error);
    errors.serverError(res);
  }
});

// ============================================
// Unlink Platform Account
// ============================================

router.delete('/accounts/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verify the account belongs to the user
    const account = await prisma.platformAccount.findUnique({
      where: { id },
    });

    if (!account || account.userId !== userId) {
      return errors.notFound(res, 'Platform account not found');
    }

    // Don't allow unlinking if it's the only way to identify the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        platformAccounts: true,
      },
    });

    if (!user) {
      return errors.notFound(res, 'User not found');
    }

    // Check if user has Steam or Discord login
    const hasOAuthLogin = user.steamId || user.discordId;
    const platformAccountCount = user.platformAccounts.length;

    if (!hasOAuthLogin && platformAccountCount <= 1) {
      return errors.badRequest(res, 'Cannot unlink your only account. Link another platform first or set up Discord/Steam login.');
    }

    // Unlink PlayerStats (set userId to null but keep the stats)
    await prisma.playerStats.updateMany({
      where: {
        platform: account.platform,
        platformId: account.platformId,
        userId,
      },
      data: {
        userId: null,
      },
    });

    // Delete the platform account
    await prisma.platformAccount.delete({
      where: { id },
    });

    logger.info(`User ${userId} unlinked ${account.platform} account ${account.platformId}`);

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'platform.unlinked',
        category: 'account',
        details: {
          platform: account.platform,
          platformId: account.platformId,
        },
      },
    });

    sendSuccess(res, {
      message: 'Platform account unlinked successfully',
    });
  } catch (error) {
    logger.error('Error unlinking platform:', error);
    errors.serverError(res);
  }
});

export default router;
