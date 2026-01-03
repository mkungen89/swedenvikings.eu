// ============================================
// Backup Service - PostgreSQL Database Backups
// ============================================

import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import cron from 'node-cron';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

interface BackupFile {
  filename: string;
  path: string;
  size: number;
  createdAt: Date;
}

export class BackupService {
  private cronJob: cron.ScheduledTask | null = null;

  /**
   * Get database connection details from DATABASE_URL
   */
  private getDatabaseConfig() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found in environment');
    }

    // Parse PostgreSQL connection string
    // Format: postgresql://user:password@host:port/database
    const match = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }

    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5],
    };
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDirectory(backupLocation: string): Promise<void> {
    try {
      await fs.mkdir(backupLocation, { recursive: true });
    } catch (error) {
      logger.error('Failed to create backup directory:', error);
      throw error;
    }
  }

  /**
   * Create database backup
   */
  async createBackup(): Promise<string> {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings) {
      throw new Error('Site settings not found');
    }

    const backupLocation = settings.backupLocation || '/var/backups/swedenvikings';
    await this.ensureBackupDirectory(backupLocation);

    const config = this.getDatabaseConfig();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}.sql`;
    const filepath = path.join(backupLocation, filename);

    logger.info(`Creating database backup: ${filename}`);

    try {
      // Windows: Use pg_dump directly
      // Linux: Use pg_dump with PGPASSWORD environment variable
      const isWindows = process.platform === 'win32';

      let command: string;
      if (isWindows) {
        // Windows command (assumes PostgreSQL bin is in PATH)
        command = `pg_dump -h ${config.host} -p ${config.port} -U ${config.user} -F p -f "${filepath}" ${config.database}`;

        // Set password via environment variable for this process
        process.env.PGPASSWORD = config.password;
      } else {
        // Linux command with inline password
        command = `PGPASSWORD="${config.password}" pg_dump -h ${config.host} -p ${config.port} -U ${config.user} -F p -f "${filepath}" ${config.database}`;
      }

      await execAsync(command);

      // Clear password from environment
      if (isWindows) {
        delete process.env.PGPASSWORD;
      }

      // Verify backup file was created
      const stats = await fs.stat(filepath);

      logger.info(`Backup created successfully: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

      return filename;
    } catch (error) {
      logger.error('Failed to create backup:', error);
      throw new Error(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all backup files
   */
  async listBackups(): Promise<BackupFile[]> {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings) {
      throw new Error('Site settings not found');
    }

    const backupLocation = settings.backupLocation || '/var/backups/swedenvikings';

    try {
      await this.ensureBackupDirectory(backupLocation);
      const files = await fs.readdir(backupLocation);

      const backups: BackupFile[] = [];

      for (const file of files) {
        if (file.endsWith('.sql')) {
          const filepath = path.join(backupLocation, file);
          const stats = await fs.stat(filepath);

          backups.push({
            filename: file,
            path: filepath,
            size: stats.size,
            createdAt: stats.birthtime,
          });
        }
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return backups;
    } catch (error) {
      logger.error('Failed to list backups:', error);
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(filename: string): Promise<void> {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings) {
      throw new Error('Site settings not found');
    }

    const backupLocation = settings.backupLocation || '/var/backups/swedenvikings';
    const filepath = path.join(backupLocation, filename);

    // Verify backup file exists
    try {
      await fs.access(filepath);
    } catch {
      throw new Error(`Backup file not found: ${filename}`);
    }

    logger.info(`Restoring database from backup: ${filename}`);

    const config = this.getDatabaseConfig();

    try {
      // Windows: Use psql directly
      // Linux: Use psql with PGPASSWORD environment variable
      const isWindows = process.platform === 'win32';

      let command: string;
      if (isWindows) {
        command = `psql -h ${config.host} -p ${config.port} -U ${config.user} -d ${config.database} -f "${filepath}"`;
        process.env.PGPASSWORD = config.password;
      } else {
        command = `PGPASSWORD="${config.password}" psql -h ${config.host} -p ${config.port} -U ${config.user} -d ${config.database} -f "${filepath}"`;
      }

      await execAsync(command);

      // Clear password from environment
      if (isWindows) {
        delete process.env.PGPASSWORD;
      }

      logger.info(`Database restored successfully from: ${filename}`);
    } catch (error) {
      logger.error('Failed to restore backup:', error);
      throw new Error(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete old backups based on retention policy
   */
  async deleteOldBackups(): Promise<number> {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings) {
      throw new Error('Site settings not found');
    }

    const backups = await this.listBackups();
    const retentionDays = settings.backupRetentionDays || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let deletedCount = 0;

    for (const backup of backups) {
      if (backup.createdAt < cutoffDate) {
        try {
          await fs.unlink(backup.path);
          logger.info(`Deleted old backup: ${backup.filename}`);
          deletedCount++;
        } catch (error) {
          logger.error(`Failed to delete backup ${backup.filename}:`, error);
        }
      }
    }

    logger.info(`Deleted ${deletedCount} old backup(s)`);
    return deletedCount;
  }

  /**
   * Get total size of all backups
   */
  async getBackupsSize(): Promise<number> {
    const backups = await this.listBackups();
    return backups.reduce((total, backup) => total + backup.size, 0);
  }

  /**
   * Start automatic backup scheduler
   */
  async startScheduler(): Promise<void> {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings || !settings.enableAutoBackup) {
      logger.info('Automatic backups are disabled');
      return;
    }

    // Stop existing scheduler if running
    this.stopScheduler();

    // Determine cron schedule based on frequency
    let cronSchedule: string;
    switch (settings.backupFrequency) {
      case 'hourly':
        cronSchedule = '0 * * * *'; // Every hour at minute 0
        break;
      case 'daily':
        cronSchedule = '0 2 * * *'; // Every day at 2:00 AM
        break;
      case 'weekly':
        cronSchedule = '0 2 * * 0'; // Every Sunday at 2:00 AM
        break;
      case 'monthly':
        cronSchedule = '0 2 1 * *'; // First day of month at 2:00 AM
        break;
      default:
        cronSchedule = '0 2 * * *'; // Default: daily
    }

    logger.info(`Starting backup scheduler: ${settings.backupFrequency} (${cronSchedule})`);

    this.cronJob = cron.schedule(cronSchedule, async () => {
      try {
        logger.info('Running scheduled backup...');
        await this.createBackup();
        await this.deleteOldBackups();
      } catch (error) {
        logger.error('Scheduled backup failed:', error);
      }
    });

    logger.info('Backup scheduler started');
  }

  /**
   * Stop automatic backup scheduler
   */
  stopScheduler(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Backup scheduler stopped');
    }
  }

  /**
   * Restart scheduler (useful when settings are updated)
   */
  async restartScheduler(): Promise<void> {
    this.stopScheduler();
    await this.startScheduler();
  }
}

// Export singleton instance
export const backupService = new BackupService();
