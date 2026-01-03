import { Router } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth';
import { prisma } from '../utils/prisma';

const router = Router();

// ============================================
// Achievements Routes
// ============================================

/**
 * GET /api/achievements
 * Get all achievements
 */
router.get('/', async (req, res) => {
  try {
    const { category, includeHidden = 'false' } = req.query;

    const where: any = {};
    if (category) where.category = category;
    if (includeHidden === 'false') where.isHidden = false;

    const achievements = await prisma.achievement.findMany({
      where,
      orderBy: { category: 'asc' },
    });

    res.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

/**
 * GET /api/achievements/user/:userId
 * Get user's achievements with progress
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: [
        { isCompleted: 'desc' },
        { completedAt: 'desc' },
      ],
    });

    res.json(userAchievements);
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    res.status(500).json({ error: 'Failed to fetch user achievements' });
  }
});

/**
 * POST /api/achievements
 * Create a new achievement (Admin only)
 */
router.post('/', requireAuth, requirePermission('manage_content'), async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      icon,
      requirement,
      xpReward,
      isHidden,
    } = req.body;

    const achievement = await prisma.achievement.create({
      data: {
        name,
        description,
        category,
        icon,
        requirement,
        xpReward: xpReward || 0,
        isHidden: isHidden || false,
      },
    });

    res.json(achievement);
  } catch (error) {
    console.error('Error creating achievement:', error);
    res.status(500).json({ error: 'Failed to create achievement' });
  }
});

/**
 * PUT /api/achievements/:id
 * Update an achievement (Admin only)
 */
router.put('/:id', requireAuth, requirePermission('manage_content'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      icon,
      requirement,
      xpReward,
      isHidden,
    } = req.body;

    const achievement = await prisma.achievement.update({
      where: { id },
      data: {
        name,
        description,
        category,
        icon,
        requirement,
        xpReward,
        isHidden,
      },
    });

    res.json(achievement);
  } catch (error) {
    console.error('Error updating achievement:', error);
    res.status(500).json({ error: 'Failed to update achievement' });
  }
});

/**
 * DELETE /api/achievements/:id
 * Delete an achievement (Admin only)
 */
router.delete('/:id', requireAuth, requirePermission('manage_content'), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.achievement.delete({
      where: { id },
    });

    res.json({ message: 'Achievement deleted successfully' });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    res.status(500).json({ error: 'Failed to delete achievement' });
  }
});

/**
 * POST /api/achievements/check/:userId
 * Check and update achievement progress for a user
 */
router.post('/check/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user stats
    const stats = await prisma.playerStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      return res.status(404).json({ error: 'Player stats not found' });
    }

    // Get all achievements
    const allAchievements = await prisma.achievement.findMany();

    // Get user's current achievements
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
    });

    const completedAchievements: { id: string; xpReward: number }[] = [];

    for (const achievement of allAchievements) {
      let userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);

      // Create user achievement if it doesn't exist
      if (!userAchievement) {
        userAchievement = await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            progress: 0,
            maxProgress: (achievement.requirement as any).value || 100,
          },
        });
      }

      // Skip if already completed
      if (userAchievement.isCompleted) continue;

      // Check progress based on requirement type
      const requirement = achievement.requirement as any;
      let progress = 0;

      switch (requirement.type) {
        case 'kills':
          progress = stats.kills;
          break;
        case 'deaths':
          progress = stats.deaths;
          break;
        case 'assists':
          progress = stats.assists;
          break;
        case 'headshots':
          progress = stats.headshots;
          break;
        case 'gamesPlayed':
          progress = stats.gamesPlayed;
          break;
        case 'gamesWon':
          progress = stats.gamesWon;
          break;
        case 'pointsCaptured':
          progress = stats.pointsCaptured;
          break;
        case 'pointsDefended':
          progress = stats.pointsDefended;
          break;
        case 'suppliesDelivered':
          progress = stats.suppliesDelivered;
          break;
        case 'revives':
          progress = stats.revives;
          break;
        case 'level':
          progress = stats.level;
          break;
        default:
          progress = 0;
      }

      // Update progress
      const isCompleted = progress >= requirement.value;

      await prisma.userAchievement.update({
        where: { id: userAchievement.id },
        data: {
          progress: Math.min(progress, requirement.value),
          isCompleted,
          completedAt: isCompleted && !userAchievement.completedAt ? new Date() : userAchievement.completedAt,
        },
      });

      if (isCompleted && !userAchievement.isCompleted) {
        completedAchievements.push({
          id: achievement.id,
          xpReward: achievement.xpReward,
        });

        // Award XP
        if (achievement.xpReward > 0) {
          await prisma.playerStats.update({
            where: { userId },
            data: {
              experiencePoints: { increment: achievement.xpReward },
            },
          });
        }
      }
    }

    res.json({
      message: 'Achievements checked successfully',
      newlyCompleted: completedAchievements,
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
    res.status(500).json({ error: 'Failed to check achievements' });
  }
});

export default router;
