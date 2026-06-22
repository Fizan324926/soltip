// ============================================================
// Common application-level enums and types
// ============================================================

// ============================================================
// Network
// ============================================================
export type Network = 'localnet' | 'devnet' | 'mainnet-beta';

// ============================================================
// Sort order
// ============================================================
export type SortOrder = 'asc' | 'desc';

// ============================================================
// Token type (SOL or SPL)
// ============================================================
export type TokenType = 'SOL' | 'USDC' | 'USDT';

// ============================================================
// Tip type
// ============================================================
export type TipType = 'direct' | 'split' | 'spl';

// ============================================================
// Goal status (derived from on-chain data, not stored)
// ============================================================
export type GoalStatus = 'active' | 'completed' | 'expired';

// ============================================================
// Creator filter options (for browsing creator lists)
// ============================================================
export interface CreatorFilters {
  search?: string;
  sortBy?: 'totalTips' | 'totalAmount' | 'createdAt' | 'username';
  sortOrder?: SortOrder;
  onlyVerified?: boolean;
  minTipsReceived?: number;
}

// ============================================================
// Pagination
// ============================================================
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

// ============================================================
// Transaction status
// ============================================================
export type TransactionStatus =
  | 'idle'
  | 'pending'
  | 'confirming'
  | 'confirmed'
  | 'failed';

export interface TransactionState {
  status: TransactionStatus;
  signature?: string;
  error?: string;
}

// ============================================================
// Tip form inputs
// ============================================================
export interface SendTipInput {
  recipientProfile: string; // base58 PublicKey
  amount: number;           // in SOL (float)
  message?: string;
  tokenType?: TokenType;
  tipType?: TipType;
}

// ============================================================
// Goal creation inputs
// ============================================================
export interface CreateGoalInput {
  title: string;
  description: string;
  targetAmount: number;    // in SOL or token units
  tokenType: TokenType;
  deadlineDate?: Date;
}

// ============================================================
// Subscription creation inputs
// ============================================================
export interface CreateSubscriptionInput {
  recipientProfile: string;
  amountPerInterval: number;
  intervalDays: number;
  isSpl: boolean;
  tokenType?: TokenType;
}

// ============================================================
// Split recipient input
// ============================================================
export interface SplitRecipientInput {
  wallet: string;  // base58 PublicKey
  shareBps: number; // 0–10000
  label?: string;
}

// ============================================================
// Profile update inputs
// ============================================================
export interface UpdateProfileInput {
  displayName?: string;
  description?: string;
  imageUrl?: string;
  minTipAmount?: number;     // in SOL
  withdrawalFeeBps?: number;
  acceptAnonymous?: boolean;
}

// ============================================================
// Leaderboard display entry
// ============================================================
export interface LeaderboardDisplayEntry {
  rank: number;
  tipperAddress: string;
  totalAmountSol: string;
  tipCount: number;
}

// ============================================================
// API Response Types (from backend)
// ============================================================

export interface ProfileResponse {
  ownerAddress: string;
  username: string;
  displayName: string;
  description: string;
  imageUrl: string;
  isVerified: boolean;
  totalTipsReceived: bigint;
  totalAmountReceivedLamports: bigint;
  totalUniqueTippers: number;
  leaderboard: LeaderboardEntry[];
  createdAt: string;
}

export interface LeaderboardEntry {
  tipper: string;
  totalAmount: bigint;
  tipCount: number;
  lastTipAt?: string;
}

export interface VaultResponse {
  profilePda: string;
  balance: bigint;
  totalDeposited: bigint;
  totalWithdrawn: bigint;
  splBalances: SplBalance[];
}

export interface SplBalance {
  mint: string;
  balance: bigint;
}

export interface TipResponse {
  txSignature: string;
  tipperAddress: string;
  recipientAddress: string;
  amountLamports: bigint;
  message?: string;
  isAnonymous: boolean;
  createdAt: string;
}

export interface GoalResponse {
  publicKey: string;
  goalId: number;
  title: string;
  description: string;
  targetAmount: bigint;
  currentAmount: bigint;
  tokenMint: string;
  deadline?: number;
  completed: boolean;
  createdAt: string;
}

export interface SubscriptionResponse {
  subscriptionPda: string;
  subscriber: string;
  recipient: string;
  amountPerInterval: bigint;
  intervalSeconds: number;
  nextPaymentAt: number;
  isActive: boolean;
  totalPaid: bigint;
}

export interface SplitResponse {
  splitPda: string;
  recipients: SplitRecipient[];
}

export interface SplitRecipient {
  wallet: string;
  shareBps: number;
  label: string;
}

export interface PollResponse {
  pollId: number;
  title: string;
  description?: string;
  options: string[];
  votes: number[];
  totalVotes: number;
  deadline?: number;
  isActive: boolean;
}

export interface ContentGateResponse {
  gateId: number;
  title: string;
  contentHash: string;
  requiredAmount: bigint;
  totalUnlocks: number;
  isActive: boolean;
}

export interface ReferralResponse {
  refereeProfile: string;
  feeShareBps: number;
  totalEarned: bigint;
  referralCount: number;
  createdAt: string;
}

export interface AnalyticsResponse {
  summary: {
    totalTips: number;
    totalAmount: bigint;
    uniqueTippers: number;
    avgTipAmount: bigint;
  };
  daily: DailyAnalytics[];
}

export interface DailyAnalytics {
  date: string;
  tipCount: number;
  amount: bigint;
  uniqueTippers: number;
}

export interface PlatformConfigResponse {
  paused: boolean;
  platformFeeBps: number;
  minTipLamports: bigint;
  maxTipLamports: bigint;
}

// ============================================================
// Anchor Account Wrapper (for on-chain data)
// ============================================================

export interface AnchorAccountWrapper<T> {
  publicKey: { toBase58(): string };
  account: T;
}

export type CreatorAccount = AnchorAccountWrapper<ProfileResponse>;
export type GoalAccount = AnchorAccountWrapper<GoalResponse>;
export type SubscriptionAccount = AnchorAccountWrapper<SubscriptionResponse>;
