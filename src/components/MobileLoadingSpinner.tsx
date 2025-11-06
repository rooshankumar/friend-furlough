import React from 'react';
import { Loader2 } from 'lucide-react';

interface MobileLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export const MobileLoadingSpinner: React.FC<MobileLoadingSpinnerProps> = ({
  size = 'md',
  text,
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50'
    : 'flex items-center justify-center p-4';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          {/* Outer ring */}
          <div className={`${sizeClasses[size]} rounded-full border-2 border-primary/20`} />
          {/* Spinning ring */}
          <Loader2 
            className={`${sizeClasses[size]} text-primary animate-spin absolute inset-0`}
          />
        </div>
        {text && (
          <p className="text-sm text-muted-foreground font-medium animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

// Compact inline spinner for buttons and small spaces
export const CompactSpinner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <Loader2 className={`h-4 w-4 animate-spin ${className}`} />
);

// Page loading with skeleton
export const MobilePageLoader: React.FC = () => (
  <div className="min-h-screen bg-background p-4 space-y-4">
    <div className="flex items-center justify-center py-8">
      <MobileLoadingSpinner size="lg" />
    </div>
    {/* Skeleton content */}
    <div className="space-y-3">
      <div className="h-20 bg-muted rounded-lg animate-pulse" />
      <div className="h-20 bg-muted rounded-lg animate-pulse" />
      <div className="h-20 bg-muted rounded-lg animate-pulse" />
    </div>
  </div>
);
