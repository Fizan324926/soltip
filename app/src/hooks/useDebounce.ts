import { useState, useEffect } from 'react';

// ============================================================
// Hook
// ============================================================

/**
 * `useDebounce<T>`
 *
 * Returns a debounced copy of `value` that only updates after
 * `delay` milliseconds of inactivity.
 *
 * @param value  The value to debounce (any type).
 * @param delay  Milliseconds to wait before the returned value updates.
 *
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * // use debouncedSearch in a query – it won't change until typing stops
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Skip debounce entirely for non-positive delays
    if (delay <= 0) {
      setDebouncedValue(value);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the previous timer whenever `value` or `delay` changes
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
