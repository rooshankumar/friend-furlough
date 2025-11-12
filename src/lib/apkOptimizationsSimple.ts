/**
 * Simplified APK Optimizations
 * Works without additional Capacitor plugins for immediate use
 */

import { Capacitor } from '@capacitor/core';
import { logger } from './logger';
import { supabase } from '@/integrations/supabase/client';

interface APKConfig {
  enableUIOptimizations: boolean;
  enablePerformanceOptimizations: boolean;
  enableConnectionOptimizations: boolean;
  enableKeyboardOptimizations: boolean;
}

class SimpleAPKOptimizer {
  private config: APKConfig;
  private isInitialized = false;
  private networkStatus: any = null;

  constructor(config: Partial<APKConfig> = {}) {
    this.config = {
      enableUIOptimizations: true,
      enablePerformanceOptimizations: true,
      enableConnectionOptimizations: true,
      enableKeyboardOptimizations: true,
      ...config
    };
  }

  /**
   * Initialize APK optimizations without external plugins
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized || !Capacitor.isNativePlatform()) {
      return;
    }

    logger.mobile('Initializing simple APK optimizations...');

    try {
      await Promise.all([
        this.config.enableUIOptimizations && this.initializeUIOptimizations(),
        this.config.enablePerformanceOptimizations && this.initializePerformanceOptimizations(),
        this.config.enableConnectionOptimizations && this.initializeConnectionOptimizations(),
        this.config.enableKeyboardOptimizations && this.initializeKeyboardOptimizations()
      ]);

      this.isInitialized = true;
      logger.mobile('Simple APK optimizations initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize APK optimizations', error);
    }
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
   * Performance Optimizations to eliminate lag
   */
  private async initializePerformanceOptimizations(): Promise<void> {
    try {
      // Enable hardware acceleration
      this.enableHardwareAcceleration();
      
      // Optimize memory usage
      this.optimizeMemoryUsage();
      
      // Add performance monitoring
      this.setupPerformanceMonitoring();
      
      // Optimize animations for APK
      this.optimizeAnimations();
      
      logger.mobile('Performance optimizations applied');
    } catch (error) {
      logger.error('Performance optimization failed', error);
    }
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
   * Keyboard Optimizations for APK
   */
  private async initializeKeyboardOptimizations(): Promise<void> {
    try {
      // Optimize input elements for mobile
      this.optimizeInputElements();
      
      // Handle keyboard visibility changes
      this.handleKeyboardEvents();
      
      logger.mobile('Keyboard optimizations initialized');
    } catch (error) {
      logger.error('Keyboard optimization failed', error);
    }
  }

  /**
   * Add hardware acceleration styles
   */
  private addHardwareAcceleration(): void {
    const style = document.createElement('style');
    style.id = 'apk-hardware-acceleration';
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
        contain: layout style paint;
      }
      
      /* Smooth scrolling for APK */
      * {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
      }
      
      /* APK-specific optimizations */
      body {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeSpeed;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Optimize scroll performance
   */
  private optimizeScrollPerformance(): void {
    // Add passive event listeners for better scroll performance
    const options = { passive: true };
    
    document.addEventListener('touchstart', () => {}, options);
    document.addEventListener('touchmove', () => {}, options);
    document.addEventListener('touchend', () => {}, options);
    document.addEventListener('wheel', () => {}, options);
    
    // Optimize scroll containers
    const scrollContainers = document.querySelectorAll('.messages-container, .conversation-list');
    scrollContainers.forEach(container => {
      const element = container as HTMLElement;
      element.style.willChange = 'scroll-position';
      element.style.contain = 'layout style paint';
    });
  }

  /**
   * Optimize touch feedback
   */
  private optimizeTouchFeedback(): void {
    const style = document.createElement('style');
    style.id = 'apk-touch-feedback';
    style.textContent = `
      /* APK Touch Optimizations */
      button, [role="button"], .clickable {
        -webkit-tap-highlight-color: rgba(59, 130, 246, 0.1);
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
        touch-action: manipulation;
        cursor: pointer;
      }
      
      button:active, [role="button"]:active {
        transform: scale(0.98);
        transition: transform 0.1s ease;
      }
      
      /* Improve button accessibility */
      button, [role="button"] {
        min-height: 44px;
        min-width: 44px;
      }
    `;
    document.head.appendChild(style);
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
   * Enable hardware acceleration
   */
  private enableHardwareAcceleration(): void {
    // Force GPU acceleration on body
    document.body.style.transform = 'translateZ(0)';
    document.body.style.backfaceVisibility = 'hidden';
    document.body.style.contain = 'layout style paint';
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
      
      // Remove unused DOM elements
      this.cleanupUnusedElements();
    }, 60000); // Every minute
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
      
      if (currentTime - lastTime >= 5000) { // Check every 5 seconds
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        if (fps < 30) {
          logger.warn(`Low FPS detected: ${fps}`);
          this.optimizeForLowPerformance();
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(checkFrameRate);
    };
    
    requestAnimationFrame(checkFrameRate);
  }

  /**
   * Optimize animations for APK
   */
  private optimizeAnimations(): void {
    const style = document.createElement('style');
    style.id = 'apk-animation-optimization';
    style.textContent = `
      /* Optimize animations for APK */
      * {
        animation-duration: 0.2s !important;
        transition-duration: 0.2s !important;
      }
      
      /* Disable animations on low-end devices */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Monitor network status using native APIs
   */
  private monitorNetworkStatus(): void {
    // Use native navigator.onLine
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      this.networkStatus = { connected: isOnline };
      
      if (!isOnline) {
        this.showOfflineIndicator();
      } else {
        this.hideOfflineIndicator();
        this.syncDataAfterReconnection();
      }
      
      logger.mobile('Network status changed', { connected: isOnline });
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    
    // Initial check
    updateNetworkStatus();
  }

  /**
   * Optimize Supabase for APK
   */
  private optimizeSupabaseForAPK(): void {
    // Configure Supabase realtime for mobile with error handling
    try {
      const channel = supabase.channel('apk-optimization');
      
      channel.on('broadcast', { event: 'connection-test' }, () => {
        logger.mobile('Supabase realtime connection active');
      });
      
      channel.subscribe((status) => {
        logger.mobile('Supabase channel status', status);
      });
      
    } catch (error) {
      logger.error('Supabase optimization failed', error);
    }
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
   * Optimize input elements for mobile
   */
  private optimizeInputElements(): void {
    const style = document.createElement('style');
    style.id = 'apk-input-optimization';
    style.textContent = `
      /* APK Input Optimizations */
      input, textarea {
        font-size: 16px !important; /* Prevent zoom on iOS */
        -webkit-appearance: none;
        border-radius: 8px;
        transition: none; /* Disable transitions for better performance */
        will-change: auto;
      }
      
      input:focus, textarea:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
        transform: translateZ(0); /* Hardware acceleration */
      }
      
      /* Optimize for Android keyboard - less aggressive approach */
      .keyboard-open {
        /* Remove position fixed as it breaks layout */
        /* Just adjust padding for keyboard */
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Handle keyboard events
   */
  private handleKeyboardEvents(): void {
    let keyboardHeight = 0;
    
    // Listen for viewport changes (keyboard show/hide)
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const screenHeight = window.screen.height;
      
      if (currentHeight < screenHeight * 0.75) {
        // Keyboard is likely open
        keyboardHeight = screenHeight - currentHeight;
        document.body.classList.add('keyboard-open');
        this.handleKeyboardShow(keyboardHeight);
      } else {
        // Keyboard is likely closed
        document.body.classList.remove('keyboard-open');
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
   * Handle keyboard show
   */
  private handleKeyboardShow(keyboardHeight: number): void {
    document.body.style.paddingBottom = `${keyboardHeight}px`;
    logger.mobile('Keyboard shown', { height: keyboardHeight });
  }

  /**
   * Handle keyboard hide
   */
  private handleKeyboardHide(): void {
    document.body.style.paddingBottom = '0px';
    logger.mobile('Keyboard hidden');
  }

  /**
   * Show offline indicator
   */
  private showOfflineIndicator(): void {
    if (document.getElementById('offline-indicator')) return;
    
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
      transform: translateZ(0);
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
    try {
      const keys = Object.keys(localStorage);
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      keys.forEach(key => {
        if (key.startsWith('cache_') || key.startsWith('temp_')) {
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
    } catch (error) {
      logger.error('Cache cleanup failed', error);
    }
  }

  /**
   * Cleanup unused DOM elements
   */
  private cleanupUnusedElements(): void {
    // Remove hidden images that are no longer needed
    const hiddenImages = document.querySelectorAll('img[style*="display: none"]');
    hiddenImages.forEach(img => {
      if (img.parentNode) {
        img.parentNode.removeChild(img);
      }
    });
    
    // Clean up old style elements
    const oldStyles = document.querySelectorAll('style[id^="temp-"]');
    oldStyles.forEach(style => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    });
  }

  /**
   * Optimize for low performance devices
   */
  private optimizeForLowPerformance(): void {
    logger.mobile('Optimizing for low performance device');
    
    // Disable non-essential animations
    const style = document.createElement('style');
    style.id = 'low-performance-optimization';
    style.textContent = `
      /* Low performance optimizations */
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
      
      /* Reduce visual effects */
      .shadow, .shadow-lg, .shadow-md {
        box-shadow: none !important;
      }
      
      /* Simplify gradients */
      .bg-gradient-to-r, .bg-gradient-to-b, .bg-gradient-subtle {
        background: #f8fafc !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Get network status
   */
  public getNetworkStatus(): any {
    return this.networkStatus;
  }

  /**
   * Test APK optimizations
   */
  public testOptimizations(): void {
    logger.mobile('Testing APK optimizations', {
      isNative: Capacitor.isNativePlatform(),
      platform: Capacitor.getPlatform(),
      networkStatus: this.networkStatus,
      isInitialized: this.isInitialized
    });
  }
}

// Export singleton instance
export const simpleAPKOptimizer = new SimpleAPKOptimizer();

// Initialize on app start for APK
if (Capacitor.isNativePlatform()) {
  simpleAPKOptimizer.initialize();
}
