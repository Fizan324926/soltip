import type { Program, Idl } from '@coral-xyz/anchor';
import { Transaction, SystemProgram, type PublicKey } from '@solana/web3.js';
import { findTipProfilePDA, findVaultPDA } from '@/lib/solana/pda';

// ============================================================
// buildInitializeVaultTx
//
// Builds an unsigned Transaction for the `initialize_vault` instruction.
// Creates the Vault PDA for the given profile owner.
// Must be called after `create_profile`.
// ============================================================

interface InitializeVaultParams {
  /** The profile owner's wallet. */
  owner: PublicKey;
}

export async function buildInitializeVaultTx(
  program: Program<Idl>,
  { owner }: InitializeVaultParams
): Promise<Transaction> {
  const [profilePda] = findTipProfilePDA(owner);
  const [vaultPda, bump] = findVaultPDA(profilePda);

  const tx = await (
    program.methods as Record<
      string,
      (bump: number) => {
        accounts: (accounts: Record<string, PublicKey>) => {
          transaction: () => Promise<Transaction>;
        };
      }
    >
  )['initializeVault'](bump)
    .accounts({
      owner,
      profile: profilePda,
      vault: vaultPda,
      systemProgram: SystemProgram.programId,
    })
    .transaction();

  return tx;
}
