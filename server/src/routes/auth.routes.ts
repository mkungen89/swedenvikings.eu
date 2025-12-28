// ============================================
// Authentication Routes
// ============================================

import { Router } from 'express';
import passport from 'passport';
import { isAuthenticated } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import { sendSuccess, errors } from '../utils/apiResponse';
import { prisma } from '../utils/prisma';

const router = Router();

// Get current user
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        socialLinks: true,
      },
    });

    if (!user) {
      return errors.notFound(res, 'User');
    }

    // Format response
    const response = {
      id: user.id,
      steamId: user.steamId,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      banner: user.banner,
      bio: user.bio,
      isPrivate: user.isPrivate,
      theme: user.theme,
      language: user.language,
      createdAt: user.createdAt,
      lastSeenAt: user.lastSeenAt,
      roles: user.roles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        color: ur.role.color,
        icon: ur.role.icon,
      })),
      permissions: [...new Set(
        user.roles.flatMap(ur =>
          ur.role.permissions.map(rp => rp.permission.key)
        )
      )],
      socialLinks: user.socialLinks,
    };

    sendSuccess(res, response);
  } catch (error) {
    errors.serverError(res);
  }
});

// Start Steam authentication
router.get('/steam', authRateLimiter, passport.authenticate('steam'));

// Steam callback
router.get('/steam/callback',
  passport.authenticate('steam', {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed`,
  }),
  (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/auth/callback`);
  }
);

// Logout
router.post('/logout', isAuthenticated, async (req, res) => {
  try {
    // Log the logout
    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'user.logout',
        category: 'auth',
        ip: req.ip,
      },
    });

    req.logout((err) => {
      if (err) {
        return errors.serverError(res, 'Logout failed');
      }
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        sendSuccess(res, { message: 'Logged out successfully' });
      });
    });
  } catch (error) {
    errors.serverError(res);
  }
});

// Check auth status
router.get('/status', (req, res) => {
  sendSuccess(res, {
    isAuthenticated: req.isAuthenticated(),
    user: req.user ? {
      id: req.user.id,
      username: req.user.username,
      avatar: req.user.avatar,
    } : null,
  });
});

export default router;

