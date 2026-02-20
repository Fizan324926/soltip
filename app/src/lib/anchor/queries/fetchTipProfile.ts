import type { Program, Idl } from '@coral-xyz/anchor';
import type { PublicKey } from '@solana/web3.js';
import type { TipProfile } from '@/types';
import { findTipProfilePDA } from '@/lib/solana/pda';

// ============================================================
// fetchTipProfile
//
// Derives the TipProfile PDA for the given owner and fetches the
// account from the chain. Returns null if the account does not exist.
// ============================================================

export async function fetchTipProfile(
  program: Program<Idl>,
  owner: PublicKey
): Promise<TipProfile | null> {
  try {
    const [profilePda] = findTipProfilePDA(owner);
    const account = await (
      program.account as Record<
        string,
        { fetchNullable: (pda: PublicKey) => Promise<TipProfile | null> }
      >
    )['tipProfile'].fetchNullable(profilePda);
    return account ?? null;
  } catch (err) {
    console.warn('[fetchTipProfile] Failed:', err);
    return null;
  }
}
