import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { PublicKey } from '@solana/web3.js';
import type { Network } from '../types/common';

interface WalletState {
  publicKey: PublicKey | null;
  connected: boolean;
  network: Network;

  setPublicKey: (pk: PublicKey | null) => void;
  setConnected: (connected: boolean) => void;
  setNetwork: (network: Network) => void;
  disconnect: () => void;
}

interface PersistedWallet {
  network: Network;
}

export const useWalletStore = create<WalletState>()(
  devtools(
    persist(
      (set) => ({
        publicKey: null,
        connected: false,
        network: (import.meta.env['VITE_SOLANA_NETWORK'] as Network) ?? 'devnet',

        setPublicKey: (pk) => set({ publicKey: pk }),

        setConnected: (connected) => set({ connected }),

        setNetwork: (network) => set({ network }),

        disconnect: () => set({ publicKey: null, connected: false }),
      }),
      {
        name: 'soltip-wallet',
        partialize: (state): PersistedWallet => ({ network: state.network }),
        merge: (persisted, current) => ({
          ...current,
          ...(persisted as PersistedWallet),
        }),
      }
    ),
    { name: 'WalletStore' }
  )
);

export const selectPublicKey = (s: WalletState) => s.publicKey;
export const selectConnected = (s: WalletState) => s.connected;
export const selectNetwork   = (s: WalletState) => s.network;
