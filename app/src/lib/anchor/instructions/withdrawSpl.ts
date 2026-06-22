import type { Program, Idl } from '@coral-xyz/anchor';
import { Transaction, type PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
import { findTipProfilePDA, findPlatformConfigPDA } from '@/lib/solana/pda';

interface WithdrawSplParams {
  owner: PublicKey;
  tokenMint: PublicKey;
  amount: BN;
}

export async function buildWithdrawSplTx(
  program: Program<Idl>,
  { owner, tokenMint, amount }: WithdrawSplParams
): Promise<Transaction> {
  const [profilePda] = findTipProfilePDA(owner);
  const [platformConfigPda] = findPlatformConfigPDA();

  // Creator's token account (destination)
  const creatorTokenAccount = getAssociatedTokenAddressSync(tokenMint, owner);

  // Platform fee token account
  const [platformAuthority] = findPlatformConfigPDA();
  const platformFeeTokenAccount = getAssociatedTokenAddressSync(tokenMint, platformAuthority, true);

  const methodsNamespace = program.methods as Record<
    string,
    (amount: BN) => {
      accounts: (accounts: Record<string, PublicKey>) => {
        transaction: () => Promise<Transaction>;
      };
    }
  >;

  const withdrawSplMethod = methodsNamespace['withdrawSpl'];
  if (!withdrawSplMethod) throw new Error('withdrawSpl method not found in program');

  const tx = await withdrawSplMethod(amount)
    .accounts({
      owner,
      tipProfile: profilePda,
      creatorTokenAccount,
      platformFeeTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .transaction();

  return tx;
}
