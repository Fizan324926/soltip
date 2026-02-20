import { useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import type { TransactionSignature } from '@solana/web3.js';

// ============================================================
// Types
// ============================================================

export type ConfirmationResult = 'confirmed' | 'failed';

export interface UseTransactionConfirmationReturn {
  /**
   * Poll the RPC for `signature` until it is confirmed or has failed.
   *
   * @param signature   Base-58 transaction signature to watch.
   * @param timeoutMs   Max wait before declaring failure (default: 60_000 ms).
   * @param intervalMs  Poll interval in milliseconds (default: 2_000 ms).
   *
   * @returns `'confirmed'` when the transaction reached `confirmed` commitment,
   *          `'failed'`    on error, timeout, or on-chain failure.
   */
  confirm: (
    signature: TransactionSignature,
    timeoutMs?: number,
    intervalMs?: number,
  ) => Promise<ConfirmationResult>;
}

// ============================================================
// Hook
// ============================================================

/**
 * `useTransactionConfirmation`
 *
 * Returns a `confirm` function that polls
 * `connection.getSignatureStatuses` until the given transaction
 * reaches `confirmed` (or `finalized`) commitment, fails on-chain,
 * or the timeout is exceeded.
 *
 * This polling approach works reliably even on heavily throttled
 * public RPCs where WebSocket subscriptions may time out.
 *
 * @example
 * const { confirm } = useTransactionConfirmation();
 * const sig = await program.methods.sendTip(...).rpc();
 * const result = await confirm(sig);
 * if (result === 'confirmed') toast.success('Tip sent!');
 */
export function useTransactionConfirmation(): UseTransactionConfirmationReturn {
  const { connection } = useConnection();

  const confirm = useCallback(
    async (
      signature: TransactionSignature,
      timeoutMs  = 60_000,
      intervalMs = 2_000,
    ): Promise<ConfirmationResult> => {
      const startTime = Date.now();

      while (true) {
        // ── Check elapsed time ───────────────────────────
        const elapsed = Date.now() - startTime;
        if (elapsed >= timeoutMs) {
          console.warn(
            `[useTransactionConfirmation] Timeout after ${timeoutMs}ms for signature`,
            signature,
          );
          return 'failed';
        }

        try {
          const response = await connection.getSignatureStatuses([signature]);
          const status   = response?.value?.[0];

          if (status !== null && status !== undefined) {
            // On-chain error → failed
            if (status.err) {
              console.error(
                '[useTransactionConfirmation] Transaction failed on-chain:',
                status.err,
                signature,
              );
              return 'failed';
            }

            // Reached confirmed or finalized commitment → done
            const commitment = status.confirmationStatus;
            if (commitment === 'confirmed' || commitment === 'finalized') {
              return 'confirmed';
            }
          }
        } catch (err) {
          // Network errors are transient – keep polling
          console.warn(
            '[useTransactionConfirmation] getSignatureStatuses error (retrying):',
            err,
          );
        }

        // Wait before next poll
        await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
      }
    },
    [connection],
  );

  return { confirm };
}

export default useTransactionConfirmation;
