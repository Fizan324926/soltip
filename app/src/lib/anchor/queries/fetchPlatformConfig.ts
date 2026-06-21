import type { Program, Idl } from '@coral-xyz/anchor';
import type { PublicKey } from '@solana/web3.js';
import type { PlatformConfig } from '@/types';
import { findPlatformConfigPDA } from '@/lib/solana/pda';

// ============================================================
// fetchPlatformConfig
//
// Derives the PlatformConfig PDA (single global account) and fetches
// it from the chain. Returns null if not yet initialized.
// ============================================================

export async function fetchPlatformConfig(
  program: Program<Idl>
): Promise<PlatformConfig | null> {
  try {
    const [configPda] = findPlatformConfigPDA();
    const accountNamespace = program.account as Record<
      string,
      { fetchNullable: (pda: PublicKey) => Promise<PlatformConfig | null> }
    >;
    const platformConfigAccount = accountNamespace['platformConfig'];
    if (!platformConfigAccount) throw new Error('platformConfig account not found in program');
    const account = await platformConfigAccount.fetchNullable(configPda);
    return account ?? null;
  } catch (err) {
    console.warn('[fetchPlatformConfig] Failed:', err);
    return null;
  }
}
