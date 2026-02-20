// ============================================================
// Anchor error code mapping for SolTip
//
// Anchor assigns error codes starting at 6000 for #[error_code] enums.
// Each variant gets the next sequential code in declaration order.
// Refer to programs/soltip/src/error.rs for the source of truth.
// ============================================================

export interface AnchorErrorInfo {
  code: number;
  name: string;
  message: string;
}

// ============================================================
// Error code map: code => human-readable info
// Order matches error.rs declaration order (6000 = first variant)
// ============================================================
export const ANCHOR_ERROR_MAP: Record<number, AnchorErrorInfo> = {
  // ---- Input Validation (6000–6009) ----
  6000: { code: 6000, name: 'UsernameTooLong',       message: 'Username is too long (max 32 characters)' },
  6001: { code: 6001, name: 'DisplayNameTooLong',    message: 'Display name is too long (max 64 characters)' },
  6002: { code: 6002, name: 'DescriptionTooLong',    message: 'Description is too long (max 256 characters)' },
  6003: { code: 6003, name: 'ImageUrlTooLong',       message: 'Image URL is too long (max 200 characters)' },
  6004: { code: 6004, name: 'MessageTooLong',        message: 'Tip message is too long (max 280 characters)' },
  6005: { code: 6005, name: 'GoalTitleTooLong',      message: 'Goal title is too long (max 64 characters)' },
  6006: { code: 6006, name: 'GoalDescriptionTooLong', message: 'Goal description is too long (max 256 characters)' },
  6007: { code: 6007, name: 'InvalidUsername',       message: 'Username contains invalid characters (use lowercase letters, digits, and underscores only)' },
  6008: { code: 6008, name: 'UnsafeTextContent',     message: 'Text contains unsafe characters' },
  6009: { code: 6009, name: 'EmptyUsername',         message: 'Username cannot be empty' },

  // ---- Financial (6010–6017) ----
  6010: { code: 6010, name: 'TipAmountTooSmall',     message: 'Tip amount is below the minimum' },
  6011: { code: 6011, name: 'TipAmountTooLarge',     message: 'Tip amount exceeds the maximum (1000 SOL)' },
  6012: { code: 6012, name: 'WithdrawalTooSmall',    message: 'Withdrawal amount is below the minimum (0.01 SOL)' },
  6013: { code: 6013, name: 'InsufficientBalance',   message: 'Insufficient balance in vault' },
  6014: { code: 6014, name: 'InvalidWithdrawalFee',  message: 'Withdrawal fee must be between 0% and 10%' },
  6015: { code: 6015, name: 'InvalidGoalAmount',     message: 'Goal target amount must be greater than zero' },
  6016: { code: 6016, name: 'InvalidMinTipAmount',   message: 'Minimum tip amount is invalid' },
  6017: { code: 6017, name: 'VaultBelowRentBuffer',  message: 'Vault balance would fall below the rent-exempt buffer' },

  // ---- Authorization (6018–6022) ----
  6018: { code: 6018, name: 'Unauthorized',          message: 'Not authorized to perform this action' },
  6019: { code: 6019, name: 'NotProfileOwner',       message: 'Only the profile owner can perform this action' },
  6020: { code: 6020, name: 'NotGoalOwner',          message: 'Only the goal creator can perform this action' },
  6021: { code: 6021, name: 'NotSubscriber',         message: 'Only the subscriber can perform this action' },
  6022: { code: 6022, name: 'NotAdmin',              message: 'Only the platform admin can perform this action' },
  6023: { code: 6023, name: 'ProfileOwnerMismatch',  message: 'Profile owner does not match' },

  // ---- State (6024–6034) ----
  6024: { code: 6024, name: 'UsernameAlreadyTaken',  message: 'That username is already taken' },
  6025: { code: 6025, name: 'GoalAlreadyCompleted',  message: 'This goal has already been completed' },
  6026: { code: 6026, name: 'GoalDeadlineExpired',   message: 'The goal deadline has expired' },
  6027: { code: 6027, name: 'InvalidGoalDeadline',   message: 'Goal deadline must be in the future' },
  6028: { code: 6028, name: 'GoalDurationTooLong',   message: 'Goal duration exceeds the maximum of 1 year' },
  6029: { code: 6029, name: 'MaxActiveGoalsReached', message: 'Maximum active goals reached (5). Complete or close an existing goal first.' },
  6030: { code: 6030, name: 'SubscriptionNotActive', message: 'Subscription is not active' },
  6031: { code: 6031, name: 'SubscriptionNotDue',    message: 'Subscription payment is not yet due' },
  6032: { code: 6032, name: 'CannotTipSelf',         message: 'You cannot tip yourself' },
  6033: { code: 6033, name: 'VaultNotInitialized',   message: 'Vault is not initialized — call initialize_vault first' },
  6034: { code: 6034, name: 'PlatformPaused',        message: 'The platform is currently paused for maintenance' },

  // ---- Rate Limiting (6035–6036) ----
  6035: { code: 6035, name: 'RateLimitExceeded',     message: 'Too many tips — please wait for the cooldown period to end' },
  6036: { code: 6036, name: 'DailyLimitExceeded',    message: 'Daily tip limit reached (100 tips per day)' },

  // ---- Math (6037–6040) ----
  6037: { code: 6037, name: 'MathOverflow',          message: 'Arithmetic overflow' },
  6038: { code: 6038, name: 'MathUnderflow',         message: 'Arithmetic underflow' },
  6039: { code: 6039, name: 'DivisionByZero',        message: 'Division by zero' },
  6040: { code: 6040, name: 'InvalidCalculation',    message: 'Invalid calculation result' },

  // ---- Feature Flags (6041–6046) ----
  6041: { code: 6041, name: 'SubscriptionsDisabled', message: 'Subscriptions are currently disabled' },
  6042: { code: 6042, name: 'GoalsDisabled',         message: 'Goals are currently disabled' },
  6043: { code: 6043, name: 'AnonymousTipsDisabled', message: 'This creator does not accept anonymous tips' },
  6044: { code: 6044, name: 'MultiTokenDisabled',    message: 'Multi-token tips are currently disabled' },
  6045: { code: 6045, name: 'TipSplitsDisabled',     message: 'Tip splits are currently disabled' },
  6046: { code: 6046, name: 'FeatureNotImplemented', message: 'This feature is not yet implemented' },

  // ---- Token (6047–6051) ----
  6047: { code: 6047, name: 'InvalidTokenMint',             message: 'Invalid token mint address' },
  6048: { code: 6048, name: 'TokenMintMismatch',            message: 'Token mint does not match expected' },
  6049: { code: 6049, name: 'InsufficientTokenBalance',     message: 'Insufficient token balance' },
  6050: { code: 6050, name: 'InvalidTokenAccount',          message: 'Invalid token account' },
  6051: { code: 6051, name: 'TokenAccountOwnerMismatch',    message: 'Token account owner does not match' },

  // ---- Splits (6052–6056) ----
  6052: { code: 6052, name: 'InvalidSplitBps',       message: 'Split percentages must add up to exactly 100%' },
  6053: { code: 6053, name: 'TooManySplitRecipients', message: 'Too many split recipients (maximum 5)' },
  6054: { code: 6054, name: 'SplitNotFound',         message: 'No split configuration found for this profile' },
  6055: { code: 6055, name: 'SplitRecipientMismatch', message: 'Split recipient does not match configuration' },
  6056: { code: 6056, name: 'DuplicateSplitRecipient', message: 'Duplicate recipient in split configuration' },

  // ---- Reentrancy (6057) ----
  6057: { code: 6057, name: 'ReentrancyDetected',    message: 'Reentrancy detected — another instruction is already in progress' },

  // ---- Account (6058–6061) ----
  6058: { code: 6058, name: 'AccountNotInitialized',  message: 'Account has not been initialized' },
  6059: { code: 6059, name: 'AccountAlreadyInitialized', message: 'Account is already initialized' },
  6060: { code: 6060, name: 'InvalidAccountData',    message: 'Invalid account data' },
  6061: { code: 6061, name: 'AccountSizeMismatch',   message: 'Account size mismatch' },

  // ---- PDA (6062–6064) ----
  6062: { code: 6062, name: 'InvalidPDA',            message: 'Invalid program-derived address' },
  6063: { code: 6063, name: 'InvalidBump',           message: 'Invalid PDA bump seed' },
  6064: { code: 6064, name: 'InvalidSeeds',          message: 'Invalid PDA seeds' },

  // ---- Timestamp (6065–6067) ----
  6065: { code: 6065, name: 'InvalidTimestamp',      message: 'Invalid timestamp' },
  6066: { code: 6066, name: 'TimestampInPast',       message: 'Timestamp is in the past' },
  6067: { code: 6067, name: 'TimestampTooFarFuture', message: 'Timestamp is too far in the future' },

  // ---- System (6068–6070) ----
  6068: { code: 6068, name: 'InvalidSystemProgram',  message: 'Invalid system program' },
  6069: { code: 6069, name: 'InvalidTokenProgram',   message: 'Invalid token program' },
  6070: { code: 6070, name: 'NotRentExempt',         message: 'Account is not rent-exempt' },

  // ---- Business Logic (6071–6078) ----
  6071: { code: 6071, name: 'NonZeroBalance',               message: 'Cannot close account with a non-zero balance' },
  6072: { code: 6072, name: 'NoTipsReceived',               message: 'No tips have been received' },
  6073: { code: 6073, name: 'EmptyLeaderboard',             message: 'Leaderboard is empty' },
  6074: { code: 6074, name: 'InvalidContributionAmount',    message: 'Invalid contribution amount' },
  6075: { code: 6075, name: 'InvalidSubscriptionInterval',  message: 'Subscription interval must be at least 1 day' },
  6076: { code: 6076, name: 'InvalidSubscriptionAmount',    message: 'Subscription amount must be greater than zero' },
};

