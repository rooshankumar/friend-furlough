import { useState, useCallback } from 'react';
import { parseSupabaseError, ErrorResponse } from '@/lib/errorHandler';

interface UseFormSubmitOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: ErrorResponse) => void;
}

/**
 * Hook for handling form submissions with loading and error states
 */
export const useFormSubmit = (options: UseFormSubmitOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  const submit = useCallback(
    async (fn: () => Promise<any>) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fn();
        options.onSuccess?.(result);
        return result;
      } catch (err: any) {
        const errorResponse = parseSupabaseError(err);
        setError(errorResponse);
        options.onError?.(errorResponse);
        throw errorResponse;
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    submit,
    isLoading,
    error,
    clearError,
  };
};
