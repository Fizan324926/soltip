import type { Program, Idl } from '@coral-xyz/anchor';
import { Transaction, SystemProgram, type PublicKey } from '@solana/web3.js';
import {
  findTipProfilePDA,
  findTipSplitPDA,
} from '@/lib/solana/pda';

// ============================================================
// buildConfigureSplitTx
//
// Builds an unsigned Transaction for the `configure_split` instruction.
// Creates or updates the TipSplit PDA for the given profile.
// Total shareBps across all recipients must equal 10,000.
// Maximum MAX_SPLIT_RECIPIENTS (5) recipients.
// ============================================================

interface SplitRecipientInput {
  /** The wallet that receives this share. */
  wallet: PublicKey;
  /** Share in basis points (0–10000). All recipients must sum to 10000. */
  shareBps: number;
}

interface ConfigureSplitParams {
  /** The profile owner's wallet. */
  owner: PublicKey;
  /**
   * Array of split recipients.
   * Must sum to exactly 10,000 bps (100%).
   * Max 5 recipients (MAX_SPLIT_RECIPIENTS).
   */
  recipients: SplitRecipientInput[];
}

export async function buildConfigureSplitTx(
  program: Program<Idl>,
  { owner, recipients }: ConfigureSplitParams
): Promise<Transaction> {
  const [profilePda]   = findTipProfilePDA(owner);
  const [tipSplitPda, bump] = findTipSplitPDA(profilePda);

  // Convert to the format the Anchor instruction expects:
  // Vec<{ wallet: Pubkey, share_bps: u16 }>
  const recipientArgs = recipients.map((r) => ({
    wallet: r.wallet,
    shareBps: r.shareBps,
  }));

  const tx = await (
    program.methods as Record<
      string,
      (
        recipients: { wallet: PublicKey; shareBps: number }[],
        bump: number
      ) => {
        accounts: (accounts: Record<string, PublicKey>) => {
          transaction: () => Promise<Transaction>;
        };
      }
    >
  )['configureSplit'](recipientArgs, bump)
    .accounts({
      owner,
      profile: profilePda,
      tipSplit: tipSplitPda,
      systemProgram: SystemProgram.programId,
    })
    .transaction();

  return tx;
}
