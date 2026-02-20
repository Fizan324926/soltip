import type { Program, Idl } from '@coral-xyz/anchor';
import { Transaction, SystemProgram, type PublicKey } from '@solana/web3.js';
import { findTipProfilePDA } from '@/lib/solana/pda';

// ============================================================
// buildCloseGoalTx
//
// Builds an unsigned Transaction for the `close_goal` instruction.
// Only the profile owner can close a goal. Rent is returned to owner.
// ============================================================

interface CloseGoalParams {
  /** The profile owner's wallet. */
  owner: PublicKey;
  /** The TipGoal PDA to close (use findGoalPDA). */
  tipGoalPda: PublicKey;
}

export async function buildCloseGoalTx(
  program: Program<Idl>,
  { owner, tipGoalPda }: CloseGoalParams
): Promise<Transaction> {
  const [profilePda] = findTipProfilePDA(owner);

  const tx = await (
    program.methods as Record<
      string,
      () => {
        accounts: (accounts: Record<string, PublicKey>) => {
          transaction: () => Promise<Transaction>;
        };
      }
    >
  )['closeGoal']()
    .accounts({
      owner,
      profile: profilePda,
      goal: tipGoalPda,
      systemProgram: SystemProgram.programId,
    })
    .transaction();

  return tx;
}
