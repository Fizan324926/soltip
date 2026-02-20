import { useEffect, useRef } from 'react';

// ============================================================
// Hook
// ============================================================

/**
 * `useInterval`
 *
 * A robust, production-safe wrapper around `setInterval` that:
 *
 * - Always calls the **latest** version of `callback` (no stale closures).
 * - Cleans up the interval on unmount or when `delay` changes.
 * - Pauses the interval by passing `null` as `delay`.
 * - Restarts the interval when `delay` changes to a valid number.
 *
 * Inspired by Dan Abramov's canonical implementation, extended with
 * null-pause support and TypeScript generics.
 *
 * @param callback  Function to call on each tick. Always the latest ref.
 * @param delay     Interval in milliseconds, or `null` to pause.
 *
 * @example
 * // Poll every 5 seconds, pause when not needed
 * const [polling, setPolling] = useState(true);
 * useInterval(fetchLatestTips, polling ? 5000 : null);
 */
export function useInterval(
  callback: () => void,
  delay: number | null
): void {
  // Store the latest callback in a ref so the interval always calls
  // the current function without needing to restart the timer.
  const savedCallback = useRef<() => void>(callback);

  // Update the ref whenever the callback changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up (or tear down) the interval
  useEffect(() => {
    // `null` delay means "paused" – don't schedule anything
    if (delay === null || delay < 0) return;

    const tick = () => {
      savedCallback.current();
    };

    const id = setInterval(tick, delay);

    return () => clearInterval(id);
  }, [delay]);
}

export default useInterval;
