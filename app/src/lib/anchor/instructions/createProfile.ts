import type { Program, Idl } from '@coral-xyz/anchor';
import { Transaction, SystemProgram, type PublicKey } from '@solana/web3.js';
import { findTipProfilePDA } from '@/lib/solana/pda';

// ============================================================
// buildCreateProfileTx
//
// Builds an unsigned Transaction for the `create_profile` instruction.
// Creates a new TipProfile PDA for the given owner wallet.
// ============================================================

interface CreateProfileParams {
  /** The wallet that will own the profile. */
  owner: PublicKey;
  /** Unique username (max 32 chars, lowercase, alphanumeric + underscores). */
  username: string;
  /** Display name shown to tippers (max 64 chars). */
  displayName: string;
  /** Bio / description (max 256 chars). */
  description: string;
  /** URL to profile avatar image (max 200 chars). */
  imageUrl: string;
}

export async function buildCreateProfileTx(
  program: Program<Idl>,
  { owner, username, displayName, description, imageUrl }: CreateProfileParams
): Promise<Transaction> {
  const [profilePda, bump] = findTipProfilePDA(owner);

  const methodsNamespace = program.methods as Record<
    string,
    (
      username: string,
      displayName: string,
      description: string,
      imageUrl: string,
      bump: number
    ) => {
      accounts: (accounts: Record<string, PublicKey>) => {
        transaction: () => Promise<Transaction>;
      };
    }
  >;
  const createMethod = methodsNamespace['createProfile'];
  if (!createMethod) throw new Error('createProfile method not found in program');
  const tx = await createMethod(username, displayName, description, imageUrl, bump)
    .accounts({
      owner,
      profile: profilePda,
      systemProgram: SystemProgram.programId,
    })
    .transaction();

  return tx;
}
