import type { Program, Idl } from '@coral-xyz/anchor';
import type { PublicKey } from '@solana/web3.js';
import type { TipperRecord } from '@/types';
import { findTipperRecordPDA } from '@/lib/solana/pda';

// ============================================================
// fetchTipperRecord
//
// Derives the TipperRecord PDA for the (tipper, profilePda) pair
// and fetches the account from the chain. Returns null if not found.
// ============================================================

export async function fetchTipperRecord(
  program: Program<Idl>,
  tipper: PublicKey,
  profilePda: PublicKey
): Promise<TipperRecord | null> {
  try {
    const [tipperRecordPda] = findTipperRecordPDA(tipper, profilePda);
    const account = await (
      program.account as Record<
        string,
        { fetchNullable: (pda: PublicKey) => Promise<TipperRecord | null> }
      >
    )['tipperRecord'].fetchNullable(tipperRecordPda);
    return account ?? null;
  } catch (err) {
    console.warn('[fetchTipperRecord] Failed:', err);
    return null;
  }
}
