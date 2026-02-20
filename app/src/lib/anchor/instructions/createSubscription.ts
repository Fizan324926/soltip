import type { Program, Idl } from '@coral-xyz/anchor';
import { Transaction, SystemProgram, type PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import {
  findTipProfilePDA,
  findSubscriptionPDA,
  findPlatformConfigPDA,
} from '@/lib/solana/pda';

// ============================================================
// buildCreateSubscriptionTx
//
// Builds an unsigned Transaction for the `create_subscription` instruction.
// Creates a recurring payment Subscription PDA for the subscriber.
// ============================================================

interface CreateSubscriptionParams {
  /** The subscriber's wallet public key. */
  subscriber: PublicKey;
  /** The recipient creator's wallet public key (profile owner). */
  recipientOwner: PublicKey;
  /** Amount to pay per interval in base units (u64). */
  amountPerInterval: BN;
  /** Payment interval duration in seconds (i64). */
  intervalSeconds: BN;
  /** Whether this is an SPL token subscription (false = SOL). */
  isSpl: boolean;
  /** Token mint (use NATIVE_MINT for SOL subscriptions). */
  tokenMint: PublicKey;
}

export async function buildCreateSubscriptionTx(
  program: Program<Idl>,
  {
    subscriber,
    recipientOwner,
    amountPerInterval,
    intervalSeconds,
    isSpl,
    tokenMint,
  }: CreateSubscriptionParams
): Promise<Transaction> {
  const [profilePda]        = findTipProfilePDA(recipientOwner);
  const [subscriptionPda, bump] = findSubscriptionPDA(subscriber, profilePda);
  const [platformConfigPda] = findPlatformConfigPDA();

  const tx = await (
    program.methods as Record<
      string,
      (
        amountPerInterval: BN,
        intervalSeconds: BN,
        isSpl: boolean,
        bump: number
      ) => {
        accounts: (accounts: Record<string, PublicKey>) => {
          transaction: () => Promise<Transaction>;
        };
      }
    >
  )['createSubscription'](amountPerInterval, intervalSeconds, isSpl, bump)
    .accounts({
      subscriber,
      recipientProfile: profilePda,
      subscription: subscriptionPda,
      tokenMint,
      platformConfig: platformConfigPda,
      systemProgram: SystemProgram.programId,
    })
    .transaction();

  return tx;
}
