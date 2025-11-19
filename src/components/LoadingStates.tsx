import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { User, MessageCircle, Users, Globe } from 'lucide-react';
import './LoadingStates.css';

// Modern dual-ring spinner
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; text?: string }> = ({ 
  size = 'md',
  text
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div className={`${sizeClasses} loader`} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
};

// Profile loading skeleton
export const ProfileLoadingSkeleton: React.FC = () => (
  <div className="fixed inset-0 top-0 md:left-16 bg-gradient-subtle pb-16 md:pb-0 overflow-auto">
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>

      {/* Profile card skeleton */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-6">
            {/* Avatar skeleton */}
            <Skeleton className="h-32 w-32 rounded-full" />
            
            {/* Profile info skeleton */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
              
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-18" />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <div className="flex space-x-4 border-b">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-28" />
        </div>
        
        {/* Content skeleton */}
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Chat loading skeleton
export const ChatLoadingSkeleton: React.FC = () => (
  <div className="fixed inset-0 top-0 md:left-16 bg-background pb-16 md:pb-0 flex">
    {/* Conversations sidebar skeleton */}
    <div className="w-80 border-r bg-card/50 p-4 space-y-3">
      <Skeleton className="h-8 w-full" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-3 w-8" />
        </div>
      ))}
    </div>
    
    {/* Chat area skeleton */}
    <div className="flex-1 flex flex-col">
      {/* Chat header skeleton */}
      <div className="border-b p-4 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      
      {/* Messages skeleton */}
      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-xs space-y-2 ${i % 2 === 0 ? 'bg-muted' : 'bg-primary'} rounded-lg p-3`}>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Input skeleton */}
      <div className="border-t p-4">
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
    </div>
  </div>
);

// Community loading skeleton
export const CommunityLoadingSkeleton: React.FC = () => (
  <div className="fixed inset-0 top-0 md:left-16 bg-gradient-subtle pb-16 md:pb-0 overflow-auto">
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Posts skeleton */}
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Post header */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              
              {/* Post content */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
              
              {/* Post image placeholder */}
              <Skeleton className="h-48 w-full rounded-lg" />
              
              {/* Post actions */}
              <div className="flex items-center gap-4 pt-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Page loading with icon
export const PageLoadingWithIcon: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description?: string 
}> = ({ icon, title, description }) => (
  <div className="fixed inset-0 top-0 md:left-16 bg-gradient-subtle pb-16 md:pb-0 flex items-center justify-center">
    <div className="text-center space-y-4 max-w-md px-4">
      <div className="flex justify-center">
        <div className="p-4 bg-primary/10 rounded-full">
          {icon}
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <LoadingSpinner size="md" />
    </div>
  </div>
);

// Error state component
export const ErrorState: React.FC<{ 
  title: string; 
  description?: string; 
  onRetry?: () => void;
  showRetry?: boolean;
}> = ({ title, description, onRetry, showRetry = true }) => (
  <div className="fixed inset-0 top-0 md:left-16 bg-gradient-subtle pb-16 md:pb-0 flex items-center justify-center">
    <div className="text-center space-y-4 max-w-md px-4">
      <div className="text-6xl">😕</div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-destructive">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {showRetry && onRetry && (
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);
