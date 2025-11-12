/**
 * APK-Specific Optimizations
 * Push notifications, smooth UI, touch handling, and performance
 */

import { Capacitor } from '@capacitor/core';
import { logger } from './logger';
import { supabase } from '@/integrations/supabase/client';

// Capacitor plugins will be available after running install-apk-plugins.bat

interface APKOptimizationConfig {
  enablePushNotifications: boolean;
  enableKeyboardOptimizations: boolean;
  enableUIOptimizations: boolean;
  enableConnectionOptimizations: boolean;
  enablePerformanceOptimizations: boolean;
}

class APKOptimizer {
  private config: APKOptimizationConfig;
  private isInitialized = false;
  private pushToken: string | null = null;
  private networkStatus: any = null;

  constructor(config: Partial<APKOptimizationConfig> = {}) {
    this.config = {
      enablePushNotifications: true,
      enableKeyboardOptimizations: true,
      enableUIOptimizations: true,
      enableConnectionOptimizations: true,
      enablePerformanceOptimizations: true,
      ...config
    };
  }

  /**
   * Initialize all APK optimizations
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized || !Capacitor.isNativePlatform()) {
      return;
    }

    logger.mobile('Initializing APK optimizations...');

    try {
      // Initialize in parallel for faster startup
      await Promise.all([
        this.config.enablePushNotifications && this.initializePushNotifications(),
        this.config.enableKeyboardOptimizations && this.initializeKeyboardOptimizations(),
        this.config.enableUIOptimizations && this.initializeUIOptimizations(),
        this.config.enableConnectionOptimizations && this.initializeConnectionOptimizations(),
        this.config.enablePerformanceOptimizations && this.initializePerformanceOptimizations()
      ]);

      this.isInitialized = true;
      logger.mobile('APK optimizations initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize APK optimizations', error);
    }
  }

  /**
   * Push Notifications Setup (Placeholder - requires plugin installation)
   */
  private async initializePushNotifications(): Promise<void> {
    try {
      // Check if push notification plugins are available
      if (typeof (window as any).PushNotifications === 'undefined') {
        logger.mobile('Push notification plugins not installed. Run install-apk-plugins.bat first.');
        return;
      }

      // Use browser notifications as fallback
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          logger.mobile('Browser notifications permission granted');
          this.setupBrowserNotifications();
        }
      }
      
    } catch (error) {
      logger.error('Push notifications setup failed', error);
    }
  }

  /**
   * Setup browser notifications as fallback
   */
  private setupBrowserNotifications(): void {
    // Listen for custom notification events
    window.addEventListener('show-notification', ((event: CustomEvent) => {
      const { title, body, icon } = event.detail;
      new Notification(title, { body, icon });
    }) as EventListener);
  }

  /**
   * Keyboard Optimizations for APK
   */
  private async initializeKeyboardOptimizations(): Promise<void> {
    try {
      // Use native browser APIs for keyboard handling
      this.setupKeyboardHandling();
      
      // Optimize input elements for mobile
      this.optimizeInputElements();
      
      logger.mobile('Keyboard optimizations initialized');
    } catch (error) {
      logger.error('Keyboard optimization failed', error);
    }
  }

  /**
   * Setup keyboard handling using browser APIs
   */
  private setupKeyboardHandling(): void {
    let keyboardHeight = 0;
    
    // Listen for viewport changes (keyboard show/hide)
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const screenHeight = window.screen.height;
      
      if (currentHeight < screenHeight * 0.75) {
        // Keyboard is likely open
        keyboardHeight = screenHeight - currentHeight;
        logger.mobile('Keyboard will show', { height: keyboardHeight });
        this.handleKeyboardShow(keyboardHeight);
      } else {
        // Keyboard is likely closed
        logger.mobile('Keyboard will hide');
        this.handleKeyboardHide();
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Handle input focus
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    });
  }

  /**
   * UI Optimizations for smooth APK performance
   */
  private async initializeUIOptimizations(): Promise<void> {
    try {
      // Add hardware acceleration styles
      this.addHardwareAcceleration();
      
      // Optimize scroll performance
      this.optimizeScrollPerformance();
      
      // Add touch feedback optimizations
      this.optimizeTouchFeedback();
      
      // Configure viewport for APK
      this.configureViewport();
      
      logger.mobile('UI optimizations applied');
    } catch (error) {
      logger.error('UI optimization failed', error);
    }
  }

  /**
   * Configure viewport for APK
   */
  private configureViewport(): void {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    
    // Optimized viewport for APK
    viewport.setAttribute('content', 
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content'
    );
  }

  /**
   * Connection Optimizations for stable APK connectivity
   */
  private async initializeConnectionOptimizations(): Promise<void> {
    try {
      // Monitor network status using native APIs
      this.monitorNetworkStatus();
      
      // Configure Supabase for mobile
      this.optimizeSupabaseForAPK();
      
      // Add connection retry logic
      this.setupConnectionRetry();
      
      logger.mobile('Connection optimizations initialized');
    } catch (error) {
      logger.error('Connection optimization failed', error);
    }
  }

  /**
   * Monitor network status using native APIs
   */
  private monitorNetworkStatus(): void {
    // Use native navigator.onLine
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      this.networkStatus = { connected: isOnline };
      
      logger.mobile('Network status changed', { connected: isOnline });
      this.handleNetworkChange({ connected: isOnline });
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    
    // Initial check
    updateNetworkStatus();
  }

  /**
   * Setup connection retry logic
   */
  private setupConnectionRetry(): void {
    let retryCount = 0;
    const maxRetries = 3;
    
    const retryConnection = async () => {
      if (retryCount >= maxRetries) {
        logger.warn('Max connection retries reached');
        return;
      }
      
      try {
        // Test connection with a simple query
        const { error } = await supabase.from('profiles').select('id').limit(1);
        
        if (error) {
          retryCount++;
          setTimeout(retryConnection, 2000 * retryCount); // Exponential backoff
        } else {
          retryCount = 0; // Reset on success
          logger.mobile('Connection restored');
        }
      } catch (error) {
        retryCount++;
        setTimeout(retryConnection, 2000 * retryCount);
      }
    };

    // Retry on network errors
    window.addEventListener('online', () => {
      setTimeout(retryConnection, 1000);
    });
  }

  /**
   * Performance Optimizations to eliminate lag
   */
  private async initializePerformanceOptimizations(): Promise<void> {
    try {
      // Enable hardware acceleration
      this.enableHardwareAcceleration();
      
      // Optimize memory usage
      this.optimizeMemoryUsage();
      
      // Configure app lifecycle handling
      this.setupAppLifecycleHandling();
      
      // Add performance monitoring
      this.setupPerformanceMonitoring();
      
      logger.mobile('Performance optimizations applied');
    } catch (error) {
      logger.error('Performance optimization failed', error);
    }
  }

  /**
   * Save push token to user profile
   */
  private async savePushTokenToProfile(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Note: push_token field needs to be added to profiles table
      // For now, store in localStorage as fallback
      localStorage.setItem('push_token', token);
        
      logger.mobile('Push token saved to profile');
    } catch (error) {
      logger.error('Failed to save push token', error);
    }
  }

  /**
   * Handle incoming push notification
   */
  private handleIncomingNotification(notification: any): void {
    // Show browser notification if app is in foreground
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title || 'New Message', {
        body: notification.body || 'You have a new message',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'friend-furlough-notification'
      });
    }
  }

  /**
   * Handle notification tap
   */
  private handleNotificationTap(notification: any): void {
    const data = notification?.data || {};
    
    if (data.conversationId) {
      // Navigate to specific conversation
      window.location.href = `/chat/${data.conversationId}`;
    } else {
      // Navigate to chat list
      window.location.href = '/chat';
    }
  }

  /**
   * Handle keyboard show
   */
  private handleKeyboardShow(keyboardHeight: number): void {
    document.body.style.paddingBottom = `${keyboardHeight}px`;
    
    // Scroll to focused input
    setTimeout(() => {
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  }

  /**
   * Handle keyboard hide
   */
  private handleKeyboardHide(): void {
    document.body.style.paddingBottom = '0px';
  }

  /**
   * Optimize input elements for mobile
   */
  private optimizeInputElements(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* APK Input Optimizations */
      input, textarea {
        font-size: 16px !important; /* Prevent zoom on iOS */
        -webkit-appearance: none;
        border-radius: 8px;
        transition: none; /* Disable transitions for better performance */
      }
      
      input:focus, textarea:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      /* Optimize for Android keyboard */
      .keyboard-open {
        position: fixed;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Add hardware acceleration styles
   */
  private addHardwareAcceleration(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* APK Hardware Acceleration */
      .messages-container,
      .conversation-list,
      .chat-input,
      .mobile-optimized {
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
        will-change: transform;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }
      
      /* Smooth scrolling for APK */
      * {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
      }
      
      /* Optimize animations for APK */
      @media (prefers-reduced-motion: no-preference) {
        * {
          animation-duration: 0.2s !important;
          transition-duration: 0.2s !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Optimize scroll performance
   */
  private optimizeScrollPerformance(): void {
    // Add passive event listeners for better scroll performance
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
    document.addEventListener('wheel', () => {}, { passive: true });
  }

  /**
   * Optimize touch feedback
   */
  private optimizeTouchFeedback(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* APK Touch Optimizations */
      button, [role="button"], .clickable {
        -webkit-tap-highlight-color: rgba(59, 130, 246, 0.1);
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
        touch-action: manipulation;
      }
      
      button:active, [role="button"]:active {
        transform: scale(0.98);
        transition: transform 0.1s ease;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Handle network changes
   */
  private handleNetworkChange(status: any): void {
    this.networkStatus = status;
    
    if (!status.connected) {
      // Show offline indicator
      this.showOfflineIndicator();
    } else {
      // Hide offline indicator and sync data
      this.hideOfflineIndicator();
      this.syncDataAfterReconnection();
    }
  }

  /**
   * Optimize Supabase for APK
   */
  private optimizeSupabaseForAPK(): void {
    try {
      // Configure Supabase realtime for mobile with proper API
      const channel = supabase.channel('apk-optimization');
      
      channel.on('broadcast', { event: 'connection-test' }, () => {
        logger.mobile('Supabase realtime connection active');
      });
      
      channel.subscribe((status) => {
        logger.mobile('Supabase channel status', status);
        
        if (status === 'SUBSCRIBED') {
          logger.mobile('Supabase realtime connected');
        } else if (status === 'CLOSED') {
          logger.mobile('Supabase realtime disconnected');
          // Attempt reconnection after delay
          setTimeout(() => {
            channel.subscribe();
          }, 5000);
        }
      });
      
    } catch (error) {
      logger.error('Supabase optimization failed', error);
    }
  }

  /**
   * Enable hardware acceleration
   */
  private enableHardwareAcceleration(): void {
    // Force GPU acceleration
    document.body.style.transform = 'translateZ(0)';
    document.body.style.backfaceVisibility = 'hidden';
  }

  /**
   * Optimize memory usage
   */
  private optimizeMemoryUsage(): void {
    // Clean up unused resources periodically
    setInterval(() => {
      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }
      
      // Clean up old cached data
      this.cleanupOldCache();
    }, 60000); // Every minute
  }

  /**
   * Setup app lifecycle handling
   */
  private setupAppLifecycleHandling(): void {
    // Use browser visibility API as fallback
    document.addEventListener('visibilitychange', () => {
      const isActive = !document.hidden;
      logger.mobile('App state changed', { isActive });
      
      if (isActive) {
        // App became active - sync data
        this.syncDataAfterReconnection();
      } else {
        // App went to background - cleanup
        this.cleanupOnBackground();
      }
    });

    // Also listen for window focus/blur events
    window.addEventListener('focus', () => {
      logger.mobile('App gained focus');
      this.syncDataAfterReconnection();
    });

    window.addEventListener('blur', () => {
      logger.mobile('App lost focus');
      this.cleanupOnBackground();
    });
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Monitor frame rate
    let lastTime = performance.now();
    let frameCount = 0;
    
    const checkFrameRate = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        if (fps < 30) {
          logger.warn(`Low FPS detected: ${fps}`);
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(checkFrameRate);
    };
    
    requestAnimationFrame(checkFrameRate);
  }

  /**
   * Show offline indicator
   */
  private showOfflineIndicator(): void {
    const indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.innerHTML = '📶 Offline - Reconnecting...';
    indicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #f59e0b;
      color: white;
      text-align: center;
      padding: 8px;
      z-index: 9999;
      font-size: 14px;
    `;
    document.body.appendChild(indicator);
  }

  /**
   * Hide offline indicator
   */
  private hideOfflineIndicator(): void {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Sync data after reconnection
   */
  private async syncDataAfterReconnection(): Promise<void> {
    try {
      // Trigger data sync in stores
      const event = new CustomEvent('network-reconnected');
      window.dispatchEvent(event);
      
      logger.mobile('Data sync triggered after reconnection');
    } catch (error) {
      logger.error('Failed to sync data after reconnection', error);
    }
  }

  /**
   * Cleanup old cache
   */
  private cleanupOldCache(): void {
    // Clean up old localStorage entries
    const keys = Object.keys(localStorage);
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.timestamp && data.timestamp < oneWeekAgo) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // Invalid JSON, remove it
          localStorage.removeItem(key);
        }
      }
    });
  }

  /**
   * Cleanup on background
   */
  private cleanupOnBackground(): void {
    // Pause non-essential operations
    // Clear intervals and timeouts
    // Reduce memory usage
  }

  /**
   * Get push token
   */
  public getPushToken(): string | null {
    return this.pushToken;
  }

  /**
   * Get network status
   */
  public getNetworkStatus(): any {
    return this.networkStatus;
  }

  /**
   * Send test push notification
   */
  public async sendTestNotification(): Promise<void> {
    try {
      // Use browser notification as fallback
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Test Notification', {
          body: 'APK notifications are working!',
          icon: '/icon-192.png',
          badge: '/icon-192.png'
        });
        logger.mobile('Test notification sent');
      } else {
        logger.warn('Notification permission not granted');
      }
    } catch (error) {
      logger.error('Failed to send test notification', error);
    }
  }
}

// Export singleton instance
export const apkOptimizer = new APKOptimizer();

// Initialize on app start
if (Capacitor.isNativePlatform()) {
  apkOptimizer.initialize();
}
