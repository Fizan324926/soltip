/**
 * Library barrel export
 */

// Utils
export { cn } from './cn';
export * from './format';
export * from './constants';
export {
  usernameSchema,
  displayNameSchema,
  descriptionSchema,
  imageUrlSchema,
  messageSchema,
  solAmountSchema,
  solanaAddressSchema,
  profileFormSchema,
  tipFormSchema,
  tokenTipFormSchema,
  goalFormSchema,
  subscriptionFormSchema,
  splitConfigSchema,
  pollFormSchema,
  validate,
  sanitizeText,
  type ProfileFormData,
  type TipFormData,
  type TokenTipFormData,
  type GoalFormData,
  type SubscriptionFormData,
  type SplitConfigFormData,
  type PollFormData,
} from './validation';

// Errors
export { parseAnchorError, ANCHOR_ERROR_MAP, ANCHOR_ERROR_BY_NAME } from './errors';

// API
export {
  ApiError,
  NetworkError,
  AuthError,
  RateLimitError,
  ValidationError,
  ServerError,
  setWalletAuthToken,
  getWalletAuthToken,
  profileApi,
  vaultApi,
  tipsApi,
  goalsApi,
  subscriptionsApi,
  splitsApi,
  adminApi,
  pollsApi,
  contentGatesApi,
  referralsApi,
  analyticsApi,
  widgetApi,
  healthApi,
} from './api/client';
