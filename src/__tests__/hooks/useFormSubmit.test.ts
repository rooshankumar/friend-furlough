/**
 * Unit tests for useFormSubmit hook
 */

import { renderHook, act } from '@testing-library/react';
import { useFormSubmit } from '@/hooks/useFormSubmit';

describe('useFormSubmit Hook', () => {
  it('should initialize with idle state', () => {
    const { result } = renderHook(() => useFormSubmit());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle successful form submission', async () => {
    const { result } = renderHook(() => useFormSubmit());
    const submitFn = jest.fn(async () => ({ success: true }));

    await act(async () => {
      await result.current.submit(submitFn);
    });

    expect(submitFn).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it('should set loading state during submission', async () => {
    const { result } = renderHook(() => useFormSubmit());
    const submitFn = jest.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { success: true };
    });

    const promise = act(async () => {
      return result.current.submit(submitFn);
    });

    expect(result.current.isLoading).toBe(true);

    await promise;

    expect(result.current.isLoading).toBe(false);
  });

  it('should handle form submission error', async () => {
    const { result } = renderHook(() => useFormSubmit());
    const submitFn = jest.fn(async () => {
      throw new Error('Submission failed');
    });

    await act(async () => {
      try {
        await result.current.submit(submitFn);
      } catch (e) {
        // Expected error
      }
    });

    expect(result.current.error).toBeDefined();
  });

  it('should clear error', async () => {
    const { result } = renderHook(() => useFormSubmit());
    const submitFn = jest.fn(async () => {
      throw new Error('Submission failed');
    });

    await act(async () => {
      try {
        await result.current.submit(submitFn);
      } catch (e) {
        // Expected error
      }
    });

    expect(result.current.error).toBeDefined();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should provide submit function', async () => {
    const { result } = renderHook(() => useFormSubmit());

    expect(typeof result.current.submit).toBe('function');
  });

  it('should handle multiple submissions', async () => {
    const { result } = renderHook(() => useFormSubmit());
    const submitFn = jest.fn(async () => ({ success: true }));

    await act(async () => {
      await result.current.submit(submitFn);
    });

    expect(submitFn).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.submit(submitFn);
    });

    expect(submitFn).toHaveBeenCalledTimes(2);
  });

  it('should return submit result', async () => {
    const { result } = renderHook(() => useFormSubmit());
    const expectedResult = { success: true, data: { id: '123' } };
    const submitFn = jest.fn(async () => expectedResult);

    let submitResult;
    await act(async () => {
      submitResult = await result.current.submit(submitFn);
    });

    expect(submitResult).toEqual(expectedResult);
  });

  it('should have all required methods', () => {
    const { result } = renderHook(() => useFormSubmit());

    expect(result.current).toHaveProperty('submit');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('clearError');
  });
});
