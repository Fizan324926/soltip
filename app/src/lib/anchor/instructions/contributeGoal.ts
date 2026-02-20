import type { Program, Idl } from '@coral-xyz/anchor';
import { Transaction, SystemProgram, type PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import {
  findTipProfilePDA,
  findVaultPDA,
  findRateLimitPDA,
  findPlatformConfigPDA,
  findPlatformTreasuryPDA,
} from '@/lib/solana/pda';

// ============================================================
// buildContributeGoalTx
//
// Builds an unsigned Transaction for the `contribute_goal` instruction.
// The contributor funds a specific TipGoal on the recipient's profile.
// ============================================================

interface ContributeGoalParams {
  /** The contributor's wallet public key. */
  contributor: PublicKey;
  /** The recipient creator's wallet public key (profile owner). */
  recipientOwner: PublicKey;
  /** The TipGoal PDA to contribute to (use findGoalPDA). */
  tipGoalPda: PublicKey;
  /** Contribution amount in lamports (u64). */
  amount: BN;
  /** Optional on-chain message (max 280 chars). Null to omit. */
  message: string | null;
}

export async function buildContributeGoalTx(
  program: Program<Idl>,
  { contributor, recipientOwner, tipGoalPda, amount, message }: ContributeGoalParams
): Promise<Transaction> {
  const [profilePda]        = findTipProfilePDA(recipientOwner);
  const [vaultPda]          = findVaultPDA(profilePda);
  const [rateLimitPda]      = findRateLimitPDA(contributor, profilePda);
  const [platformConfigPda] = findPlatformConfigPDA();
  const [treasuryPda]       = findPlatformTreasuryPDA();

  const tx = await (
    program.methods as Record<
      string,
      (amount: BN, message: string | null) => {
        accounts: (accounts: Record<string, PublicKey>) => {
          transaction: () => Promise<Transaction>;
        };
      }
    >
  )['contributeGoal'](amount, message)
    .accounts({
      contributor,
      recipientProfile: profilePda,
      goal: tipGoalPda,
      vault: vaultPda,
      rateLimit: rateLimitPda,
      platformConfig: platformConfigPda,
      treasury: treasuryPda,
      systemProgram: SystemProgram.programId,
    })
    .transaction();

  return tx;
}
