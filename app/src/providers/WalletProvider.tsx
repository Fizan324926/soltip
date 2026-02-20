import React, { type FC, type ReactNode, useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import type { Network } from '../types/common';

// Import wallet-adapter CSS (base styles)
import '@solana/wallet-adapter-react-ui/styles.css';

// ============================================================
// Resolve RPC endpoint from network string
// ============================================================
function getEndpoint(network: Network): string {
  // Allow a custom RPC URL via environment variable (highest priority)
  const customRpc = (import.meta.env['VITE_SOLANA_RPC_URL'] || import.meta.env['VITE_RPC_URL']) as string | undefined;
  if (customRpc) return customRpc;

  switch (network) {
    case 'mainnet-beta':
      return clusterApiUrl('mainnet-beta');
    case 'localnet':
      return 'http://localhost:8899';
    case 'devnet':
    default:
      return clusterApiUrl('devnet');
  }
}

// ============================================================
// Props
// ============================================================
interface WalletProviderProps {
  children: ReactNode;
}

// ============================================================
// WalletProvider
//
// Wraps the application with:
//   1. ConnectionProvider  – manages the web3 Connection
//   2. WalletProvider      – adapter registry + auto-connect
//   3. WalletModalProvider – built-in connect modal UI
// ============================================================
export const WalletProvider: FC<WalletProviderProps> = ({ children }) => {
  const network = (import.meta.env['VITE_SOLANA_NETWORK'] as Network) ?? 'devnet';
  const endpoint = useMemo(() => getEndpoint(network), [network]);

  // Register supported wallet adapters.
  // Backpack is detected automatically via the wallet standard; it does not
  // need an explicit adapter in modern wallet-adapter versions.
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      // Backpack exposes itself via the Wallet Standard and is discovered
      // automatically – no explicit adapter needed.
    ],
    []
  );

  return (
    <ConnectionProvider
      endpoint={endpoint}
      config={{
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60_000,
      }}
    >
      <SolanaWalletProvider
        wallets={wallets}
        autoConnect
        onError={(error) => {
          // Surface wallet errors to the console; the UI layer handles toasts
          console.error('[WalletProvider] wallet error:', error);
        }}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

export default WalletProvider;
