import type { Program, Idl } from '@coral-xyz/anchor';
import { Transaction, SystemProgram, type PublicKey } from '@solana/web3.js';
import {
  findTipProfilePDA,
  findSubscriptionPDA,
} from '@/lib/solana/pda';

// ============================================================
// buildCancelSubscriptionTx
//
// Builds an unsigned Transaction for the `cancel_subscription` instruction.
// Closes the Subscription PDA and returns rent to the subscriber.
// ============================================================

interface CancelSubscriptionParams {
  /** The subscriber's wallet public key. */
  subscriber: PublicKey;
  /** The recipient creator's wallet public key (profile owner). */
  recipientOwner: PublicKey;
}

export async function buildCancelSubscriptionTx(
  program: Program<Idl>,
  { subscriber, recipientOwner }: CancelSubscriptionParams
): Promise<Transaction> {
  const [profilePda]      = findTipProfilePDA(recipientOwner);
  const [subscriptionPda] = findSubscriptionPDA(subscriber, profilePda);

  const methodsNamespace = program.methods as Record<
    string,
    () => {
      accounts: (accounts: Record<string, PublicKey>) => {
        transaction: () => Promise<Transaction>;
      };
    }
  >;
  const cancelMethod = methodsNamespace['cancelSubscription'];
  if (!cancelMethod) throw new Error('cancelSubscription method not found in program');
  const tx = await cancelMethod()
    .accounts({
      subscriber,
      recipientProfile: profilePda,
      subscription: subscriptionPda,
      systemProgram: SystemProgram.programId,
    })
    .transaction();

  return tx;
}
