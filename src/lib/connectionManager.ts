// Enhanced connection management for Supabase
import { supabase } from '@/integrations/supabase/client';

// Connection state management
class ConnectionManager {
  private isOnline = navigator.onLine;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Array<(isOnline: boolean) => void> = [];
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupEventListeners();
    this.startPeriodicCheck();
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      console.log('🌐 Connection restored');
      this.isOnline = true;
      this.reconnectAttempts = 0;
      this.notifyListeners(true);
    });

    window.addEventListener('offline', () => {
      console.log('🌐 Connection lost');
      this.isOnline = false;
      this.notifyListeners(false);
    });

    // Handle page visibility changes (app backgrounding)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ App became visible, checking connection...');
        this.checkConnection();
      }
    });

    // Handle focus events
    window.addEventListener('focus', () => {
      console.log('🎯 App gained focus, checking connection...');
      this.checkConnection();
    });
  }

  private startPeriodicCheck() {
    // Check connection every 30 seconds when app is active
    this.checkInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.checkConnection();
      }
    }, 30000);
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
    try {
      // Use Supabase health check
      const { error } = await supabase.from('profiles').select('id').limit(1);
      
      const isConnected = !error || error.code !== 'PGRST301'; // Not a connection error
      
      if (isConnected !== this.isOnline) {
        this.isOnline = isConnected;
        this.notifyListeners(isConnected);
        
        if (isConnected) {
          console.log('✅ Connection verified');
          this.reconnectAttempts = 0;
        } else {
          console.warn('❌ Connection check failed');
        }
      }
      
      return isConnected;
    } catch (error) {
      console.warn('Connection check failed:', error);
      if (this.isOnline) {
        this.isOnline = false;
        this.notifyListeners(false);
      }
      return false;
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

  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
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
