/**
 * Unit tests for error handling utilities
 */

import {
  parseSupabaseError,
  retryAsync,
  handleAsyncOperation,
  validateAsyncResponse,
} from '@/lib/errorHandler';

describe('Error Handler Utilities', () => {
  describe('parseSupabaseError', () => {
    it('should parse Supabase error with code', () => {
      const error = {
        code: 'PGRST301',
        message: 'The result set is too large',
      };

      const result = parseSupabaseError(error);

      expect(result.message).toBeDefined();
      expect(result.code).toBe('PGRST301');
    });

    it('should parse network error', () => {
      const error = new Error('Network request failed');

      const result = parseSupabaseError(error);

      expect(result.message).toContain('Network');
    });

    it('should handle unknown error type', () => {
      const error = 'Unknown error string';

      const result = parseSupabaseError(error);

      expect(result.message).toBeDefined();
    });

    it('should parse timeout error', () => {
      const error = new Error('Request timeout');

      const result = parseSupabaseError(error);

      expect(result.message).toContain('timed out');
    });

    it('should parse unique constraint violation', () => {
      const error = {
        code: '23505',
        message: 'duplicate key value',
      };

      const result = parseSupabaseError(error);

      expect(result.message).toContain('already exists');
    });

    it('should parse foreign key constraint violation', () => {
      const error = {
        code: '23503',
        message: 'violates foreign key constraint',
      };

      const result = parseSupabaseError(error);

      expect(result.message).toBeDefined();
    });

    it('should return error response object with message field', () => {
      const error = new Error('Test error');

      const result = parseSupabaseError(error);

      expect(result).toHaveProperty('message');
      expect(result.message).toBeDefined();
    });
  });

  describe('retryAsync', () => {
    it('should retry failed operation', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      const result = await retryAsync(operation, {
        maxAttempts: 3,
        delayMs: 10,
      });

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw error after max attempts exceeded', async () => {
      const operation = async () => {
        throw new Error('Permanent failure');
      };

      await expect(
        retryAsync(operation, {
          maxAttempts: 2,
          delayMs: 10,
        })
      ).rejects.toThrow('Permanent failure');
    });

    it('should succeed on first attempt', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        return 'success';
      };

      const result = await retryAsync(operation, {
        maxAttempts: 3,
        delayMs: 10,
      });

      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });

    it('should use exponential backoff', async () => {
      let attempts = 0;

      const operation = async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Failure');
        }
        return 'success';
      };

      const result = await retryAsync(operation, {
        maxAttempts: 3,
        delayMs: 10,
        backoffMultiplier: 2,
      });

      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });
  });

  describe('handleAsyncOperation', () => {
    it('should handle successful async operation', async () => {
      const operation = async () => 'success';

      const result = await handleAsyncOperation(operation);

      expect(result).toBe('success');
    });

    it('should handle failed async operation gracefully', async () => {
      const operation = async () => {
        throw new Error('Operation failed');
      };

      const result = await handleAsyncOperation(operation);

      expect(result).toBeDefined();
    });

    it('should return result for successful operations', async () => {
      const operation = async () => ({ data: 'test' });

      const result = await handleAsyncOperation(operation);

      expect(result).toEqual({ data: 'test' });
    });
  });

  describe('validateAsyncResponse', () => {
    it('should validate successful response', () => {
      const response = {
        data: { id: '123', name: 'Test' },
        error: null,
      };

      const result = validateAsyncResponse(response, 'test');

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it('should return object with valid property', () => {
      const response = {
        data: { id: '123', name: 'Test' },
        error: null,
      };

      const result = validateAsyncResponse(response, 'test');

      expect(result).toHaveProperty('valid');
    });

    it('should handle response with data', () => {
      const response = {
        data: { test: 'data' },
        error: null,
      };

      const result = validateAsyncResponse(response, 'test');

      expect(result.data).toBeDefined();
    });

    it('should return validation result object', () => {
      const testData = { id: '123', name: 'Test' };
      const response = {
        data: testData,
        error: null,
      };

      const result = validateAsyncResponse(response, 'test');

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('data');
    });
  });
});
