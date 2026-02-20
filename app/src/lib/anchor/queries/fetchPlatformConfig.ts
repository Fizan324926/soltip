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
    const account = await (
      program.account as Record<
        string,
        { fetchNullable: (pda: PublicKey) => Promise<PlatformConfig | null> }
      >
    )['platformConfig'].fetchNullable(configPda);
    return account ?? null;
  } catch (err) {
    console.warn('[fetchPlatformConfig] Failed:', err);
    return null;
  }
}
