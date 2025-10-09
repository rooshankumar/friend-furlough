import { useEffect, useRef, useState, useCallback } from 'react';
import { connectionManager } from '@/lib/connectionManager';

// Hook for intersection observer (lazy loading)
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [hasIntersected, options]);

  return { elementRef, isIntersecting, hasIntersected };
}

// Hook for debounced values (search, etc.)
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for connection status
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(connectionManager.connected);

  useEffect(() => {
    const unsubscribe = connectionManager.onConnectionChange(setIsOnline);
    return unsubscribe;
  }, []);

  return isOnline;
}

// Hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const lastRenderTime = useRef(Date.now());
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    
    // Log slow renders in development
    if (process.env.NODE_ENV === 'development') {
      const now = Date.now();
      const delta = now - lastRenderTime.current;
      lastRenderTime.current = now;
      if (delta > 100) {
        console.warn(`🐌 Slow render detected in ${componentName}: ${delta}ms (render #${renderCount.current})`);
      }
    }
  });

  const logEvent = useCallback((eventName: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${componentName} - ${eventName}:`, data);
    }
  }, [componentName]);

  return { logEvent, renderCount: renderCount.current };
}

// Hook for image lazy loading
export function useImageLazyLoad(src: string) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { elementRef, hasIntersected } = useIntersectionObserver();

  useEffect(() => {
    if (!hasIntersected || !src) return;

    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
    img.onerror = () => {
      setError('Failed to load image');
      setIsLoading(false);
    };
    img.src = src;
  }, [hasIntersected, src]);

  return { elementRef, imageSrc, isLoading, error };
}

// Hook for virtual scrolling (for large lists)
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    scrollElementRef,
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex,
    endIndex,
  };
}

// Hook for caching expensive computations
export function useCache<T>(
  key: string,
  computeFn: () => T,
  dependencies: any[] = []
) {
  const cache = useRef<Map<string, { value: T; deps: any[] }>>(new Map());

  return useCallback(() => {
    const cached = cache.current.get(key);
    
    // Check if cache is valid
    if (cached && JSON.stringify(cached.deps) === JSON.stringify(dependencies)) {
      return cached.value;
    }

    // Compute new value
    const value = computeFn();
    cache.current.set(key, { value, deps: [...dependencies] });
    
    // Limit cache size
    if (cache.current.size > 100) {
      const firstKey = cache.current.keys().next().value;
      cache.current.delete(firstKey);
    }
    
    return value;
  }, [key, computeFn, dependencies]);
}
