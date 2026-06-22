/**
 * Application Constants
 *
 * Centralized configuration values to avoid magic numbers.
 */

// ============================================================
// API & Network
// ============================================================

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const SOLANA_RPC_URL =
  import.meta.env.VITE_RPC_URL || 'https://api.devnet.solana.com';

export const PROGRAM_ID = import.meta.env.VITE_PROGRAM_ID || '';

// ============================================================
// Query Cache Times
// ============================================================

export const CACHE_TIMES = {
  /** Profile data - changes rarely */
  PROFILE: 5 * 60 * 1000, // 5 minutes

  /** Vault balance - changes with tips/withdrawals */
  VAULT: 60 * 1000, // 1 minute

  /** Goals - changes with contributions */
  GOALS: 2 * 60 * 1000, // 2 minutes

  /** Tips history - append only */
  TIPS: 60 * 1000, // 1 minute

  /** Platform config - changes rarely */
  PLATFORM: 10 * 60 * 1000, // 10 minutes

  /** SOL price - external API */
  PRICE: 30 * 1000, // 30 seconds

  /** Leaderboard */
  LEADERBOARD: 5 * 60 * 1000, // 5 minutes

  /** Analytics */
  ANALYTICS: 5 * 60 * 1000, // 5 minutes
} as const;

// ============================================================
// UI Defaults
// ============================================================

export const TIP_PRESETS = [0.1, 0.5, 1, 5] as const;

export const SUBSCRIPTION_INTERVALS = [
  { label: 'Weekly', days: 7 },
  { label: 'Bi-weekly', days: 14 },
  { label: 'Monthly', days: 30 },
] as const;

export const PAGE_SIZE = {
  PROFILES: 20,
  TIPS: 25,
  GOALS: 10,
} as const;

// ============================================================
// Limits
// ============================================================

export const LIMITS = {
  // Text lengths (bytes)
  USERNAME_MIN: 3,
  USERNAME_MAX: 32,
  DISPLAY_NAME_MAX: 64,
  DESCRIPTION_MAX: 256,
  IMAGE_URL_MAX: 200,
  MESSAGE_MAX: 280,
  GOAL_TITLE_MAX: 64,
  GOAL_DESCRIPTION_MAX: 256,

  // Amounts (SOL)
  MIN_TIP: 0.001,
  MAX_TIP: 1000,
  MIN_WITHDRAWAL: 0.01,
  MAX_GOAL_TARGET: 10000,

  // Counts
  MAX_ACTIVE_GOALS: 5,
  MAX_SPLIT_RECIPIENTS: 5,
  MAX_POLL_OPTIONS: 10,

  // Time
  MAX_GOAL_DURATION_DAYS: 365,
  MIN_SUBSCRIPTION_INTERVAL_DAYS: 1,
  MAX_SUBSCRIPTION_INTERVAL_DAYS: 365,
} as const;

// ============================================================
// Rate Limiting
// ============================================================

export const RATE_LIMITS = {
  /** Debounce between tip submissions */
  TIP_COOLDOWN_MS: 2000,

  /** Debounce for search input */
  SEARCH_DEBOUNCE_MS: 300,

  /** Debounce for form validation */
  VALIDATION_DEBOUNCE_MS: 150,
} as const;

// ============================================================
// Feature Flags
// ============================================================

export const FEATURES = {
  ENABLE_SPL_TOKENS: true,
  ENABLE_SUBSCRIPTIONS: true,
  ENABLE_GOALS: true,
  ENABLE_POLLS: true,
  ENABLE_CONTENT_GATES: true,
  ENABLE_REFERRALS: true,
  ENABLE_SPLITS: true,
} as const;

// ============================================================
// External Links
// ============================================================

export const EXTERNAL_LINKS = {
  GITHUB: 'https://github.com/Fizan324926/soltip',
  SOLANA_EXPLORER: 'https://explorer.solana.com',
  SOLANA_DOCS: 'https://docs.solana.com',
} as const;

// ============================================================
// Animation
// ============================================================

export const ANIMATION = {
  DURATION_FAST: 150,
  DURATION_NORMAL: 200,
  DURATION_SLOW: 300,
  EASE_OUT: [0.25, 0.46, 0.45, 0.94] as const,
  EASE_SPRING: [0.34, 1.56, 0.64, 1] as const,
} as const;
