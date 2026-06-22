// ============================================================
// SolTip – Hooks barrel export
// ============================================================

export { useWallet, type UseWalletReturn }                   from './useWallet';
export { useAnchorClient }                                   from './useAnchorClient';
export { useDebounce }                                       from './useDebounce';
export { useClipboard, type UseClipboardReturn }             from './useClipboard';
export { useLocalStorage }                                   from './useLocalStorage';
export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
}                                                            from './useMediaQuery';
export { useInterval }                                       from './useInterval';
export {
  useTransactionConfirmation,
  type ConfirmationResult,
  type UseTransactionConfirmationReturn,
}                                                            from './useTransactionConfirmation';
export {
  useErrorHandler,
  getErrorMessage,
  isRetryableError,
}                                                            from './useErrorHandler';
export {
  useRateLimitedAction,
  useDebouncedCallback,
}                                                            from './useRateLimitedAction';
