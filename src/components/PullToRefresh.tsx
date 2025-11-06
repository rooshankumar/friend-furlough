import React from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  pullDistance,
  isRefreshing,
  threshold = 80
}) => {
  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 360;
  const opacity = Math.min(progress * 1.5, 1);

  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div 
      className="absolute top-0 left-0 right-0 flex items-center justify-center z-50 pointer-events-none"
      style={{
        transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
        transition: isRefreshing ? 'transform 0.2s ease-out' : 'none'
      }}
    >
      <div 
        className="bg-background/95 backdrop-blur-sm rounded-full p-3 shadow-lg border border-border"
        style={{ opacity }}
      >
        <RefreshCw 
          className={`h-5 w-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`}
          style={{
            transform: isRefreshing ? 'none' : `rotate(${rotation}deg)`,
            transition: isRefreshing ? 'none' : 'transform 0.1s ease-out'
          }}
        />
      </div>
      {!isRefreshing && pullDistance >= threshold && (
        <div className="absolute top-full mt-2 text-xs text-muted-foreground font-medium">
          Release to refresh
        </div>
      )}
    </div>
  );
};
