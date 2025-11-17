/**
 * Email Service Wrapper
 * Handles retry logic, error handling, and logging for Brevo emails
 */

import { brevoClient } from './brevoClient';
import { parseSupabaseError } from './errorHandler';

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Retry logic with exponential backoff
 */
async function retryEmailSend(
  fn: () => Promise<any>,
  maxRetries = 3,
  delayMs = 1000
): Promise<any> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const delay = delayMs * Math.pow(2, i);
        console.warn(`Email send failed, retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Send welcome email with retry logic
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<EmailResult> {
  try {
    const result = await retryEmailSend(() =>
      brevoClient.sendWelcomeEmail(email, name)
    );

    console.log(`Welcome email sent to ${email}`, result);
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error: any) {
    const errorMsg = parseSupabaseError(error);
    const errorString = typeof errorMsg === 'string' ? errorMsg : errorMsg.message || 'Unknown error';
    console.error(`Failed to send welcome email to ${email}:`, errorString);
    return {
      success: false,
      error: errorString,
    };
  }
}

/**
 * Send password reset email with retry logic
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetLink: string
): Promise<EmailResult> {
  try {
    const result = await retryEmailSend(() =>
      brevoClient.sendPasswordResetEmail(email, name, resetLink)
    );

    console.log(`Password reset email sent to ${email}`, result);
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error: any) {
    const errorMsg = parseSupabaseError(error);
    const errorString = typeof errorMsg === 'string' ? errorMsg : errorMsg.message || 'Unknown error';
    console.error(`Failed to send password reset email to ${email}:`, errorString);
    return {
      success: false,
      error: errorString,
    };
  }
}

/**
 * Send verification email with retry logic
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  verifyLink: string
): Promise<EmailResult> {
  try {
    const result = await retryEmailSend(() =>
      brevoClient.sendVerificationEmail(email, name, verifyLink)
    );

    console.log(`Verification email sent to ${email}`, result);
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error: any) {
    const errorMsg = parseSupabaseError(error);
    const errorString = typeof errorMsg === 'string' ? errorMsg : errorMsg.message || 'Unknown error';
    console.error(`Failed to send verification email to ${email}:`, errorString);
    return {
      success: false,
      error: errorString,
    };
  }
}

/**
 * Send new message notification with retry logic
 */
export async function sendNewMessageNotification(
  email: string,
  recipientName: string,
  senderName: string,
  messagePreview: string,
  chatLink: string
): Promise<EmailResult> {
  try {
    const result = await retryEmailSend(() =>
      brevoClient.sendNewMessageNotification(
        email,
        recipientName,
        senderName,
        messagePreview,
        chatLink
      )
    );

    console.log(`Message notification sent to ${email}`, result);
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error: any) {
    const errorMsg = parseSupabaseError(error);
    const errorString = typeof errorMsg === 'string' ? errorMsg : errorMsg.message || 'Unknown error';
    console.error(`Failed to send message notification to ${email}:`, errorString);
    return {
      success: false,
      error: errorString,
    };
  }
}

/**
 * Send custom email with retry logic
 */
export async function sendCustomEmail(
  email: string,
  templateId: number,
  params: Record<string, any>,
  tags?: string[]
): Promise<EmailResult> {
  try {
    const result = await retryEmailSend(() =>
      brevoClient.sendCustomEmail(email, templateId, params, tags)
    );

    console.log(`Custom email sent to ${email}`, result);
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error: any) {
    const errorMsg = parseSupabaseError(error);
    const errorString = typeof errorMsg === 'string' ? errorMsg : errorMsg.message || 'Unknown error';
    console.error(`Failed to send custom email to ${email}:`, errorString);
    return {
      success: false,
      error: errorString,
    };
  }
}

/**
 * Send bulk emails with retry logic
 */
export async function sendBulkEmail(
  emails: string[],
  templateId: number,
  params: Record<string, any>,
  tags?: string[]
): Promise<EmailResult> {
  try {
    const result = await retryEmailSend(() =>
      brevoClient.sendBulkEmail(emails, templateId, params, tags)
    );

    console.log(`Bulk email sent to ${emails.length} recipients`, result);
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error: any) {
    const errorMsg = parseSupabaseError(error);
    const errorString = typeof errorMsg === 'string' ? errorMsg : errorMsg.message || 'Unknown error';
    console.error(`Failed to send bulk email:`, errorString);
    return {
      success: false,
      error: errorString,
    };
  }
}
