import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../utils/prisma';

const router = Router();

// ============================================
// Player Stats Routes
// ============================================

/**
 * GET /api/stats/:userId
 * Get player stats for a specific user
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if PlayerStats table exists
    try {
      const stats = await prisma.playerStats.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      });

      if (!stats) {
        // Create default stats if they don't exist
        const newStats = await prisma.playerStats.create({
          data: {
            userId,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        });
        return res.json(newStats);
      }

      res.json(stats);
    } catch (dbError: any) {
      // If table doesn't exist yet (migrations not run), return empty stats
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
        return res.json({
          userId,
          gamesPlayed: 0,
          kills: 0,
          deaths: 0,
          kdr: 0,
          level: 1,
          experiencePoints: 0,
        });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

/**
 * GET /api/stats/:userId/matches
 * Get match history for a specific user
 */
router.get('/:userId/matches', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = '10', offset = '0' } = req.query;

    const playerStats = await prisma.playerStats.findUnique({
      where: { userId },
    });

    if (!playerStats) {
      return res.status(404).json({ error: 'Player stats not found' });
    }

    const matches = await prisma.match.findMany({
      where: { playerStatsId: playerStats.id },
      orderBy: { playedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.match.count({
      where: { playerStatsId: playerStats.id },
    });

    res.json({
      matches,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

/**
 * POST /api/stats/:userId/matches
 * Record a new match (Admin/System only)
 */
router.post('/:userId/matches', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      map,
      gameMode,
      duration,
      result,
      kills,
      deaths,
      assists,
      score,
      pointsCaptured,
      pointsDefended,
      suppliesDelivered,
      revives,
      xpEarned,
    } = req.body;

    const playerStats = await prisma.playerStats.findUnique({
      where: { userId },
    });

    if (!playerStats) {
      return res.status(404).json({ error: 'Player stats not found' });
    }

    // Create match record
    const match = await prisma.match.create({
      data: {
        playerStatsId: playerStats.id,
        map,
        gameMode,
        duration,
        result,
        kills: kills || 0,
        deaths: deaths || 0,
        assists: assists || 0,
        score: score || 0,
        pointsCaptured: pointsCaptured || 0,
        pointsDefended: pointsDefended || 0,
        suppliesDelivered: suppliesDelivered || 0,
        revives: revives || 0,
        xpEarned: xpEarned || 0,
      },
    });

    // Update player stats
    const updatedStats = await prisma.playerStats.update({
      where: { userId },
      data: {
        gamesPlayed: { increment: 1 },
        gamesWon: result === 'win' ? { increment: 1 } : undefined,
        gamesLost: result === 'loss' ? { increment: 1 } : undefined,
        kills: { increment: kills || 0 },
        deaths: { increment: deaths || 0 },
        assists: { increment: assists || 0 },
        pointsCaptured: { increment: pointsCaptured || 0 },
        pointsDefended: { increment: pointsDefended || 0 },
        suppliesDelivered: { increment: suppliesDelivered || 0 },
        revives: { increment: revives || 0 },
        totalPlaytime: { increment: duration || 0 },
        experiencePoints: { increment: xpEarned || 0 },
        // Calculate K/D ratio
        kdr: playerStats.deaths + (deaths || 0) > 0
          ? (playerStats.kills + (kills || 0)) / (playerStats.deaths + (deaths || 0))
          : playerStats.kills + (kills || 0),
        // Calculate win rate
        winRate: playerStats.gamesPlayed + 1 > 0
          ? ((playerStats.gamesWon + (result === 'win' ? 1 : 0)) / (playerStats.gamesPlayed + 1)) * 100
          : 0,
        // Update best records
        mostKillsInGame: Math.max(playerStats.mostKillsInGame, kills || 0),
        bestScore: Math.max(playerStats.bestScore, score || 0),
      },
    });

    // Calculate level from XP
    const newLevel = Math.floor(Math.sqrt(updatedStats.experiencePoints / 100)) + 1;
    if (newLevel !== updatedStats.level) {
      await prisma.playerStats.update({
        where: { userId },
        data: { level: newLevel },
      });
    }

    res.json({ match, stats: updatedStats });
  } catch (error) {
    console.error('Error recording match:', error);
    res.status(500).json({ error: 'Failed to record match' });
  }
});

/**
 * GET /api/stats/leaderboard
 * Get leaderboard rankings
 */
router.get('/leaderboard/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = '10' } = req.query;

    let orderBy: any = {};

    switch (type) {
      case 'level':
        orderBy = { level: 'desc' };
        break;
      case 'kills':
        orderBy = { kills: 'desc' };
        break;
      case 'kdr':
        orderBy = { kdr: 'desc' };
        break;
      case 'winrate':
        orderBy = { winRate: 'desc' };
        break;
      default:
        orderBy = { experiencePoints: 'desc' };
    }

    const leaderboard = await prisma.playerStats.findMany({
      orderBy,
      take: parseInt(limit as string),
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
