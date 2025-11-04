import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Global app performance optimizations
 * Fixes slow loading, message sending delays, and improves caching
 */
export const useAppOptimization = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🚀 Initializing app performance optimizations...');

    // 1. Optimize React Query cache settings
    queryClient.setDefaultOptions({
      queries: {
        staleTime: 3 * 60 * 1000, // 3 minutes - data stays fresh longer
        gcTime: 10 * 60 * 1000, // 10 minutes - keep data in cache longer
        retry: 2, // Retry failed requests twice
        refetchOnWindowFocus: false, // Don't refetch on every window focus
        refetchOnMount: false, // Don't refetch on every mount
      },
      mutations: {
        retry: 1, // Retry mutations once on failure
      }
    });

    // 2. Prefetch critical data on app load
    const prefetchCriticalData = async () => {
      try {
        // Prefetch conversations list
        await queryClient.prefetchQuery({
          queryKey: ['conversations'],
          staleTime: 5 * 60 * 1000,
        });
      } catch (error) {
        console.error('Prefetch error:', error);
      }
    };

    prefetchCriticalData();

    // 3. Enable service worker for offline support
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('✅ Service Worker registered'))
        .catch((error) => console.error('Service Worker registration failed:', error));
    }

    // 4. Optimize image loading globally
    const optimizeImages = () => {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (!img.loading) {
          img.loading = 'lazy';
        }
        // Add error handling for broken images
        img.onerror = () => {
          img.src = '/placeholder-user.jpg';
        };
      });
    };

    // Run on mount and whenever DOM changes significantly
    optimizeImages();
    const observer = new MutationObserver(optimizeImages);
    observer.observe(document.body, { childList: true, subtree: true });

    // 5. Cleanup on unmount
    return () => {
      observer.disconnect();
    };
  }, [queryClient]);

  // 6. Aggressive cache cleanup on page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('🧹 Cleaning up old cache data...');
        
        // Clear queries older than 10 minutes when app is hidden
        const queries = queryClient.getQueryCache().getAll();
        const now = Date.now();
        
        queries.forEach(query => {
          const age = now - query.state.dataUpdatedAt;
          if (age > 10 * 60 * 1000) {
            queryClient.removeQueries({ queryKey: query.queryKey });
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [queryClient]);

  return {
    clearCache: () => queryClient.clear(),
    invalidateAll: () => queryClient.invalidateQueries(),
  };
};
