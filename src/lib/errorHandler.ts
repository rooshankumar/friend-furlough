/**
 * Centralized error handling utilities
 */

export interface ErrorResponse {
  code?: string;
  message: string;
  details?: any;
}

/**
 * Parse Supabase error into user-friendly message
 */
export const parseSupabaseError = (error: any): ErrorResponse => {
  if (!error) {
    return { message: 'An unknown error occurred' };
  }

  // Handle Supabase-specific errors
  if (error.code) {
    const errorMap: Record<string, string> = {
      '42P01': 'Database table not found',
      '42P17': 'Infinite recursion detected in policy',
      '23505': 'This record already exists',
      '23503': 'Cannot delete this record as it is referenced by other records',
      '42501': 'Permission denied',
      'PGRST116': 'The request body is too large',
      'PGRST301': 'The result set is too large to represent',
    };

    return {
      code: error.code,
      message: errorMap[error.code] || error.message || 'Database error',
      details: error.details,
    };
  }

  // Handle network errors
  if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
    return {
      message: 'Network error. Please check your connection and try again.',
      details: error,
    };
  }

  // Handle timeout errors
  if (error.message?.includes('timeout')) {
    return {
      message: 'Request timed out. Please try again.',
      details: error,
    };
  }

  // Handle authentication errors
  if (error.message?.includes('unauthorized') || error.message?.includes('Unauthorized')) {
    return {
      message: 'You are not authorized to perform this action',
      details: error,
    };
  }

  // Default error message
  return {
    message: error.message || 'An error occurred',
    details: error,
  };
};

/**
 * Retry async operation with exponential backoff
 */
export const retryAsync = async <T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
        onRetry?.(attempt, error);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

/**
 * Handle async operation with loading and error states
 */
export const handleAsyncOperation = async <T>(
  fn: () => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: ErrorResponse) => void;
    onFinally?: () => void;
  } = {}
): Promise<T | null> => {
  try {
    const result = await fn();
    options.onSuccess?.(result);
    return result;
  } catch (error) {
    const errorResponse = parseSupabaseError(error);
    options.onError?.(errorResponse);
    return null;
  } finally {
    options.onFinally?.();
  }
};

/**
 * Validate async operation response
 */
export const validateAsyncResponse = <T>(
  data: T | null,
  error: any
): { valid: boolean; data: T | null; error: ErrorResponse | null } => {
  if (error) {
    return {
      valid: false,
      data: null,
      error: parseSupabaseError(error),
    };
  }

  if (!data) {
    return {
      valid: false,
      data: null,
      error: { message: 'No data returned from server' },
    };
  }

  return {
    valid: true,
    data,
    error: null,
  };
};
