import { useMemo } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { AnchorClient, createAnchorClient } from '../lib/anchor/client';

// ============================================================
// Hook
// ============================================================

/**
 * `useAnchorClient`
 *
 * Returns a memoised `AnchorClient` instance when a wallet is
 * connected, or `null` when no wallet is available.
 *
 * The client is only recreated when:
 *   - The underlying `connection` endpoint changes (network switch)
 *   - The connected wallet (public key / signing capability) changes
 *
 * Usage:
 * ```tsx
 * const client = useAnchorClient();
 * if (!client) return <ConnectWalletPrompt />;
 * const sig = await client.getProgram().methods.sendTip(...).rpc();
 * ```
 */
export function useAnchorClient(): AnchorClient | null {
  const { connection } = useConnection();
  const anchorWallet   = useAnchorWallet();       // undefined when disconnected

  const client = useMemo<AnchorClient | null>(() => {
    if (!anchorWallet) return null;
    return createAnchorClient(connection, anchorWallet);
  }, [connection, anchorWallet]);

  return client;
}

export default useAnchorClient;
