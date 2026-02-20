import type { Program, Idl } from '@coral-xyz/anchor';
import { Transaction, SystemProgram, type PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import {
  findTipProfilePDA,
  findVaultPDA,
  findPlatformConfigPDA,
  findPlatformTreasuryPDA,
} from '@/lib/solana/pda';

// ============================================================
// buildWithdrawTx
//
// Builds an unsigned Transaction for the `withdraw` instruction.
// The owner withdraws the specified lamport amount from their Vault.
// ============================================================

interface WithdrawParams {
  /** The creator's wallet public key (profile owner). */
  owner: PublicKey;
  /** Amount to withdraw in lamports (u64). */
  amount: BN;
}

export async function buildWithdrawTx(
  program: Program<Idl>,
  { owner, amount }: WithdrawParams
): Promise<Transaction> {
  const [profilePda]        = findTipProfilePDA(owner);
  const [vaultPda]          = findVaultPDA(profilePda);
  const [platformConfigPda] = findPlatformConfigPDA();
  const [treasuryPda]       = findPlatformTreasuryPDA();

  const tx = await (
    program.methods as Record<
      string,
      (amount: BN) => {
        accounts: (accounts: Record<string, PublicKey>) => {
          transaction: () => Promise<Transaction>;
        };
      }
    >
  )['withdraw'](amount)
    .accounts({
      owner,
      profile: profilePda,
      vault: vaultPda,
      platformConfig: platformConfigPda,
      treasury: treasuryPda,
      systemProgram: SystemProgram.programId,
    })
    .transaction();

  return tx;
}
