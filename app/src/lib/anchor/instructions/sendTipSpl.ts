import type { Program, Idl } from '@coral-xyz/anchor';
import { Transaction, SystemProgram, type PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
import {
  findTipProfilePDA,
  findSplVaultPDA,
  findRateLimitPDA,
  findTipperRecordPDA,
  findPlatformConfigPDA,
  findPlatformTreasuryPDA,
} from '@/lib/solana/pda';

// ============================================================
// buildSendTipSplTx
//
// Builds an unsigned Transaction for the `send_tip_spl` instruction.
// Transfers an SPL token amount from tipper to the recipient's SPL vault.
// ============================================================

interface SendTipSplParams {
  /** The tipper's wallet public key. */
  tipper: PublicKey;
  /** The tipper's associated token account for the mint. */
  tipperTokenAccount: PublicKey;
  /** The recipient creator's wallet public key. */
  recipientOwner: PublicKey;
  /** The recipient's associated token account (or SPL vault ATA). */
  recipientTokenAccount: PublicKey;
  /** The SPL token mint. */
  tokenMint: PublicKey;
  /** Amount in the token's base units (u64). */
  amount: BN;
  /** Optional on-chain message (max 280 chars). Null to omit. */
  message: string | null;
}

export async function buildSendTipSplTx(
  program: Program<Idl>,
  {
    tipper,
    tipperTokenAccount,
    recipientOwner,
    recipientTokenAccount,
    tokenMint,
    amount,
    message,
  }: SendTipSplParams
): Promise<Transaction> {
  const [profilePda]        = findTipProfilePDA(recipientOwner);
  const [splVaultPda]       = findSplVaultPDA(profilePda, tokenMint);
  const [rateLimitPda]      = findRateLimitPDA(tipper, profilePda);
  const [tipperRecordPda]   = findTipperRecordPDA(tipper, profilePda);
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
  )['sendTipSpl'](amount, message)
    .accounts({
      tipper,
      tipperTokenAccount,
      recipientProfile: profilePda,
      splVault: splVaultPda,
      recipientTokenAccount,
      tokenMint,
      rateLimit: rateLimitPda,
      tipperRecord: tipperRecordPda,
      platformConfig: platformConfigPda,
      treasury: treasuryPda,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .transaction();

  return tx;
}
