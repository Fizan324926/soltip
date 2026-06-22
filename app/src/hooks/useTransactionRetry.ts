import { useState, useCallback, useRef } from 'react';
import { Connection, TransactionSignature } from '@solana/web3.js';

interface RetryConfig {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  confirmationTimeout?: number;
}

interface RetryState {
  attempt: number;
  isRetrying: boolean;
  lastError: Error | null;
  signature: TransactionSignature | null;
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  confirmationTimeout: 60000,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateBackoff(attempt: number, baseDelay: number, maxDelay: number): number {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  const jitter = delay * 0.1 * Math.random();
  return delay + jitter;
}

export function useTransactionRetry(connection: Connection, config: RetryConfig = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const abortControllerRef = useRef<AbortController | null>(null);

  const [state, setState] = useState<RetryState>({
    attempt: 0,
    isRetrying: false,
    lastError: null,
    signature: null,
  });

  const confirmWithRetry = useCallback(
    async (
      signature: TransactionSignature,
      onAttempt?: (attempt: number) => void
    ): Promise<boolean> => {
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      setState((prev) => ({
        ...prev,
        signature,
        isRetrying: true,
        attempt: 0,
        lastError: null,
      }));

      for (let attempt = 0; attempt <= mergedConfig.maxRetries; attempt++) {
        if (signal.aborted) {
          setState((prev) => ({ ...prev, isRetrying: false }));
          return false;
        }

        setState((prev) => ({ ...prev, attempt }));
        onAttempt?.(attempt);

        try {
          const result = await connection.confirmTransaction(
            {
              signature,
              blockhash: (await connection.getLatestBlockhash()).blockhash,
              lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
            },
            'confirmed'
          );

          if (result.value.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(result.value.err)}`);
          }

          setState((prev) => ({
            ...prev,
            isRetrying: false,
            lastError: null,
          }));
          return true;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          setState((prev) => ({ ...prev, lastError: err }));

          if (attempt < mergedConfig.maxRetries) {
            const delay = calculateBackoff(
              attempt,
              mergedConfig.baseDelayMs,
              mergedConfig.maxDelayMs
            );
            await sleep(delay);
          }
        }
      }

      setState((prev) => ({ ...prev, isRetrying: false }));
      return false;
    },
    [connection, mergedConfig]
  );

  const sendWithRetry = useCallback(
    async <T>(
      sendFn: () => Promise<T>,
      onAttempt?: (attempt: number) => void
    ): Promise<T> => {
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      setState((prev) => ({
        ...prev,
        isRetrying: true,
        attempt: 0,
        lastError: null,
      }));

      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= mergedConfig.maxRetries; attempt++) {
        if (signal.aborted) {
          throw new Error('Transaction cancelled');
        }

        setState((prev) => ({ ...prev, attempt }));
        onAttempt?.(attempt);

        try {
          const result = await sendFn();
          setState((prev) => ({
            ...prev,
            isRetrying: false,
            lastError: null,
          }));
          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          setState((prev) => ({ ...prev, lastError }));

          const isRetryable = isRetryableError(lastError);
          if (!isRetryable || attempt >= mergedConfig.maxRetries) {
            break;
          }

          const delay = calculateBackoff(
            attempt,
            mergedConfig.baseDelayMs,
            mergedConfig.maxDelayMs
          );
          await sleep(delay);
        }
      }

      setState((prev) => ({ ...prev, isRetrying: false }));
      throw lastError || new Error('Transaction failed after retries');
    },
    [mergedConfig]
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setState((prev) => ({ ...prev, isRetrying: false }));
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState({
      attempt: 0,
      isRetrying: false,
      lastError: null,
      signature: null,
    });
  }, [cancel]);

  return {
    ...state,
    confirmWithRetry,
    sendWithRetry,
    cancel,
    reset,
    maxRetries: mergedConfig.maxRetries,
  };
}

function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  const retryablePatterns = [
    'blockhash not found',
    'block height exceeded',
    'node is behind',
    'too many requests',
    'rate limit',
    'timeout',
    'network',
    'econnrefused',
    'econnreset',
    'socket hang up',
    '503',
    '502',
    '504',
    'transaction was not confirmed',
  ];

  return retryablePatterns.some((pattern) => message.includes(pattern));
}

export type { RetryConfig, RetryState };
