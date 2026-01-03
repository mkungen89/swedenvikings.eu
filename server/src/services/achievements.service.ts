// ============================================
// Achievements Service
// ============================================
// Handles achievement checking, awarding, and notifications

import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

interface AchievementRequirement {
  type: 'kills' | 'deaths' | 'assists' | 'headshots' | 'gamesPlayed' | 'gamesWon' |
        'pointsCaptured' | 'pointsDefended' | 'suppliesDelivered' | 'revives' |
        'level' | 'kdr' | 'winRate';
  value: number;
  operator?: 'gte' | 'lte' | 'eq' | 'gt' | 'lt';
}

class AchievementsService {
  /**
   * Check all achievements for a user and update progress
   */
  async checkAchievements(userId: string): Promise<{
    newlyCompleted: Array<{ id: string; name: string; xpReward: number }>;
    updated: number;
  }> {
    try {
      // Get user stats
      const stats = await prisma.playerStats.findUnique({
        where: { userId },
      });

      if (!stats) {
        logger.warn(`No player stats found for user ${userId}`);
        return { newlyCompleted: [], updated: 0 };
      }

      // Get all achievements
      const allAchievements = await prisma.achievement.findMany();

      // Get user's current achievements
      const userAchievements = await prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
      });

      const newlyCompleted: Array<{ id: string; name: string; xpReward: number }> = [];
      let updated = 0;

      for (const achievement of allAchievements) {
        let userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);

        // Create user achievement if it doesn't exist
        if (!userAchievement) {
          const requirement = achievement.requirement as AchievementRequirement;
          userAchievement = await prisma.userAchievement.create({
            data: {
              userId,
              achievementId: achievement.id,
              progress: 0,
              maxProgress: requirement.value,
            },
            include: { achievement: true },
          });
        }

        // Skip if already completed
        if (userAchievement.isCompleted) continue;

        // Check progress
        const requirement = achievement.requirement as AchievementRequirement;
        const progress = this.getProgress(requirement, stats);
        const isCompleted = this.checkRequirement(requirement, progress);

