import { useCallback, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { setWalletAuthToken } from '@/lib/api/client';

/**
 * Token format: `<base58_signature>.<base58_pubkey>.<timestamp_secs>`
 * Signed message: `SolTip-Auth:<timestamp_secs>`
 * Valid for 5 minutes (server checks timestamp window).
 */
const AUTH_MESSAGE_PREFIX = 'SolTip-Auth:';
const REFRESH_INTERVAL_MS = 4 * 60 * 1000; // Refresh every 4 minutes (before 5-min expiry)

/**
 * Automatically signs an auth message with the connected wallet
 * and stores the token for API requests.
 *
 * - Signs on connect
 * - Refreshes every 4 minutes
 * - Clears on disconnect
 */
export function useWalletAuth() {
  const { publicKey, signMessage, connected } = useWallet();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sign = useCallback(async () => {
    if (!publicKey || !signMessage) return;

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const message = `${AUTH_MESSAGE_PREFIX}${timestamp}`;
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);

      const token = [
        bs58.encode(signature),
        publicKey.toBase58(),
        String(timestamp),
      ].join('.');

      setWalletAuthToken(token);
    } catch (err) {
      // User rejected the signature request — clear any stale token
      console.warn('[useWalletAuth] Failed to sign auth message:', err);
      setWalletAuthToken(null);
    }
  }, [publicKey, signMessage]);

  useEffect(() => {
    if (connected && publicKey && signMessage) {
      // Sign immediately on connect
      sign();

      // Refresh token periodically
      intervalRef.current = setInterval(sign, REFRESH_INTERVAL_MS);
    } else {
      // Disconnected — clear token
      setWalletAuthToken(null);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [connected, publicKey, signMessage, sign]);

  return { sign, isAuthenticated: connected && !!publicKey };
}
