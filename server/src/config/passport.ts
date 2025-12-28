// ============================================
// Passport Configuration - Steam Authentication
// ============================================

import passport from 'passport';
import { Strategy as SteamStrategy } from 'passport-steam';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

// Steam Strategy
passport.use(new SteamStrategy(
  {
    returnURL: process.env.STEAM_RETURN_URL || 'http://localhost:3001/api/auth/steam/callback',
    realm: process.env.STEAM_REALM || 'http://localhost:3001',
    apiKey: process.env.STEAM_API_KEY || '',
  },
  async (identifier: string, profile: any, done: Function) => {
    try {
      const steamId = profile.id;
      const username = profile.displayName;
      const avatar = profile.photos?.[2]?.value || profile.photos?.[0]?.value;

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { steamId },
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
        },
      });

      if (!user) {
        // Create new user with default role
        const defaultRole = await prisma.role.findFirst({
          where: { isDefault: true },
        });

        user = await prisma.user.create({
          data: {
            steamId,
            username,
            avatar,
            roles: defaultRole ? {
              create: {
                roleId: defaultRole.id,
              },
            } : undefined,
          },
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
          },
        });

        logger.info(`New user registered: ${username} (${steamId})`);

        // Log the registration
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'user.register',
            category: 'auth',
            details: { steamId, username },
          },
        });
      } else {
        // Update existing user's avatar and last seen
        await prisma.user.update({
          where: { id: user.id },
          data: {
            avatar,
            lastSeenAt: new Date(),
          },
        });

        // Log the login
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'user.login',
            category: 'auth',
            details: { steamId },
          },
        });
      }

      // Format roles for session
      const formattedRoles = user.roles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        color: ur.role.color,
        permissions: ur.role.permissions.map(rp => ({
          key: rp.permission.key,
        })),
      }));

      return done(null, {
        id: user.id,
        steamId: user.steamId,
        username: user.username,
        avatar: user.avatar,
        roles: formattedRoles,
      });
    } catch (error) {
      logger.error('Steam auth error:', error);
      return done(error, null);
    }
  }
));

// Serialize user to session
passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
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
      },
    });

    if (!user) {
      return done(null, false);
    }

    // Format roles
    const formattedRoles = user.roles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      color: ur.role.color,
      permissions: ur.role.permissions.map(rp => ({
        key: rp.permission.key,
      })),
    }));

    done(null, {
      id: user.id,
      steamId: user.steamId,
      username: user.username,
      avatar: user.avatar,
      roles: formattedRoles,
    });
  } catch (error) {
    done(error, null);
  }
});

