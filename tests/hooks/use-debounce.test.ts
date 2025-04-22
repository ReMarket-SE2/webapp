import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/lib/hooks/use-debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value updates', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'initial' },
    });

    // Initial value
    expect(result.current).toBe('initial');

    // Update the value
    rerender({ value: 'updated' });
    expect(result.current).toBe('initial'); // Still the old value

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now we should have the updated value
    expect(result.current).toBe('updated');
  });

  it('should cancel previous debounce on new value', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'initial' },
    });

    // Update multiple times rapidly
    rerender({ value: 'update1' });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender({ value: 'update2' });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Still the initial value
    expect(result.current).toBe('initial');

    // Complete the timeout
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should have the latest value
    expect(result.current).toBe('update2');
  });

  it('should use default delay if not provided', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'updated' });
    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(500); // Changed from 300ms to 500ms to match the default delay
    });

    expect(result.current).toBe('updated');
  });
});
