import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { playNotificationSound, showBrowserNotification } from '@/lib/notificationHelpers';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  related_id?: string;
  related_user_id?: string;
  read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  
  // Actions
  loadNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  subscribeToNotifications: (userId: string) => void;
  unsubscribe: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  
  loadNotifications: async (userId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error loading notifications:', error);
        throw error;
      }
      
      const unreadCount = data?.filter(n => !n.read).length || 0;
      
      set({ 
        notifications: data || [], 
        unreadCount,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error loading notifications:', error);
      set({ isLoading: false });
    }
  },
  
  markAsRead: async (notificationId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },
  
  markAllAsRead: async () => {
    try {
      const { error } = await (supabase as any).rpc('mark_all_notifications_read');
      
      if (error) throw error;
      
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  },
  
  deleteNotification: async (notificationId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw error;
      
      set(state => {
        const notification = state.notifications.find(n => n.id === notificationId);
        const wasUnread = notification && !notification.read;
        
        return {
          notifications: state.notifications.filter(n => n.id !== notificationId),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
        };
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  },
  
  subscribeToNotifications: (userId: string) => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New notification:', payload);
          const newNotification = payload.new as Notification;
          
          set(state => ({
            notifications: [newNotification, ...state.notifications],
            unreadCount: state.unreadCount + 1
          }));
          
          // Get notification settings from localStorage
          const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{"soundEnabled": true, "pushEnabled": true}');
          
          // Play sound if enabled
          if (settings.soundEnabled) {
            playNotificationSound();
          }
          
          // Show browser notification if enabled
          if (settings.pushEnabled) {
            showBrowserNotification(newNotification.title, {
              body: newNotification.message,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: newNotification.id,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          
          set(state => ({
            notifications: state.notifications.map(n =>
              n.id === updatedNotification.id ? updatedNotification : n
            ),
            unreadCount: state.notifications.filter(n => !n.read).length
          }));
        }
      )
      .subscribe();
  },
  
  unsubscribe: () => {
    supabase.channel('notifications').unsubscribe();
  }
}));
