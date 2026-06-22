import { useRef, useCallback, useState } from 'react';

interface UseRateLimitedActionOptions {
  /** Minimum time between actions in milliseconds */
  cooldownMs?: number;
  /** Show feedback when rate limited */
  onRateLimited?: () => void;
}

/**
 * Hook for rate-limiting user actions (tips, votes, etc.)
 * Prevents accidental double-clicks and intentional spam.
 */
export function useRateLimitedAction<T extends (...args: any[]) => Promise<any>>(
  action: T,
  options: UseRateLimitedActionOptions = {},
): {
  execute: T;
  isLocked: boolean;
  remainingMs: number;
} {
  const { cooldownMs = 2000, onRateLimited } = options;
  const lastCallRef = useRef<number>(0);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);

  const execute = useCallback(
    async (...args: Parameters<T>) => {
      const now = Date.now();
      const elapsed = now - lastCallRef.current;

      if (elapsed < cooldownMs) {
        const remaining = cooldownMs - elapsed;
        setRemainingMs(remaining);
        onRateLimited?.();
        return;
      }

      lastCallRef.current = now;
      setIsLocked(true);

      try {
        const result = await action(...args);
        return result;
      } finally {
        // Unlock after cooldown
        setTimeout(() => {
          setIsLocked(false);
          setRemainingMs(0);
        }, cooldownMs);
      }
    },
    [action, cooldownMs, onRateLimited],
  ) as T;

  return { execute, isLocked, remainingMs };
}

/**
 * Simpler debounce hook for non-critical actions.
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delayMs: number = 300,
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delayMs);
    },
    [callback, delayMs],
  ) as T;
}

export default useRateLimitedAction;
