import { useState, useEffect, useRef, useCallback } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

// Check if running in Capacitor
const isCapacitor = () => {
  return !!(window as any).Capacitor;
};

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  disabled = false
}: UsePullToRefreshOptions) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    // Only trigger if scrolled to top (with small tolerance for Capacitor)
    const scrollTop = container.scrollTop;
    if (scrollTop <= 5) {
      startY.current = e.touches[0].clientY;
      currentY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 5) {
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    
    // More aggressive pull detection for Capacitor
    const minPullDistance = isCapacitor() ? 20 : 30;
    
    if (distance > minPullDistance) {
      // Apply resistance effect (less resistance on Capacitor for better feel)
      const resistanceFactor = isCapacitor() ? 0.5 : 0.4;
      const resistedDistance = Math.min(distance * resistanceFactor, threshold * 1.2);
      setPullDistance(resistedDistance);

      // Prevent default to stop overscroll bounce on iOS/Android
      if (resistedDistance > 15) {
        e.preventDefault();
        e.stopPropagation();
      }
    } else {
      // Allow normal scrolling for small movements
      if (distance < 10) {
        setIsPulling(false);
        setPullDistance(0);
      }
    }
  }, [isPulling, disabled, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, threshold, disabled, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    isPulling,
    pullDistance,
    isRefreshing,
    isActive: isPulling || isRefreshing
  };
};
