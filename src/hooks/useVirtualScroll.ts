import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  items: any[];
  overscan?: number;
}

/**
 * Virtual scrolling hook for efficient rendering of large lists
 * Only renders visible items + overscan buffer
 */
export const useVirtualScroll = <T>({
  itemHeight,
  containerHeight,
  items,
  overscan = 3
}: UseVirtualScrollOptions) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const totalHeight = items.length * itemHeight;
  const visibleStart = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleEnd = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(visibleStart, visibleEnd);

  // Handle scroll
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
  }, []);

  // Setup scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Scroll to index
  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    if (!containerRef.current) return;
    
    const scrollTop = index * itemHeight;
    containerRef.current.scrollTo({ top: scrollTop, behavior });
  }, [itemHeight]);

  // Scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!containerRef.current) return;
    
    containerRef.current.scrollTo({ 
      top: totalHeight, 
      behavior 
    });
  }, [totalHeight]);

  return {
    containerRef,
    visibleItems,
    visibleStart,
    totalHeight,
    scrollToIndex,
    scrollToBottom,
    offsetY: visibleStart * itemHeight,
  };
};
