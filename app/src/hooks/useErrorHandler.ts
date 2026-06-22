import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { parseAnchorError } from '@/lib/errors';
import {
  ApiError,
  AuthError,
  RateLimitError,
  NetworkError,
  ValidationError,
} from '@/lib/api/client';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  toastId?: string;
  onAuthError?: () => void;
  onRateLimit?: (retryAfter?: number) => void;
}

/**
 * Hook for consistent error handling across the app.
 * Parses errors and shows appropriate user feedback.
 */
export function useErrorHandler(defaultOptions: ErrorHandlerOptions = {}) {
  const handleError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}) => {
      const opts = { ...defaultOptions, ...options };
      const { showToast = true, toastId, onAuthError, onRateLimit } = opts;

      // Handle typed API errors
      if (error instanceof AuthError) {
        onAuthError?.();
        if (showToast) {
          toast.error('Please reconnect your wallet', { id: toastId });
        }
        return;
      }

      if (error instanceof RateLimitError) {
        onRateLimit?.(error.retryAfter);
        if (showToast) {
          const msg = error.retryAfter
            ? `Rate limited. Try again in ${error.retryAfter}s`
            : 'Too many requests. Please wait.';
          toast.error(msg, { id: toastId });
        }
        return;
      }

      if (error instanceof NetworkError) {
        if (showToast) {
          toast.error('Network error. Check your connection.', { id: toastId });
        }
        return;
      }

      if (error instanceof ValidationError) {
        if (showToast) {
          toast.error(error.message, { id: toastId });
        }
        return;
      }

      if (error instanceof ApiError) {
        if (showToast) {
          toast.error(error.message, { id: toastId });
        }
        return;
      }

      // Parse Anchor/Solana errors
      const message = parseAnchorError(error);
      if (showToast) {
        toast.error(message, { id: toastId });
      }
    },
    [defaultOptions],
  );

  return { handleError };
}

/**
 * Get user-friendly error message from any error type.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return parseAnchorError(error);
}

/**
 * Check if an error is retryable.
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.retryable;
  }

  const message = getErrorMessage(error);
  const retryablePatterns = [
    'network',
    'timeout',
    'blockhash',
    'expired',
    'connection',
  ];
  return retryablePatterns.some((p) =>
    message.toLowerCase().includes(p),
  );
}

export default useErrorHandler;
