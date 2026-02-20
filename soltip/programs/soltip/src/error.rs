use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    // ========== Input Validation ==========
    #[msg("Username too long (max 32 chars)")]
    UsernameTooLong,
    #[msg("Display name too long (max 64 chars)")]
    DisplayNameTooLong,
    #[msg("Description too long (max 256 chars)")]
    DescriptionTooLong,
    #[msg("Image URL too long (max 200 chars)")]
    ImageUrlTooLong,
    #[msg("Message too long (max 280 chars)")]
    MessageTooLong,
    #[msg("Goal title too long (max 64 chars)")]
    GoalTitleTooLong,
    #[msg("Goal description too long (max 256 chars)")]
    GoalDescriptionTooLong,
    #[msg("Username contains invalid characters (lowercase, digits, underscore only)")]
    InvalidUsername,
    #[msg("Text contains unsafe characters")]
    UnsafeTextContent,
    #[msg("Username cannot be empty")]
    EmptyUsername,

    // ========== Financial ==========
    #[msg("Tip amount below minimum")]
    TipAmountTooSmall,
    #[msg("Tip amount exceeds maximum (1000 SOL)")]
    TipAmountTooLarge,
    #[msg("Withdrawal amount below minimum (0.01 SOL)")]
    WithdrawalTooSmall,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Invalid withdrawal fee (0-10%)")]
    InvalidWithdrawalFee,
    #[msg("Goal target amount must be > 0")]
    InvalidGoalAmount,
    #[msg("Min tip amount invalid")]
    InvalidMinTipAmount,
    #[msg("Vault balance would fall below rent buffer")]
    VaultBelowRentBuffer,

    // ========== Authorization ==========
    #[msg("Not authorized")]
    Unauthorized,
    #[msg("Only profile owner can perform this action")]
    NotProfileOwner,
    #[msg("Only goal creator can perform this action")]
    NotGoalOwner,
    #[msg("Only subscriber can perform this action")]
    NotSubscriber,
    #[msg("Only platform admin can perform this action")]
    NotAdmin,
    #[msg("Profile owner mismatch")]
    ProfileOwnerMismatch,

    // ========== State ==========
    #[msg("Username already taken")]
    UsernameAlreadyTaken,
    #[msg("Goal already completed")]
    GoalAlreadyCompleted,
    #[msg("Goal deadline expired")]
    GoalDeadlineExpired,
    #[msg("Goal deadline must be in the future")]
    InvalidGoalDeadline,
    #[msg("Goal duration exceeds 1 year")]
    GoalDurationTooLong,
    #[msg("Max active goals reached (5)")]
    MaxActiveGoalsReached,
    #[msg("Subscription not active")]
    SubscriptionNotActive,
    #[msg("Subscription payment not yet due")]
    SubscriptionNotDue,
    #[msg("Cannot tip yourself")]
    CannotTipSelf,
    #[msg("Vault not initialized – call initialize_vault first")]
    VaultNotInitialized,
    #[msg("Platform is paused")]
    PlatformPaused,

    // ========== Rate Limiting ==========
    #[msg("Too many tips – cooldown period active")]
    RateLimitExceeded,
    #[msg("Daily tip limit reached")]
    DailyLimitExceeded,

    // ========== Math ==========
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Math underflow")]
    MathUnderflow,
    #[msg("Division by zero")]
    DivisionByZero,
    #[msg("Invalid calculation")]
    InvalidCalculation,

    // ========== Feature Flags ==========
    #[msg("Subscriptions disabled")]
    SubscriptionsDisabled,
    #[msg("Goals disabled")]
    GoalsDisabled,
    #[msg("Anonymous tips disabled")]
    AnonymousTipsDisabled,
    #[msg("Multi-token disabled")]
    MultiTokenDisabled,
    #[msg("Tip splits disabled")]
    TipSplitsDisabled,
    #[msg("Feature not implemented")]
    FeatureNotImplemented,

    // ========== Token ==========
    #[msg("Invalid token mint")]
    InvalidTokenMint,
    #[msg("Token mint mismatch")]
    TokenMintMismatch,
    #[msg("Insufficient token balance")]
    InsufficientTokenBalance,
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    #[msg("Token account owner mismatch")]
    TokenAccountOwnerMismatch,

    // ========== Splits ==========
    #[msg("Split BPS must sum to 10 000")]
    InvalidSplitBps,
    #[msg("Too many split recipients (max 5)")]
    TooManySplitRecipients,
    #[msg("Split config not found for this profile")]
    SplitNotFound,
    #[msg("Split recipient mismatch")]
    SplitRecipientMismatch,
    #[msg("Duplicate recipient in split")]
    DuplicateSplitRecipient,

    // ========== Reentrancy ==========
    #[msg("Reentrancy detected – instruction already in progress")]
    ReentrancyDetected,

    // ========== Account ==========
    #[msg("Account not initialized")]
    AccountNotInitialized,
    #[msg("Account already initialized")]
    AccountAlreadyInitialized,
    #[msg("Invalid account data")]
    InvalidAccountData,
    #[msg("Account size mismatch")]
    AccountSizeMismatch,

    // ========== PDA ==========
    #[msg("Invalid PDA")]
    InvalidPDA,
    #[msg("Invalid bump")]
    InvalidBump,
    #[msg("Invalid seeds")]
    InvalidSeeds,

    // ========== Timestamp ==========
    #[msg("Invalid timestamp")]
    InvalidTimestamp,
    #[msg("Timestamp in past")]
    TimestampInPast,
    #[msg("Timestamp too far in future")]
    TimestampTooFarFuture,

    // ========== System ==========
    #[msg("Invalid system program")]
    InvalidSystemProgram,
    #[msg("Invalid token program")]
    InvalidTokenProgram,
    #[msg("Account not rent exempt")]
    NotRentExempt,

    // ========== Business Logic ==========
    #[msg("Non-zero balance – cannot close")]
    NonZeroBalance,
    #[msg("No tips received")]
    NoTipsReceived,
    #[msg("Leaderboard empty")]
    EmptyLeaderboard,
    #[msg("Invalid contribution amount")]
    InvalidContributionAmount,
    #[msg("Subscription interval must be >= 1 day")]
    InvalidSubscriptionInterval,
    #[msg("Subscription amount must be > 0")]
    InvalidSubscriptionAmount,
}
