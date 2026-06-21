// ============================================================
// Anchor instruction re-exports (low-level builders)
// ============================================================
export { buildSendTipTx }             from './sendTip';
export { buildSendTipSplTx }          from './sendTipSpl';
export { buildSendTipSplitTx }        from './sendTipSplit';
export { buildWithdrawTx }            from './withdraw';
export { buildCreateProfileTx }       from './createProfile';
export { buildUpdateProfileTx }       from './updateProfile';
export { buildInitializeVaultTx }     from './initializeVault';
export { buildCreateGoalTx }          from './createGoal';
export { buildContributeGoalTx }      from './contributeGoal';
export { buildCloseGoalTx }           from './closeGoal';
export { buildCreateSubscriptionTx }  from './createSubscription';
export { buildCancelSubscriptionTx }  from './cancelSubscription';
export { buildConfigureSplitTx }      from './configureSplit';

// ============================================================
// High-level instruction executors
// Matching convention used by all API hooks:
//   fn(client, publicKey, ...args) => Promise<string>  (tx signature)
// Each wrapper: builds the tx → sends+confirms → returns signature.
// ============================================================
import { PublicKey, SystemProgram } from '@solana/web3.js';
import BN from 'bn.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import type { WalletContextState } from '@solana/wallet-adapter-react';
import type { AnchorClient } from '../client';
import { findTipProfilePDA, findSplVaultPDA } from '@/lib/solana/pda';
import { buildSendTipTx } from './sendTip';
import { buildSendTipSplTx } from './sendTipSpl';
import { buildSendTipSplitTx } from './sendTipSplit';
import { buildWithdrawTx } from './withdraw';
import { buildCreateProfileTx } from './createProfile';
import { buildUpdateProfileTx } from './updateProfile';
import { buildInitializeVaultTx } from './initializeVault';
import { buildCreateGoalTx } from './createGoal';
import { buildContributeGoalTx } from './contributeGoal';
import { buildCloseGoalTx } from './closeGoal';
import { buildCreateSubscriptionTx } from './createSubscription';
import { buildConfigureSplitTx } from './configureSplit';

// ── SOL tip ──────────────────────────────────────────────────
export async function sendTip(
  client: AnchorClient,
  publicKey: PublicKey,
  recipientAddress: string,
  amount: bigint,
  message?: string
): Promise<string> {
  const tx = await buildSendTipTx(client.getProgram(), {
    tipper: publicKey,
    recipientOwner: new PublicKey(recipientAddress),
    amount: new BN(amount.toString()),
    message: message ?? null,
  });
  return client.provider.sendAndConfirm(tx);
}

// ── SPL token tip ─────────────────────────────────────────────
export async function sendTipSpl(
  client: AnchorClient,
  publicKey: PublicKey,
  recipientAddress: string,
  tokenMint: string,
  amount: bigint,
  message?: string
): Promise<string> {
  const tokenMintPubkey = new PublicKey(tokenMint);
  const recipientOwner = new PublicKey(recipientAddress);
  const [profilePda] = findTipProfilePDA(recipientOwner);
  const [splVaultPda] = findSplVaultPDA(profilePda, tokenMintPubkey);
  const tipperTokenAccount = getAssociatedTokenAddressSync(tokenMintPubkey, publicKey);

  const tx = await buildSendTipSplTx(client.getProgram(), {
    tipper: publicKey,
    tipperTokenAccount,
    recipientOwner,
    recipientTokenAccount: splVaultPda,
    tokenMint: tokenMintPubkey,
    amount: new BN(amount.toString()),
    message: message ?? null,
  });
  return client.provider.sendAndConfirm(tx);
}

// ── Split tip ─────────────────────────────────────────────────
export async function sendTipSplit(
  client: AnchorClient,
  publicKey: PublicKey,
  recipientAddress: string,
  amount: bigint,
  message?: string,
  recipientWallets?: string[]
): Promise<string> {
  const tx = await buildSendTipSplitTx(client.getProgram(), {
    tipper: publicKey,
    recipientOwner: new PublicKey(recipientAddress),
    amount: new BN(amount.toString()),
    message: message ?? null,
    recipientWallets: (recipientWallets ?? []).map((w) => new PublicKey(w)),
  });
  return client.provider.sendAndConfirm(tx);
}

// ── Withdraw ──────────────────────────────────────────────────
export async function withdraw(
  client: AnchorClient,
  publicKey: PublicKey,
  amount: bigint
): Promise<string> {
  const tx = await buildWithdrawTx(client.getProgram(), {
    owner: publicKey,
    amount: new BN(amount.toString()),
  });
  return client.provider.sendAndConfirm(tx);
}

// ── Create profile ────────────────────────────────────────────
export async function createProfile(
  client: AnchorClient,
  wallet: Pick<WalletContextState, 'publicKey'>,
  args: { username: string; displayName: string; description: string; imageUrl: string }
): Promise<string> {
  if (!wallet.publicKey) throw new Error('Wallet not connected');
  const tx = await buildCreateProfileTx(client.getProgram(), {
    owner: wallet.publicKey,
    ...args,
  });
  return client.provider.sendAndConfirm(tx);
}

