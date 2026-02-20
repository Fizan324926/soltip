import type { Program, Idl } from '@coral-xyz/anchor';
import {
  Transaction,
  SystemProgram,
  type PublicKey,
  type AccountMeta,
} from '@solana/web3.js';
import BN from 'bn.js';
import {
  findTipProfilePDA,
  findTipSplitPDA,
  findVaultPDA,
  findRateLimitPDA,
  findTipperRecordPDA,
  findPlatformConfigPDA,
  findPlatformTreasuryPDA,
} from '@/lib/solana/pda';

// ============================================================
// buildSendTipSplitTx
//
// Builds an unsigned Transaction for the `send_tip_split` instruction.
//
// The split recipient wallets are passed as `remainingAccounts`
// (writable, non-signer), as the on-chain instruction reads them
// from `ctx.remaining_accounts` to distribute shares.
// ============================================================

interface SendTipSplitParams {
  /** The tipper's wallet public key. */
  tipper: PublicKey;
  /** The recipient creator's wallet public key (profile owner). */
  recipientOwner: PublicKey;
  /** Total tip amount in lamports (u64). */
  amount: BN;
  /** Optional on-chain message (max 280 chars). Null to omit. */
  message: string | null;
  /**
   * The split recipient wallet addresses.
   * Must match the on-chain TipSplit.recipients order and count.
   */
  recipientWallets: PublicKey[];
}

export async function buildSendTipSplitTx(
  program: Program<Idl>,
  { tipper, recipientOwner, amount, message, recipientWallets }: SendTipSplitParams
): Promise<Transaction> {
  const [profilePda]        = findTipProfilePDA(recipientOwner);
  const [tipSplitPda]       = findTipSplitPDA(profilePda);
  const [vaultPda]          = findVaultPDA(profilePda);
  const [rateLimitPda]      = findRateLimitPDA(tipper, profilePda);
  const [tipperRecordPda]   = findTipperRecordPDA(tipper, profilePda);
  const [platformConfigPda] = findPlatformConfigPDA();
  const [treasuryPda]       = findPlatformTreasuryPDA();

  // Build remaining accounts: writable, non-signer recipient wallets.
  const remainingAccounts: AccountMeta[] = recipientWallets.map((wallet) => ({
    pubkey: wallet,
    isWritable: true,
    isSigner: false,
  }));

  const tx = await (
    program.methods as Record<
      string,
      (amount: BN, message: string | null) => {
        accounts: (accounts: Record<string, PublicKey>) => {
          remainingAccounts: (accounts: AccountMeta[]) => {
            transaction: () => Promise<Transaction>;
          };
        };
      }
    >
  )['sendTipSplit'](amount, message)
    .accounts({
      tipper,
      recipientProfile: profilePda,
      tipSplit: tipSplitPda,
      vault: vaultPda,
      rateLimit: rateLimitPda,
      tipperRecord: tipperRecordPda,
      platformConfig: platformConfigPda,
      treasury: treasuryPda,
      systemProgram: SystemProgram.programId,
    })
    .remainingAccounts(remainingAccounts)
    .transaction();

  return tx;
}
