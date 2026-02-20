import { PublicKey } from '@solana/web3.js';

// ============================================================
// Program ID
// ============================================================
export const PROGRAM_ID = new PublicKey(
  'BhynwWdN5g5S5FfCEgDovajaYQDq925S2Xs8vXas58uo'
);

// ============================================================
// Networks
// ============================================================
export enum Networks {
  Localnet = 'localnet',
  Devnet = 'devnet',
  MainnetBeta = 'mainnet-beta',
}

// ============================================================
// PDA Seeds  (must match Rust constants.rs byte strings exactly)
// ============================================================
export const SEEDS = {
  TIP_PROFILE: 'tip_profile',
  VAULT: 'vault',
  TIP_GOAL: 'tip_goal',
  SUBSCRIPTION: 'subscription',
  TREASURY: 'treasury',
  TIPPER_RECORD: 'tipper_record',
  TIP_SPLIT: 'tip_split',
  RATE_LIMIT: 'rate_limit',
  PLATFORM_CONFIG: 'platform_config',
  SPL_VAULT: 'spl_vault',
} as const;

export type SeedKey = keyof typeof SEEDS;

// ============================================================
// Numeric Limits  (mirrors constants.rs)
// ============================================================
export const LIMITS = {
  // String lengths
  MAX_USERNAME_LENGTH: 32,
  MAX_DISPLAY_NAME_LENGTH: 64,
  MAX_DESCRIPTION_LENGTH: 256,
  MAX_IMAGE_URL_LENGTH: 200,
  MAX_MESSAGE_LENGTH: 280,
  MAX_GOAL_TITLE_LENGTH: 64,
  MAX_GOAL_DESCRIPTION_LENGTH: 256,
  MAX_SPLIT_LABEL_LENGTH: 32,

  // Financial (lamports)
  MIN_TIP_AMOUNT: BigInt(1_000),
  MAX_TIP_AMOUNT: BigInt(1_000_000_000_000),
  DEFAULT_WITHDRAWAL_FEE_BPS: 200,
  MAX_WITHDRAWAL_FEE_BPS: 1_000,
  MIN_WITHDRAWAL_AMOUNT: BigInt(10_000_000),
  PLATFORM_FEE_BPS: 100,
  MIN_VAULT_RENT_BUFFER: BigInt(1_000_000),

  // Leaderboard / goals / splits
  MAX_TOP_TIPPERS: 10,
  MAX_TOP_CONTRIBUTORS: 10,
  MAX_ACTIVE_GOALS: 5,
  MAX_SPLIT_RECIPIENTS: 5,

  // Rate limiting
  DEFAULT_TIP_COOLDOWN_SECONDS: 3,
  MAX_TIPS_PER_DAY: 100,

  // Time (seconds)
  SECONDS_PER_DAY: 86_400,
  SECONDS_PER_WEEK: 604_800,
  SECONDS_PER_MONTH: 2_592_000,
  MAX_GOAL_DURATION: 31_536_000,

  // BPS
  BPS_DENOMINATOR: 10_000,
} as const;

// ============================================================
// Token Mints
// ============================================================
export const TOKEN_MINTS = {
  devnet: {
    USDC: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
    USDT: new PublicKey('EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS'),
  },
  mainnet: {
    USDC: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    USDT: new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
  },
} as const;

// ============================================================
// SOL system program address (used as token_mint for SOL goals)
// ============================================================
export const NATIVE_MINT = new PublicKey(
  'So11111111111111111111111111111111111111112'
);
