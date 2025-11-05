import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Centralized subscription manager for real-time channels
 * Prevents duplicate subscriptions and manages cleanup
 */
class SubscriptionManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Subscribe to a channel with automatic reconnection
   */
  subscribe(
    channelName: string,
    config: {
      event: string;
      schema: string;
      table: string;
      filter?: string;
    },
    callback: (payload: any) => void
  ): () => void {
    // Unsubscribe existing channel if exists
    this.unsubscribe(channelName);

    console.log('📡 Subscribing to:', channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        config,
        callback
      )
      .subscribe((status) => {
        console.log(`📡 Channel ${channelName} status:`, status);

        if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Channel ${channelName} error, will retry...`);
          this.scheduleReconnect(channelName, config, callback);
        }
      });

    this.channels.set(channelName, channel);

    // Return cleanup function
    return () => this.unsubscribe(channelName);
  }

  /**
   * Subscribe to presence (typing indicators, online status)
   */
  subscribePresence(
    channelName: string,
    onJoin?: (key: string, current: any, prev: any) => void,
    onLeave?: (key: string, current: any, prev: any) => void
  ): () => void {
    this.unsubscribe(channelName);

    console.log('👥 Subscribing to presence:', channelName);

    const channel = supabase.channel(channelName);

    if (onJoin) {
      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        onJoin(key, newPresences, null);
      });
    }

    if (onLeave) {
      channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        onLeave(key, null, leftPresences);
      });
    }

    channel.subscribe();
    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      console.log('🔌 Unsubscribing from:', channelName);
      channel.unsubscribe();
      this.channels.delete(channelName);
    }

    // Clear reconnect timer
    const timer = this.reconnectTimers.get(channelName);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(channelName);
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(
    channelName: string,
    config: any,
    callback: (payload: any) => void
  ) {
    // Clear existing timer
    const existingTimer = this.reconnectTimers.get(channelName);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Exponential backoff: 2s, 4s, 8s, max 30s
    const retryDelay = Math.min(2000 * Math.pow(2, this.reconnectTimers.size), 30000);

    const timer = setTimeout(() => {
      console.log(`🔄 Reconnecting to ${channelName}...`);
      this.subscribe(channelName, config, callback);
    }, retryDelay);

    this.reconnectTimers.set(channelName, timer);
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll() {
    console.log('🔌 Unsubscribing from all channels');
    
    this.channels.forEach((channel, name) => {
      channel.unsubscribe();
    });
    
    this.channels.clear();

    this.reconnectTimers.forEach(timer => {
      clearTimeout(timer);
    });
    
    this.reconnectTimers.clear();
  }

  /**
   * Get active channel count
   */
  getActiveCount(): number {
    return this.channels.size;
  }

  /**
   * Check if channel is active
   */
  isActive(channelName: string): boolean {
    return this.channels.has(channelName);
  }
}

// Export singleton instance
export const subscriptionManager = new SubscriptionManager();
