/**
 * Zod Validation Schemas
 *
 * Input validation for all user-facing forms.
 * Security: prevents injection and ensures data integrity.
 */

import { z } from 'zod';

// ============================================================
// Constants
// ============================================================

export const LIMITS = {
  USERNAME_MIN: 3,
  USERNAME_MAX: 32,
  DISPLAY_NAME_MAX: 64,
  DESCRIPTION_MAX: 256,
  IMAGE_URL_MAX: 200,
  MESSAGE_MAX: 280,
  GOAL_TITLE_MAX: 64,
  GOAL_DESCRIPTION_MAX: 256,
  MIN_TIP_SOL: 0.001,
  MAX_TIP_SOL: 1000,
  MIN_WITHDRAWAL_SOL: 0.01,
} as const;

// ============================================================
// Common Validators
// ============================================================

export const usernameSchema = z
  .string()
  .min(LIMITS.USERNAME_MIN, `Username must be at least ${LIMITS.USERNAME_MIN} characters`)
  .max(LIMITS.USERNAME_MAX, `Username must be at most ${LIMITS.USERNAME_MAX} characters`)
  .regex(
    /^[a-z0-9_]+$/,
    'Username can only contain lowercase letters, numbers, and underscores',
  )
  .transform((s) => s.toLowerCase());

export const displayNameSchema = z
  .string()
  .min(1, 'Display name is required')
  .max(LIMITS.DISPLAY_NAME_MAX, `Display name must be at most ${LIMITS.DISPLAY_NAME_MAX} characters`)
  .transform((s) => s.trim());

export const descriptionSchema = z
  .string()
  .max(LIMITS.DESCRIPTION_MAX, `Description must be at most ${LIMITS.DESCRIPTION_MAX} characters`)
  .transform((s) => s.trim())
  .optional();

export const imageUrlSchema = z
  .string()
  .max(LIMITS.IMAGE_URL_MAX, `Image URL must be at most ${LIMITS.IMAGE_URL_MAX} characters`)
  .url('Must be a valid URL')
  .refine(
    (url) => url.startsWith('https://') || url.startsWith('ipfs://'),
    'Image URL must use HTTPS or IPFS',
  )
  .optional()
  .or(z.literal(''));

export const messageSchema = z
  .string()
  .max(LIMITS.MESSAGE_MAX, `Message must be at most ${LIMITS.MESSAGE_MAX} characters`)
  .transform((s) => s.trim())
  .optional();

export const solAmountSchema = z
  .number()
  .positive('Amount must be positive')
  .min(LIMITS.MIN_TIP_SOL, `Minimum amount is ${LIMITS.MIN_TIP_SOL} SOL`)
  .max(LIMITS.MAX_TIP_SOL, `Maximum amount is ${LIMITS.MAX_TIP_SOL} SOL`);

export const solanaAddressSchema = z
  .string()
  .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid Solana address');

// ============================================================
// Form Schemas
// ============================================================

export const profileFormSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
  description: descriptionSchema,
  imageUrl: imageUrlSchema,
});

export const tipFormSchema = z.object({
  amount: solAmountSchema,
  message: messageSchema,
  recipientAddress: solanaAddressSchema,
});

export const tokenTipFormSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  tokenMint: solanaAddressSchema,
  message: messageSchema,
  recipientAddress: solanaAddressSchema,
});

export const goalFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(LIMITS.GOAL_TITLE_MAX, `Title must be at most ${LIMITS.GOAL_TITLE_MAX} characters`)
    .transform((s) => s.trim()),
  description: z
    .string()
    .max(LIMITS.GOAL_DESCRIPTION_MAX, `Description must be at most ${LIMITS.GOAL_DESCRIPTION_MAX} characters`)
    .transform((s) => s.trim())
    .optional(),
  targetAmount: z
    .number()
    .positive('Target amount must be positive')
    .max(LIMITS.MAX_TIP_SOL * 10, 'Target amount too large'),
  deadlineTimestamp: z
    .number()
    .int()
    .positive()
    .refine(
      (ts) => ts > Date.now() / 1000,
      'Deadline must be in the future',
    )
    .optional(),
});

export const subscriptionFormSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .min(LIMITS.MIN_TIP_SOL, `Minimum amount is ${LIMITS.MIN_TIP_SOL} SOL`),
  intervalDays: z
    .number()
    .int()
    .min(1, 'Minimum interval is 1 day')
    .max(365, 'Maximum interval is 365 days'),
  recipientAddress: solanaAddressSchema,
});

export const splitRecipientSchema = z.object({
  wallet: solanaAddressSchema,
  shareBps: z
    .number()
    .int()
    .min(1, 'Share must be at least 0.01%')
    .max(10000, 'Share cannot exceed 100%'),
  label: z
    .string()
    .max(32, 'Label too long')
    .optional(),
});

export const splitConfigSchema = z.object({
  recipients: z
    .array(splitRecipientSchema)
    .min(1, 'At least one recipient required')
    .max(5, 'Maximum 5 recipients')
    .refine(
      (recipients) => {
        const total = recipients.reduce((sum, r) => sum + r.shareBps, 0);
        return total === 10000;
      },
      'Shares must add up to 100%',
    ),
});

export const pollFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(128, 'Title too long')
    .transform((s) => s.trim()),
  description: z.string().max(256, 'Description too long').optional(),
  options: z
    .array(z.string().min(1, 'Option cannot be empty').max(64, 'Option too long'))
    .min(2, 'At least 2 options required')
    .max(10, 'Maximum 10 options'),
  deadlineTimestamp: z
    .number()
    .int()
    .positive()
    .refine((ts) => ts > Date.now() / 1000, 'Deadline must be in the future')
    .optional(),
});

// ============================================================
// Type Exports
// ============================================================

export type ProfileFormData = z.infer<typeof profileFormSchema>;
export type TipFormData = z.infer<typeof tipFormSchema>;
export type TokenTipFormData = z.infer<typeof tokenTipFormSchema>;
export type GoalFormData = z.infer<typeof goalFormSchema>;
export type SubscriptionFormData = z.infer<typeof subscriptionFormSchema>;
export type SplitConfigFormData = z.infer<typeof splitConfigSchema>;
export type PollFormData = z.infer<typeof pollFormSchema>;

// ============================================================
// Validation Helpers
// ============================================================

/**
 * Validate data and return result with errors.
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    errors[path || '_root'] = issue.message;
  }

  return { success: false, errors };
}

/**
 * Sanitize user text input.
 */
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .slice(0, 1000); // Hard limit
}
