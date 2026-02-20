import type { Program, Idl } from '@coral-xyz/anchor';
import { Transaction, SystemProgram, type PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { findTipProfilePDA, findGoalPDA } from '@/lib/solana/pda';

// ============================================================
// buildCreateGoalTx
//
// Builds an unsigned Transaction for the `create_goal` instruction.
// Creates a new TipGoal PDA for the given profile.
// ============================================================

interface CreateGoalParams {
  /** The profile owner's wallet. */
  owner: PublicKey;
  /** Unique goal identifier (u64). Use a monotonically increasing value. */
  goalId: BN;
  /** Goal title (max 64 chars). */
  title: string;
  /** Goal description (max 256 chars). */
  description: string;
  /** Target amount in base units of tokenMint (u64). */
  targetAmount: BN;
  /** Token mint for this goal (use NATIVE_MINT for SOL goals). */
  tokenMint: PublicKey;
  /** Unix timestamp deadline (i64), or null for no deadline. */
  deadline: BN | null;
}

export async function buildCreateGoalTx(
  program: Program<Idl>,
  { owner, goalId, title, description, targetAmount, tokenMint, deadline }: CreateGoalParams
): Promise<Transaction> {
  const [profilePda] = findTipProfilePDA(owner);
  const [goalPda, bump] = findGoalPDA(profilePda, goalId);

  const tx = await (
    program.methods as Record<
      string,
      (
        goalId: BN,
        title: string,
        description: string,
        targetAmount: BN,
        deadline: BN | null,
        bump: number
      ) => {
        accounts: (accounts: Record<string, PublicKey>) => {
          transaction: () => Promise<Transaction>;
        };
      }
    >
  )['createGoal'](goalId, title, description, targetAmount, deadline, bump)
    .accounts({
      owner,
      profile: profilePda,
      goal: goalPda,
      tokenMint,
      systemProgram: SystemProgram.programId,
    })
    .transaction();

  return tx;
}
