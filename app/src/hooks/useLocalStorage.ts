import { useState, useCallback } from 'react';

// ============================================================
// Hook
// ============================================================

/**
 * `useLocalStorage<T>`
 *
 * A fully typed localStorage hook that mirrors the `useState` API.
 * Handles JSON serialization / deserialization and falls back
 * gracefully when localStorage is unavailable (e.g. SSR, private
 * browsing with storage disabled).
 *
 * @param key           The localStorage key.
 * @param initialValue  The value to use if no stored value exists.
 *
 * @returns `[storedValue, setValue]` – identical signature to useState.
 *
 * @example
 * const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('theme', 'dark');
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // ── Initialise from localStorage (runs once) ───────────
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return initialValue;
      return JSON.parse(item) as T;
    } catch (err) {
      console.warn(`[useLocalStorage] Failed to read key "${key}":`, err);
      return initialValue;
    }
  });

  // ── Setter ─────────────────────────────────────────────
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next =
          typeof value === 'function'
            ? (value as (prev: T) => T)(prev)
            : value;

        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch (err) {
          console.warn(`[useLocalStorage] Failed to write key "${key}":`, err);
        }

        return next;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}

export default useLocalStorage;
