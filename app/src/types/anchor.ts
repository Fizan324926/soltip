import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

// ============================================================
// LeaderboardEntry  (inline struct in TipProfile)
// ============================================================
export interface LeaderboardEntry {
  tipper: PublicKey;
  totalAmount: BN;   // u64
  tipCount: number;  // u32
}

// ============================================================
// TipProfile  (tip_profile PDA)
// ============================================================
export interface TipProfile {
  owner: PublicKey;
  username: string;
  displayName: string;
  description: string;
  imageUrl: string;

  // Stats
  totalTipsReceived: BN;            // u64
  totalAmountReceivedLamports: BN;  // u64
  totalAmountReceivedSpl: BN;       // u64
  totalUniqueTippers: number;       // u32
  activeGoalsCount: number;         // u8

  // Config
  minTipAmount: BN;          // u64
  withdrawalFeeBps: number;  // u16
  acceptAnonymous: boolean;
  isVerified: boolean;

  // Security
  reentrancyGuard: boolean;

  // Timestamps
  createdAt: BN;   // i64
  updatedAt: BN;   // i64

  bump: number;    // u8

  // On-chain leaderboard
  topTippers: LeaderboardEntry[];
}

// ============================================================
// Vault  (vault PDA)
// ============================================================
export interface Vault {
  owner: PublicKey;
  balance: BN;          // u64  – current escrowed balance (lamports)
  totalDeposited: BN;   // u64  – lifetime deposits
  totalWithdrawn: BN;   // u64  – lifetime withdrawals
  createdAt: BN;        // i64
  bump: number;         // u8
}

// ============================================================
// TipGoal  (tip_goal PDA)
// ============================================================
export interface TipGoal {
  profile: PublicKey;
  goalId: BN;                  // u64
  title: string;
  description: string;
  targetAmount: BN;            // u64
  currentAmount: BN;           // u64
  tokenMint: PublicKey;
  deadline: BN | null;         // Option<i64>
  completed: boolean;
  completedAt: BN | null;      // Option<i64>
  uniqueContributors: number;  // u32
  createdAt: BN;               // i64
  bump: number;                // u8
}

// ============================================================
// Subscription  (subscription PDA)
// ============================================================
export interface Subscription {
  subscriber: PublicKey;
  recipientProfile: PublicKey;
  amountPerInterval: BN;   // u64
  intervalSeconds: BN;     // i64
  nextPaymentDue: BN;      // i64
  autoRenew: boolean;
  totalPaid: BN;           // u64
  paymentCount: number;    // u32
  createdAt: BN;           // i64
  lastPaymentAt: BN;       // i64
  isActive: boolean;
  isSpl: boolean;
  tokenMint: PublicKey;
  bump: number;            // u8
}

// ============================================================
// TipperRecord  (tipper_record PDA)
// ============================================================
export interface TipperRecord {
  tipper: PublicKey;
  recipientProfile: PublicKey;
  totalAmount: BN;     // u64
  tipCount: number;    // u32
  firstTipAt: BN;      // i64
  lastTipAt: BN;       // i64
  bump: number;        // u8
}

// ============================================================
// SplitRecipient  (inline struct in TipSplit)
// ============================================================
export interface SplitRecipient {
  wallet: PublicKey;
  shareBps: number;   // u16
}

// ============================================================
// TipSplit  (tip_split PDA)
// ============================================================
export interface TipSplit {
  profile: PublicKey;
  numRecipients: number;          // u8
  recipients: SplitRecipient[];
  isActive: boolean;
  bump: number;                   // u8
}

// ============================================================
// RateLimit  (rate_limit PDA)
// ============================================================
export interface RateLimit {
  tipper: PublicKey;
  recipient: PublicKey;
  lastTipAt: BN;       // i64
  tipCountToday: number; // u32
  windowStart: BN;     // i64
  bump: number;        // u8
}

// ============================================================
// PlatformConfig  (platform_config PDA)
// ============================================================
export interface PlatformConfig {
  authority: PublicKey;
  treasury: PublicKey;
  platformFeeBps: number;  // u16
  paused: boolean;
  createdAt: BN;           // i64
  bump: number;            // u8
}

// ============================================================
// Decoded account wrapper (includes the on-chain public key)
// ============================================================
export interface DecodedAccount<T> {
  publicKey: PublicKey;
  account: T;
}

export type TipProfileAccount    = DecodedAccount<TipProfile>;
export type VaultAccount         = DecodedAccount<Vault>;
export type TipGoalAccount       = DecodedAccount<TipGoal>;
export type SubscriptionAccount  = DecodedAccount<Subscription>;
export type TipperRecordAccount  = DecodedAccount<TipperRecord>;
export type TipSplitAccount      = DecodedAccount<TipSplit>;
export type RateLimitAccount     = DecodedAccount<RateLimit>;
export type PlatformConfigAccount = DecodedAccount<PlatformConfig>;
