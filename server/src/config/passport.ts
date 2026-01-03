// ============================================
// Passport Configuration - Multi-Platform Authentication
// ============================================

import passport from 'passport';
import { Strategy as SteamStrategy } from 'passport-steam';
import { Strategy as DiscordStrategy } from '@oauth-everything/passport-discord';
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

        // Send notifications asynchronously (don't block login)
        const notifyNewUser = async () => {
          try {
            const settings = await prisma.siteSettings.findUnique({
              where: { id: 'main' },
            });

            if (!settings) return;

            // Send welcome email to user (if we have email - future feature)
            // if (user.email && settings.enableEmailNotifications) {
            //   const { emailService } = await import('../services/email.service');
            //   await emailService.sendNewUserWelcome(user);
            // }

            // Send admin notifications
            if (settings.notifyOnNewUser) {
              // Email notification
              if (settings.enableEmailNotifications) {
                const { emailService } = await import('../services/email.service');
                await emailService.sendNewUserNotification({
                  id: user.id,
                  username: user.username,
                  steamId: user.steamId,
                });
              }

              // Discord notification
              if (settings.enableDiscordNotifications) {
                const { discordService } = await import('../services/discord.service');
                await discordService.sendNewUserNotification({
                  id: user.id,
                  username: user.username,
                  steamId: user.steamId,
                  avatar: user.avatar || undefined,
                });
              }
            }
          } catch (error) {
            // Don't fail auth if notifications fail
            logger.error('Failed to send new user notifications:', error);
          }
        };

        // Run notifications in background
        notifyNewUser().catch((error) => {
          logger.error('New user notification error:', error);
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

// ============================================
// Discord Strategy (Optional - only if credentials provided)
// ============================================

if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  passport.use(new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.DISCORD_CALLBACK_URL || 'http://localhost:3001/api/auth/discord/callback',
      scope: ['identify', 'email'],
    },
    async (accessToken: string, refreshToken: string, profile: any, done: Function) => {
    try {
      const discordId = profile.id;
      const username = profile.username;
      const email = profile.email;
      const avatar = profile.avatar
        ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
        : null;

      // Find user by Discord ID
      let user = await prisma.user.findUnique({
        where: { discordId },
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
        // Create new user with Discord OAuth
        const defaultRole = await prisma.role.findFirst({
          where: { isDefault: true },
        });

        user = await prisma.user.create({
          data: {
            discordId,
            username,
            email,
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

        logger.info(`New Discord user registered: ${username} (${discordId})`);

        // Log the registration
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'user.register',
            category: 'auth',
            details: { discordId, username, provider: 'discord' },
          },
        });

        // Send notifications (same as Steam)
        const notifyNewUser = async () => {
          try {
            const settings = await prisma.siteSettings.findUnique({
              where: { id: 'main' },
            });

            if (!settings || !settings.notifyOnNewUser) return;

            if (settings.enableEmailNotifications) {
              const { emailService } = await import('../services/email.service');
              await emailService.sendNewUserNotification({
                id: user.id,
                username: user.username,
                steamId: user.steamId,
                discordId: user.discordId,
              });
            }

            if (settings.enableDiscordNotifications) {
              const { discordService } = await import('../services/discord.service');
              await discordService.sendNewUserNotification({
                id: user.id,
                username: user.username,
                steamId: user.steamId,
                discordId: user.discordId,
                avatar: user.avatar || undefined,
              });
            }
          } catch (error) {
            logger.error('Failed to send new user notifications:', error);
          }
        };

        notifyNewUser().catch((error) => {
          logger.error('New user notification error:', error);
        });
      } else {
        // Update existing user
        await prisma.user.update({
          where: { id: user.id },
          data: {
            avatar,
            email,
            lastSeenAt: new Date(),
          },
        });

        // Log the login
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'user.login',
            category: 'auth',
            details: { discordId, provider: 'discord' },
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
        discordId: user.discordId,
        username: user.username,
        avatar: user.avatar,
        roles: formattedRoles,
      });
    } catch (error) {
      logger.error('Discord auth error:', error);
      return done(error, null);
    }
  }));

  logger.info('Discord authentication strategy enabled');
} else {
  logger.info('Discord authentication disabled (no credentials configured)');
}

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
      discordId: user.discordId,
      username: user.username,
      avatar: user.avatar,
      roles: formattedRoles,
    });
  } catch (error) {
    done(error, null);
  }
});

