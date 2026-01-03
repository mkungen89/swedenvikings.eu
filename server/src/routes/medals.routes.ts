import { Router } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth';
import { prisma } from '../utils/prisma';

const router = Router();

// ============================================
// Medals Routes
// ============================================

/**
 * GET /api/medals
 * Get all available medals
 */
router.get('/', async (req, res) => {
  try {
    const { category, tier, rarity } = req.query;

    const where: any = {};
    if (category) where.category = category;
    if (tier) where.tier = tier;
    if (rarity) where.rarity = rarity;

    const medals = await prisma.medal.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { tier: 'asc' },
      ],
    });

    res.json(medals);
  } catch (error) {
    console.error('Error fetching medals:', error);
    res.status(500).json({ error: 'Failed to fetch medals' });
  }
});

/**
 * GET /api/medals/user/:userId
 * Get user's medals with progress
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const userMedals = await prisma.userMedal.findMany({
      where: { userId },
      include: {
        medal: true,
      },
      orderBy: [
        { isUnlocked: 'desc' },
        { unlockedAt: 'desc' },
      ],
    });

    res.json(userMedals);
  } catch (error) {
    console.error('Error fetching user medals:', error);
    res.status(500).json({ error: 'Failed to fetch user medals' });
  }
});

/**
 * POST /api/medals
 * Create a new medal (Admin only)
 */
router.post('/', requireAuth, requirePermission('manage_content'), async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      tier,
      icon,
      imageUrl,
      rarity,
      requirement,
    } = req.body;

    const medal = await prisma.medal.create({
      data: {
        name,
        description,
        category,
        tier,
        icon,
        imageUrl,
        rarity: rarity || 'common',
        requirement,
      },
    });

    res.json(medal);
  } catch (error) {
    console.error('Error creating medal:', error);
    res.status(500).json({ error: 'Failed to create medal' });
  }
});

/**
 * PUT /api/medals/:id
 * Update a medal (Admin only)
 */
router.put('/:id', requireAuth, requirePermission('manage_content'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      tier,
      icon,
      imageUrl,
      rarity,
      requirement,
    } = req.body;

    const medal = await prisma.medal.update({
      where: { id },
      data: {
        name,
        description,
        category,
        tier,
        icon,
        imageUrl,
        rarity,
        requirement,
      },
    });

    res.json(medal);
  } catch (error) {
    console.error('Error updating medal:', error);
    res.status(500).json({ error: 'Failed to update medal' });
  }
});

/**
 * DELETE /api/medals/:id
 * Delete a medal (Admin only)
 */
router.delete('/:id', requireAuth, requirePermission('manage_content'), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.medal.delete({
      where: { id },
    });

    res.json({ message: 'Medal deleted successfully' });
  } catch (error) {
    console.error('Error deleting medal:', error);
    res.status(500).json({ error: 'Failed to delete medal' });
  }
});

/**
 * POST /api/medals/check/:userId
 * Check and update medal progress for a user
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

    // Get all medals
    const allMedals = await prisma.medal.findMany();

    // Get user's current medals
    const userMedals = await prisma.userMedal.findMany({
      where: { userId },
    });

    const unlockedMedals: string[] = [];

    for (const medal of allMedals) {
      let userMedal = userMedals.find(um => um.medalId === medal.id);

      // Create user medal if it doesn't exist
      if (!userMedal) {
        userMedal = await prisma.userMedal.create({
          data: {
            userId,
            medalId: medal.id,
            progress: 0,
            maxProgress: (medal.requirement as any).value || 100,
          },
        });
      }

      // Skip if already unlocked
      if (userMedal.isUnlocked) continue;

      // Check progress based on requirement type
      const requirement = medal.requirement as any;
      let progress = 0;

      switch (requirement.type) {
        case 'kills':
          progress = stats.kills;
          break;
        case 'headshots':
          progress = stats.headshots;
          break;
        case 'pointsCaptured':
          progress = stats.pointsCaptured;
          break;
        case 'pointsDefended':
          progress = stats.pointsDefended;
          break;
        case 'revives':
          progress = stats.revives;
          break;
        case 'suppliesDelivered':
          progress = stats.suppliesDelivered;
          break;
        case 'winStreak':
          // This would need to be tracked separately
          progress = 0;
          break;
        default:
          progress = 0;
      }

      // Update progress
      const isUnlocked = progress >= requirement.value;

      await prisma.userMedal.update({
        where: { id: userMedal.id },
        data: {
          progress: Math.min(progress, requirement.value),
          isUnlocked,
          unlockedAt: isUnlocked && !userMedal.unlockedAt ? new Date() : userMedal.unlockedAt,
        },
      });

      if (isUnlocked && !userMedal.isUnlocked) {
        unlockedMedals.push(medal.id);
      }
    }

    res.json({
      message: 'Medals checked successfully',
      newlyUnlocked: unlockedMedals,
    });
  } catch (error) {
    console.error('Error checking medals:', error);
    res.status(500).json({ error: 'Failed to check medals' });
  }
});

export default router;
