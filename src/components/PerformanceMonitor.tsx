import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

export const PerformanceMonitor: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page navigation performance
    const startTime = performance.now();
    
    const measurePageLoad = () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Only log if it takes more than 100ms
      if (loadTime > 100) {
        
        // Warn if page takes more than 1 second
        if (loadTime > 1000) {
          console.warn(`🐌 Slow page load detected: ${location.pathname} took ${Math.round(loadTime)}ms`);
        }
      }
    };

    // Measure after React has finished rendering
    const timeoutId = setTimeout(measurePageLoad, 0);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  useEffect(() => {
    // Collect Web Vitals metrics
    const collectMetrics = () => {
      try {
        // Get performance entries
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        
        if (navigation) {
          const metrics: Partial<PerformanceMetrics> = {
            pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          };
          
          // First Contentful Paint
          const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
          if (fcp) {
            metrics.firstContentfulPaint = fcp.startTime;
          }
          
          // Log metrics if any are concerning
          if (metrics.pageLoadTime && metrics.pageLoadTime > 1000) {
            console.log('📊 Performance Metrics:', metrics);
          }
        }
        
        // Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
          try {
            const lcpObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1];
              if (lastEntry && lastEntry.startTime > 2500) { // LCP > 2.5s is poor
              }
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            
            // Cleanup after 10 seconds
            setTimeout(() => lcpObserver.disconnect(), 10000);
          } catch (error) {
            // Silently fail if PerformanceObserver is not supported
          }
        }
      } catch (error) {
        // Silently fail if performance API is not available
      }
    };

    // Collect metrics after page load
    if (document.readyState === 'complete') {
      collectMetrics();
    } else {
      window.addEventListener('load', collectMetrics);
      return () => window.removeEventListener('load', collectMetrics);
    }
  }, []);

  // Monitor memory usage (development only)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const checkMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
        const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
        
        // Warn if memory usage is high
        if (usedMB > 100) {
          console.warn(`🧠 High memory usage: ${usedMB}MB / ${totalMB}MB`);
        }
      }
    };

    // Check memory every 30 seconds in development
    const intervalId = setInterval(checkMemoryUsage, 30000);
    return () => clearInterval(intervalId);
  }, []);

  return null; // This component doesn't render anything
};

// Hook for component-level performance monitoring
export const useComponentPerformance = (componentName: string) => {
  const mountTime = React.useRef(Date.now());
  const renderCount = React.useRef(0);

  React.useEffect(() => {
    renderCount.current += 1;
    
    if (process.env.NODE_ENV === 'development') {
      const renderTime = Date.now() - mountTime.current;
      
      // Log slow initial renders
      if (renderCount.current === 1 && renderTime > 100) {
        console.log(`📊 ${componentName} initial render: ${renderTime}ms`);
      }
      
      // Warn about excessive re-renders
      if (renderCount.current > 10) {
        console.warn(`🔄 ${componentName} has re-rendered ${renderCount.current} times`);
      }
    }
  });

  const logEvent = React.useCallback((eventName: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${componentName} - ${eventName}:`, data);
    }
  }, [componentName]);

  return { logEvent, renderCount: renderCount.current };
};

export default PerformanceMonitor;