        // Update progress
        if (progress !== userAchievement.progress || isCompleted !== userAchievement.isCompleted) {
          await prisma.userAchievement.update({
            where: { id: userAchievement.id },
            data: {
              progress: Math.min(progress, requirement.value),
              isCompleted,
              completedAt: isCompleted && !userAchievement.completedAt ? new Date() : userAchievement.completedAt,
            },
          });
          updated++;

          // If newly completed, award XP
          if (isCompleted && !userAchievement.isCompleted) {
            newlyCompleted.push({
              id: achievement.id,
              name: achievement.name,
              xpReward: achievement.xpReward,
            });

            if (achievement.xpReward > 0) {
              await this.awardXP(userId, achievement.xpReward);
            }

            // Create notification
            await this.createAchievementNotification(userId, achievement.name, achievement.xpReward);

            logger.info(`Achievement completed: ${achievement.name} for user ${userId} (+${achievement.xpReward} XP)`);
          }
        }
      }

      return { newlyCompleted, updated };
    } catch (error) {
      logger.error('Error checking achievements:', error);
      throw error;
    }
  }

  /**
   * Get progress value for a requirement type
   */
  private getProgress(requirement: AchievementRequirement, stats: any): number {
    switch (requirement.type) {
      case 'kills':
        return stats.kills || 0;
      case 'deaths':
        return stats.deaths || 0;
      case 'assists':
        return stats.assists || 0;
      case 'headshots':
        return stats.headshots || 0;
      case 'gamesPlayed':
        return stats.gamesPlayed || 0;
      case 'gamesWon':
        return stats.gamesWon || 0;
      case 'pointsCaptured':
        return stats.pointsCaptured || 0;
      case 'pointsDefended':
        return stats.pointsDefended || 0;
      case 'suppliesDelivered':
        return stats.suppliesDelivered || 0;
      case 'revives':
        return stats.revives || 0;
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
  private checkRequirement(requirement: AchievementRequirement, progress: number): boolean {
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
   * Award XP to a user
   */
  private async awardXP(userId: string, xp: number): Promise<void> {
    const stats = await prisma.playerStats.findUnique({
      where: { userId },
    });

    if (!stats) return;

    const newXP = stats.experiencePoints + xp;
    const newLevel = this.calculateLevel(newXP);

    await prisma.playerStats.update({
      where: { userId },
      data: {
        experiencePoints: newXP,
        level: newLevel,
      },
    });

    // If leveled up, create notification
    if (newLevel > stats.level) {
      await this.createLevelUpNotification(userId, newLevel);
      logger.info(`User ${userId} leveled up to ${newLevel}`);
    }
  }

  /**
   * Calculate level from XP
   */
  private calculateLevel(xp: number): number {
    // Level formula: sqrt(XP / 1000)
    return Math.floor(Math.sqrt(xp / 1000)) + 1;
  }

  /**
   * Create achievement unlock notification
   */
  private async createAchievementNotification(userId: string, achievementName: string, xpReward: number): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: 'achievement_unlocked',
          title: 'Achievement Unlocked!',
          message: `Du har låst upp achievementet "${achievementName}"! +${xpReward} XP`,
          link: '/profile',
        },
      });
    } catch (error) {
      logger.error('Error creating achievement notification:', error);
    }
  }

  /**
   * Create level up notification
   */
  private async createLevelUpNotification(userId: string, level: number): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: 'level_up',
          title: 'Level Up!',
          message: `Grattis! Du har nått level ${level}!`,
          link: '/profile',
        },
      });
    } catch (error) {
      logger.error('Error creating level up notification:', error);
    }
  }

  /**
   * Get user achievements with progress
   */
  async getUserAchievements(userId: string) {
    return await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: [
        { isCompleted: 'desc' },
        { completedAt: 'desc' },
        { progress: 'desc' },
      ],
    });
  }

  /**
   * Get achievement by ID
   */
  async getAchievement(achievementId: string) {
    return await prisma.achievement.findUnique({
      where: { id: achievementId },
    });
  }

  /**
   * Get all achievements
   */
  async getAllAchievements(includeHidden: boolean = false) {
    return await prisma.achievement.findMany({
      where: includeHidden ? {} : { isHidden: false },
      orderBy: { category: 'asc' },
    });
  }

  /**
   * Create new achievement (Admin only)
   */
  async createAchievement(data: {
    name: string;
    description: string;
    category: string;
    icon: string;
    requirement: AchievementRequirement;
    xpReward?: number;
    isHidden?: boolean;
  }) {
    return await prisma.achievement.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        icon: data.icon,
        requirement: data.requirement as any,
        xpReward: data.xpReward || 0,
        isHidden: data.isHidden || false,
      },
    });
  }

  /**
   * Update achievement (Admin only)
   */
  async updateAchievement(achievementId: string, data: Partial<{
    name: string;
    description: string;
    category: string;
    icon: string;
    requirement: AchievementRequirement;
    xpReward: number;
    isHidden: boolean;
  }>) {
    return await prisma.achievement.update({
      where: { id: achievementId },
      data: data as any,
    });
  }

  /**
   * Delete achievement (Admin only)
   */
  async deleteAchievement(achievementId: string) {
    return await prisma.achievement.delete({
      where: { id: achievementId },
    });
  }

  /**
   * Manually award achievement to user (Admin only)
   */
  async awardAchievement(userId: string, achievementId: string) {
    const achievement = await this.getAchievement(achievementId);
    if (!achievement) {
      throw new Error('Achievement not found');
    }

    const userAchievement = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
    });

    if (!userAchievement) {
      // Create and complete
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId,
          progress: (achievement.requirement as AchievementRequirement).value,
          maxProgress: (achievement.requirement as AchievementRequirement).value,
          isCompleted: true,
          completedAt: new Date(),
        },
      });
    } else if (!userAchievement.isCompleted) {
      // Complete existing
      await prisma.userAchievement.update({
        where: { id: userAchievement.id },
        data: {
          progress: (achievement.requirement as AchievementRequirement).value,
          isCompleted: true,
          completedAt: new Date(),
        },
      });
    } else {
      throw new Error('Achievement already completed');
    }

    // Award XP
    if (achievement.xpReward > 0) {
      await this.awardXP(userId, achievement.xpReward);
    }

    // Create notification
    await this.createAchievementNotification(userId, achievement.name, achievement.xpReward);

    logger.info(`Achievement manually awarded: ${achievement.name} to user ${userId}`);
  }

  /**
   * Reset user achievements (Admin only)
   */
  async resetUserAchievements(userId: string) {
    await prisma.userAchievement.deleteMany({
      where: { userId },
    });

    logger.info(`All achievements reset for user ${userId}`);
  }
}

export const achievementsService = new AchievementsService();
