// ============================================
// Optimization Service - Database Maintenance
// ============================================

import cron from 'node-cron';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

interface DatabaseStats {
  databaseSize: string;
  databaseSizeBytes: number;
  tableCount: number;
  totalRows: number;
  oldestActivityLog?: Date;
  activityLogCount: number;
  oldestTicket?: Date;
  ticketCount: number;
}

export class OptimizationService {
  private cronJob: cron.ScheduledTask | null = null;

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    try {
      // Get database size
      const sizeResult = await prisma.$queryRaw<Array<{ pg_database_size: bigint }>>`
        SELECT pg_database_size(current_database()) as pg_database_size;
      `;
      const sizeBytes = Number(sizeResult[0].pg_database_size);
      const sizeMB = sizeBytes / 1024 / 1024;
      const sizeGB = sizeMB / 1024;

      let sizeFormatted: string;
      if (sizeGB >= 1) {
        sizeFormatted = `${sizeGB.toFixed(2)} GB`;
      } else {
        sizeFormatted = `${sizeMB.toFixed(2)} MB`;
      }

      // Get table count
      const tableResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT count(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public';
      `;
      const tableCount = Number(tableResult[0].count);

      // Get total row count across all tables
      const rowCountResult = await prisma.$queryRaw<Array<{ total_rows: bigint }>>`
        SELECT sum(n_live_tup) as total_rows
        FROM pg_stat_user_tables;
      `;
      const totalRows = Number(rowCountResult[0].total_rows || 0);

      // Get activity log statistics
      const activityLogCount = await prisma.activityLog.count();
      const oldestActivityLog = await prisma.activityLog.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      });

      // Get ticket statistics
      const ticketCount = await prisma.ticket.count();
      const oldestTicket = await prisma.ticket.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      });

      return {
        databaseSize: sizeFormatted,
        databaseSizeBytes: sizeBytes,
        tableCount,
        totalRows,
        oldestActivityLog: oldestActivityLog?.createdAt,
        activityLogCount,
        oldestTicket: oldestTicket?.createdAt,
        ticketCount,
      };
    } catch (error) {
      logger.error('Failed to get database stats:', error);
      throw error;
    }
  }

  /**
   * Optimize database (VACUUM ANALYZE)
   */
  async optimizeDatabase(): Promise<void> {
    try {
      logger.info('Starting database optimization...');

      // Run VACUUM ANALYZE on all tables
      await prisma.$executeRawUnsafe('VACUUM ANALYZE;');

      logger.info('Database optimization completed');
    } catch (error) {
      logger.error('Failed to optimize database:', error);
      throw error;
    }
  }

  /**
   * Clean old activity logs
   */
  async cleanOldActivityLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      logger.info(`Cleaning activity logs older than ${daysToKeep} days (before ${cutoffDate.toISOString()})...`);

      const result = await prisma.activityLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      logger.info(`Deleted ${result.count} old activity log entries`);
      return result.count;
    } catch (error) {
      logger.error('Failed to clean old activity logs:', error);
      throw error;
    }
  }

  /**
   * Clean closed tickets older than specified days
   */
  async cleanOldClosedTickets(daysToKeep: number = 180): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      logger.info(`Cleaning closed tickets older than ${daysToKeep} days...`);

      const result = await prisma.ticket.deleteMany({
        where: {
          status: 'closed',
          updatedAt: {
            lt: cutoffDate,
          },
        },
      });

      logger.info(`Deleted ${result.count} old closed tickets`);
      return result.count;
    } catch (error) {
      logger.error('Failed to clean old tickets:', error);
      throw error;
    }
  }

  /**
   * Clean old session data
   */
  async cleanOldSessions(daysToKeep: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      logger.info(`Cleaning sessions older than ${daysToKeep} days...`);

      // This depends on how sessions are stored
      // If using connect-pg-simple or similar, sessions might be in a separate table
      // For now, we'll just log that this needs to be implemented based on session store

      logger.info('Session cleanup not implemented (depends on session store configuration)');
      return 0;
    } catch (error) {
      logger.error('Failed to clean old sessions:', error);
      throw error;
    }
  }

  /**
   * Clean all old data based on default retention policies
   */
  async cleanOldData(): Promise<{
    activityLogs: number;
    tickets: number;
    sessions: number;
  }> {
    try {
      logger.info('Starting cleanup of old data...');

      const activityLogs = await this.cleanOldActivityLogs(90); // Keep 90 days
      const tickets = await this.cleanOldClosedTickets(180); // Keep 180 days
      const sessions = await this.cleanOldSessions(7); // Keep 7 days

      logger.info('Data cleanup completed', { activityLogs, tickets, sessions });

      return { activityLogs, tickets, sessions };
    } catch (error) {
      logger.error('Failed to clean old data:', error);
      throw error;
    }
  }

  /**
   * Reindex database tables for better performance
   */
  async reindexDatabase(): Promise<void> {
    try {
      logger.info('Starting database reindex...');

      // Reindex all tables in the public schema
      await prisma.$executeRawUnsafe('REINDEX SCHEMA public;');

      logger.info('Database reindex completed');
    } catch (error) {
      logger.error('Failed to reindex database:', error);
      throw error;
    }
  }

  /**
   * Get table sizes
   */
  async getTableSizes(): Promise<Array<{ tableName: string; size: string; rows: number }>> {
    try {
      const result = await prisma.$queryRaw<
        Array<{
          tablename: string;
          size: string;
          n_live_tup: bigint;
        }>
      >`
        SELECT
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
          n_live_tup
        FROM pg_tables
        LEFT JOIN pg_stat_user_tables ON pg_tables.tablename = pg_stat_user_tables.relname
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
      `;

      return result.map((row) => ({
        tableName: row.tablename,
        size: row.size,
        rows: Number(row.n_live_tup || 0),
      }));
    } catch (error) {
      logger.error('Failed to get table sizes:', error);
      throw error;
    }
  }

  /**
   * Start automatic optimization scheduler
   */
  async startScheduler(): Promise<void> {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings || !settings.enableDatabaseOptimization) {
      logger.info('Automatic database optimization is disabled');
      return;
    }

    // Stop existing scheduler if running
    this.stopScheduler();

    // Determine cron schedule based on frequency
    let cronSchedule: string;
    switch (settings.optimizationSchedule) {
      case 'daily':
        cronSchedule = '0 3 * * *'; // Every day at 3:00 AM
        break;
      case 'weekly':
        cronSchedule = '0 3 * * 1'; // Every Monday at 3:00 AM
        break;
      case 'monthly':
        cronSchedule = '0 3 1 * *'; // First day of month at 3:00 AM
        break;
      default:
        cronSchedule = '0 3 * * 1'; // Default: weekly
    }

    logger.info(`Starting optimization scheduler: ${settings.optimizationSchedule} (${cronSchedule})`);

    this.cronJob = cron.schedule(cronSchedule, async () => {
      try {
        logger.info('Running scheduled database optimization...');
        await this.optimizeDatabase();
        await this.cleanOldData();
      } catch (error) {
        logger.error('Scheduled optimization failed:', error);
      }
    });

    logger.info('Optimization scheduler started');
  }

  /**
   * Stop automatic optimization scheduler
   */
  stopScheduler(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Optimization scheduler stopped');
    }
  }

  /**
   * Restart scheduler (useful when settings are updated)
   */
  async restartScheduler(): Promise<void> {
    this.stopScheduler();
    await this.startScheduler();
  }

  /**
   * Check if database size exceeds configured limit
   */
  async checkDatabaseSize(): Promise<{
    currentSize: number;
    maxSize: number;
    percentage: number;
    exceeded: boolean;
  }> {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings) {
      throw new Error('Site settings not found');
    }

    const stats = await this.getDatabaseStats();
    const maxSizeBytes = (settings.maxDatabaseSize || 10) * 1024 * 1024 * 1024; // Convert GB to bytes
    const percentage = (stats.databaseSizeBytes / maxSizeBytes) * 100;
    const exceeded = stats.databaseSizeBytes > maxSizeBytes;

    if (exceeded) {
      logger.warn(`Database size (${stats.databaseSize}) exceeds configured limit (${settings.maxDatabaseSize} GB)`);
    }

    return {
      currentSize: stats.databaseSizeBytes,
      maxSize: maxSizeBytes,
      percentage: Math.round(percentage * 100) / 100,
      exceeded,
    };
  }
}

// Export singleton instance
export const optimizationService = new OptimizationService();
