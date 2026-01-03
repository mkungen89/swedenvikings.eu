// ============================================
// Notification Service
// ============================================

import { prisma } from '../utils/prisma';
import { emitNotification } from '../socket';
import { logger } from '../utils/logger';

export interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  isRead?: boolean;
  type?: string;
}

class NotificationService {
  /**
   * Create a new notification and emit it via socket
   */
  async create(data: CreateNotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link,
          metadata: data.metadata,
        },
      });

      // Emit via socket for real-time updates
      emitNotification(data.userId, notification);

      logger.debug(`Notification created for user ${data.userId}: ${data.type}`);
      return notification;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users
   */
  async createMany(userIds: string[], data: Omit<CreateNotificationData, 'userId'>) {
    const notifications = await Promise.all(
      userIds.map((userId) => this.create({ ...data, userId }))
    );
    return notifications;
  }

  /**
   * Get notifications for a user with pagination
   */
  async getByUserId(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters: NotificationFilters = {}
  ) {
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }
    if (filters.type) {
      where.type = filters.type;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total, page, limit };
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return result;
  }

  /**
   * Delete a notification
   */
  async delete(notificationId: string, userId: string) {
    const notification = await prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
    return notification;
  }

  /**
   * Delete old notifications (cleanup job)
   */
  async deleteOld(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true,
      },
    });

    logger.info(`Deleted ${result.count} old notifications`);
    return result;
  }

  // ============================================
  // Convenience methods for specific notification types
  // ============================================

  async notifyForumReply(userId: string, threadTitle: string, threadId: string, authorName: string) {
    return this.create({
      userId,
      type: 'forum_reply',
      title: 'Nytt svar i tråd',
      message: `${authorName} svarade i "${threadTitle}"`,
      link: `/forum/thread/${threadId}`,
    });
  }

  async notifyCommentReply(userId: string, contentTitle: string, contentType: 'news' | 'event', contentSlug: string, authorName: string) {
    return this.create({
      userId,
      type: 'comment_reply',
      title: 'Nytt svar på din kommentar',
      message: `${authorName} svarade på din kommentar i "${contentTitle}"`,
      link: `/${contentType}/${contentSlug}`,
    });
  }

  async notifyNewMessage(userId: string, senderName: string, conversationId: string) {
    return this.create({
      userId,
      type: 'new_message',
      title: 'Nytt meddelande',
      message: `${senderName} skickade ett meddelande till dig`,
      link: `/messages/${conversationId}`,
    });
  }

  async notifyFriendRequest(userId: string, senderName: string, senderId: string) {
    return this.create({
      userId,
      type: 'friend_request',
      title: 'Vänförfrågan',
      message: `${senderName} vill bli din vän`,
      link: `/profile/${senderId}`,
    });
  }

  async notifyFriendAccepted(userId: string, friendName: string, friendId: string) {
    return this.create({
      userId,
      type: 'friend_accepted',
      title: 'Vänförfrågan accepterad',
      message: `${friendName} accepterade din vänförfrågan`,
      link: `/profile/${friendId}`,
    });
  }

  async notifyEventReminder(userId: string, eventTitle: string, eventSlug: string) {
    return this.create({
      userId,
      type: 'event_reminder',
      title: 'Påminnelse om event',
      message: `"${eventTitle}" börjar snart`,
      link: `/events/${eventSlug}`,
    });
  }

  async notifyNewNews(userId: string, newsTitle: string, newsSlug: string) {
    return this.create({
      userId,
      type: 'news_published',
      title: 'Ny nyhet',
      message: `"${newsTitle}" har publicerats`,
      link: `/news/${newsSlug}`,
    });
  }

  async notifySystem(userId: string, title: string, message: string, link?: string) {
    return this.create({
      userId,
      type: 'system',
      title,
      message,
      link,
    });
  }
}

export const notificationService = new NotificationService();
