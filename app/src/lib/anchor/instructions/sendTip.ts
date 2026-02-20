import type { Program, Idl } from '@coral-xyz/anchor';
import { Transaction, SystemProgram, type PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import {
  findTipProfilePDA,
  findVaultPDA,
  findRateLimitPDA,
  findTipperRecordPDA,
  findPlatformConfigPDA,
  findPlatformTreasuryPDA,
} from '@/lib/solana/pda';

// ============================================================
// buildSendTipTx
//
// Builds an unsigned Transaction for the `send_tip` instruction.
// All PDAs are derived automatically from the provided public keys.
// ============================================================

interface SendTipParams {
  /** The tipper's wallet public key. */
  tipper: PublicKey;
  /** The recipient creator's wallet public key (tip profile owner). */
  recipientOwner: PublicKey;
  /** Tip amount in lamports (u64). */
  amount: BN;
  /** Optional on-chain message (max 280 chars). Null to omit. */
  message: string | null;
}

export async function buildSendTipTx(
  program: Program<Idl>,
  { tipper, recipientOwner, amount, message }: SendTipParams
): Promise<Transaction> {
  const [profilePda]       = findTipProfilePDA(recipientOwner);
  const [vaultPda]         = findVaultPDA(profilePda);
  const [rateLimitPda]     = findRateLimitPDA(tipper, profilePda);
  const [tipperRecordPda]  = findTipperRecordPDA(tipper, profilePda);
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
  )['sendTip'](amount, message)
    .accounts({
      tipper,
      recipientProfile: profilePda,
      vault: vaultPda,
      rateLimit: rateLimitPda,
      tipperRecord: tipperRecordPda,
      platformConfig: platformConfigPda,
      treasury: treasuryPda,
      systemProgram: SystemProgram.programId,
    })
    .transaction();

  return tx;
}
