// ============================================================
// Stores barrel – re-export all store hooks and selectors
// ============================================================

export {
  useWalletStore,
  selectPublicKey,
  selectConnected,
  selectNetwork,
} from './walletStore';

export {
  usePlatformStore,
  selectPlatformConfig,
  selectIsPaused,
  selectPlatformFeeBps,
} from './platformStore';

export {
  useUserProfileStore,
  selectProfile,
  selectVault,
  selectHasProfile,
} from './userProfileStore';

export {
  useUiStore,
  selectTheme,
  selectSidebarOpen,
  selectActiveTipModal,
} from './uiStore';
