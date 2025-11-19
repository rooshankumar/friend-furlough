/**
 * Brevo Email Service Client
 * Handles transactional emails: welcome, password reset, alerts, notifications
 */

interface BrevoEmailParams {
  to: string | string[];
  templateId: number;
  params?: Record<string, any>;
  subject?: string;
  htmlContent?: string;
  replyTo?: string;
  tags?: string[];
}

interface BrevoResponse {
  messageId: string;
  [key: string]: any;
}

class BrevoClient {
  private baseUrl = 'https://api.brevo.com/v3';

  private getApiKey(): string {
    return import.meta.env.VITE_BREVO_API_KEY;
  }

  private getSenderEmail(): string {
    return import.meta.env.VITE_BREVO_SENDER_EMAIL;
  }

  private getSenderName(): string {
    return import.meta.env.VITE_BREVO_SENDER_NAME;
  }

  constructor() {
    // Validate on first use, not on construction
  }

  /**
   * Send email using Brevo template
   */
  async sendEmail(params: BrevoEmailParams): Promise<BrevoResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Brevo API key not configured');
    }

    const recipients = Array.isArray(params.to)
      ? params.to.map(email => ({ email }))
      : [{ email: params.to }];

    const payload = {
      to: recipients,
      templateId: params.templateId,
      params: params.params || {},
      tags: params.tags || [],
      replyTo: params.replyTo ? { email: params.replyTo } : undefined,
    };

    // Remove undefined fields
    Object.keys(payload).forEach(key => payload[key as keyof typeof payload] === undefined && delete payload[key as keyof typeof payload]);

    try {
      const response = await fetch(`${this.baseUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Brevo API error: ${error.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Brevo email send error:', error);
      throw error;
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(email: string, name: string): Promise<BrevoResponse> {
    return this.sendEmail({
      to: email,
      templateId: parseInt(import.meta.env.VITE_BREVO_TEMPLATE_WELCOME || '1'),
      params: {
        name: name || 'User',
        appUrl: import.meta.env.VITE_APP_BASE_URL,
      },
      tags: ['welcome', 'onboarding'],
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetLink: string
  ): Promise<BrevoResponse> {
    console.log('Sending password reset email with params:', { email, name, resetLink });
    
    return this.sendEmail({
      to: email,
      templateId: parseInt(import.meta.env.VITE_BREVO_TEMPLATE_FORGOT_PASSWORD || '2'),
      params: {
        name: name || 'User',
        resetLink: resetLink,
        reset_link: resetLink,
        link: resetLink,
        expiryTime: '24 hours',
        expiry_time: '24 hours',
        FIRSTNAME: name || 'User',
        RESET_LINK: resetLink,
        EXPIRY_TIME: '24 hours',
      },
      tags: ['password-reset', 'security'],
    });
  }

  /**
   * Send email verification link
   */
  async sendVerificationEmail(
    email: string,
    name: string,
    verifyLink: string
  ): Promise<BrevoResponse> {
    return this.sendEmail({
      to: email,
      templateId: parseInt(import.meta.env.VITE_BREVO_TEMPLATE_VERIFY_ACCOUNT || '3'),
      params: {
        name: name || 'User',
        verifyLink,
        expiryTime: '24 hours',
      },
      tags: ['verification', 'onboarding'],
    });
  }

  /**
   * Send new message notification
   */
  async sendNewMessageNotification(
    email: string,
    recipientName: string,
    senderName: string,
    messagePreview: string,
    chatLink: string
  ): Promise<BrevoResponse> {
    return this.sendEmail({
      to: email,
      templateId: parseInt(import.meta.env.VITE_BREVO_TEMPLATE_NEW_MESSAGE || '4'),
      params: {
        recipientName,
        senderName,
        messagePreview: messagePreview.substring(0, 100),
        chatLink,
      },
      tags: ['notification', 'message'],
    });
  }

  /**
   * Send custom email with template
   */
  async sendCustomEmail(
    email: string,
    templateId: number,
    params: Record<string, any>,
    tags?: string[]
  ): Promise<BrevoResponse> {
    return this.sendEmail({
      to: email,
      templateId,
      params,
      tags,
    });
  }

  /**
   * Send bulk emails (multiple recipients)
   */
  async sendBulkEmail(
    emails: string[],
    templateId: number,
    params: Record<string, any>,
    tags?: string[]
  ): Promise<BrevoResponse> {
    return this.sendEmail({
      to: emails,
      templateId,
      params,
      tags,
    });
  }
}

// Export singleton instance
export const brevoClient = new BrevoClient();

// Export type for use in other modules
export type { BrevoEmailParams, BrevoResponse };
