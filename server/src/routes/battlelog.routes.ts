import express from 'express';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';
import { isAuthenticated, hasPermission } from '../middleware/auth';
import * as battlelogService from '../services/battlelog.service';
import { logger } from '../utils/logger';
import { prisma } from '../utils/prisma';

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/battlelog/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, webp)'));
    }
  },
});

// Validation schemas
const weaponSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  type: z.enum([
    'ASSAULT_RIFLE',
    'SNIPER_RIFLE',
    'MACHINE_GUN',
    'SUBMACHINE_GUN',
    'PISTOL',
    'SHOTGUN',
    'GRENADE_LAUNCHER',
    'ROCKET_LAUNCHER',
    'MELEE',
  ]),
  faction: z.enum(['NATO', 'RUS', 'NEUTRAL']),
  modSource: z.string().min(1),
  imageUrl: z.string().url().optional(),
  iconUrl: z.string().url().optional(),
  damage: z.number().int().positive().optional(),
  accuracy: z.number().int().positive().optional(),
  range: z.number().int().positive().optional(),
  fireRate: z.number().int().positive().optional(),
});

const vehicleSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['TANK', 'APC', 'IFV', 'TRUCK', 'CAR', 'HELICOPTER', 'BOAT', 'STATIC_WEAPON']),
  faction: z.enum(['NATO', 'RUS', 'NEUTRAL']),
  modSource: z.string().min(1),
  imageUrl: z.string().url().optional(),
  iconUrl: z.string().url().optional(),
  armor: z.number().int().positive().optional(),
  speed: z.number().int().positive().optional(),
  capacity: z.number().int().positive().optional(),
});

// ============================================
// Weapons Routes
// ============================================

// Get all weapons
router.get('/weapons', async (req, res) => {
  try {
    const { faction, type, modSource, isActive } = req.query;

    const weapons = await battlelogService.getAllWeapons({
      faction: faction as any,
      type: type as any,
      modSource: modSource as string,
      isActive: isActive === 'true',
    });

    res.json(weapons);
  } catch (error) {
    logger.error('Failed to get weapons', { error });
    res.status(500).json({ error: 'Failed to fetch weapons' });
  }
});

// Get weapon by ID
router.get('/weapons/:id', async (req, res) => {
  try {
    const weapon = await battlelogService.getWeaponById(req.params.id);
    res.json(weapon);
  } catch (error) {
    logger.error('Failed to get weapon', { error, id: req.params.id });
    res.status(404).json({ error: 'Weapon not found' });
  }
});

// Create weapon (Admin only)
router.post('/weapons', isAuthenticated, hasPermission('manage_content'), async (req, res) => {
  try {
    const data = weaponSchema.parse(req.body);
    const weapon = await battlelogService.createWeapon(data);
    res.status(201).json(weapon);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    logger.error('Failed to create weapon', { error });
    res.status(500).json({ error: 'Failed to create weapon' });
  }
});

// Update weapon (Admin only)
router.put('/weapons/:id', isAuthenticated, hasPermission('manage_content'), async (req, res) => {
  try {
    const data = weaponSchema.partial().parse(req.body);
    const weapon = await battlelogService.updateWeapon(req.params.id, data);
    res.json(weapon);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    logger.error('Failed to update weapon', { error, id: req.params.id });
    res.status(500).json({ error: 'Failed to update weapon' });
  }
});

// Delete weapon (Admin only)
router.delete(
  '/weapons/:id',
  isAuthenticated,
  hasPermission('manage_content'),
  async (req, res) => {
    try {
      await battlelogService.deleteWeapon(req.params.id);
      res.status(204).send();
    } catch (error) {
      logger.error('Failed to delete weapon', { error, id: req.params.id });
      res.status(500).json({ error: 'Failed to delete weapon' });
    }
  }
);

