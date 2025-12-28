// ============================================
// Admin Routes
// ============================================

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { isAuthenticated, hasPermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess, sendPaginated, errors } from '../utils/apiResponse';
import { prisma } from '../utils/prisma';
import { cache } from '../utils/redis';

const router = Router();

// All admin routes require authentication and admin access
router.use(isAuthenticated);
router.use(hasPermission('admin.access'));

// ============================================
// Dashboard
// ============================================

router.get('/dashboard', hasPermission('admin.dashboard'), async (req, res) => {
  try {
    // Try cache first
    const cached = await cache.get('admin:dashboard');
    if (cached) {
      return sendSuccess(res, cached);
    }

    const [
      totalUsers,
      newUsersToday,
      totalBans,
      activeBans,
      openTickets,
      pendingApplications,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.ban.count(),
      prisma.ban.count({ where: { isActive: true } }),
      prisma.ticket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
      prisma.application.count({ where: { status: 'pending' } }),
    ]);

    const recentActivity = await prisma.activityLog.findMany({
      where: { category: 'admin' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    const data = {
      stats: {
        totalUsers,
        newUsersToday,
        totalBans,
        activeBans,
        openTickets,
        pendingApplications,
      },
      recentActivity,
    };

    // Cache for 1 minute
    await cache.set('admin:dashboard', data, 60);

    sendSuccess(res, data);
  } catch (error) {
    errors.serverError(res);
  }
});

// ============================================
// User Management
// ============================================

router.get('/users',
  hasPermission('users.view'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('role').optional().isUUID(),
  validate,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const roleId = req.query.role as string;
      const skip = (page - 1) * limit;

      const where: any = {};
      
      if (search) {
        where.OR = [
          { username: { contains: search, mode: 'insensitive' } },
          { steamId: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (roleId) {
        where.roles = { some: { roleId } };
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: {
            roles: {
              include: { role: true },
            },
            bansReceived: {
              where: { isActive: true },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);

      const formattedUsers = users.map(user => ({
        id: user.id,
        steamId: user.steamId,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
        lastSeenAt: user.lastSeenAt,
        roles: user.roles.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
          color: ur.role.color,
        })),
        isBanned: user.bansReceived.length > 0,
      }));

      sendPaginated(res, formattedUsers, page, limit, total);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

router.get('/users/:id',
  hasPermission('users.view'),
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        include: {
          roles: {
            include: { role: true },
          },
          socialLinks: true,
          bansReceived: {
            include: {
              bannedBy: {
                select: { id: true, username: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        return errors.notFound(res, 'User');
      }

      sendSuccess(res, user);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

router.patch('/users/:id',
  hasPermission('users.edit'),
  param('id').isUUID(),
  body('username').optional().isString().trim().isLength({ min: 2, max: 32 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('roles').optional().isArray(),
  body('roles.*').optional().isUUID(),
  validate,
  async (req, res) => {
    try {
      const { username, email, roles } = req.body;

      // Update user
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: {
          ...(username && { username }),
          ...(email && { email }),
        },
      });

      // Update roles if provided
      if (roles) {
        // Remove all existing roles
        await prisma.userRole.deleteMany({
          where: { userId: req.params.id },
        });

        // Add new roles
        await prisma.userRole.createMany({
          data: roles.map((roleId: string) => ({
            userId: req.params.id,
            roleId,
          })),
        });
      }

      // Log the action
      await prisma.activityLog.create({
        data: {
          userId: req.user!.id,
          action: 'admin.user.edit',
          category: 'admin',
          details: { targetUserId: req.params.id, changes: req.body },
          ip: req.ip,
        },
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: req.params.id },
        include: {
          roles: {
            include: { role: true },
          },
        },
      });

      sendSuccess(res, updatedUser);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Ban user
router.post('/users/:id/ban',
  hasPermission('users.ban'),
  param('id').isUUID(),
  body('reason').isString().trim().isLength({ min: 3, max: 500 }),
  body('expiresAt').optional().isISO8601(),
  validate,
  async (req, res) => {
    try {
      const { reason, expiresAt } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
      });

      if (!user) {
        return errors.notFound(res, 'User');
      }

      // Check if already banned
      const existingBan = await prisma.ban.findFirst({
        where: {
          steamId: user.steamId,
          isActive: true,
        },
      });

      if (existingBan) {
        return errors.validation(res, {
          ban: ['User is already banned'],
        });
      }

      const ban = await prisma.ban.create({
        data: {
          steamId: user.steamId,
          reason,
          bannedById: req.user!.id,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
        include: {
          bannedBy: {
            select: { id: true, username: true },
          },
        },
      });

      // Log the action
      await prisma.activityLog.create({
        data: {
          userId: req.user!.id,
          action: 'admin.user.ban',
          category: 'admin',
          details: { targetUserId: req.params.id, reason, expiresAt },
          ip: req.ip,
        },
      });

      sendSuccess(res, ban, undefined, 201);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Unban user
router.post('/users/:id/unban',
  hasPermission('users.ban'),
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
      });

      if (!user) {
        return errors.notFound(res, 'User');
      }

      await prisma.ban.updateMany({
        where: {
          steamId: user.steamId,
          isActive: true,
        },
        data: { isActive: false },
      });

      // Log the action
      await prisma.activityLog.create({
        data: {
          userId: req.user!.id,
          action: 'admin.user.unban',
          category: 'admin',
          details: { targetUserId: req.params.id },
          ip: req.ip,
        },
      });

      sendSuccess(res, { message: 'User unbanned successfully' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// ============================================
// Role Management
// ============================================

router.get('/roles', hasPermission('roles.view'), async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { priority: 'desc' },
    });

    const formattedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      color: role.color,
      icon: role.icon,
      priority: role.priority,
      isDefault: role.isDefault,
      userCount: role._count.users,
      permissions: role.permissions.map(rp => rp.permission.key),
    }));

    sendSuccess(res, formattedRoles);
  } catch (error) {
    errors.serverError(res);
  }
});

router.get('/permissions', hasPermission('roles.view'), async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // Group by category
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {} as Record<string, typeof permissions>);

    sendSuccess(res, grouped);
  } catch (error) {
    errors.serverError(res);
  }
});

router.post('/roles',
  hasPermission('roles.create'),
  body('name').isString().trim().isLength({ min: 2, max: 32 }),
  body('color').isHexColor(),
  body('icon').optional().isString(),
  body('priority').optional().isInt({ min: 0, max: 99 }),
  body('permissions').optional().isArray(),
  body('permissions.*').optional().isString(),
  validate,
  async (req, res) => {
    try {
      const { name, color, icon, priority, permissions } = req.body;

      // Check if role name exists
      const existing = await prisma.role.findUnique({ where: { name } });
      if (existing) {
        return errors.validation(res, { name: ['Role name already exists'] });
      }

      const role = await prisma.role.create({
        data: {
          name,
          color,
          icon,
          priority: priority || 0,
        },
      });

      // Add permissions
      if (permissions && permissions.length > 0) {
        const permissionRecords = await prisma.permission.findMany({
          where: { key: { in: permissions } },
        });

        await prisma.rolePermission.createMany({
          data: permissionRecords.map(p => ({
            roleId: role.id,
            permissionId: p.id,
          })),
        });
      }

      // Log the action
      await prisma.activityLog.create({
        data: {
          userId: req.user!.id,
          action: 'admin.role.create',
          category: 'admin',
          details: { roleId: role.id, name },
          ip: req.ip,
        },
      });

      sendSuccess(res, role, undefined, 201);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// ============================================
// Site Settings
// ============================================

router.get('/settings', hasPermission('admin.settings'), async (req, res) => {
  try {
    let settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { id: 'main' },
      });
    }

    sendSuccess(res, settings);
  } catch (error) {
    errors.serverError(res);
  }
});

router.patch('/settings',
  hasPermission('admin.settings'),
  body('siteName').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('siteDescription').optional().isString().trim().isLength({ max: 500 }),
  body('maintenance').optional().isBoolean(),
  body('maintenanceMessage').optional().isString().trim(),
  body('primaryColor').optional().isHexColor(),
  body('accentColor').optional().isHexColor(),
  validate,
  async (req, res) => {
    try {
      const settings = await prisma.siteSettings.update({
        where: { id: 'main' },
        data: req.body,
      });

      // Clear cache
      await cache.del('settings');

      // Log the action
      await prisma.activityLog.create({
        data: {
          userId: req.user!.id,
          action: 'admin.settings.update',
          category: 'admin',
          details: req.body,
          ip: req.ip,
        },
      });

      sendSuccess(res, settings);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// ============================================
// Activity Logs
// ============================================

router.get('/logs',
  hasPermission('admin.access'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isString(),
  query('userId').optional().isUUID(),
  validate,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const category = req.query.category as string;
      const userId = req.query.userId as string;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (category) where.category = category;
      if (userId) where.userId = userId;

      const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
          where,
          include: {
            user: {
              select: { id: true, username: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.activityLog.count({ where }),
      ]);

      sendPaginated(res, logs, page, limit, total);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

export default router;

