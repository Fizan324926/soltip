import type { Program, Idl } from '@coral-xyz/anchor';
import { Transaction, type PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { findTipProfilePDA } from '@/lib/solana/pda';

// ============================================================
// buildUpdateProfileTx
//
// Builds an unsigned Transaction for the `update_profile` instruction.
// All fields are optional; pass undefined to leave unchanged on-chain.
// The Anchor instruction receives Option<T> values for each field.
// ============================================================

interface UpdateProfileParams {
  /** The profile owner's wallet. */
  owner: PublicKey;
  /** New display name (max 64 chars). */
  displayName?: string;
  /** New bio / description (max 256 chars). */
  description?: string;
  /** New profile image URL (max 200 chars). */
  imageUrl?: string;
  /** Minimum tip amount in lamports (u64). */
  minTipAmount?: BN;
  /** Withdrawal fee in basis points (0–1000). */
  withdrawalFeeBps?: number;
  /** Whether to accept anonymous tips. */
  acceptAnonymous?: boolean;
}

export async function buildUpdateProfileTx(
  program: Program<Idl>,
  {
    owner,
    displayName,
    description,
    imageUrl,
    minTipAmount,
    withdrawalFeeBps,
    acceptAnonymous,
  }: UpdateProfileParams
): Promise<Transaction> {
  const [profilePda] = findTipProfilePDA(owner);

  // Convert undefined → null for Anchor's Option<T> serialisation.
  const tx = await (
    program.methods as Record<
      string,
      (
        displayName: string | null,
        description: string | null,
        imageUrl: string | null,
        minTipAmount: BN | null,
        withdrawalFeeBps: number | null,
        acceptAnonymous: boolean | null
      ) => {
        accounts: (accounts: Record<string, PublicKey>) => {
          transaction: () => Promise<Transaction>;
        };
      }
    >
  )['updateProfile'](
    displayName ?? null,
    description ?? null,
    imageUrl ?? null,
    minTipAmount ?? null,
    withdrawalFeeBps ?? null,
    acceptAnonymous ?? null
  )
    .accounts({
      owner,
      profile: profilePda,
    })
    .transaction();

  return tx;
}