// Upload weapon image (Admin only)
router.post(
  '/weapons/:id/image',
  isAuthenticated,
  hasPermission('manage_content'),
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
      }

      const imageUrl = `/uploads/battlelog/${req.file.filename}`;

      const weapon = await battlelogService.updateWeapon(req.params.id, {
        imageUrl,
      });

      res.json(weapon);
    } catch (error) {
      logger.error('Failed to upload weapon image', { error, id: req.params.id });
      res.status(500).json({ error: 'Failed to upload image' });
    }
  }
);

// ============================================
// Vehicles Routes
// ============================================

// Get all vehicles
router.get('/vehicles', async (req, res) => {
  try {
    const { faction, type, modSource, isActive } = req.query;

    const vehicles = await battlelogService.getAllVehicles({
      faction: faction as any,
      type: type as any,
      modSource: modSource as string,
      isActive: isActive === 'true',
    });

    res.json(vehicles);
  } catch (error) {
    logger.error('Failed to get vehicles', { error });
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// Get vehicle by ID
router.get('/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await battlelogService.getVehicleById(req.params.id);
    res.json(vehicle);
  } catch (error) {
    logger.error('Failed to get vehicle', { error, id: req.params.id });
    res.status(404).json({ error: 'Vehicle not found' });
  }
});

// Create vehicle (Admin only)
router.post('/vehicles', isAuthenticated, hasPermission('manage_content'), async (req, res) => {
  try {
    const data = vehicleSchema.parse(req.body);
    const vehicle = await battlelogService.createVehicle(data);
    res.status(201).json(vehicle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    logger.error('Failed to create vehicle', { error });
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

// Update vehicle (Admin only)
router.put('/vehicles/:id', isAuthenticated, hasPermission('manage_content'), async (req, res) => {
  try {
    const data = vehicleSchema.partial().parse(req.body);
    const vehicle = await battlelogService.updateVehicle(req.params.id, data);
    res.json(vehicle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    logger.error('Failed to update vehicle', { error, id: req.params.id });
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// Delete vehicle (Admin only)
router.delete(
  '/vehicles/:id',
  isAuthenticated,
  hasPermission('manage_content'),
  async (req, res) => {
    try {
      await battlelogService.deleteVehicle(req.params.id);
      res.status(204).send();
    } catch (error) {
      logger.error('Failed to delete vehicle', { error, id: req.params.id });
      res.status(500).json({ error: 'Failed to delete vehicle' });
    }
  }
);

// Upload vehicle image (Admin only)
router.post(
  '/vehicles/:id/image',
  isAuthenticated,
  hasPermission('manage_content'),
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
      }

      const imageUrl = `/uploads/battlelog/${req.file.filename}`;

      const vehicle = await battlelogService.updateVehicle(req.params.id, {
        imageUrl,
      });

      res.json(vehicle);
    } catch (error) {
      logger.error('Failed to upload vehicle image', { error, id: req.params.id });
      res.status(500).json({ error: 'Failed to upload image' });
    }
  }
);

// ============================================
// Player Stats Routes
// ============================================

// Get player weapon stats
router.get('/players/:userId/weapons', isAuthenticated, async (req, res) => {
  try {
    const { faction } = req.query;
    const weaponStats = await battlelogService.getPlayerWeaponStats(
      req.params.userId,
      faction as any
    );
    res.json(weaponStats);
  } catch (error) {
    logger.error('Failed to get player weapon stats', { error, userId: req.params.userId });
    res.status(500).json({ error: 'Failed to fetch weapon stats' });
  }
});

// Get player vehicle stats
router.get('/players/:userId/vehicles', isAuthenticated, async (req, res) => {
  try {
    const { faction } = req.query;
    const vehicleStats = await battlelogService.getPlayerVehicleStats(
      req.params.userId,
      faction as any
    );
    res.json(vehicleStats);
  } catch (error) {
    logger.error('Failed to get player vehicle stats', { error, userId: req.params.userId });
    res.status(500).json({ error: 'Failed to fetch vehicle stats' });
  }
});

// Update preferred faction
router.put('/players/:userId/faction', isAuthenticated, async (req, res) => {
  try {
    // Only allow users to update their own faction
    if (req.user?.id !== req.params.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { faction } = req.body;

    if (!['NATO', 'RUS'].includes(faction)) {
      return res.status(400).json({ error: 'Invalid faction' });
    }

    const playerStats = await battlelogService.updatePreferredFaction(req.params.userId, faction);
    res.json(playerStats);
  } catch (error) {
    logger.error('Failed to update preferred faction', { error, userId: req.params.userId });
    res.status(500).json({ error: 'Failed to update faction' });
  }
});

// ============================================
// Utility Routes
// ============================================

// Get all mod sources
router.get('/mods', async (req, res) => {
  try {
    const mods = await battlelogService.getModSources();
    res.json(mods);
  } catch (error) {
    logger.error('Failed to get mod sources', { error });
    res.status(500).json({ error: 'Failed to fetch mod sources' });
  }
});

// ============================================
// Game Server Endpoints (For Arma Reforger Mod)
// ============================================

/**
 * POST /api/battlelog/match
 * Submit match results from Arma Reforger server
 * Requires SERVER_API_KEY authentication
 */
router.post('/match', async (req, res) => {
  try {
    const { serverApiKey, ...matchData } = req.body;

    // Validate server API key
    if (serverApiKey !== process.env.SERVER_API_KEY) {
      return res.status(401).json({ error: 'Invalid server API key' });
    }

    // Validate required fields
    if (!matchData.matchId || !matchData.players || !Array.isArray(matchData.players)) {
      return res.status(400).json({ error: 'Invalid match data' });
    }

    // Process each player's stats
    for (const playerData of matchData.players) {
      const { platform, platformId, platformUsername, ...stats } = playerData;

      if (!platform || !platformId) {
        logger.warn('Skipping player with missing platform data', { playerData });
        continue;
      }

      // Find or create PlayerStats
      let playerStats = await prisma.playerStats.findUnique({
        where: {
          platform_platformId: {
            platform,
            platformId,
          },
        },
      });

      if (!playerStats) {
        playerStats = await prisma.playerStats.create({
          data: {
            platform,
            platformId,
            platformUsername,
          },
        });
      }

      // Update stats
      await prisma.playerStats.update({
        where: { id: playerStats.id },
        data: {
          platformUsername, // Update username if changed
          totalPlaytime: { increment: stats.playTime || 0 },
          gamesPlayed: { increment: 1 },
          gamesWon: { increment: stats.result === 'win' ? 1 : 0 },
          gamesLost: { increment: stats.result === 'loss' ? 1 : 0 },
          kills: { increment: stats.kills || 0 },
          deaths: { increment: stats.deaths || 0 },
          assists: { increment: stats.assists || 0 },
          headshots: { increment: stats.headshots || 0 },
          pointsCaptured: { increment: stats.pointsCaptured || 0 },
          pointsDefended: { increment: stats.pointsDefended || 0 },
          suppliesDelivered: { increment: stats.suppliesDelivered || 0 },
          vehiclesDestroyed: { increment: stats.vehiclesDestroyed || 0 },
          revives: { increment: stats.revives || 0 },
          teamKills: { increment: stats.teamKills || 0 },
          distanceTraveled: { increment: stats.distanceTraveled || 0 },
          longestKillStreak: Math.max(playerStats.longestKillStreak, stats.killStreak || 0),
          bestScore: Math.max(playerStats.bestScore, stats.score || 0),
          mostKillsInGame: Math.max(playerStats.mostKillsInGame, stats.kills || 0),
          experiencePoints: { increment: stats.xpEarned || 0 },
        },
      });

      // Create Match record
      await prisma.match.create({
        data: {
          playerStatsId: playerStats.id,
          map: matchData.map || 'Unknown',
          gameMode: matchData.gameMode || 'Conflict',
          duration: matchData.duration || 0,
          result: stats.result || 'draw',
          kills: stats.kills || 0,
          deaths: stats.deaths || 0,
          assists: stats.assists || 0,
          score: stats.score || 0,
          pointsCaptured: stats.pointsCaptured || 0,
          pointsDefended: stats.pointsDefended || 0,
          suppliesDelivered: stats.suppliesDelivered || 0,
          revives: stats.revives || 0,
          xpEarned: stats.xpEarned || 0,
        },
      });

      // Update weapon stats if provided
      if (stats.weaponKills && typeof stats.weaponKills === 'object') {
        for (const [weaponName, kills] of Object.entries(stats.weaponKills)) {
          const weapon = await prisma.weapon.findUnique({
            where: { name: weaponName },
          });

          if (weapon) {
            const weaponStats = await prisma.weaponStats.upsert({
              where: {
                playerStatsId_weaponId: {
                  playerStatsId: playerStats.id,
                  weaponId: weapon.id,
                },
              },
              create: {
                playerStatsId: playerStats.id,
                weaponId: weapon.id,
                kills: kills as number,
              },
              update: {
                kills: { increment: kills as number },
              },
            });

            // Calculate service stars (every 100 kills)
            const serviceStars = Math.floor(weaponStats.kills / 100);
            if (serviceStars > weaponStats.serviceStars) {
              await prisma.weaponStats.update({
                where: { id: weaponStats.id },
                data: { serviceStars },
              });
            }
          }
        }
      }

      // Update vehicle stats if provided
      if (stats.vehicleKills && typeof stats.vehicleKills === 'object') {
        for (const [vehicleName, kills] of Object.entries(stats.vehicleKills)) {
          const vehicle = await prisma.vehicle.findUnique({
            where: { name: vehicleName },
          });

          if (vehicle) {
            await prisma.vehicleStats.upsert({
              where: {
                playerStatsId_vehicleId: {
                  playerStatsId: playerStats.id,
                  vehicleId: vehicle.id,
                },
              },
              create: {
                playerStatsId: playerStats.id,
                vehicleId: vehicle.id,
                kills: kills as number,
              },
              update: {
                kills: { increment: kills as number },
              },
            });
          }
        }
      }

      // Recalculate KDR and win rate
      const updatedStats = await prisma.playerStats.findUnique({
        where: { id: playerStats.id },
      });

      if (updatedStats) {
        const kdr = updatedStats.deaths > 0 ? updatedStats.kills / updatedStats.deaths : updatedStats.kills;
        const winRate = updatedStats.gamesPlayed > 0
          ? (updatedStats.gamesWon / updatedStats.gamesPlayed) * 100
          : 0;

        await prisma.playerStats.update({
          where: { id: playerStats.id },
          data: { kdr, winRate },
        });
      }
    }

    logger.info(`Match ${matchData.matchId} processed successfully with ${matchData.players.length} players`);

    res.json({
      success: true,
      message: 'Match data recorded successfully',
      matchId: matchData.matchId,
      playersProcessed: matchData.players.length,
    });
  } catch (error) {
    logger.error('Failed to process match data', { error });
    res.status(500).json({ error: 'Failed to process match data' });
  }
});

/**
 * GET /api/battlelog/player/:platform/:platformId
 * Get player stats by platform and platform ID
 * Used by the mod to check if a player has stats
 */
router.get('/player/:platform/:platformId', async (req, res) => {
  try {
    const { platform, platformId } = req.params;

    const playerStats = await prisma.playerStats.findUnique({
      where: {
        platform_platformId: {
          platform,
          platformId,
        },
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

    if (!playerStats) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json(playerStats);
  } catch (error) {
    logger.error('Failed to get player stats', { error, params: req.params });
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

export default router;
