import { prisma } from '../utils/prisma';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

/**
 * GDPR Service - Handles data export and deletion requests
 */
export class GDPRService {
  /**
   * Export all user data as JSON
   */
  async exportUserData(userId: string): Promise<any> {
    // Fetch all user-related data
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        sessions: true,
        socialLinks: true,
        bansReceived: true,
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1000, // Last 1000 activities
        },
        newsArticles: true,
        eventsOrganized: true,
        eventParticipations: {
          include: {
            event: true,
          },
        },
        galleryItems: true,
        ticketsCreated: {
          include: {
            messages: true,
          },
        },
        ticketMessages: true,
        applications: true,
        clanMemberships: {
          include: {
            clan: true,
          },
        },
        notifications: true,
        playerStats: {
          include: {
            matches: true,
          },
        },
        medals: {
          include: {
            medal: true,
          },
        },
        achievements: {
          include: {
            achievement: true,
          },
        },
      },
    });

    if (!userData) {
      throw new Error('User not found');
    }

    // Get cookie consent
    const cookieConsent = await prisma.cookieConsent.findUnique({
      where: { userId },
    });

    // Get export/deletion requests
    const exportRequests = await prisma.dataExportRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
    });

    const deletionRequests = await prisma.dataDeletionRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
    });

    // Compile all data
    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportVersion: '1.0',
        userId: userId,
      },
      profile: {
        id: userData.id,
        steamId: userData.steamId,
        username: userData.username,
        email: userData.email,
        avatar: userData.avatar,
        banner: userData.banner,
        bio: userData.bio,
        isPrivate: userData.isPrivate,
        theme: userData.theme,
        language: userData.language,
        emailNotifications: userData.emailNotifications,
        discordNotifications: userData.discordNotifications,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        lastSeenAt: userData.lastSeenAt,
      },
      roles: userData.roles.map(ur => ({
        role: ur.role.name,
        assignedAt: ur.assignedAt,
      })),
      socialLinks: userData.socialLinks,
      sessions: userData.sessions.map(s => ({
        userAgent: s.userAgent,
        ip: s.ip,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      })),
      bans: userData.bansReceived,
      activityLogs: userData.activityLogs,
      content: {
        newsArticles: userData.newsArticles,
        eventsOrganized: userData.eventsOrganized,
        eventParticipations: userData.eventParticipations,
        galleryItems: userData.galleryItems,
      },
      support: {
        ticketsCreated: userData.ticketsCreated,
        ticketMessages: userData.ticketMessages,
      },
      applications: userData.applications,
      clans: userData.clanMemberships,
      notifications: userData.notifications,
      gaming: {
        playerStats: userData.playerStats,
        medals: userData.medals,
        achievements: userData.achievements,
      },
      privacy: {
        cookieConsent,
        exportRequests,
        deletionRequests,
      },
    };

    return exportData;
  }

  /**
   * Create a data export request
   */
  async createExportRequest(userId: string): Promise<any> {
    // Check if there's already a pending request
    const existingRequest = await prisma.dataExportRequest.findFirst({
      where: {
        userId,
        status: { in: ['pending', 'processing'] },
      },
    });

    if (existingRequest) {
      throw new Error('Export request already in progress');
    }

    // Create new export request
    const exportRequest = await prisma.dataExportRequest.create({
      data: {
        userId,
        status: 'pending',
      },
    });

    // Process export asynchronously
    this.processExportRequest(exportRequest.id).catch(err => {
      console.error('Export request processing failed:', err);
    });

    return exportRequest;
  }

  /**
   * Process export request (generate ZIP file)
   */
  private async processExportRequest(requestId: string): Promise<void> {
    try {
      // Update status to processing
      await prisma.dataExportRequest.update({
        where: { id: requestId },
        data: { status: 'processing' },
      });

      const request = await prisma.dataExportRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw new Error('Export request not found');
      }

      // Export user data
      const userData = await this.exportUserData(request.userId);

      // Create exports directory if it doesn't exist
      const exportsDir = path.join(process.cwd(), 'server', 'exports');
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }

      // Generate unique filename
      const filename = `user-data-${request.userId}-${Date.now()}.zip`;
      const filepath = path.join(exportsDir, filename);

      // Create ZIP file
      const output = fs.createWriteStream(filepath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      return new Promise((resolve, reject) => {
        output.on('close', async () => {
          try {
            const fileSize = archive.pointer();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 48); // 48 hour expiry

            // Update request with file info
            await prisma.dataExportRequest.update({
              where: { id: requestId },
              data: {
                status: 'completed',
                fileUrl: `/api/gdpr/export/${requestId}/download`,
                fileSize: BigInt(fileSize),
                expiresAt,
                completedAt: new Date(),
              },
            });

            resolve();
          } catch (err) {
            reject(err);
          }
        });

        archive.on('error', reject);

        archive.pipe(output);

        // Add JSON data to archive
        archive.append(JSON.stringify(userData, null, 2), { name: 'user-data.json' });

        // Add README
        const readme = `# Your Sweden Vikings Data Export

This archive contains all your personal data stored in the Sweden Vikings CMS.

## Contents:
- user-data.json: All your data in JSON format

## Data included:
- Profile information
- Roles and permissions
- Social links
- Activity logs
- Content (news, events, gallery)
- Support tickets
- Applications
- Clan memberships
- Gaming statistics, medals, and achievements
- Privacy settings and consent

## How to use:
You can open the JSON file in any text editor or JSON viewer.

Exported: ${new Date().toISOString()}
Export Version: 1.0

For questions, contact: admin@swedenvikings.eu
`;
        archive.append(readme, { name: 'README.txt' });

        archive.finalize();
      });
    } catch (error) {
      console.error('Export processing error:', error);

      // Update status to failed
      await prisma.dataExportRequest.update({
        where: { id: requestId },
        data: { status: 'failed' },
      });

      throw error;
    }
  }

  /**
   * Get export file path
   */
  async getExportFilePath(requestId: string): Promise<string | null> {
    const request = await prisma.dataExportRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.status !== 'completed' || !request.fileUrl) {
      return null;
    }

    // Check if expired
    if (request.expiresAt && new Date() > request.expiresAt) {
      return null;
    }

    const exportsDir = path.join(process.cwd(), 'server', 'exports');
    const files = fs.readdirSync(exportsDir);
    const matchingFile = files.find(f => f.includes(request.userId));

    if (!matchingFile) {
      return null;
    }

    return path.join(exportsDir, matchingFile);
  }

  /**
   * Create a data deletion request
   */
  async createDeletionRequest(
    userId: string,
    reason?: string
  ): Promise<any> {
    // Check if there's already a pending request
    const existingRequest = await prisma.dataDeletionRequest.findFirst({
      where: {
        userId,
        status: { in: ['pending', 'approved'] },
      },
    });

    if (existingRequest) {
      throw new Error('Deletion request already exists');
    }

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');

    // Create deletion request
    const deletionRequest = await prisma.dataDeletionRequest.create({
      data: {
        userId,
        reason,
        status: 'pending',
        verificationToken,
      },
    });

    // TODO: Send verification email to user

    return {
      ...deletionRequest,
      message: 'Deletion request created. Please check your email to verify.',
    };
  }

  /**
   * Verify deletion request
   */
  async verifyDeletionRequest(token: string): Promise<any> {
    const request = await prisma.dataDeletionRequest.findUnique({
      where: { verificationToken: token },
    });

    if (!request) {
      throw new Error('Invalid verification token');
    }

    if (request.verifiedAt) {
      throw new Error('Request already verified');
    }

    // Mark as verified and schedule deletion for 30 days from now
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + 30);

    const updatedRequest = await prisma.dataDeletionRequest.update({
      where: { id: request.id },
      data: {
        verifiedAt: new Date(),
        status: 'approved',
        scheduledFor,
      },
    });

    return {
      ...updatedRequest,
      message: `Account deletion scheduled for ${scheduledFor.toISOString()}. You have 30 days to cancel.`,
    };
  }

  /**
   * Cancel deletion request
   */
  async cancelDeletionRequest(requestId: string, userId: string): Promise<any> {
    const request = await prisma.dataDeletionRequest.findFirst({
      where: {
        id: requestId,
        userId,
      },
    });

    if (!request) {
      throw new Error('Deletion request not found');
    }

    if (request.status === 'completed') {
      throw new Error('Cannot cancel completed deletion');
    }

    await prisma.dataDeletionRequest.delete({
      where: { id: requestId },
    });

    return { message: 'Deletion request cancelled successfully' };
  }

  /**
   * Execute account deletion (called by admin or scheduled task)
   */
  async executeAccountDeletion(userId: string): Promise<void> {
    // This will cascade delete all related data due to Prisma relations
    await prisma.user.delete({
      where: { id: userId },
    });

    // Mark deletion request as completed
    await prisma.dataDeletionRequest.updateMany({
      where: {
        userId,
        status: 'approved',
      },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    // Clean up export files
    const exportsDir = path.join(process.cwd(), 'server', 'exports');
    if (fs.existsSync(exportsDir)) {
      const files = fs.readdirSync(exportsDir);
      files.forEach(file => {
        if (file.includes(userId)) {
          fs.unlinkSync(path.join(exportsDir, file));
        }
      });
    }
  }

  /**
   * Save or update cookie consent
   */
  async saveCookieConsent(
    userId: string | null,
    consent: {
      necessary: boolean;
      analytics: boolean;
      marketing: boolean;
      preferences: boolean;
    },
    ipAddress?: string,
    userAgent?: string
  ): Promise<any> {
    const data = {
      ...consent,
      ipAddress,
      userAgent,
      consentVersion: '1.0',
    };

    if (userId) {
      // User is logged in - save to their account
      const existing = await prisma.cookieConsent.findUnique({
        where: { userId },
      });

      if (existing) {
        return await prisma.cookieConsent.update({
          where: { userId },
          data,
        });
      } else {
        return await prisma.cookieConsent.create({
          data: {
            userId,
            ...data,
          },
        });
      }
    } else {
      // Anonymous user - save without userId (stored in session/localStorage)
      return await prisma.cookieConsent.create({
        data,
      });
    }
  }

  /**
   * Get cookie consent for user
   */
  async getCookieConsent(userId: string): Promise<any> {
    return await prisma.cookieConsent.findUnique({
      where: { userId },
    });
  }

  /**
   * Get user's GDPR requests
   */
  async getUserGDPRRequests(userId: string): Promise<any> {
    const [exportRequests, deletionRequests] = await Promise.all([
      prisma.dataExportRequest.findMany({
        where: { userId },
        orderBy: { requestedAt: 'desc' },
      }),
      prisma.dataDeletionRequest.findMany({
        where: { userId },
        orderBy: { requestedAt: 'desc' },
      }),
    ]);

    return {
      exports: exportRequests,
      deletions: deletionRequests,
    };
  }
}

export const gdprService = new GDPRService();
