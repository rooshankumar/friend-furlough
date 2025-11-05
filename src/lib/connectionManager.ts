// Enhanced connection management for Supabase
import { supabase } from '@/integrations/supabase/client';

// Connection state management
class ConnectionManager {
  private isOnline = navigator.onLine;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10; // Increased from 5
  private reconnectDelay = 500; // Reduced from 1000ms
  private listeners: Array<(isOnline: boolean) => void> = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private aggressiveCheckInterval: NodeJS.Timeout | null = null;
  private lastSuccessfulCheck = Date.now();
  private isCheckingConnection = false;

  constructor() {
    this.setupEventListeners();
    this.startPeriodicCheck();
  }

  private setupEventListeners() {
    // Network status events
    window.addEventListener('online', () => {
      console.log('🌐 Connection restored');
      this.isOnline = true;
      this.reconnectAttempts = 0;
      this.notifyListeners(true);
      this.attemptReconnection();
    });

    window.addEventListener('offline', () => {
      console.log('🌐 Connection lost');
      this.isOnline = false;
      this.notifyListeners(false);
    });

    // Page visibility changes (app backgrounding/foregrounding)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ App became visible, checking connection...');
        // Immediate check when app becomes visible
        setTimeout(() => this.checkConnection(), 100);
        // Force reconnection for real-time subscriptions
        setTimeout(() => this.attemptReconnection(), 500);
      } else {
        console.log('👁️ App went to background');
      }
    });

    // Window focus events (tab switching)
    window.addEventListener('focus', () => {
      console.log('🎯 App gained focus, checking connection...');
      setTimeout(() => this.checkConnection(), 100);
      setTimeout(() => this.attemptReconnection(), 300);
    });

    window.addEventListener('blur', () => {
      console.log('🎯 App lost focus');
    });

    // Mobile-specific events
    if ('serviceWorker' in navigator) {
      // Handle service worker messages (for background sync)
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'BACKGROUND_SYNC') {
          console.log('📱 Background sync triggered');
          this.checkConnection();
        }
      });
    }

    // Handle page load/reload
    window.addEventListener('load', () => {
      console.log('🔄 Page loaded, initializing connection...');
      setTimeout(() => this.checkConnection(), 1000);
    });

    // Handle before page unload
    window.addEventListener('beforeunload', () => {
      console.log('👋 Page unloading, cleaning up...');
      this.destroy();
    });
  }

  private startPeriodicCheck() {
    // Regular check every 30 seconds (optimized from 15s)
    this.checkInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.checkConnection();
      }
    }, 30000);
    
    // Aggressive check every 60 seconds when connection is unstable (optimized from 5s)
    this.aggressiveCheckInterval = setInterval(() => {
      const timeSinceLastSuccess = Date.now() - this.lastSuccessfulCheck;
      
      // If no successful check in last 60 seconds, check more frequently
      if (timeSinceLastSuccess > 60000 && document.visibilityState === 'visible') {
        console.log('🔄 Aggressive connection check (unstable connection detected)');
        this.checkConnection();
      }
    }, 60000);
  }

  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach(listener => {
      try {
        listener(isOnline);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  public onConnectionChange(callback: (isOnline: boolean) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public async checkConnection(): Promise<boolean> {
    if (this.isCheckingConnection) {
      return this.isOnline; // Prevent multiple simultaneous checks
    }
    
    this.isCheckingConnection = true;
    
    try {
      // Multiple connection tests for reliability
      const tests = [
        // Test 1: Basic navigator.onLine
        Promise.resolve(navigator.onLine),
        
        // Test 2: Simple fetch to a reliable endpoint
        fetch('https://www.google.com/favicon.ico', { 
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000)
        }).then(() => true).catch(() => false),
        
        // Test 3: Supabase health check
        (async () => {
          try {
            const { error } = await supabase.from('profiles').select('id').limit(1);
            return !error || !['PGRST301', 'PGRST000', 'ENOTFOUND', 'ECONNREFUSED'].includes(error?.code || '');
          } catch {
            return false;
          }
        })()
      ];
      
      const results = await Promise.allSettled(tests);
      const connectionResults = results.map(result => 
        result.status === 'fulfilled' ? result.value : false
      );
      
      // Consider connected if at least 2 out of 3 tests pass
      const passedTests = connectionResults.filter(Boolean).length;
      const isConnected = passedTests >= 2;
      
      console.log(`🔍 Connection test results: ${connectionResults.join(', ')} (${passedTests}/3 passed)`);
      
      if (isConnected !== this.isOnline) {
        this.isOnline = isConnected;
        this.notifyListeners(isConnected);
        
        if (isConnected) {
          console.log('✅ Connection verified and restored');
          this.reconnectAttempts = 0;
          this.lastSuccessfulCheck = Date.now();
          
          // Trigger session refresh when connection is restored
          this.attemptReconnection();
        } else {
          console.warn('❌ Connection lost - multiple tests failed');
          this.scheduleReconnection();
        }
      } else if (isConnected) {
        this.lastSuccessfulCheck = Date.now();
      }
      
      return isConnected;
    } catch (error) {
      console.warn('Connection check failed:', error);
      if (this.isOnline) {
        this.isOnline = false;
        this.notifyListeners(false);
        this.scheduleReconnection();
      }
      return false;
    } finally {
      this.isCheckingConnection = false;
    }
  }

  public async waitForConnection(timeout = 30000): Promise<void> {
    if (this.isOnline) return;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        reject(new Error('Connection timeout'));
      }, timeout);

      const unsubscribe = this.onConnectionChange((isOnline) => {
        if (isOnline) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve();
        }
      });
    });
  }

  public get connected(): boolean {
    return this.isOnline;
  }

  private scheduleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn(`❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 10000);
    
    console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.checkConnection();
    }, delay);
  }
  
  private attemptReconnection() {
    // Force refresh Supabase connection
    try {
      console.log('🔄 Attempting full reconnection...');
      
      // 1. Refresh auth session
      supabase.auth.refreshSession().then(({ error }) => {
        if (error) {
          console.warn('Auth refresh failed:', error);
        } else {
          console.log('✅ Auth session refreshed');
        }
      });
      
      // 2. Re-establish realtime connections more aggressively
      const reconnectRealtime = () => {
        try {
          // Disconnect all existing channels
          supabase.realtime.disconnect();
          
          // Wait a bit then reconnect
          setTimeout(() => {
            supabase.realtime.connect();
            console.log('✅ Realtime reconnected');
            
            // Trigger a custom event for components to resubscribe
            window.dispatchEvent(new CustomEvent('supabase-reconnected'));
          }, 1000);
        } catch (error) {
          console.warn('Realtime reconnection failed:', error);
          // Retry after delay
          setTimeout(reconnectRealtime, 2000);
        }
      };
      
      reconnectRealtime();
      
      // 3. Clear any stale data/caches
      this.clearStaleData();
      
    } catch (error) {
      console.warn('Failed to refresh Supabase connections:', error);
    }
  }

  private clearStaleData() {
    try {
      // Clear any cached data that might be stale
      if (typeof window !== 'undefined') {
        // Clear localStorage items that might be stale
        const keysToCheck = ['supabase.auth.token', 'offline_messages'];
        keysToCheck.forEach(key => {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const parsed = JSON.parse(item);
              // Check if data is older than 1 hour
              if (parsed.timestamp && Date.now() - parsed.timestamp > 3600000) {
                localStorage.removeItem(key);
                console.log(`🧹 Cleared stale data: ${key}`);
              }
            } catch {
              // Not JSON, skip
            }
          }
        });
      }
    } catch (error) {
      console.warn('Failed to clear stale data:', error);
    }
  }

  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    if (this.aggressiveCheckInterval) {
      clearInterval(this.aggressiveCheckInterval);
    }
    this.listeners = [];
  }
}

// Enhanced session management with connection awareness
export class SessionManager {
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private connectionManager: ConnectionManager;

  constructor(connectionManager: ConnectionManager) {
    this.connectionManager = connectionManager;
    this.setupSessionManagement();
  }

  private setupSessionManagement() {
    // Monitor auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session) {
        this.scheduleTokenRefresh(session);
      } else if (event === 'SIGNED_OUT') {
        this.clearRefreshTimer();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('🔄 Token refreshed successfully');
        this.scheduleTokenRefresh(session);
      }
    });

    // Handle connection restoration
    this.connectionManager.onConnectionChange(async (isOnline) => {
      if (isOnline && !this.isRefreshing) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('🔄 Connection restored, refreshing session...');
          await this.refreshSession();
        }
      }
    });
  }

  private scheduleTokenRefresh(session: any) {
    this.clearRefreshTimer();
    
    if (session.expires_at) {
      const expiresAt = session.expires_at * 1000;
      const now = Date.now();
      const refreshIn = Math.max(expiresAt - now - 60000, 60000); // Refresh 1 min before expiry, minimum 1 min
      
      console.log(`⏰ Scheduling token refresh in ${Math.round(refreshIn / 1000)}s`);
      
      this.refreshTimer = setTimeout(async () => {
        await this.refreshSession();
      }, refreshIn);
    }
  }

  private clearRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private async refreshSession() {
    if (this.isRefreshing) return;
    
    this.isRefreshing = true;
    try {
      await this.connectionManager.waitForConnection();
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('❌ Session refresh failed:', error);
      }
    } catch (error) {
      console.error('❌ Session refresh error:', error);
    } finally {
      this.isRefreshing = false;
    }
  }

  public async ensureValidSession(): Promise<boolean> {
    try {
      await this.connectionManager.waitForConnection();
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Session check failed:', error);
        return false;
      }
      
      if (!session) {
        console.log('ℹ️ No active session');
        return false;
      }
      
      // Check if token is about to expire (within 5 minutes)
      const expiresAt = session.expires_at * 1000;
      const now = Date.now();
      
      if (expiresAt - now < 300000) { // 5 minutes
        console.log('🔄 Token expiring soon, refreshing...');
        await this.refreshSession();
      }
      
      return true;
    } catch (error) {
      console.error('❌ Session validation error:', error);
      return false;
    }
  }
}

// Create global instances
export const connectionManager = new ConnectionManager();
export const sessionManager = new SessionManager(connectionManager);

// Enhanced API wrapper with retry logic
export class SupabaseWrapper {
  private maxRetries = 3;
  private baseDelay = 1000;

  async withRetry<T>(
    operation: () => Promise<T>,
    context = 'operation'
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Wait for connection if offline
        if (!connectionManager.connected) {
          console.log(`🔄 Waiting for connection before ${context} (attempt ${attempt})`);
          await connectionManager.waitForConnection();
        }

        // Ensure valid session
        await sessionManager.ensureValidSession();

        const result = await operation();
        
        if (attempt > 1) {
          console.log(`✅ ${context} succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`❌ ${context} failed on attempt ${attempt}:`, error.message);

        // Don't retry on certain errors
        if (error.code === '401' || error.code === '403' || error.code === 'PGRST116') {
          throw error;
        }

        if (attempt < this.maxRetries) {
          const delay = this.baseDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Retrying ${context} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error(`${context} failed after ${this.maxRetries} attempts`);
  }
}

export const supabaseWrapper = new SupabaseWrapper();
