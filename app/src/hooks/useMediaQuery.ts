import { useState, useEffect } from 'react';

// ============================================================
// Hook
// ============================================================

/**
 * `useMediaQuery`
 *
 * SSR-safe CSS media query hook.
 * Returns `false` on the server (or any environment where
 * `window.matchMedia` is unavailable) and the live match state
 * on the client.
 *
 * The listener is automatically cleaned up when the component
 * unmounts or the `query` string changes.
 *
 * @param query  A valid CSS media query string, e.g. `"(max-width: 768px)"`.
 *
 * @example
 * const isMobile  = useMediaQuery('(max-width: 768px)');
 * const isDark    = useMediaQuery('(prefers-color-scheme: dark)');
 * const isRetina  = useMediaQuery('(min-resolution: 2dppx)');
 */
export function useMediaQuery(query: string): boolean {
  // ── Guard for environments without matchMedia ──────────
  const getInitialValue = (): boolean => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState<boolean>(getInitialValue);

  useEffect(() => {
    // Not available in SSR or very old browsers
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQueryList = window.matchMedia(query);

    // Sync state in case the query changed between renders
    setMatches(mediaQueryList.matches);

    // Use the modern `addEventListener` API; fall back to deprecated
    // `addListener` for Safari < 14
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', handler);
      return () => mediaQueryList.removeEventListener('change', handler);
    } else {
      // Deprecated path (Safari < 14)
      mediaQueryList.addListener(handler);
      return () => mediaQueryList.removeListener(handler);
    }
  }, [query]);

  return matches;
}

// ── Convenience shortcuts ──────────────────────────────────
export const useIsMobile  = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet  = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');

export default useMediaQuery;
