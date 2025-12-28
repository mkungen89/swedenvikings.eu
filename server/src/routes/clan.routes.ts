// ============================================
// Clan Routes
// ============================================

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { isAuthenticated, hasPermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess, sendPaginated, errors } from '../utils/apiResponse';
import { prisma } from '../utils/prisma';

const router = Router();

// Get all clans (public)
router.get('/',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('recruiting').optional().isBoolean(),
  validate,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const recruiting = req.query.recruiting === 'true';
      const skip = (page - 1) * limit;

      const where: any = {};
      if (recruiting) where.isRecruiting = true;

      const [clans, total] = await Promise.all([
        prisma.clan.findMany({
          where,
          include: {
            _count: { select: { members: true } },
            members: {
              where: { role: 'leader' },
              include: {
                user: {
                  select: { id: true, username: true, avatar: true },
                },
              },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.clan.count({ where }),
      ]);

      const formattedClans = clans.map(clan => ({
        id: clan.id,
        name: clan.name,
        tag: clan.tag,
        description: clan.description,
        logo: clan.logo,
        color: clan.color,
        isRecruiting: clan.isRecruiting,
        memberCount: clan._count.members,
        leader: clan.members[0]?.user || null,
        createdAt: clan.createdAt,
      }));

      sendPaginated(res, formattedClans, page, limit, total);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Get single clan
router.get('/:id',
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const clan = await prisma.clan.findUnique({
        where: { id: req.params.id },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, username: true, avatar: true },
              },
            },
            orderBy: [
              { role: 'asc' },
              { joinedAt: 'asc' },
            ],
          },
        },
      });

      if (!clan) {
        return errors.notFound(res, 'Clan');
      }

      sendSuccess(res, clan);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Create clan (requires auth)
router.post('/',
  isAuthenticated,
  body('name').isString().trim().isLength({ min: 3, max: 50 }),
  body('tag').isString().trim().isLength({ min: 2, max: 6 }).toUpperCase(),
  body('description').optional().isString().trim().isLength({ max: 500 }),
  body('color').optional().isHexColor(),
  validate,
  async (req, res) => {
    try {
      const { name, tag, description, color } = req.body;

      // Check if user is already in a clan
      const existingMembership = await prisma.clanMember.findFirst({
        where: { userId: req.user!.id },
      });

      if (existingMembership) {
        return errors.validation(res, {
          clan: ['You are already in a clan'],
        });
      }

      // Check if name or tag exists
      const existingClan = await prisma.clan.findFirst({
        where: {
          OR: [{ name }, { tag }],
        },
      });

      if (existingClan) {
        return errors.validation(res, {
          name: existingClan.name === name ? ['Clan name already exists'] : [],
          tag: existingClan.tag === tag ? ['Clan tag already exists'] : [],
        });
      }

      // Create clan with creator as leader
      const clan = await prisma.clan.create({
        data: {
          name,
          tag,
          description,
          color: color || '#6366f1',
          members: {
            create: {
              userId: req.user!.id,
              role: 'leader',
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, username: true, avatar: true },
              },
            },
          },
        },
      });

      sendSuccess(res, clan, undefined, 201);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Update clan (leader/officer only)
router.patch('/:id',
  isAuthenticated,
  param('id').isUUID(),
  body('name').optional().isString().trim().isLength({ min: 3, max: 50 }),
  body('description').optional().isString().trim().isLength({ max: 500 }),
  body('color').optional().isHexColor(),
  body('isRecruiting').optional().isBoolean(),
  validate,
  async (req, res) => {
    try {
      // Check if user is leader or officer
      const membership = await prisma.clanMember.findFirst({
        where: {
          clanId: req.params.id,
          userId: req.user!.id,
          role: { in: ['leader', 'officer'] },
        },
      });

      if (!membership) {
        return errors.forbidden(res, 'Only clan leaders and officers can edit the clan');
      }

      const clan = await prisma.clan.update({
        where: { id: req.params.id },
        data: req.body,
      });

      sendSuccess(res, clan);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Join clan
router.post('/:id/join',
  isAuthenticated,
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const clan = await prisma.clan.findUnique({
        where: { id: req.params.id },
      });

      if (!clan) {
        return errors.notFound(res, 'Clan');
      }

      if (!clan.isRecruiting) {
        return errors.validation(res, {
          clan: ['This clan is not recruiting'],
        });
      }

      // Check if already in a clan
      const existingMembership = await prisma.clanMember.findFirst({
        where: { userId: req.user!.id },
      });

      if (existingMembership) {
        return errors.validation(res, {
          clan: ['You are already in a clan'],
        });
      }

      const membership = await prisma.clanMember.create({
        data: {
          clanId: clan.id,
          userId: req.user!.id,
          role: 'member',
        },
        include: {
          clan: true,
          user: {
            select: { id: true, username: true, avatar: true },
          },
        },
      });

      sendSuccess(res, membership, undefined, 201);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Leave clan
router.delete('/:id/leave',
  isAuthenticated,
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const membership = await prisma.clanMember.findFirst({
        where: {
          clanId: req.params.id,
          userId: req.user!.id,
        },
      });

      if (!membership) {
        return errors.notFound(res, 'Membership');
      }

      // Check if user is leader
      if (membership.role === 'leader') {
        // Check if there are other members
        const memberCount = await prisma.clanMember.count({
          where: { clanId: req.params.id },
        });

        if (memberCount > 1) {
          return errors.validation(res, {
            clan: ['Leaders must transfer leadership before leaving'],
          });
        }

        // Delete clan if leader is the only member
        await prisma.clan.delete({
          where: { id: req.params.id },
        });

        return sendSuccess(res, { message: 'Clan disbanded' });
      }

      await prisma.clanMember.delete({
        where: { id: membership.id },
      });

      sendSuccess(res, { message: 'Left clan successfully' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Update member role (leader only)
router.patch('/:id/members/:memberId/role',
  isAuthenticated,
  param('id').isUUID(),
  param('memberId').isUUID(),
  body('role').isIn(['officer', 'member']),
  validate,
  async (req, res) => {
    try {
      const { role } = req.body;

      // Check if user is leader
      const leaderMembership = await prisma.clanMember.findFirst({
        where: {
          clanId: req.params.id,
          userId: req.user!.id,
          role: 'leader',
        },
      });

      if (!leaderMembership) {
        return errors.forbidden(res, 'Only clan leaders can change member roles');
      }

      const membership = await prisma.clanMember.update({
        where: { id: req.params.memberId },
        data: { role },
        include: {
          user: {
            select: { id: true, username: true, avatar: true },
          },
        },
      });

      sendSuccess(res, membership);
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Kick member (leader/officer only)
router.delete('/:id/members/:memberId',
  isAuthenticated,
  param('id').isUUID(),
  param('memberId').isUUID(),
  validate,
  async (req, res) => {
    try {
      // Check if user is leader or officer
      const userMembership = await prisma.clanMember.findFirst({
        where: {
          clanId: req.params.id,
          userId: req.user!.id,
          role: { in: ['leader', 'officer'] },
        },
      });

      if (!userMembership) {
        return errors.forbidden(res, 'Only clan leaders and officers can kick members');
      }

      const targetMembership = await prisma.clanMember.findUnique({
        where: { id: req.params.memberId },
      });

      if (!targetMembership) {
        return errors.notFound(res, 'Member');
      }

      // Can't kick leaders or officers (unless you're the leader)
      if (targetMembership.role !== 'member' && userMembership.role !== 'leader') {
        return errors.forbidden(res, 'Officers cannot kick other officers or leaders');
      }

      await prisma.clanMember.delete({
        where: { id: req.params.memberId },
      });

      sendSuccess(res, { message: 'Member kicked from clan' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

export default router;

