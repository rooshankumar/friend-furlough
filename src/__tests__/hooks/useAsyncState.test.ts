/**
 * Unit tests for useAsyncState hook
 */

import { renderHook, act } from '@testing-library/react';
import { useAsyncState } from '@/hooks/useAsyncState';

describe('useAsyncState Hook', () => {
  it('should initialize with idle state', () => {
    const { result } = renderHook(() => useAsyncState());

    expect(result.current.state).toBe('idle');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
  });

  it('should execute async operation successfully', async () => {
    const { result } = renderHook(() => useAsyncState());
    const operation = async () => ({ id: '123', name: 'Test' });

    await act(async () => {
      await result.current.execute(operation);
    });

    expect(result.current.state).toBe('success');
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual({ id: '123', name: 'Test' });
    expect(result.current.error).toBeNull();
  });

  it('should handle async operation failure', async () => {
    const { result } = renderHook(() => useAsyncState());
    const operation = async () => {
      throw new Error('Operation failed');
    };

    await act(async () => {
      try {
        await result.current.execute(operation);
      } catch (e) {
        // Expected error
      }
    });

    expect(result.current.state).toBe('error');
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeDefined();
  });

  it('should set loading state during execution', async () => {
    const { result } = renderHook(() => useAsyncState());
    const operation = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'success';
    };

    const promise = act(async () => {
      return result.current.execute(operation);
    });

    expect(result.current.isLoading).toBe(true);

    await promise;

    expect(result.current.isLoading).toBe(false);
  });

  it('should call onSuccess callback on successful execution', async () => {
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useAsyncState({ onSuccess }));
    const operation = async () => ({ data: 'test' });

    await act(async () => {
      await result.current.execute(operation);
    });

    expect(onSuccess).toHaveBeenCalledWith({ data: 'test' });
  });

  it('should call onError callback on failed execution', async () => {
    const onError = jest.fn();
    const { result } = renderHook(() => useAsyncState({ onError }));
    const operation = async () => {
      throw new Error('Test error');
    };

    await act(async () => {
      try {
        await result.current.execute(operation);
      } catch (e) {
        // Expected error
      }
    });

    expect(onError).toHaveBeenCalled();
  });

  it('should reset state', async () => {
    const { result } = renderHook(() => useAsyncState());
    const operation = async () => ({ data: 'test' });

    await act(async () => {
      await result.current.execute(operation);
    });

    expect(result.current.state).toBe('success');

    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should have correct flags for each state', async () => {
    const { result } = renderHook(() => useAsyncState());

    // Idle state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);

    const operation = async () => 'success';

    await act(async () => {
      await result.current.execute(operation);
    });

    // Success state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);
  });
});
