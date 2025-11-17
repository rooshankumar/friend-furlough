/**
 * Notification Email Service
 * Handles sending email notifications for app events
 * Integrates with Brevo for transactional emails
 */

import { sendNewMessageNotification } from './emailService';
import { supabase } from '@/integrations/supabase/client';

interface NotificationEmailPayload {
  recipientId: string;
  senderName: string;
  messagePreview: string;
  conversationId: string;
}

/**
 * Send new message notification email
 * Called when a user receives a new message
 */
export async function notifyNewMessage(payload: NotificationEmailPayload): Promise<boolean> {
  try {
    // Get recipient profile
    const { data: recipient } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', payload.recipientId)
      .single();

    if (!recipient) {
      console.warn('Recipient profile not found for notification');
      return false;
    }

    // Get recipient email from auth
    const { data: { user } } = await supabase.auth.admin.getUserById(payload.recipientId);
    const recipientEmail = user?.email;

    if (!recipientEmail) {
      console.warn('Recipient email not found for notification');
      return false;
    }

    // Build chat link
    const chatLink = `${import.meta.env.VITE_APP_OPEN_CHAT_URL}/${payload.conversationId}`;

    // Send email
    const result = await sendNewMessageNotification(
      recipientEmail,
      recipient.name || 'User',
      payload.senderName,
      payload.messagePreview,
      chatLink
    );

    if (result.success) {
      console.log(`✅ Message notification sent to ${recipientEmail}`);
      return true;
    } else {
      console.warn(`⚠️ Failed to send message notification: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error('Error sending message notification:', error);
    return false;
  }
}

/**
 * Send notification email for friend request
 * Can be extended with a Brevo template
 */
export async function notifyFriendRequest(
  recipientId: string,
  senderName: string
): Promise<boolean> {
  try {
    const { data: recipient } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', recipientId)
      .single();

    if (!recipient) {
      console.warn('Recipient profile not found for friend request notification');
      return false;
    }

    console.log(`📧 Friend request notification queued for ${recipientId}`);
    // TODO: Implement when template is created
    return true;
  } catch (error) {
    console.error('Error sending friend request notification:', error);
    return false;
  }
}

/**
 * Send notification email for new follower
 * Can be extended with a Brevo template
 */
export async function notifyNewFollower(
  recipientId: string,
  followerName: string
): Promise<boolean> {
  try {
    const { data: recipient } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', recipientId)
      .single();

    if (!recipient) {
      console.warn('Recipient profile not found for follower notification');
      return false;
    }

    console.log(`📧 New follower notification queued for ${recipientId}`);
    // TODO: Implement when template is created
    return true;
  } catch (error) {
    console.error('Error sending follower notification:', error);
    return false;
  }
}

/**
 * Send notification email for post interaction (like/comment)
 * Can be extended with a Brevo template
 */
export async function notifyPostInteraction(
  recipientId: string,
  interactionType: 'like' | 'comment',
  actorName: string,
  postPreview: string
): Promise<boolean> {
  try {
    const { data: recipient } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', recipientId)
      .single();

    if (!recipient) {
      console.warn('Recipient profile not found for post interaction notification');
      return false;
    }

    console.log(`📧 Post ${interactionType} notification queued for ${recipientId}`);
    // TODO: Implement when template is created
    return true;
  } catch (error) {
    console.error('Error sending post interaction notification:', error);
    return false;
  }
}
