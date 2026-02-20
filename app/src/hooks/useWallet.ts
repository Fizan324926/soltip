import { useEffect, useMemo } from 'react';
import {
  useWallet as useSolanaWallet,
} from '@solana/wallet-adapter-react';
import { useWalletStore } from '../stores/walletStore';

// ============================================================
// Helpers
// ============================================================

/**
 * Shorten a base-58 public key to "ABCD…WXYZ" format.
 * Returns an empty string if key is null/undefined.
 */
function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

// ============================================================
// Return shape
// ============================================================
export interface UseWalletReturn {
  /** Raw wallet adapter hook return value (all original fields) */
  wallet: ReturnType<typeof useSolanaWallet>;

  /** True when the wallet is connected AND its public key is available */
  isWalletReady: boolean;

  /** Full base-58 string of the connected public key, or null */
  publicKeyString: string | null;

  /** Shortened "ABCD…WXYZ" form, or null when disconnected */
  shortAddress: string | null;
}

// ============================================================
// Hook
// ============================================================

/**
 * `useWallet` – thin wrapper around `@solana/wallet-adapter-react`'s
 * `useWallet`.
 *
 * Additions over the raw adapter hook:
 *  - `isWalletReady`    – boolean convenience flag
 *  - `publicKeyString`  – pre-computed base-58 string
 *  - `shortAddress`     – truncated display address
 *
 * Side-effect: keeps the Zustand `walletStore` in sync so that
 * components that cannot access the adapter context (e.g. plain
 * utility functions, stores) can still read the current public key
 * and connection state.
 */
export function useWallet(): UseWalletReturn {
  const adapterWallet = useSolanaWallet();
  const { publicKey, connected } = adapterWallet;

  // ── Sync to walletStore ─────────────────────────────────
  const setPublicKey  = useWalletStore((s) => s.setPublicKey);
  const setConnected  = useWalletStore((s) => s.setConnected);

  useEffect(() => {
    setPublicKey(publicKey ?? null);
    setConnected(connected);
  }, [publicKey, connected, setPublicKey, setConnected]);

  // Clean up when the component unmounts (edge case: provider teardown)
  useEffect(() => {
    return () => {
      // Do NOT reset walletStore on unmount – the store should outlive
      // the component. Disconnect is handled by the adapter itself.
    };
  }, []);

  // ── Derived values (memoised) ───────────────────────────
  const publicKeyString = useMemo<string | null>(
    () => (publicKey ? publicKey.toBase58() : null),
    [publicKey]
  );

  const isWalletReady = useMemo<boolean>(
    () => connected && publicKey !== null,
    [connected, publicKey]
  );

  const shortAddress = useMemo<string | null>(
    () => (publicKeyString ? shortenAddress(publicKeyString) : null),
    [publicKeyString]
  );

  return {
    wallet:          adapterWallet,
    isWalletReady,
    publicKeyString,
    shortAddress,
  };
}

export default useWallet;
