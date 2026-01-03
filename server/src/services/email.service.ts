// ============================================
// Email Service - SMTP Email Sending
// ============================================

import nodemailer, { Transporter } from 'nodemailer';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { decrypt } from '../utils/encryption';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface EmailTemplateData {
  [key: string]: any;
}

export class EmailService {
  private transporter: Transporter | null = null;

  /**
   * Initialize email transporter with settings from database
   */
  private async initializeTransporter(): Promise<Transporter> {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings) {
      throw new Error('Site settings not found');
    }

    if (!settings.enableEmailNotifications) {
      throw new Error('Email notifications are disabled');
    }

    // Validate required SMTP settings
    if (!settings.smtpHost || !settings.smtpPort) {
      throw new Error('SMTP configuration is incomplete');
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpSecure, // true for 465, false for other ports
      auth: settings.smtpUser && settings.smtpPassword ? {
        user: settings.smtpUser,
        pass: decrypt(settings.smtpPassword), // Decrypt password before use
      } : undefined,
    });

    // Verify connection
    await transporter.verify();

    return transporter;
  }

  /**
   * Get transporter (creates new one if not exists)
   */
  private async getTransporter(): Promise<Transporter> {
    if (!this.transporter) {
      this.transporter = await this.initializeTransporter();
    }
    return this.transporter;
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const settings = await prisma.siteSettings.findUnique({
        where: { id: 'main' },
      });

      if (!settings) {
        throw new Error('Site settings not found');
      }

      const transporter = await this.getTransporter();

      const mailOptions = {
        from: `"${settings.emailFromName}" <${settings.emailFromAddress}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const info = await transporter.sendMail(mailOptions);

      logger.info(`Email sent: ${info.messageId}`);
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send test email to verify SMTP configuration
   */
  async sendTestEmail(recipientEmail?: string): Promise<void> {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings) {
      throw new Error('Site settings not found');
    }

    const testRecipient = recipientEmail || settings.adminEmailAddresses?.split('\n')[0];

    if (!testRecipient) {
      throw new Error('No recipient email address provided');
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .success {
              background: #10b981;
              color: white;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              text-align: center;
            }
            .info {
              background: white;
              padding: 15px;
              border-left: 4px solid #6366f1;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${settings.siteName}</h1>
            <p>SMTP Test Email</p>
          </div>
          <div class="content">
            <div class="success">
              <strong>✅ Success!</strong> Your SMTP configuration is working correctly.
            </div>

            <div class="info">
              <h3>SMTP Configuration:</h3>
              <p><strong>Host:</strong> ${settings.smtpHost}</p>
              <p><strong>Port:</strong> ${settings.smtpPort}</p>
              <p><strong>Secure:</strong> ${settings.smtpSecure ? 'Yes (TLS/SSL)' : 'No'}</p>
              <p><strong>From:</strong> ${settings.emailFromName} &lt;${settings.emailFromAddress}&gt;</p>
            </div>

            <p>This is a test email sent from your Sweden Vikings CMS to verify that email notifications are configured correctly.</p>

            <p>If you received this email, your SMTP settings are working perfectly!</p>
          </div>
          <div class="footer">
            <p>Sent from ${settings.siteName} CMS</p>
            <p>This is an automated test email.</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: testRecipient,
      subject: `[${settings.siteName}] SMTP Test Email`,
      html,
      text: 'This is a test email from Sweden Vikings CMS. If you received this, your SMTP configuration is working!',
    });
  }

  /**
   * Send welcome email to new user
   */
  async sendNewUserWelcome(user: { id: string; username: string; email?: string }): Promise<void> {
    if (!user.email) {
      logger.warn(`User ${user.id} has no email address, skipping welcome email`);
      return;
    }

    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings) {
      throw new Error('Site settings not found');
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              background: #6366f1;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Välkommen till ${settings.siteName}!</h1>
          </div>
          <div class="content">
            <p>Hej <strong>${user.username}</strong>!</p>

            <p>Välkommen till vår Arma Reforger gaming community! Vi är glada att ha dig här.</p>

            <p>Du kan nu:</p>
            <ul>
              <li>Ansluta till vår server och spela</li>
              <li>Delta i events och turneringar</li>
              <li>Chatta med andra spelare i vårt community</li>
              <li>Skapa eller gå med i clans</li>
            </ul>

            <p style="text-align: center;">
              <a href="${settings.allowedOrigins || 'http://localhost:5173'}" class="button">Besök Webbplatsen</a>
            </p>

            <p>Vi ses på slagfältet!</p>
          </div>
          <div class="footer">
            <p>Sent from ${settings.siteName}</p>
            ${settings.discordInvite ? `<p><a href="${settings.discordInvite}">Join our Discord</a></p>` : ''}
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: user.email,
      subject: `Välkommen till ${settings.siteName}!`,
      html,
      text: `Välkommen till ${settings.siteName}, ${user.username}! Vi är glada att ha dig här.`,
    });
  }

  /**
   * Send notification email to admins about new user
   */
  async sendNewUserNotification(user: { id: string; username: string; steamId: string }): Promise<void> {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings || !settings.notifyOnNewUser) {
      return;
    }

    const adminEmails = settings.adminEmailAddresses
      ?.split('\n')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (!adminEmails || adminEmails.length === 0) {
      logger.warn('No admin emails configured, skipping new user notification');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: #6366f1;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .info-box {
              background: white;
              padding: 15px;
              border-left: 4px solid #6366f1;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>🆕 Ny Användare Registrerad</h2>
          </div>
          <div class="content">
            <div class="info-box">
              <p><strong>Användarnamn:</strong> ${user.username}</p>
              <p><strong>Steam ID:</strong> ${user.steamId}</p>
              <p><strong>User ID:</strong> ${user.id}</p>
              <p><strong>Tid:</strong> ${new Date().toLocaleString('sv-SE')}</p>
            </div>

            <p>En ny användare har just registrerat sig på ${settings.siteName}.</p>
          </div>
          <div class="footer">
            <p>Automated notification from ${settings.siteName} CMS</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: adminEmails,
      subject: `[${settings.siteName}] Ny Användare: ${user.username}`,
      html,
      text: `Ny användare registrerad: ${user.username} (Steam ID: ${user.steamId})`,
    });
  }

  /**
   * Send notification about new support ticket
   */
  async sendNewTicketNotification(ticket: {
    id: string;
    title: string;
    priority: string;
    user: { username: string };
  }): Promise<void> {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings || !settings.notifyOnNewTicket) {
      return;
    }

    const adminEmails = settings.adminEmailAddresses
      ?.split('\n')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (!adminEmails || adminEmails.length === 0) {
      return;
    }

    const priorityColors: { [key: string]: string } = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      urgent: '#dc2626',
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: #6366f1;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .info-box {
              background: white;
              padding: 15px;
              border-left: 4px solid ${priorityColors[ticket.priority] || '#6366f1'};
              margin: 20px 0;
            }
            .priority {
              display: inline-block;
              background: ${priorityColors[ticket.priority] || '#6366f1'};
              color: white;
              padding: 5px 15px;
              border-radius: 15px;
              font-size: 12px;
              text-transform: uppercase;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>🎫 Nytt Support-ärende</h2>
          </div>
          <div class="content">
            <div class="info-box">
              <p><strong>Titel:</strong> ${ticket.title}</p>
              <p><strong>Från:</strong> ${ticket.user.username}</p>
              <p><strong>Prioritet:</strong> <span class="priority">${ticket.priority}</span></p>
              <p><strong>Ticket ID:</strong> #${ticket.id}</p>
              <p><strong>Tid:</strong> ${new Date().toLocaleString('sv-SE')}</p>
            </div>

            <p>Ett nytt support-ärende har skapats och väntar på svar.</p>
          </div>
          <div class="footer">
            <p>Automated notification from ${settings.siteName} CMS</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: adminEmails,
      subject: `[${settings.siteName}] Nytt Ticket: ${ticket.title}`,
      html,
      text: `Nytt support-ärende från ${ticket.user.username}: ${ticket.title} (Prioritet: ${ticket.priority})`,
    });
  }

  /**
   * Send notification about server being down
   */
  async sendServerDownNotification(): Promise<void> {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings || !settings.notifyOnServerDown) {
      return;
    }

    const adminEmails = settings.adminEmailAddresses
      ?.split('\n')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (!adminEmails || adminEmails.length === 0) {
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: #dc2626;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .alert {
              background: #fee2e2;
              border-left: 4px solid #dc2626;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>🚨 Server Nere - Alert!</h2>
          </div>
          <div class="content">
            <div class="alert">
              <strong>⚠️ VARNING:</strong> Arma Reforger servern svarar inte!
            </div>

            <p><strong>Upptäckt:</strong> ${new Date().toLocaleString('sv-SE')}</p>

            <p>Servern kunde inte nås vid den senaste health check-kontrollen.</p>

            <p><strong>Rekommenderade åtgärder:</strong></p>
            <ul>
              <li>Kontrollera serverprocessen</li>
              <li>Kolla serverloggar för fel</li>
              <li>Verifiera nätverksanslutning</li>
              <li>Starta om servern om nödvändigt</li>
            </ul>
          </div>
          <div class="footer">
            <p>Automated alert from ${settings.siteName} CMS</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: adminEmails,
      subject: `[${settings.siteName}] 🚨 SERVER NERE - Alert!`,
      html,
      text: `VARNING: Arma Reforger servern svarar inte! Upptäckt: ${new Date().toLocaleString('sv-SE')}`,
    });
  }

  /**
   * Reset transporter (useful when settings are updated)
   */
  resetTransporter(): void {
    this.transporter = null;
  }
}

// Export singleton instance
export const emailService = new EmailService();
