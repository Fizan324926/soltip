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
    const accountNamespace = program.account as Record<
      string,
      { fetchNullable: (pda: PublicKey) => Promise<Vault | null> }
    >;
    const vaultAccount = accountNamespace['vault'];
    if (!vaultAccount) throw new Error('vault account not found in program');
    const account = await vaultAccount.fetchNullable(vaultPda);
    return account ?? null;
  } catch (err) {
    console.warn('[fetchVault] Failed:', err);
    return null;
  }
}
