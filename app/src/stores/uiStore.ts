import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ============================================================
// State shape
// ============================================================
interface UiState {
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
  activeTipModal: string | null;  // profile public key string, or null

  // Actions
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  openTipModal: (profilePubkey: string) => void;
  closeTipModal: () => void;
}

// ============================================================
// Store (devtools only in development)
// ============================================================
const persistedStore = persist<UiState>(
  (set) => ({
    theme: 'light',
    sidebarOpen: false,
    activeTipModal: null,

    toggleTheme: () =>
      set(
        (state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' }),
        false,
        'ui/toggleTheme'
      ),

    setTheme: (theme) =>
      set({ theme }, false, 'ui/setTheme'),

    setSidebarOpen: (open) =>
      set({ sidebarOpen: open }, false, 'ui/setSidebarOpen'),

    toggleSidebar: () =>
      set(
        (state) => ({ sidebarOpen: !state.sidebarOpen }),
        false,
        'ui/toggleSidebar'
      ),

    openTipModal: (profilePubkey) =>
      set(
        { activeTipModal: profilePubkey },
        false,
        'ui/openTipModal'
      ),

    closeTipModal: () =>
      set({ activeTipModal: null }, false, 'ui/closeTipModal'),
  }),
  {
    name: 'soltip-ui',
    partialize: (state) => ({ theme: state.theme }),
  }
);

export const useUiStore = create<UiState>()(
  import.meta.env.DEV
    ? devtools(persistedStore, { name: 'UiStore' })
    : persistedStore
);

// ============================================================
// Convenience selectors
// ============================================================
export const selectTheme          = (s: UiState) => s.theme;
export const selectSidebarOpen    = (s: UiState) => s.sidebarOpen;
export const selectActiveTipModal = (s: UiState) => s.activeTipModal;
