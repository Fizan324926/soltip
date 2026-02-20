import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { PlatformConfig } from '../types/anchor';

// ============================================================
// State shape
// ============================================================
interface PlatformState {
  config: PlatformConfig | null;
  isPaused: boolean;
  lastFetchedAt: number | null;

  // Actions
  setConfig: (config: PlatformConfig) => void;
  setPaused: (paused: boolean) => void;
  clear: () => void;
}

// ============================================================
// Store
// ============================================================
export const usePlatformStore = create<PlatformState>()(
  devtools(
    (set) => ({
      config: null,
      isPaused: false,
      lastFetchedAt: null,

      setConfig: (config) =>
        set(
          {
            config,
            isPaused: config.paused,
            lastFetchedAt: Date.now(),
          },
          false,
          'platform/setConfig'
        ),

      setPaused: (paused) =>
        set(
          (state) => ({
            isPaused: paused,
            config: state.config ? { ...state.config, paused } : null,
          }),
          false,
          'platform/setPaused'
        ),

      clear: () =>
        set(
          { config: null, isPaused: false, lastFetchedAt: null },
          false,
          'platform/clear'
        ),
    }),
    { name: 'PlatformStore' }
  )
);

// ============================================================
// Convenience selectors
// ============================================================
export const selectPlatformConfig  = (s: PlatformState) => s.config;
export const selectIsPaused        = (s: PlatformState) => s.isPaused;
export const selectPlatformFeeBps  = (s: PlatformState) =>
  s.config?.platformFeeBps ?? 100;
