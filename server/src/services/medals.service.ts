// ============================================
// Medals Service
// ============================================
// Handles medal checking, awarding, and progress tracking

import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

interface MedalRequirement {
  type: 'kills' | 'headshots' | 'pointsCaptured' | 'pointsDefended' | 'revives' |
        'suppliesDelivered' | 'gamesPlayed' | 'gamesWon' | 'level' | 'kdr' | 'winRate';
  value: number;
  operator?: 'gte' | 'lte' | 'eq' | 'gt' | 'lt';
}

class MedalsService {
  /**
   * Check all medals for a user and update progress
   */
  async checkMedals(userId: string): Promise<{
    newlyUnlocked: Array<{ id: string; name: string; tier: string; rarity: string }>;
    updated: number;
  }> {
    try {
      // Get user stats
      const stats = await prisma.playerStats.findUnique({
        where: { userId },
      });

      if (!stats) {
        logger.warn(`No player stats found for user ${userId}`);
        return { newlyUnlocked: [], updated: 0 };
      }

      // Get all medals
      const allMedals = await prisma.medal.findMany();

      // Get user's current medals
      const userMedals = await prisma.userMedal.findMany({
        where: { userId },
        include: { medal: true },
      });

      const newlyUnlocked: Array<{ id: string; name: string; tier: string; rarity: string }> = [];
      let updated = 0;

      for (const medal of allMedals) {
        let userMedal = userMedals.find(um => um.medalId === medal.id);

        // Create user medal if it doesn't exist
        if (!userMedal) {
          const requirement = medal.requirement as MedalRequirement;
          userMedal = await prisma.userMedal.create({
            data: {
              userId,
              medalId: medal.id,
              progress: 0,
              maxProgress: requirement.value,
            },
            include: { medal: true },
          });
        }

        // Skip if already unlocked
        if (userMedal.isUnlocked) continue;

        // Check progress
        const requirement = medal.requirement as MedalRequirement;
        const progress = this.getProgress(requirement, stats);
        const isUnlocked = this.checkRequirement(requirement, progress);

        // Update progress
        if (progress !== userMedal.progress || isUnlocked !== userMedal.isUnlocked) {
          await prisma.userMedal.update({
            where: { id: userMedal.id },
            data: {
              progress: Math.min(progress, requirement.value),
              isUnlocked,
              unlockedAt: isUnlocked && !userMedal.unlockedAt ? new Date() : userMedal.unlockedAt,
            },
          });
          updated++;

          // If newly unlocked, create notification
          if (isUnlocked && !userMedal.isUnlocked) {
            newlyUnlocked.push({
              id: medal.id,
              name: medal.name,
              tier: medal.tier,
              rarity: medal.rarity,
            });

            await this.createMedalNotification(userId, medal.name, medal.tier, medal.rarity);

            logger.info(`Medal unlocked: ${medal.name} (${medal.tier}) for user ${userId}`);
          }
        }
      }

      return { newlyUnlocked, updated };
    } catch (error) {
      logger.error('Error checking medals:', error);
      throw error;
    }
  }

  /**
   * Get progress value for a requirement type
   */
  private getProgress(requirement: MedalRequirement, stats: any): number {
    switch (requirement.type) {
      case 'kills':
        return stats.kills || 0;
      case 'headshots':
        return stats.headshots || 0;
      case 'pointsCaptured':
        return stats.pointsCaptured || 0;
      case 'pointsDefended':
        return stats.pointsDefended || 0;
      case 'revives':
        return stats.revives || 0;
      case 'suppliesDelivered':
        return stats.suppliesDelivered || 0;
      case 'gamesPlayed':
        return stats.gamesPlayed || 0;
      case 'gamesWon':
        return stats.gamesWon || 0;
      case 'level':
        return stats.level || 1;
      case 'kdr':
        return stats.kdr || 0;
      case 'winRate':
        return stats.winRate || 0;
      default:
        return 0;
    }
  }

  /**
   * Check if requirement is met
   */
  private checkRequirement(requirement: MedalRequirement, progress: number): boolean {
    const operator = requirement.operator || 'gte';

    switch (operator) {
      case 'gte':
        return progress >= requirement.value;
      case 'gt':
        return progress > requirement.value;
      case 'lte':
        return progress <= requirement.value;
      case 'lt':
        return progress < requirement.value;
      case 'eq':
        return progress === requirement.value;
      default:
        return progress >= requirement.value;
    }
  }

  /**
   * Create medal unlock notification
   */
  private async createMedalNotification(userId: string, medalName: string, tier: string, rarity: string): Promise<void> {
    try {
      const tierEmoji = {
        bronze: '🥉',
        silver: '🥈',
        gold: '🥇',
        platinum: '💎',
      }[tier] || '🏅';

      await prisma.notification.create({
        data: {
          userId,
          type: 'medal_unlocked',
          title: 'Medal Unlocked!',
          message: `Du har låst upp ${tierEmoji} ${medalName} (${tier})!`,
          link: '/profile',
        },
      });
    } catch (error) {
      logger.error('Error creating medal notification:', error);
    }
  }

