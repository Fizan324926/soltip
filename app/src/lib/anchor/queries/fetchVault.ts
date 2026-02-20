import type { Program, Idl } from '@coral-xyz/anchor';
import type { PublicKey } from '@solana/web3.js';
import type { Vault } from '@/types';
import { findVaultPDA } from '@/lib/solana/pda';

// ============================================================
// fetchVault
//
// Derives the Vault PDA for the given profile PDA and fetches the
// account from the chain. Returns null if the account does not exist.
// ============================================================

export async function fetchVault(
  program: Program<Idl>,
  profilePda: PublicKey
): Promise<Vault | null> {
  try {
    const [vaultPda] = findVaultPDA(profilePda);
    const account = await (
      program.account as Record<
        string,
        { fetchNullable: (pda: PublicKey) => Promise<Vault | null> }
      >
    )['vault'].fetchNullable(vaultPda);
    return account ?? null;
  } catch (err) {
    console.warn('[fetchVault] Failed:', err);
    return null;
  }
}
