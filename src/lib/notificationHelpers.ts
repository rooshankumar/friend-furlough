import { supabase } from '@/integrations/supabase/client';

/**
 * Manually create a notification (for testing before triggers are active)
 */
export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  relatedId?: string;
  relatedUserId?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        related_id: params.relatedId,
        related_user_id: params.relatedUserId,
        read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { data: null, error };
  }
}

/**
 * Create a test notification (for development)
 */
export async function createTestNotification(userId: string) {
  const types = [
    { type: 'message', title: 'New message from Test User', message: 'Hey! How are you?', link: '/chat' },
    { type: 'friend-request', title: 'Friend request from John', message: 'John wants to connect', link: '/friends' },
    { type: 'post-like', title: 'Someone liked your post', message: 'Your post got a new like!', link: '/community' },
    { type: 'post-comment', title: 'New comment on your post', message: 'Great post!', link: '/community' },
  ];

  const randomType = types[Math.floor(Math.random() * types.length)];
  
  return createNotification({
    userId,
    ...randomType,
  });
}

/**
 * Test notification sound (for development)
 * Usage in browser console: window.testNotificationSound()
 */
export function testNotificationSound() {
  console.log('🔔 Playing notification sound...');
  playNotificationSound();
  console.log('✅ Sound played! If you didn\'t hear it, check your browser sound settings.');
}

// Make test function available in browser console for easy testing
if (typeof window !== 'undefined') {
  (window as any).testNotificationSound = testNotificationSound;
}

/**
 * Notification sound player - Pleasant two-tone notification sound
 */
export function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a pleasant two-tone notification sound
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      // Smooth fade in and out
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + duration - 0.05);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = audioContext.currentTime;
    
    // First tone (higher pitch)
    playTone(880, now, 0.15);
    
    // Second tone (slightly lower pitch) - creates a pleasant "ding-dong" effect
    playTone(660, now + 0.1, 0.2);
    
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
}

/**
 * Show browser notification (requires permission)
 */
export async function showBrowserNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, options);
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(title, options);
    }
  }
}

/**
 * Group notifications by type and related_id (or related_user_id for messages)
 */
export function groupNotifications(notifications: any[]) {
  const grouped: { [key: string]: any[] } = {};

  notifications.forEach(notification => {
    // For messages, group by sender (related_user_id)
    // For other types, group by related_id (e.g., post_id)
    let key: string;
    if (notification.type === 'message') {
      key = `${notification.type}_${notification.related_user_id || notification.related_id || 'none'}`;
    } else {
      key = `${notification.type}_${notification.related_id || 'none'}`;
    }
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(notification);
  });

  // Convert to array and create summary notifications
  return Object.entries(grouped).map(([key, items]) => {
    if (items.length === 1) {
      return items[0];
    }

    // Multiple notifications of same type
    const first = items[0];
    const count = items.length;
    
    return {
      ...first,
      id: key,
      grouped: true,
      count,
      items,
      title: getGroupedTitle(first.type, count, items),
      message: getGroupedMessage(first.type, count, items),
    };
  });
}

function getGroupedTitle(type: string, count: number, items: any[]): string {
  // Extract user names from notification titles
  const getUserName = (item: any) => {
    // Try to extract name from title (e.g., "New message from John" -> "John")
    const match = item.title.match(/from (.+?)(?:\s|$)/i);
    return match ? match[1] : item.title.split(' ')[0];
  };
  
  const names = items.map(getUserName).filter(Boolean);
  const uniqueNames = [...new Set(names)];
  
  switch (type) {
    case 'message':
      if (uniqueNames.length === 1) {
        // Single user: "You have 3 new messages from John"
        const userName = uniqueNames[0];
        if (count === 1) {
          return `New message from ${userName}`;
        }
        return `You have ${count} new messages from ${userName}`;
      }
      // Multiple users: "You have 5 new messages from 3 people"
      return `You have ${count} new messages from ${uniqueNames.length} people`;
    
    case 'post-like':
      if (uniqueNames.length === 1) {
        const userName = uniqueNames[0];
        if (count === 1) {
          return `${userName} liked your post`;
        }
        return `${userName} and ${count - 1} others liked your post`;
      }
      return `${uniqueNames.length} people liked your post`;
    
    case 'post-comment':
      if (uniqueNames.length === 1) {
        const userName = uniqueNames[0];
        if (count === 1) {
          return `${userName} commented on your post`;
        }
        return `${userName} and ${count - 1} others commented on your post`;
      }
      return `${count} new comments on your post`;
    
    case 'friend-request':
      if (uniqueNames.length === 1) {
        return `Friend request from ${uniqueNames[0]}`;
      }
      return `${uniqueNames.length} friend requests`;
    
    default:
      return items[0].title;
  }
}

function getGroupedMessage(type: string, count: number, items: any[]): string {
  // Extract user names from notification titles
  const getUserName = (item: any) => {
    const match = item.title.match(/from (.+?)(?:\s|$)/i);
    return match ? match[1] : item.title.split(' ')[0];
  };
  
  const names = items.map(getUserName).filter(Boolean);
  const uniqueNames = [...new Set(names)];
  
  if (type === 'message') {
    if (uniqueNames.length === 1) {
      // Show preview of latest message if available
      return items[0].message || 'Tap to view conversation';
    }
    // Multiple users
    if (uniqueNames.length === 2) {
      return `${uniqueNames[0]} and ${uniqueNames[1]}`;
    }
    return `${uniqueNames[0]}, ${uniqueNames[1]} and ${uniqueNames.length - 2} others`;
  }
  
  // For other types
  if (uniqueNames.length === 1) {
    return items[0].message || '';
  }
  
  if (uniqueNames.length === 2) {
    return `${uniqueNames[0]} and ${uniqueNames[1]}`;
  }
  
  return `${uniqueNames[0]}, ${uniqueNames[1]} and ${uniqueNames.length - 2} others`;
}
