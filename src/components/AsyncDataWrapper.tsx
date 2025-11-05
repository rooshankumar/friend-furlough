import React from 'react';
import { LoadingSpinner, ErrorState } from '@/components/LoadingStates';

interface AsyncDataWrapperProps {
  isLoading: boolean;
  error: any;
  data: any;
  onRetry?: () => void;
  loadingText?: string;
  errorTitle?: string;
  errorDescription?: string;
  children: React.ReactNode;
}

/**
 * Wrapper component for handling async data loading states
 * Eliminates repetitive loading/error/success state handling
 */
export const AsyncDataWrapper: React.FC<AsyncDataWrapperProps> = ({
  isLoading,
  error,
  data,
  onRetry,
  loadingText = 'Loading...',
  errorTitle = 'Failed to load data',
  errorDescription = 'Please try again',
  children,
}) => {
  if (isLoading) {
    return <LoadingSpinner text={loadingText} />;
  }

  if (error) {
    return (
      <ErrorState
        title={errorTitle}
        description={errorDescription}
        onRetry={onRetry}
        showRetry={!!onRetry}
      />
    );
  }

  if (!data) {
    return (
      <ErrorState
        title="No data available"
        description="The requested data could not be found"
        showRetry={false}
      />
    );
  }

  return <>{children}</>;
};
