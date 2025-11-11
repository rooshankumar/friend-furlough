import { useEffect, useRef } from 'react';

interface UseTapToRefreshOptions {
  onRefresh: () => void | Promise<void>;
  tapCount?: number; // Number of taps required (default: 2 for double tap)
  tapTimeout?: number; // Time window for taps in ms (default: 500ms)
  enabled?: boolean; // Enable/disable the hook (default: true)
}

/**
 * Hook to detect multiple taps on an element and trigger refresh
 * Usage: const tapRef = useTapToRefresh({ onRefresh: handleRefresh, tapCount: 2 })
 * Then attach tapRef to the element: <div ref={tapRef}>...</div>
 */
export const useTapToRefresh = ({
  onRefresh,
  tapCount = 2,
  tapTimeout = 500,
  enabled = true,
}: UseTapToRefreshOptions) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const element = elementRef.current;
    if (!element) return;

    const handleTap = async () => {
      tapCountRef.current += 1;

      // Clear existing timer
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }

      // Check if we've reached the required tap count
      if (tapCountRef.current >= tapCount) {
        console.log(`🔄 ${tapCount} taps detected, refreshing...`);
        tapCountRef.current = 0;
        await onRefresh();
        return;
      }

      // Set timer to reset tap count
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, tapTimeout);
    };

    element.addEventListener('click', handleTap);

    return () => {
      element.removeEventListener('click', handleTap);
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }
    };
  }, [onRefresh, tapCount, tapTimeout, enabled]);

  return elementRef;
};

/**
 * Hook to detect multiple taps anywhere on the page and trigger refresh
 * Useful for navigation bars or headers
 */
export const useGlobalTapToRefresh = ({
  onRefresh,
  tapCount = 2,
  tapTimeout = 500,
  enabled = true,
}: UseTapToRefreshOptions) => {
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleTap = async (e: MouseEvent | TouchEvent) => {
      // Only trigger on specific elements (e.g., navigation)
      const target = e.target as HTMLElement;
      const isNavElement = target.closest('nav') || target.closest('[data-tap-refresh]');
      
      if (!isNavElement) return;

      tapCountRef.current += 1;

      // Clear existing timer
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }

      // Check if we've reached the required tap count
      if (tapCountRef.current >= tapCount) {
        console.log(`🔄 ${tapCount} taps detected on nav, refreshing...`);
        tapCountRef.current = 0;
        await onRefresh();
        return;
      }

      // Set timer to reset tap count
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, tapTimeout);
    };

    document.addEventListener('click', handleTap);
    document.addEventListener('touchend', handleTap);

    return () => {
      document.removeEventListener('click', handleTap);
      document.removeEventListener('touchend', handleTap);
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }
    };
  }, [onRefresh, tapCount, tapTimeout, enabled]);
};
