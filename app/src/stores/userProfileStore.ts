import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { TipProfile, Vault } from '../types/anchor';

// ============================================================
// State shape
// ============================================================
interface UserProfileState {
  profile: TipProfile | null;
  vault: Vault | null;
  hasProfile: boolean;
  isLoading: boolean;
  lastFetchedAt: number | null;

  // Actions
  setProfile: (profile: TipProfile | null) => void;
  setVault: (vault: Vault | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

// ============================================================
// Store (devtools only in development)
// ============================================================
const storeImpl = (set: any) => ({
  profile: null,
  vault: null,
  hasProfile: false,
  isLoading: false,
  lastFetchedAt: null,

  setProfile: (profile: TipProfile | null) =>
    set(
      {
        profile,
        hasProfile: profile !== null,
        lastFetchedAt: Date.now(),
      },
      false,
      'userProfile/setProfile'
    ),

  setVault: (vault: Vault | null) =>
    set({ vault }, false, 'userProfile/setVault'),

  setLoading: (isLoading: boolean) =>
    set({ isLoading }, false, 'userProfile/setLoading'),

  clear: () =>
    set(
      {
        profile: null,
        vault: null,
        hasProfile: false,
        isLoading: false,
        lastFetchedAt: null,
      },
      false,
      'userProfile/clear'
    ),
});

export const useUserProfileStore = create<UserProfileState>()(
  import.meta.env.DEV
    ? devtools(storeImpl, { name: 'UserProfileStore' })
    : storeImpl
);

// ============================================================
// Convenience selectors
// ============================================================
export const selectProfile    = (s: UserProfileState) => s.profile;
export const selectVault      = (s: UserProfileState) => s.vault;
export const selectHasProfile = (s: UserProfileState) => s.hasProfile;
