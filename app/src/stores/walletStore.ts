import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { PublicKey } from '@solana/web3.js';
import type { Network } from '../types/common';

// ============================================================
// State shape
// ============================================================
interface WalletState {
  publicKey: PublicKey | null;
  connected: boolean;
  network: Network;

  // Actions
  setPublicKey: (pk: PublicKey | null) => void;
  setConnected: (connected: boolean) => void;
  setNetwork: (network: Network) => void;
  disconnect: () => void;
}

// ============================================================
// Persisted keys are serialized manually (PublicKey isn't JSON-safe)
// ============================================================
interface PersistedWallet {
  network: Network;
}

// ============================================================
// Store (devtools only in development)
// ============================================================
const persistedStore = persist<WalletState>(
  (set) => ({
    publicKey: null,
    connected: false,
    network: (import.meta.env['VITE_SOLANA_NETWORK'] as Network) ?? 'devnet',

    setPublicKey: (pk) =>
      set({ publicKey: pk }, false, 'wallet/setPublicKey'),

    setConnected: (connected) =>
      set({ connected }, false, 'wallet/setConnected'),

    setNetwork: (network) =>
      set({ network }, false, 'wallet/setNetwork'),

    disconnect: () =>
      set(
        { publicKey: null, connected: false },
        false,
        'wallet/disconnect'
      ),
  }),
  {
    name: 'soltip-wallet',
    partialize: (state): PersistedWallet => ({
      network: state.network,
    }),
    merge: (persisted, current) => ({
      ...current,
      ...(persisted as PersistedWallet),
    }),
  }
);

export const useWalletStore = create<WalletState>()(
  import.meta.env.DEV
    ? devtools(persistedStore, { name: 'WalletStore' })
    : persistedStore
);

// ============================================================
// Convenience selectors
// ============================================================
export const selectPublicKey = (s: WalletState) => s.publicKey;
export const selectConnected = (s: WalletState) => s.connected;
export const selectNetwork   = (s: WalletState) => s.network;
