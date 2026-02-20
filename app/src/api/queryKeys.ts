import type { Network } from '../types/common';

// ============================================================
// Query key factory for TanStack Query v5
//
// All keys are typed tuples so TypeScript catches typos.
// Follows the "key factory" pattern recommended by TKDodo:
//   https://tkdodo.eu/blog/effective-react-query-keys
//
// Usage examples:
//   queryClient.invalidateQueries({ queryKey: queryKeys.profile.all })
//   useQuery({ queryKey: queryKeys.profile.byOwner(address) })
// ============================================================

export const queryKeys = {
  // ----------------------------------------------------------
  // Profile
  // ----------------------------------------------------------
  profile: {
    /** Matches all profile queries (for broad invalidation) */
    all: ['profiles'] as const,

    /** List of profiles with optional filter params */
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.profile.all, 'list', filters ?? {}] as const,

    /** Single profile by owner wallet address */
    byOwner: (ownerAddress: string) =>
      [...queryKeys.profile.all, 'byOwner', ownerAddress] as const,

    /** Single profile by username slug */
    byUsername: (username: string) =>
      [...queryKeys.profile.all, 'byUsername', username] as const,
  },

  // ----------------------------------------------------------
  // Vault
  // ----------------------------------------------------------
  vault: {
    all: ['vaults'] as const,

    /** Vault for a given profile PDA address */
    byProfile: (profilePda: string) =>
      [...queryKeys.vault.all, 'byProfile', profilePda] as const,
  },

  // ----------------------------------------------------------
  // Goals
  // ----------------------------------------------------------
  goals: {
    all: ['goals'] as const,

    /** All goals for a given profile PDA */
    byProfile: (profilePda: string) =>
      [...queryKeys.goals.all, 'byProfile', profilePda] as const,

    /** Single goal by its PDA address */
    byPda: (goalPda: string) =>
      [...queryKeys.goals.all, 'byPda', goalPda] as const,
  },

  // ----------------------------------------------------------
  // Subscription
  // ----------------------------------------------------------
  subscription: {
    all: ['subscriptions'] as const,

    /** Subscription between a specific (subscriber, profile) pair */
    byPair: (subscriberAddress: string, profilePda: string) =>
      [
        ...queryKeys.subscription.all,
        'byPair',
        subscriberAddress,
        profilePda,
      ] as const,

    /** All subscriptions for a given subscriber wallet */
    bySubscriber: (subscriberAddress: string) =>
      [
        ...queryKeys.subscription.all,
        'bySubscriber',
        subscriberAddress,
      ] as const,

    /** All subscriptions pointing to a given profile */
    byProfile: (profilePda: string) =>
      [...queryKeys.subscription.all, 'byProfile', profilePda] as const,
  },

  // ----------------------------------------------------------
  // TipSplit
  // ----------------------------------------------------------
  tipSplit: {
    all: ['tipSplits'] as const,

    /** Split config for a given profile PDA */
    byProfile: (profilePda: string) =>
      [...queryKeys.tipSplit.all, 'byProfile', profilePda] as const,
  },

  // ----------------------------------------------------------
  // Platform
  // ----------------------------------------------------------
  platform: {
    all: ['platform'] as const,

    /** PlatformConfig PDA (singleton) */
    config: (network?: Network) =>
      [...queryKeys.platform.all, 'config', network ?? 'devnet'] as const,
  },

  // ----------------------------------------------------------
  // TipperRecord
  // ----------------------------------------------------------
  tipperRecord: {
    all: ['tipperRecords'] as const,

    /** Record for a specific (tipper, profile) pair */
    byPair: (tipperAddress: string, profilePda: string) =>
      [
        ...queryKeys.tipperRecord.all,
        'byPair',
        tipperAddress,
        profilePda,
      ] as const,

    /** All tipper records for a given profile (leaderboard source) */
    byProfile: (profilePda: string) =>
      [...queryKeys.tipperRecord.all, 'byProfile', profilePda] as const,
  },

  // ----------------------------------------------------------
  // RateLimit
  // ----------------------------------------------------------
  rateLimit: {
    all: ['rateLimits'] as const,

    /** Rate-limit PDA for a (tipper, profile) pair */
    byPair: (tipperAddress: string, profilePda: string) =>
      [
        ...queryKeys.rateLimit.all,
        'byPair',
        tipperAddress,
        profilePda,
      ] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
