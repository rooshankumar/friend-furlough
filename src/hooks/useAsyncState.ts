import { useState, useCallback } from 'react';
import { parseSupabaseError, ErrorResponse } from '@/lib/errorHandler';

type AsyncState = 'idle' | 'loading' | 'success' | 'error';

interface UseAsyncStateOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: ErrorResponse) => void;
}

/**
 * Hook for managing async operation states (loading, success, error)
 */
export const useAsyncState = (options: UseAsyncStateOptions = {}) => {
  const [state, setState] = useState<AsyncState>('idle');
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [data, setData] = useState<any>(null);

  const execute = useCallback(
    async (asyncFn: () => Promise<any>) => {
      setState('loading');
      setError(null);

      try {
        const result = await asyncFn();
        setData(result);
        setState('success');
        options.onSuccess?.(result);
        return result;
      } catch (err: any) {
        const errorResponse = parseSupabaseError(err);
        setError(errorResponse);
        setState('error');
        options.onError?.(errorResponse);
        throw errorResponse;
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setState('idle');
    setError(null);
    setData(null);
  }, []);

  const isLoading = state === 'loading';
  const isSuccess = state === 'success';
  const isError = state === 'error';

  return {
    state,
    isLoading,
    isSuccess,
    isError,
    error,
    data,
    execute,
    reset,
  };
};
