import { useState, useCallback, useRef } from 'react';

// ============================================================
// Types
// ============================================================
export interface UseClipboardReturn {
  /** Call with any text string to copy it to the clipboard. */
  copy: (text: string) => void;
  /** True for 2 seconds after a successful copy, then resets to false. */
  copied: boolean;
  /** The error from the last failed copy attempt, or null. */
  error: Error | null;
}

// ============================================================
// Hook
// ============================================================

/**
 * `useClipboard`
 *
 * Copies text to the system clipboard using the modern
 * `navigator.clipboard` API with a graceful `execCommand` fallback
 * for older browsers / non-HTTPS contexts.
 *
 * @param resetDelay  Milliseconds before `copied` reverts to false (default 2000).
 *
 * @example
 * const { copy, copied } = useClipboard();
 * <button onClick={() => copy(walletAddress)}>
 *   {copied ? 'Copied!' : 'Copy'}
 * </button>
 */
export function useClipboard(resetDelay = 2000): UseClipboardReturn {
  const [copied, setCopied] = useState(false);
  const [error, setError]   = useState<Error | null>(null);
  const resetTimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    (text: string) => {
      // Clear any pending reset timer
      if (resetTimerRef.current !== null) {
        clearTimeout(resetTimerRef.current);
      }

      setError(null);

      const performCopy = async () => {
        try {
          if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
          } else {
            // Fallback for older browsers / HTTP
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.cssText =
              'position:fixed;top:-9999px;left:-9999px;opacity:0;';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            if (!success) {
              throw new Error('execCommand("copy") returned false.');
            }
          }

          setCopied(true);
          resetTimerRef.current = setTimeout(() => {
            setCopied(false);
          }, resetDelay);
        } catch (err) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setCopied(false);
          console.warn('[useClipboard] Failed to copy:', err);
        }
      };

      void performCopy();
    },
    [resetDelay]
  );

  return { copy, copied, error };
}

export default useClipboard;
