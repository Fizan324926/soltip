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
