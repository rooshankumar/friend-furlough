import { useEffect, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Mobile-specific performance optimizations for PWA
 * Addresses common mobile performance bottlenecks
 */
export const useMobileOptimization = () => {
  const queryClient = useQueryClient();
  const [isMobile, setIsMobile] = useState(false);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);

  // Detect mobile and device capabilities
  useEffect(() => {
    const checkDevice = () => {
      // Mobile detection
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);

      // Low-end device detection
      const memory = (navigator as any).deviceMemory || 4; // Default to 4GB if not available
      const cores = navigator.hardwareConcurrency || 4;
      const isLowEnd = memory <= 2 || cores <= 2;
      setIsLowEndDevice(isLowEnd);

      console.log('📱 Device info:', { mobile, memory: `${memory}GB`, cores, isLowEnd });
    };

    checkDevice();
  }, []);

  // Optimize for mobile performance
  const optimizeForMobile = useCallback(() => {
    if (!isMobile) return;

    console.log('📱 Applying mobile optimizations...');

    // 1. Reduce query cache size for mobile
    queryClient.setDefaultOptions({
      queries: {
        staleTime: isLowEndDevice ? 2 * 60 * 1000 : 5 * 60 * 1000, // 2min vs 5min
        gcTime: isLowEndDevice ? 5 * 60 * 1000 : 10 * 60 * 1000, // 5min vs 10min
        retry: isLowEndDevice ? 1 : 3, // Fewer retries on low-end devices
      }
    });

    // 2. Disable animations on low-end devices
    if (isLowEndDevice) {
      document.documentElement.style.setProperty('--animation-duration', '0s');
      document.documentElement.style.setProperty('--transition-duration', '0s');
    }

    // 3. Optimize images for mobile
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.loading) {
        img.loading = 'lazy';
      }
      // Reduce image quality on low-end devices
      if (isLowEndDevice && img.src.includes('supabase')) {
        const url = new URL(img.src);
        url.searchParams.set('quality', '60');
        url.searchParams.set('width', '400');
        img.src = url.toString();
      }
    });

    // 4. Throttle scroll events
    let scrollTimeout: NodeJS.Timeout;
    const throttledScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // Process scroll events
      }, isLowEndDevice ? 100 : 50);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [isMobile, isLowEndDevice, queryClient]);

  // Mobile-specific file upload optimization
  const optimizeFileUpload = useCallback((file: File): Promise<File> => {
    // Disable compression - return original file for all devices
    console.log('📱 File upload optimization disabled - using original file:', {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type
    });
    return Promise.resolve(file);
  }, []);

  // Network optimization for mobile
  const optimizeNetworkRequests = useCallback(() => {
    if (!isMobile) return;
    const connection = (navigator as any).connection;
    if (connection) {
      const { effectiveType, downlink } = connection;
      console.log('📱 Network info:', { effectiveType, downlink: `${downlink}Mbps` });

      // Adjust request behavior based on connection
      if (effectiveType === '2g' || downlink < 1) {
        // Very slow connection - minimize requests
        queryClient.setDefaultOptions({
          queries: {
            staleTime: 10 * 60 * 1000, // 10 minutes
            retry: 0, // No retries on slow connections
          }
        });
      } else if (effectiveType === '3g' || downlink < 5) {
        // Moderate connection - reduce frequency
        queryClient.setDefaultOptions({
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
          }
        });
      }
    }
  }, [isMobile, queryClient]);

  // Memory management for mobile
  const optimizeMemoryUsage = useCallback(() => {
    if (!isMobile) return;

    // Clear unused caches more aggressively on mobile
    const clearUnusedCaches = () => {
      const queries = queryClient.getQueryCache().getAll();
      const now = Date.now();
      
      queries.forEach(query => {
        const lastUpdated = query.state.dataUpdatedAt;
        const age = now - lastUpdated;
        
        // Clear queries older than 5 minutes on mobile
        if (age > 5 * 60 * 1000) {
          queryClient.removeQueries({ queryKey: query.queryKey });
        }
      });
    };

    // Run cleanup every 2 minutes on mobile
    const cleanupInterval = setInterval(clearUnusedCaches, 2 * 60 * 1000);

    // Cleanup on page visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        clearUnusedCaches();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(cleanupInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMobile, queryClient]);

  // Initialize mobile optimizations
  useEffect(() => {
    if (isMobile) {
      const cleanup1 = optimizeForMobile();
      optimizeNetworkRequests();
      const cleanup2 = optimizeMemoryUsage();

      return () => {
        cleanup1?.();
        cleanup2?.();
      };
    }
  }, [isMobile, optimizeForMobile, optimizeNetworkRequests, optimizeMemoryUsage]);

  return {
    isMobile,
    isLowEndDevice,
    optimizeFileUpload,
    optimizeForMobile,
    optimizeNetworkRequests,
    optimizeMemoryUsage
  };
};
