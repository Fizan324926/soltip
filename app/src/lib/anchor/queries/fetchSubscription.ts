import type { Program, Idl } from '@coral-xyz/anchor';
import type { PublicKey } from '@solana/web3.js';
import type { Subscription } from '@/types';
import { findSubscriptionPDA } from '@/lib/solana/pda';

// ============================================================
// fetchSubscription
//
// Derives the Subscription PDA for the (subscriber, profilePda) pair
// and fetches the account from the chain. Returns null if not found.
// ============================================================

export async function fetchSubscription(
  program: Program<Idl>,
  subscriber: PublicKey,
  profilePda: PublicKey
): Promise<Subscription | null> {
  try {
    const [subscriptionPda] = findSubscriptionPDA(subscriber, profilePda);
    const account = await (
      program.account as Record<
        string,
        { fetchNullable: (pda: PublicKey) => Promise<Subscription | null> }
      >
    )['subscription'].fetchNullable(subscriptionPda);
    return account ?? null;
  } catch (err) {
    console.warn('[fetchSubscription] Failed:', err);
    return null;
  }
}