// ── Update profile ────────────────────────────────────────────
export async function updateProfile(
  client: AnchorClient,
  wallet: Pick<WalletContextState, 'publicKey'>,
  args: {
    displayName?: string;
    description?: string;
    imageUrl?: string;
    minTipAmount?: bigint;
    withdrawalFeeBps?: number;
    acceptAnonymous?: boolean;
  }
): Promise<string> {
  if (!wallet.publicKey) throw new Error('Wallet not connected');
  const tx = await buildUpdateProfileTx(client.getProgram(), {
    owner: wallet.publicKey,
    displayName: args.displayName,
    description: args.description,
    imageUrl: args.imageUrl,
    minTipAmount: args.minTipAmount !== undefined ? new BN(args.minTipAmount.toString()) : undefined,
    withdrawalFeeBps: args.withdrawalFeeBps,
    acceptAnonymous: args.acceptAnonymous,
  });
  return client.provider.sendAndConfirm(tx);
}

// ── Initialize vault ─────────────────────────────────────────
export async function initializeVault(
  client: AnchorClient,
  publicKey: PublicKey
): Promise<string> {
  const tx = await buildInitializeVaultTx(client.getProgram(), { owner: publicKey });
  return client.provider.sendAndConfirm(tx);
}

// ── Create goal ───────────────────────────────────────────────
export async function createGoal(
  client: AnchorClient,
  publicKey: PublicKey,
  args: {
    goalId: bigint;
    title: string;
    description: string;
    targetAmount: bigint;
    tokenMint: string;
    deadline?: bigint;
  }
): Promise<string> {
  const tx = await buildCreateGoalTx(client.getProgram(), {
    owner: publicKey,
    goalId: new BN(args.goalId.toString()),
    title: args.title,
    description: args.description,
    targetAmount: new BN(args.targetAmount.toString()),
    tokenMint: new PublicKey(args.tokenMint),
    deadline: args.deadline !== undefined ? new BN(args.deadline.toString()) : null,
  });
  return client.provider.sendAndConfirm(tx);
}

// ── Contribute to goal ────────────────────────────────────────
export async function contributeGoal(
  client: AnchorClient,
  publicKey: PublicKey,
  goalAddress: string,
  recipientAddress: string,
  amount: bigint,
  message?: string
): Promise<string> {
  const tx = await buildContributeGoalTx(client.getProgram(), {
    contributor: publicKey,
    recipientOwner: new PublicKey(recipientAddress),
    tipGoalPda: new PublicKey(goalAddress),
    amount: new BN(amount.toString()),
    message: message ?? null,
  });
  return client.provider.sendAndConfirm(tx);
}

// ── Close goal ────────────────────────────────────────────────
export async function closeGoal(
  client: AnchorClient,
  publicKey: PublicKey,
  goalAddress: string,
  _goalId?: bigint
): Promise<string> {
  const tx = await buildCloseGoalTx(client.getProgram(), {
    owner: publicKey,
    tipGoalPda: new PublicKey(goalAddress),
  });
  return client.provider.sendAndConfirm(tx);
}

// ── Create subscription ───────────────────────────────────────
export async function createSubscription(
  client: AnchorClient,
  publicKey: PublicKey,
  args: {
    recipientAddress: string;
    amountPerInterval: bigint;
    intervalSeconds: bigint;
    isSpl: boolean;
    tokenMint: string;
  }
): Promise<string> {
  const tx = await buildCreateSubscriptionTx(client.getProgram(), {
    subscriber: publicKey,
    recipientOwner: new PublicKey(args.recipientAddress),
    amountPerInterval: new BN(args.amountPerInterval.toString()),
    intervalSeconds: new BN(args.intervalSeconds.toString()),
    isSpl: args.isSpl,
    tokenMint: new PublicKey(args.tokenMint),
  });
  return client.provider.sendAndConfirm(tx);
}

// ── Cancel subscription ───────────────────────────────────────
// The hook only passes the subscription PDA address; we fetch the
// on-chain account to get recipientProfile for the accounts map.
export async function cancelSubscription(
  client: AnchorClient,
  publicKey: PublicKey,
  subscriptionAddress: string
): Promise<string> {
  const program = client.getProgram();
  const subscriptionPda = new PublicKey(subscriptionAddress);

  const sub = await client.fetchAccount<{ recipientProfile: PublicKey }>(
    'subscription',
    subscriptionPda
  );
  if (!sub) throw new Error('Subscription not found on-chain');

  const methodsNamespace = program.methods as Record<
    string,
    () => {
      accounts: (a: Record<string, PublicKey>) => { transaction: () => Promise<import('@solana/web3.js').Transaction> };
    }
  >;
  const cancelMethod = methodsNamespace['cancelSubscription'];
  if (!cancelMethod) throw new Error('cancelSubscription method not found in program');
  const tx = await cancelMethod()
    .accounts({
      subscriber: publicKey,
      recipientProfile: sub.recipientProfile,
      subscription: subscriptionPda,
      systemProgram: SystemProgram.programId,
    })
    .transaction();

  return client.provider.sendAndConfirm(tx);
}

// ── Configure split ───────────────────────────────────────────
export async function configureSplit(
  client: AnchorClient,
  publicKey: PublicKey,
  recipients: { wallet: string; shareBps: number; label?: string }[]
): Promise<string> {
  const tx = await buildConfigureSplitTx(client.getProgram(), {
    owner: publicKey,
    recipients: recipients.map((r) => ({
      wallet: new PublicKey(r.wallet),
      shareBps: r.shareBps,
    })),
  });
  return client.provider.sendAndConfirm(tx);
}
