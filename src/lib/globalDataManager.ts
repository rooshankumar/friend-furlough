import { supabase } from '@/integrations/supabase/client';
import { connectionManager } from '@/lib/connectionManager';

/**
 * Global data manager that handles automatic data refresh across all pages
 * Eliminates the need for hard refreshes by keeping data in sync
 */
class GlobalDataManager {
  private refreshCallbacks: Map<string, () => Promise<void>> = new Map();
  private lastRefreshTime = Date.now();
  private isRefreshing = false;
  private refreshInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupEventListeners();
    this.startPeriodicRefresh();
  }

  private setupEventListeners() {
    // Handle connection restoration
    connectionManager.onConnectionChange(async (isOnline) => {
      if (isOnline && !this.isRefreshing) {
        console.log('🌐 Connection restored: Refreshing all data...');
        await this.refreshAllData('connection_restored');
      }
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handlePageVisible();
      }
    });

    // Handle focus events (tab switching)
    window.addEventListener('focus', () => {
      this.handlePageVisible();
    });

    // Handle Supabase reconnection
    window.addEventListener('supabase-reconnected', () => {
      console.log('🔄 Supabase reconnected: Refreshing data...');
      setTimeout(() => this.refreshAllData('supabase_reconnected'), 1000);
    });

    // Handle storage events (data changes from other tabs)
    window.addEventListener('storage', (event) => {
      if (event.key === 'data_updated') {
        this.refreshAllData('cross_tab_sync');
      }
    });
  }

  private handlePageVisible() {
    const timeSinceLastRefresh = Date.now() - this.lastRefreshTime;
    
    // If page was hidden for more than 5 minutes, refresh data (increased threshold)
    if (timeSinceLastRefresh > 5 * 60 * 1000) {
      console.log('👁️ Page visible after', Math.round(timeSinceLastRefresh / 1000), 'seconds');
      setTimeout(() => this.refreshAllData('page_visible'), 500);
    }
  }

  private startPeriodicRefresh() {
    // Disabled periodic refresh to reduce overhead
    // Rely on event-driven updates (visibility, connection, real-time) instead
    // this.refreshInterval = setInterval(() => {
    //   if (document.visibilityState === 'visible' && connectionManager.connected) {
    //     console.log('⏰ Periodic data refresh');
    //     this.refreshAllData('periodic');
    //   }
    // }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Register a callback to be called when data needs to be refreshed
   */
  public registerRefreshCallback(key: string, callback: () => Promise<void>) {
    this.refreshCallbacks.set(key, callback);
    console.log(`📝 Registered refresh callback: ${key}`);
  }

  /**
   * Unregister a refresh callback
   */
  public unregisterRefreshCallback(key: string) {
    this.refreshCallbacks.delete(key);
    console.log(`🗑️ Unregistered refresh callback: ${key}`);
  }

  /**
   * Refresh all registered data
   */
  public async refreshAllData(reason: string = 'manual') {
    if (this.isRefreshing) {
      console.log('⏳ Refresh already in progress, skipping...');
      return;
    }

    this.isRefreshing = true;
    this.lastRefreshTime = Date.now();

    try {
      console.log(`🔄 Refreshing all data (reason: ${reason})`);
      
      const refreshPromises = Array.from(this.refreshCallbacks.entries()).map(
        async ([key, callback]) => {
          try {
            await callback();
            console.log(`✅ Refreshed: ${key}`);
          } catch (error) {
            console.error(`❌ Failed to refresh ${key}:`, error);
          }
        }
      );

      await Promise.allSettled(refreshPromises);
      
      // Notify other tabs that data was updated
      localStorage.setItem('data_updated', Date.now().toString());
      
      console.log('✅ All data refreshed successfully');
    } catch (error) {
      console.error('❌ Global data refresh failed:', error);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Force refresh specific data by key
   */
  public async refreshData(key: string) {
    const callback = this.refreshCallbacks.get(key);
    if (callback) {
      try {
        console.log(`🔄 Refreshing: ${key}`);
        await callback();
        console.log(`✅ Refreshed: ${key}`);
      } catch (error) {
        console.error(`❌ Failed to refresh ${key}:`, error);
      }
    } else {
      console.warn(`⚠️ No refresh callback found for: ${key}`);
    }
  }

  /**
   * Setup real-time subscriptions for automatic updates
   */
  public setupRealtimeSubscriptions(userId: string) {
    if (!userId) return;

    console.log('🔄 Setting up global real-time subscriptions...');

    // Subscribe to profile changes
    const profileChannel = supabase
      .channel(`global_profile_${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles'
        }, 
        (payload) => {
          console.log('👤 Profile data changed:', payload);
          this.refreshData('profile');
          this.refreshData('auth');
        }
      )
      .subscribe();

    // Subscribe to posts changes (for community/explore pages)
    const postsChannel = supabase
      .channel(`global_posts_${userId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          console.log('📝 Posts data changed:', payload);
          this.refreshData('posts');
          this.refreshData('community');
          this.refreshData('explore');
        }
      )
      .subscribe();

    // Subscribe to conversation changes
    const conversationsChannel = supabase
      .channel(`global_conversations_${userId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('💬 Conversation data changed:', payload);
          this.refreshData('conversations');
          this.refreshData('chat');
        }
      )
      .subscribe();

    // Subscribe to friend requests/connections
    const friendsChannel = supabase
      .channel(`global_friends_${userId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests'
        },
        (payload) => {
          console.log('👥 Friends data changed:', payload);
          this.refreshData('friends');
          this.refreshData('notifications');
        }
      )
      .subscribe();

    // Store channels for cleanup
    (window as any).globalRealtimeChannels = {
      profile: profileChannel,
      posts: postsChannel,
      conversations: conversationsChannel,
      friends: friendsChannel
    };

    console.log('✅ Global real-time subscriptions established');
  }

  /**
   * Cleanup all subscriptions
   */
  public cleanup() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    const channels = (window as any).globalRealtimeChannels;
    if (channels) {
      Object.values(channels).forEach((channel: any) => {
        if (channel && typeof channel.unsubscribe === 'function') {
          channel.unsubscribe();
        }
      });
      delete (window as any).globalRealtimeChannels;
    }

    this.refreshCallbacks.clear();
    console.log('🧹 Global data manager cleaned up');
  }
}

// Create global instance
export const globalDataManager = new GlobalDataManager();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  globalDataManager.cleanup();
});