  /**
   * Get user medals with progress
   */
  async getUserMedals(userId: string) {
    return await prisma.userMedal.findMany({
      where: { userId },
      include: {
        medal: true,
      },
      orderBy: [
        { isUnlocked: 'desc' },
        { unlockedAt: 'desc' },
        { progress: 'desc' },
      ],
    });
  }

  /**
   * Get medal by ID
   */
  async getMedal(medalId: string) {
    return await prisma.medal.findUnique({
      where: { id: medalId },
    });
  }

  /**
   * Get all medals
   */
  async getAllMedals(filters?: {
    category?: string;
    tier?: string;
    rarity?: string;
  }) {
    const where: any = {};
    if (filters?.category) where.category = filters.category;
    if (filters?.tier) where.tier = filters.tier;
    if (filters?.rarity) where.rarity = filters.rarity;

    return await prisma.medal.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { tier: 'asc' },
      ],
    });
  }

  /**
   * Create new medal (Admin only)
   */
  async createMedal(data: {
    name: string;
    description: string;
    category: string;
    tier: string;
    icon: string;
    imageUrl?: string;
    rarity?: string;
    requirement: MedalRequirement;
  }) {
    return await prisma.medal.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        tier: data.tier,
        icon: data.icon,
        imageUrl: data.imageUrl,
        rarity: data.rarity || 'common',
        requirement: data.requirement as any,
      },
    });
  }

  /**
   * Update medal (Admin only)
   */
  async updateMedal(medalId: string, data: Partial<{
    name: string;
    description: string;
    category: string;
    tier: string;
    icon: string;
    imageUrl: string;
    rarity: string;
    requirement: MedalRequirement;
  }>) {
    return await prisma.medal.update({
      where: { id: medalId },
      data: data as any,
    });
  }

  /**
   * Delete medal (Admin only)
   */
  async deleteMedal(medalId: string) {
    return await prisma.medal.delete({
      where: { id: medalId },
    });
  }

  /**
   * Manually award medal to user (Admin only)
   */
  async awardMedal(userId: string, medalId: string) {
    const medal = await this.getMedal(medalId);
    if (!medal) {
      throw new Error('Medal not found');
    }

    const userMedal = await prisma.userMedal.findUnique({
      where: {
        userId_medalId: {
          userId,
          medalId,
        },
      },
    });

    if (!userMedal) {
      // Create and unlock
      await prisma.userMedal.create({
        data: {
          userId,
          medalId,
          progress: (medal.requirement as MedalRequirement).value,
          maxProgress: (medal.requirement as MedalRequirement).value,
          isUnlocked: true,
          unlockedAt: new Date(),
        },
      });
    } else if (!userMedal.isUnlocked) {
      // Unlock existing
      await prisma.userMedal.update({
        where: { id: userMedal.id },
        data: {
          progress: (medal.requirement as MedalRequirement).value,
          isUnlocked: true,
          unlockedAt: new Date(),
        },
      });
    } else {
      throw new Error('Medal already unlocked');
    }

    // Create notification
    await this.createMedalNotification(userId, medal.name, medal.tier, medal.rarity);

    logger.info(`Medal manually awarded: ${medal.name} to user ${userId}`);
  }

  /**
   * Reset user medals (Admin only)
   */
  async resetUserMedals(userId: string) {
    await prisma.userMedal.deleteMany({
      where: { userId },
    });

    logger.info(`All medals reset for user ${userId}`);
  }

  /**
   * Get medal statistics for user
   */
  async getUserMedalStats(userId: string) {
    const userMedals = await this.getUserMedals(userId);

    const stats = {
      total: userMedals.length,
      unlocked: userMedals.filter(um => um.isUnlocked).length,
      byTier: {
        bronze: userMedals.filter(um => um.isUnlocked && um.medal.tier === 'bronze').length,
        silver: userMedals.filter(um => um.isUnlocked && um.medal.tier === 'silver').length,
        gold: userMedals.filter(um => um.isUnlocked && um.medal.tier === 'gold').length,
        platinum: userMedals.filter(um => um.isUnlocked && um.medal.tier === 'platinum').length,
      },
      byRarity: {
        common: userMedals.filter(um => um.isUnlocked && um.medal.rarity === 'common').length,
        rare: userMedals.filter(um => um.isUnlocked && um.medal.rarity === 'rare').length,
        epic: userMedals.filter(um => um.isUnlocked && um.medal.rarity === 'epic').length,
        legendary: userMedals.filter(um => um.isUnlocked && um.medal.rarity === 'legendary').length,
      },
      completionPercentage: userMedals.length > 0
        ? (userMedals.filter(um => um.isUnlocked).length / userMedals.length) * 100
        : 0,
    };

    return stats;
  }
}

export const medalsService = new MedalsService();
