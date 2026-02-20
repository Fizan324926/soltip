import type { Program, Idl } from '@coral-xyz/anchor';
import type { PublicKey } from '@solana/web3.js';
import type { TipSplit } from '@/types';
import { findTipSplitPDA } from '@/lib/solana/pda';

// ============================================================
// fetchTipSplit
//
// Derives the TipSplit PDA for the given profile PDA and fetches
// the account from the chain. Returns null if not found.
// ============================================================

export async function fetchTipSplit(
  program: Program<Idl>,
  profilePda: PublicKey
): Promise<TipSplit | null> {
  try {
    const [tipSplitPda] = findTipSplitPDA(profilePda);
    const account = await (
      program.account as Record<
        string,
        { fetchNullable: (pda: PublicKey) => Promise<TipSplit | null> }
      >
    )['tipSplit'].fetchNullable(tipSplitPda);
    return account ?? null;
  } catch (err) {
    console.warn('[fetchTipSplit] Failed:', err);
    return null;
  }
}
