import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UiState {
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
  activeTipModal: string | null;

  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  openTipModal: (profilePubkey: string) => void;
  closeTipModal: () => void;
}

export const useUiStore = create<UiState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'light',
        sidebarOpen: false,
        activeTipModal: null,

        toggleTheme: () =>
          set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

        setTheme: (theme) => set({ theme }),

        setSidebarOpen: (open) => set({ sidebarOpen: open }),

        toggleSidebar: () =>
          set((state) => ({ sidebarOpen: !state.sidebarOpen })),

        openTipModal: (profilePubkey) =>
          set({ activeTipModal: profilePubkey }),

        closeTipModal: () => set({ activeTipModal: null }),
      }),
      {
        name: 'soltip-ui',
        partialize: (state) => ({ theme: state.theme }),
      }
    ),
    { name: 'UiStore' }
  )
);

export const selectTheme          = (s: UiState) => s.theme;
export const selectSidebarOpen    = (s: UiState) => s.sidebarOpen;
export const selectActiveTipModal = (s: UiState) => s.activeTipModal;
