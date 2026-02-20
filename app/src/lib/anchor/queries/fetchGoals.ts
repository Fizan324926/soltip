import type { Program, Idl } from '@coral-xyz/anchor';
import type { PublicKey } from '@solana/web3.js';
import type { TipGoal } from '@/types';

// ============================================================
// fetchGoals
//
// Fetches all TipGoal accounts associated with the given profile PDA.
//
// Uses a memcmp filter on byte offset 8 (after the 8-byte discriminator)
// which is where the `profile: PublicKey` field is stored in TipGoal.
// ============================================================

export async function fetchGoals(
  program: Program<Idl>,
  profilePda: PublicKey
): Promise<TipGoal[]> {
  try {
    type GoalAccount = { publicKey: PublicKey; account: TipGoal };

    const accounts = await (
      program.account as Record<
        string,
        {
          all: (filters: {
            memcmp: { offset: number; bytes: string };
          }[]) => Promise<GoalAccount[]>;
        }
      >
    )['tipGoal'].all([
      {
        memcmp: {
          // 8-byte discriminator prefix, then the `profile` field (PublicKey)
          offset: 8,
          bytes: profilePda.toBase58(),
        },
      },
    ]);

    return accounts.map((a) => a.account);
  } catch (err) {
    console.warn('[fetchGoals] Failed:', err);
    return [];
  }
}
