import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import type { Faction, WeaponType, VehicleType } from '@prisma/client';

// ============================================
// Battlelog Service
// ============================================
// Hanterar vapen, fordon och utrustning för Arma Reforger battlelog

// ============================================
// Weapons Management
// ============================================

export async function getAllWeapons(filters?: {
  faction?: Faction;
  type?: WeaponType;
  modSource?: string;
  isActive?: boolean;
}) {
  try {
    const weapons = await prisma.weapon.findMany({
      where: {
        ...(filters?.faction && { faction: filters.faction }),
        ...(filters?.type && { type: filters.type }),
        ...(filters?.modSource && { modSource: filters.modSource }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      orderBy: [{ faction: 'asc' }, { type: 'asc' }, { displayName: 'asc' }],
    });

    return weapons;
  } catch (error) {
    logger.error('Failed to fetch weapons', { error, filters });
    throw error;
  }
}

export async function getWeaponById(id: string) {
  try {
    const weapon = await prisma.weapon.findUnique({
      where: { id },
    });

    if (!weapon) {
      throw new Error('Weapon not found');
    }

    return weapon;
  } catch (error) {
    logger.error('Failed to fetch weapon', { error, id });
    throw error;
  }
}

export async function createWeapon(data: {
  name: string;
  displayName: string;
  description?: string;
  type: WeaponType;
  faction: Faction;
  modSource: string;
  imageUrl?: string;
  iconUrl?: string;
  damage?: number;
  accuracy?: number;
  range?: number;
  fireRate?: number;
}) {
  try {
    const weapon = await prisma.weapon.create({
      data,
    });

    logger.info('Weapon created', { weaponId: weapon.id, name: weapon.name });
    return weapon;
  } catch (error) {
    logger.error('Failed to create weapon', { error, data });
    throw error;
  }
}

export async function updateWeapon(
  id: string,
  data: Partial<{
    name: string;
    displayName: string;
    description: string;
    type: WeaponType;
    faction: Faction;
    modSource: string;
    imageUrl: string;
    iconUrl: string;
    damage: number;
    accuracy: number;
    range: number;
    fireRate: number;
    isActive: boolean;
  }>
) {
  try {
    const weapon = await prisma.weapon.update({
      where: { id },
      data,
    });

    logger.info('Weapon updated', { weaponId: weapon.id, name: weapon.name });
    return weapon;
  } catch (error) {
    logger.error('Failed to update weapon', { error, id, data });
    throw error;
  }
}

export async function deleteWeapon(id: string) {
  try {
    await prisma.weapon.delete({
      where: { id },
    });

    logger.info('Weapon deleted', { weaponId: id });
  } catch (error) {
    logger.error('Failed to delete weapon', { error, id });
    throw error;
  }
}

// ============================================
// Vehicles Management
// ============================================

export async function getAllVehicles(filters?: {
  faction?: Faction;
  type?: VehicleType;
  modSource?: string;
  isActive?: boolean;
}) {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        ...(filters?.faction && { faction: filters.faction }),
        ...(filters?.type && { type: filters.type }),
        ...(filters?.modSource && { modSource: filters.modSource }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      orderBy: [{ faction: 'asc' }, { type: 'asc' }, { displayName: 'asc' }],
    });

    return vehicles;
  } catch (error) {
    logger.error('Failed to fetch vehicles', { error, filters });
    throw error;
  }
}

export async function getVehicleById(id: string) {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    return vehicle;
  } catch (error) {
    logger.error('Failed to fetch vehicle', { error, id });
    throw error;
  }
}

export async function createVehicle(data: {
  name: string;
  displayName: string;
  description?: string;
  type: VehicleType;
  faction: Faction;
  modSource: string;
  imageUrl?: string;
  iconUrl?: string;
  armor?: number;
  speed?: number;
  capacity?: number;
}) {
  try {
    const vehicle = await prisma.vehicle.create({
      data,
    });

    logger.info('Vehicle created', { vehicleId: vehicle.id, name: vehicle.name });
    return vehicle;
  } catch (error) {
    logger.error('Failed to create vehicle', { error, data });
    throw error;
  }
}

export async function updateVehicle(
  id: string,
  data: Partial<{
    name: string;
    displayName: string;
    description: string;
    type: VehicleType;
    faction: Faction;
    modSource: string;
    imageUrl: string;
    iconUrl: string;
    armor: number;
    speed: number;
    capacity: number;
    isActive: boolean;
  }>
) {
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data,
    });

    logger.info('Vehicle updated', { vehicleId: vehicle.id, name: vehicle.name });
    return vehicle;
  } catch (error) {
    logger.error('Failed to update vehicle', { error, id, data });
    throw error;
  }
}

export async function deleteVehicle(id: string) {
  try {
    await prisma.vehicle.delete({
      where: { id },
    });

    logger.info('Vehicle deleted', { vehicleId: id });
  } catch (error) {
    logger.error('Failed to delete vehicle', { error, id });
    throw error;
  }
}

// ============================================
// Player Weapon Stats
// ============================================

export async function getPlayerWeaponStats(userId: string, faction?: Faction) {
  try {
    const playerStats = await prisma.playerStats.findUnique({
      where: { userId },
      include: {
        weaponStats: {
          include: {
            weapon: true,
          },
          where: faction ? { weapon: { faction } } : undefined,
          orderBy: { kills: 'desc' },
        },
      },
    });

    if (!playerStats) {
      return [];
    }

    return playerStats.weaponStats;
  } catch (error) {
    logger.error('Failed to fetch player weapon stats', { error, userId });
    throw error;
  }
}

export async function getPlayerVehicleStats(userId: string, faction?: Faction) {
  try {
    const playerStats = await prisma.playerStats.findUnique({
      where: { userId },
      include: {
        vehicleStats: {
          include: {
            vehicle: true,
          },
          where: faction ? { vehicle: { faction } } : undefined,
          orderBy: { kills: 'desc' },
        },
      },
    });

    if (!playerStats) {
      return [];
    }

    return playerStats.vehicleStats;
  } catch (error) {
    logger.error('Failed to fetch player vehicle stats', { error, userId });
    throw error;
  }
}

// ============================================
// Update Preferred Faction
// ============================================

export async function updatePreferredFaction(userId: string, faction: Faction) {
  try {
    // Find or create PlayerStats
    let playerStats = await prisma.playerStats.findUnique({
      where: { userId },
    });

    if (!playerStats) {
      playerStats = await prisma.playerStats.create({
        data: {
          userId,
          preferredFaction: faction,
        },
      });
    } else {
      playerStats = await prisma.playerStats.update({
        where: { userId },
        data: { preferredFaction: faction },
      });
    }

    logger.info('Preferred faction updated', { userId, faction });
    return playerStats;
  } catch (error) {
    logger.error('Failed to update preferred faction', { error, userId, faction });
    throw error;
  }
}

// ============================================
// Mod Sources
// ============================================

export async function getModSources() {
  try {
    const weaponMods = await prisma.weapon.findMany({
      select: { modSource: true },
      distinct: ['modSource'],
    });

    const vehicleMods = await prisma.vehicle.findMany({
      select: { modSource: true },
      distinct: ['modSource'],
    });

    const uniqueMods = new Set([
      ...weaponMods.map((w) => w.modSource),
      ...vehicleMods.map((v) => v.modSource),
    ]);

    return Array.from(uniqueMods).sort();
  } catch (error) {
    logger.error('Failed to fetch mod sources', { error });
    throw error;
  }
}
