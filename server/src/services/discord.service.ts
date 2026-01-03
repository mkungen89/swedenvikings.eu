// ============================================
// Discord Service - Webhook Notifications
// ============================================

import axios from 'axios';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
  };
  timestamp?: string;
}

interface DiscordWebhookPayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

export class DiscordService {
  /**
   * Send Discord webhook notification
   */
  private async sendWebhook(payload: DiscordWebhookPayload): Promise<void> {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings) {
      throw new Error('Site settings not found');
    }

    if (!settings.enableDiscordNotifications) {
      throw new Error('Discord notifications are disabled');
    }

    if (!settings.discordWebhookUrl) {
      throw new Error('Discord webhook URL not configured');
    }

    try {
      await axios.post(settings.discordWebhookUrl, payload);
      logger.info('Discord notification sent successfully');
    } catch (error) {
      logger.error('Failed to send Discord notification:', error);
      throw error;
    }
  }

  /**
   * Send test Discord notification
   */
  async sendTestNotification(): Promise<void> {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings) {
      throw new Error('Site settings not found');
    }

    const embed: DiscordEmbed = {
      title: '✅ Discord Webhook Test',
      description: 'Your Discord webhook is configured correctly and working!',
      color: 0x10b981, // Green
      fields: [
        {
          name: 'Server',
          value: settings.siteName,
          inline: true,
        },
        {
          name: 'Status',
          value: '🟢 Online',
          inline: true,
        },
        {
          name: 'Configuration',
          value: `Webhook URL: ${settings.discordWebhookUrl?.substring(0, 50)}...`,
          inline: false,
        },
      ],
      footer: {
        text: `${settings.siteName} CMS`,
      },
      timestamp: new Date().toISOString(),
    };

    await this.sendWebhook({
      username: settings.siteName,
      embeds: [embed],
    });
  }

  /**
   * Send new user notification to Discord
   */
  async sendNewUserNotification(user: {
    id: string;
    username: string;
    steamId: string;
    avatar?: string;
  }): Promise<void> {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings || !settings.notifyOnNewUser) {
      return;
    }

    const embed: DiscordEmbed = {
      title: '🆕 Ny Användare Registrerad',
      description: `**${user.username}** har just gått med i communityn!`,
      color: 0x6366f1, // Indigo
      fields: [
        {
          name: 'Användarnamn',
          value: user.username,
          inline: true,
        },
        {
          name: 'Steam ID',
          value: `\`${user.steamId}\``,
          inline: true,
        },
        {
          name: 'User ID',
          value: `\`${user.id}\``,
          inline: false,
        },
      ],
      footer: {
        text: settings.siteName,
      },
      timestamp: new Date().toISOString(),
    };

    await this.sendWebhook({
      username: settings.siteName,
      embeds: [embed],
    });
  }

  /**
   * Send new ticket notification to Discord
   */
  async sendNewTicketNotification(ticket: {
    id: string;
    title: string;
    priority: string;
    category: string;
    user: { username: string };
  }): Promise<void> {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings || !settings.notifyOnNewTicket) {
      return;
    }

    const priorityEmojis: { [key: string]: string } = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      urgent: '🔴',
    };

    const priorityColors: { [key: string]: number } = {
      low: 0x10b981,
      medium: 0xf59e0b,
      high: 0xef4444,
      urgent: 0xdc2626,
    };

    const embed: DiscordEmbed = {
      title: '🎫 Nytt Support-ärende',
      description: ticket.title,
      color: priorityColors[ticket.priority] || 0x6366f1,
      fields: [
        {
          name: 'Från',
          value: ticket.user.username,
          inline: true,
        },
        {
          name: 'Prioritet',
          value: `${priorityEmojis[ticket.priority] || '⚪'} ${ticket.priority.toUpperCase()}`,
          inline: true,
        },
        {
          name: 'Kategori',
          value: ticket.category,
          inline: true,
        },
        {
          name: 'Ticket ID',
          value: `#${ticket.id}`,
          inline: true,
        },
      ],
      footer: {
        text: settings.siteName,
      },
      timestamp: new Date().toISOString(),
    };

    await this.sendWebhook({
      username: settings.siteName,
      embeds: [embed],
    });
  }

  /**
   * Send new news notification to Discord
   */
  async sendNewNewsNotification(news: {
    id: string;
    title: string;
    excerpt?: string;
    author: { username: string };
  }): Promise<void> {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings || !settings.notifyOnNewNews) {
      return;
    }

    const embed: DiscordEmbed = {
      title: '📰 Ny Artikel Publicerad',
      description: `**${news.title}**\n\n${news.excerpt || 'Läs mer på webbplatsen!'}`,
      color: 0x6366f1,
      fields: [
        {
          name: 'Författare',
          value: news.author.username,
          inline: true,
        },
      ],
      footer: {
        text: settings.siteName,
      },
      timestamp: new Date().toISOString(),
    };

    await this.sendWebhook({
      username: settings.siteName,
      embeds: [embed],
    });
  }

  /**
   * Send new event notification to Discord
   */
  async sendNewEventNotification(event: {
    id: string;
    title: string;
    description?: string;
    startDate: Date;
    maxParticipants?: number;
  }): Promise<void> {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings || !settings.notifyOnNewEvent) {
      return;
    }

    const embed: DiscordEmbed = {
      title: '📅 Nytt Event!',
      description: `**${event.title}**\n\n${event.description || ''}`,
      color: 0x06b6d4, // Cyan
      fields: [
        {
          name: 'Starttid',
          value: event.startDate.toLocaleString('sv-SE'),
          inline: true,
        },
      ],
      footer: {
        text: settings.siteName,
      },
      timestamp: new Date().toISOString(),
    };

    if (event.maxParticipants) {
      embed.fields?.push({
        name: 'Max deltagare',
        value: event.maxParticipants.toString(),
        inline: true,
      });
    }

    await this.sendWebhook({
      username: settings.siteName,
      embeds: [embed],
    });
  }

  /**
   * Send server down notification to Discord
   */
  async sendServerDownNotification(serverName?: string): Promise<void> {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings || !settings.notifyOnServerDown) {
      return;
    }

    const embed: DiscordEmbed = {
      title: '🚨 Server Nere - Alert!',
      description: `**${serverName || 'Arma Reforger Server'}** svarar inte!`,
      color: 0xdc2626, // Red
      fields: [
        {
          name: 'Status',
          value: '🔴 Offline',
          inline: true,
        },
        {
          name: 'Upptäckt',
          value: new Date().toLocaleString('sv-SE'),
          inline: true,
        },
        {
          name: 'Åtgärd krävs',
          value: '⚠️ Kontrollera servern omedelbart!',
          inline: false,
        },
      ],
      footer: {
        text: `${settings.siteName} - Automated Alert`,
      },
      timestamp: new Date().toISOString(),
    };

    await this.sendWebhook({
      username: `${settings.siteName} Alerts`,
      embeds: [embed],
    });
  }

  /**
   * Send server online notification to Discord
   */
  async sendServerOnlineNotification(serverName?: string): Promise<void> {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings) {
      return;
    }

    const embed: DiscordEmbed = {
      title: '✅ Server Online',
      description: `**${serverName || 'Arma Reforger Server'}** är nu online igen!`,
      color: 0x10b981, // Green
      fields: [
        {
          name: 'Status',
          value: '🟢 Online',
          inline: true,
        },
        {
          name: 'Tid',
          value: new Date().toLocaleString('sv-SE'),
          inline: true,
        },
      ],
      footer: {
        text: settings.siteName,
      },
      timestamp: new Date().toISOString(),
    };

    await this.sendWebhook({
      username: settings.siteName,
      embeds: [embed],
    });
  }

  /**
   * Send custom notification to Discord
   */
  async sendCustomNotification(
    title: string,
    description: string,
    color: number = 0x6366f1,
    fields?: Array<{ name: string; value: string; inline?: boolean }>
  ): Promise<void> {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings) {
      throw new Error('Site settings not found');
    }

    const embed: DiscordEmbed = {
      title,
      description,
      color,
      fields,
      footer: {
        text: settings.siteName,
      },
      timestamp: new Date().toISOString(),
    };

    await this.sendWebhook({
      username: settings.siteName,
      embeds: [embed],
    });
  }
}

// Export singleton instance
export const discordService = new DiscordService();
