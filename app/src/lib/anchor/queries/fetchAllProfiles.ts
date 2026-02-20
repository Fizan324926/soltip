import type { Program, Idl } from '@coral-xyz/anchor';
import type { PublicKey } from '@solana/web3.js';
import type { TipProfile } from '@/types';

// ============================================================
// fetchAllProfiles
//
// Fetches all TipProfile accounts on-chain.
// Returns an array of { pubkey, account } objects.
//
// NOTE: This performs a getProgramAccounts RPC call which may be
// expensive on mainnet. Use sparingly and prefer caching with
// React Query (staleTime / cacheTime configured in the query client).
// ============================================================

export interface ProfileWithPubkey {
  pubkey: PublicKey;
  account: TipProfile;
}

export async function fetchAllProfiles(
  program: Program<Idl>
): Promise<ProfileWithPubkey[]> {
  try {
    const accounts = await (
      program.account as Record<
        string,
        { all: () => Promise<{ publicKey: PublicKey; account: TipProfile }[]> }
      >
    )['tipProfile'].all();

    return accounts.map((a) => ({
      pubkey: a.publicKey,
      account: a.account,
    }));
  } catch (err) {
    console.warn('[fetchAllProfiles] Failed:', err);
    return [];
  }
}