// ============================================================
// Error name → code lookup (for convenience)
// ============================================================
export const ANCHOR_ERROR_BY_NAME: Record<string, AnchorErrorInfo> =
  Object.fromEntries(
    Object.values(ANCHOR_ERROR_MAP).map((e) => [e.name, e])
  );

// ============================================================
// Friendly display names for common anchor framework errors
// (non-custom, i.e. < 6000)
// ============================================================
const FRAMEWORK_ERRORS: Record<number, string> = {
  100:  'Account discriminator mismatch',
  101:  'Account not mutable',
  102:  'Account owned by wrong program',
  103:  'Account not associated token account',
  2000: 'Constraint violated',
  2001: 'Constraint mut violated',
  2002: 'Constraint has_one violated',
  2003: 'Constraint signer violated',
  2006: 'Constraint seeds violated',
  2012: 'Constraint associated violated',
  3000: 'Invalid account discriminator',
  3008: 'Account not initialized',
};

// ============================================================
// parseAnchorError
//
// Attempts to extract an error code from an anchor/web3 error
// and return a human-readable string.
// ============================================================
export function parseAnchorError(err: unknown): string {
  if (!err) return 'Unknown error';

  const message = getErrorMessage(err);

  // 1. Try to match Anchor custom error code pattern: "custom program error: 0x..."
  const hexMatch = message.match(/custom program error:\s*0x([0-9a-fA-F]+)/i);
  if (hexMatch) {
    const code = parseInt(hexMatch[1], 16);
    const info = ANCHOR_ERROR_MAP[code];
    if (info) return info.message;
    const frameworkMsg = FRAMEWORK_ERRORS[code];
    if (frameworkMsg) return frameworkMsg;
    return `Program error: ${code}`;
  }

  // 2. Try to match decimal error code in anchor error JSON
  const errorCodeMatch = message.match(/"errorCode"[^}]*"number":\s*(\d+)/);
  if (errorCodeMatch) {
    const code = parseInt(errorCodeMatch[1], 10);
    const info = ANCHOR_ERROR_MAP[code];
    if (info) return info.message;
  }

  // 3. Try matching the error name directly
  const nameMatch = message.match(/"name":\s*"([A-Za-z]+)"/);
  if (nameMatch) {
    const info = ANCHOR_ERROR_BY_NAME[nameMatch[1]];
    if (info) return info.message;
  }

  // 4. Try matching error number inline: "Error Number: XXXX"
  const numberMatch = message.match(/Error Number:\s*(\d+)/i);
  if (numberMatch) {
    const code = parseInt(numberMatch[1], 10);
    const info = ANCHOR_ERROR_MAP[code];
    if (info) return info.message;
  }

  // 5. Common wallet/RPC errors
  if (message.includes('User rejected')) return 'Transaction rejected by wallet';
  if (message.includes('insufficient funds')) return 'Insufficient SOL for transaction fees';
  if (message.includes('blockhash not found')) return 'Transaction expired — please try again';
  if (message.includes('Transaction was not confirmed'))
    return 'Transaction was not confirmed — check your connection and try again';

  // 6. Fallback
  return message.length > 120 ? `${message.slice(0, 120)}…` : message;
}

// ============================================================
// Helper: extract a string message from any error shape
// ============================================================
function getErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, unknown>;
    if (typeof obj['message'] === 'string') return obj['message'];
    if (typeof obj['msg'] === 'string') return obj['msg'];
    try {
      return JSON.stringify(err);
    } catch {
      return 'Unknown error object';
    }
  }
  return String(err);
}
