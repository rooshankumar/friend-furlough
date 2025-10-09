import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAutoRefresh } from './useAutoRefresh';

/**
 * Comprehensive page optimization hook
 * Provides performance enhancements for all pages
 */
export const usePageOptimization = (
  pageName: string,
  options: {
    enableAutoRefresh?: boolean;
    enablePreloading?: boolean;
    enableVirtualization?: boolean;
    cacheKeys?: string[];
    preloadDelay?: number;
  } = {}
) => {
  const {
    enableAutoRefresh = true,
    enablePreloading = true,
    enableVirtualization = false,
    cacheKeys = [],
    preloadDelay = 1000
  } = options;

  const queryClient = useQueryClient();
  const performanceRef = useRef<{ startTime: number; metrics: any[] }>({
    startTime: Date.now(),
    metrics: []
  });

  // Auto-refresh functionality
  const { manualRefresh, refreshAll } = enableAutoRefresh 
    ? useAutoRefresh(pageName, undefined, cacheKeys)
    : { manualRefresh: () => {}, refreshAll: () => {} };

  // Performance monitoring
  const trackMetric = useCallback((name: string, value: number, metadata?: any) => {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      page: pageName,
      metadata
    };
    
    performanceRef.current.metrics.push(metric);
    
    // Log performance warnings
    if (name === 'page_load' && value > 1000) {
      console.warn(`🐌 Slow page load: ${pageName} took ${value}ms`);
    }
    
    if (name === 'render_time' && value > 100) {
      console.warn(`🐌 Slow render: ${pageName} render took ${value}ms`);
    }
  }, [pageName]);

  // Page load performance tracking
  useEffect(() => {
    const startTime = performanceRef.current.startTime;
    const loadTime = Date.now() - startTime;
    
    trackMetric('page_load', loadTime);
    
    // Track Core Web Vitals if available
    if ('web-vital' in window) {
      // LCP (Largest Contentful Paint)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        trackMetric('lcp', lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID (First Input Delay)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          trackMetric('fid', entry.processingStart - entry.startTime);
        });
      }).observe({ entryTypes: ['first-input'] });
    }
  }, [trackMetric]);

  // Preload related data
  const preloadData = useCallback(async (preloadQueries: string[]) => {
    if (!enablePreloading) return;

    setTimeout(async () => {
      for (const queryKey of preloadQueries) {
        try {
          await queryClient.prefetchQuery({
            queryKey: [queryKey],
            staleTime: 5 * 60 * 1000 // 5 minutes
          });
        } catch (error) {
          console.warn(`Failed to preload ${queryKey}:`, error);
        }
      }
    }, preloadDelay);
  }, [queryClient, enablePreloading, preloadDelay]);

  // Memory optimization
  const optimizeMemory = useCallback(() => {
    // Clear old query cache entries
    queryClient.getQueryCache().clear();
    
    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }, [queryClient]);

  // Intersection Observer for lazy loading
  const useIntersectionObserver = useCallback((
    callback: (entries: IntersectionObserverEntry[]) => void,
    options: IntersectionObserverInit = {}
  ) => {
    const observer = useMemo(() => {
      if (typeof window === 'undefined') return null;
      
      return new IntersectionObserver(callback, {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      });
    }, [callback, options]);

    return observer;
  }, []);

  // Virtual scrolling helper
  const useVirtualScroll = useCallback((
    items: any[],
    itemHeight: number,
    containerHeight: number
  ) => {
    if (!enableVirtualization) {
      return { visibleItems: items, startIndex: 0, endIndex: items.length };
    }

    const [scrollTop, setScrollTop] = useState(0);
    
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    const visibleItems = items.slice(startIndex, endIndex);
    
    return {
      visibleItems,
      startIndex,
      endIndex,
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
      onScroll: (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
      }
    };
  }, [enableVirtualization]);

  // Debounced search
  const useDebounce = useCallback(<T>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  }, []);

  return {
    // Auto-refresh
    manualRefresh,
    refreshAll,
    
    // Performance
    trackMetric,
    getMetrics: () => performanceRef.current.metrics,
    
    // Data management
    preloadData,
    optimizeMemory,
    
    // UI optimization
    useIntersectionObserver,
    useVirtualScroll,
    useDebounce,
    
    // Page info
    pageName,
    loadTime: Date.now() - performanceRef.current.startTime
  };
};

// Specific page optimization hooks
export const useHomePageOptimization = () => {
  return usePageOptimization('home', {
    cacheKeys: ['posts', 'trending', 'recommendations'],
    enablePreloading: true,
    preloadDelay: 500
  });
};

export const useExplorePageOptimization = () => {
  return usePageOptimization('explore', {
    cacheKeys: ['explore', 'users', 'filters'],
    enableVirtualization: true,
    enablePreloading: true
  });
};

export const useCommunityPageOptimization = () => {
  return usePageOptimization('community', {
    cacheKeys: ['posts', 'community', 'trending'],
    enableVirtualization: true,
    enablePreloading: true
  });
};

export const useProfilePageOptimization = () => {
  return usePageOptimization('profile', {
    cacheKeys: ['profile', 'posts', 'connections'],
    enablePreloading: true
  });
};

export const useChatPageOptimization = () => {
  return usePageOptimization('chat', {
    cacheKeys: ['conversations', 'messages'],
    enableVirtualization: true,
    enableAutoRefresh: true
  });
};
