/**
 * Mobile-first optimization utilities
 * Focused on Chrome mobile performance and UX
 */

import { logger } from './logger';

export interface MobileDevice {
  isMobile: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isChrome: boolean;
  screenSize: 'small' | 'medium' | 'large';
  hasTouch: boolean;
  connectionType: 'slow' | 'fast' | 'unknown';
}

class MobileOptimizer {
  private device: MobileDevice;
  private performanceObserver: PerformanceObserver | null = null;

  constructor() {
    this.device = this.detectDevice();
    this.initPerformanceMonitoring();
    this.optimizeForMobile();
  }

  private detectDevice(): MobileDevice {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);
    const isChrome = /chrome/i.test(userAgent);
    
    const screenWidth = window.innerWidth;
    let screenSize: 'small' | 'medium' | 'large' = 'large';
    if (screenWidth < 640) screenSize = 'small';
    else if (screenWidth < 1024) screenSize = 'medium';

    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Detect connection speed
    const connection = (navigator as any).connection;
    let connectionType: 'slow' | 'fast' | 'unknown' = 'unknown';
    if (connection) {
      const effectiveType = connection.effectiveType;
      connectionType = ['slow-2g', '2g', '3g'].includes(effectiveType) ? 'slow' : 'fast';
    }

    return {
      isMobile,
      isAndroid,
      isIOS,
      isChrome,
      screenSize,
      hasTouch,
      connectionType
    };
  }

  private initPerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            logger.performance(`Page Load: ${navEntry.loadEventEnd - navEntry.fetchStart}ms`);
          }
          
          if (entry.entryType === 'largest-contentful-paint') {
            logger.performance(`LCP: ${entry.startTime}ms`);
          }
          
          if (entry.entryType === 'first-input') {
            const fidEntry = entry as PerformanceEventTiming;
            logger.performance(`FID: ${fidEntry.processingStart - fidEntry.startTime}ms`);
          }
        });
      });

      try {
        this.performanceObserver.observe({ entryTypes: ['navigation', 'largest-contentful-paint', 'first-input'] });
      } catch (e) {
        logger.warn('Performance observer not fully supported');
      }
    }
  }

  private optimizeForMobile(): void {
    if (!this.device.isMobile) return;

    // Optimize viewport for mobile
    this.setMobileViewport();
    
    // Optimize touch interactions
    this.optimizeTouchInteractions();
    
    // Optimize images for mobile
    this.optimizeImages();
    
    // Prevent zoom on input focus (iOS)
    this.preventInputZoom();
    
    logger.mobile('Mobile optimizations applied', this.device);
  }

  private setMobileViewport(): void {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    
    // Optimized viewport for mobile web apps
    viewport.setAttribute('content', 
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    );
  }

  private optimizeTouchInteractions(): void {
    // Add touch-action CSS for better scrolling
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile-first touch optimizations */
      * {
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
      }
      
      body {
        touch-action: manipulation;
        -webkit-overflow-scrolling: touch;
      }
      
      button, [role="button"] {
        touch-action: manipulation;
        min-height: 44px; /* iOS accessibility guideline */
        min-width: 44px;
      }
      
      input, textarea, select {
        touch-action: manipulation;
      }
      
      /* Improve scrolling performance */
      .scroll-container {
        -webkit-overflow-scrolling: touch;
        transform: translateZ(0);
      }
      
      /* Mobile-specific improvements */
      @media (max-width: 768px) {
        .mobile-optimized {
          will-change: transform;
        }
        
        /* Reduce animations on slow connections */
        ${this.device.connectionType === 'slow' ? `
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        ` : ''}
      }
    `;
    document.head.appendChild(style);
  }

  private optimizeImages(): void {
    // Lazy load images that are not in viewport
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      // Observe all images with data-src
      document.querySelectorAll('img[data-src]').forEach((img) => {
        imageObserver.observe(img);
      });
    }
  }

  private preventInputZoom(): void {
    if (this.device.isIOS) {
      // Prevent zoom on input focus for iOS
      const inputs = document.querySelectorAll('input, textarea, select');
      inputs.forEach((input) => {
        const element = input as HTMLInputElement;
        if (element.style.fontSize === '' || parseFloat(element.style.fontSize) < 16) {
          element.style.fontSize = '16px';
        }
      });
    }
  }

  // Public methods for mobile optimization
  public getDevice(): MobileDevice {
    return { ...this.device };
  }

  public isMobileDevice(): boolean {
    return this.device.isMobile;
  }

  public isSlowConnection(): boolean {
    return this.device.connectionType === 'slow';
  }

  public optimizeForFileUpload(): void {
    if (!this.device.isMobile) return;

    // Mobile file upload optimizations
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input) => {
      const fileInput = input as HTMLInputElement;
      
      // Optimize for mobile cameras
      if (fileInput.accept && fileInput.accept.includes('image')) {
        // Add capture attribute for camera access
        fileInput.setAttribute('capture', 'environment');
      }
      
      // Prevent multiple file selection on mobile for better UX
      if (this.device.screenSize === 'small') {
        fileInput.removeAttribute('multiple');
      }
    });
  }

  public addMobileGestures(element: HTMLElement): void {
    if (!this.device.hasTouch) return;

    let startY = 0;
    let startTime = 0;

    element.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      startTime = Date.now();
    }, { passive: true });

    element.addEventListener('touchend', (e) => {
      const endY = e.changedTouches[0].clientY;
      const endTime = Date.now();
      const distance = startY - endY;
      const duration = endTime - startTime;

      // Pull to refresh gesture
      if (distance < -100 && duration < 500 && window.scrollY === 0) {
        element.dispatchEvent(new CustomEvent('pullToRefresh'));
      }
    }, { passive: true });
  }

  public optimizeScrolling(container: HTMLElement): void {
    // Add momentum scrolling for iOS
    (container.style as any).webkitOverflowScrolling = 'touch';
    container.style.transform = 'translateZ(0)';
    
    // Optimize scroll performance
    let ticking = false;
    container.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Scroll optimizations can be added here
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  public cleanup(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

// Export singleton instance
export const mobileOptimizer = new MobileOptimizer();

// Convenience functions
export const isMobile = () => mobileOptimizer.isMobileDevice();
export const isSlowConnection = () => mobileOptimizer.isSlowConnection();
export const getDevice = () => mobileOptimizer.getDevice();
export const optimizeForFileUpload = () => mobileOptimizer.optimizeForFileUpload();
export const addMobileGestures = (element: HTMLElement) => mobileOptimizer.addMobileGestures(element);
export const optimizeScrolling = (container: HTMLElement) => mobileOptimizer.optimizeScrolling(container);
