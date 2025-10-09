import React, { useEffect, useRef, useCallback, memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface InfiniteScrollProps {
  children: React.ReactNode;
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  loadingComponent?: React.ReactNode;
  className?: string;
}

export const InfiniteScroll = memo<InfiniteScrollProps>(({
  children,
  hasMore,
  loading,
  onLoadMore,
  threshold = 0.8,
  loadingComponent,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || loading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    if (scrollPercentage >= threshold) {
      onLoadMore();
    }
  }, [loading, hasMore, threshold, onLoadMore]);

  // Intersection Observer for loading trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  // Scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const defaultLoadingComponent = (
    <div className="flex flex-col space-y-4 p-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className={`overflow-auto ${className}`}
    >
      {children}
      
      {hasMore && (
        <div ref={loadingRef} className="w-full">
          {loading && (loadingComponent || defaultLoadingComponent)}
        </div>
      )}
      
      {!hasMore && (
        <div className="text-center py-4 text-muted-foreground">
          <p>No more items to load</p>
        </div>
      )}
    </div>
  );
});

InfiniteScroll.displayName = 'InfiniteScroll';
