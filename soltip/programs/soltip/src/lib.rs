// ==========================================================
// SolTip – Decentralized Tipping Platform  v2.0.0
//
// Architecture overview:
//   • Creators create a TipProfile PDA and optionally a Vault PDA.
//   • Tips (SOL or SPL) flow into the Vault; creators withdraw with fee split.
//   • RateLimit PDAs prevent spam (cooldown + daily cap per tipper/creator pair).
//   • TipperRecord PDAs power the on-chain leaderboard without linear scans.
//   • TipGoal PDAs track fundraising campaigns with optional deadlines.
//   • Subscription PDAs manage recurring payments (SOL or SPL).
//   • TipSplit PDAs distribute a single tip across multiple wallets atomically.
//   • PlatformConfig PDA stores admin settings (fee BPS, pause state, treasury).
//   • Reentrancy guard on TipProfile prevents cross-instruction reentrancy.
//
// Program ID: BhynwWdN5g5S5FfCEgDovajaYQDq925S2Xs8vXas58uo
// ==========================================================

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;

// Import state types explicitly to avoid collisions
pub use state::{
    TipProfile, TipGoal, Subscription, Vault,
    TipperRecord, LeaderboardEntry, TipSplit as TipSplitAccount, SplitRecipient, RateLimit,
};

// Import instruction contexts
pub use instructions::{
    CreateProfile, UpdateProfile, SendTip, SendTipSpl,
    Withdraw, WithdrawSpl, CreateGoal, ContributeGoal, CloseGoal,
    CreateSubscription, CancelSubscription, ProcessSubscription,
    InitializeVault, ConfigureSplit, SendTipSplit,
    InitializePlatform, VerifyCreator, PausePlatform, PlatformConfig,
};

// Import events
pub use instructions::send_tip::TipSentEvent;
pub use instructions::send_tip_spl::SplTipSentEvent;
pub use instructions::withdraw::WithdrawalEvent;
pub use instructions::withdraw_spl::SplWithdrawalEvent;
pub use instructions::send_tip_split::TipSplitSentEvent;
pub use instructions::contribute_goal::GoalContributionEvent;
pub use instructions::process_subscription::SubscriptionProcessedEvent;

// Re-export __client_accounts_* modules to crate root (required by #[program] macro)
// These are pub(crate) in the generated code so use pub(crate) here
pub(crate) use instructions::create_profile::__client_accounts_create_profile;
pub(crate) use instructions::update_profile::__client_accounts_update_profile;
pub(crate) use instructions::send_tip::__client_accounts_send_tip;
pub(crate) use instructions::send_tip_spl::__client_accounts_send_tip_spl;
pub(crate) use instructions::withdraw::__client_accounts_withdraw;
pub(crate) use instructions::withdraw_spl::__client_accounts_withdraw_spl;
pub(crate) use instructions::create_goal::__client_accounts_create_goal;
pub(crate) use instructions::contribute_goal::__client_accounts_contribute_goal;
pub(crate) use instructions::close_goal::__client_accounts_close_goal;
pub(crate) use instructions::create_subscription::__client_accounts_create_subscription;
pub(crate) use instructions::cancel_subscription::__client_accounts_cancel_subscription;
pub(crate) use instructions::process_subscription::__client_accounts_process_subscription;
pub(crate) use instructions::initialize_vault::__client_accounts_initialize_vault;
pub(crate) use instructions::configure_split::__client_accounts_configure_split;
pub(crate) use instructions::send_tip_split::__client_accounts_send_tip_split;
pub(crate) use instructions::initialize_platform::__client_accounts_initialize_platform;
pub(crate) use instructions::verify_creator::__client_accounts_verify_creator;
pub(crate) use instructions::pause_platform::__client_accounts_pause_platform;

declare_id!("BhynwWdN5g5S5FfCEgDovajaYQDq925S2Xs8vXas58uo");

#[program]
pub mod soltip {
    use super::*;

    // ---- Profile Management ----------------------------------------

    /// Create a new creator tip profile (one per wallet).
    ///
    /// Initialises a `TipProfile` PDA at seeds `["tip_profile", owner]`.
    /// `username` must be 1–32 chars, lowercase alphanumeric + underscore only.
    pub fn create_profile(
        ctx: Context<CreateProfile>,
        username: String,
        display_name: String,
        description: String,
        image_url: String,
    ) -> Result<()> {
        instructions::create_profile::handler(ctx, username, display_name, description, image_url)
    }

    /// Update mutable fields on an existing tip profile.
    ///
    /// All parameters are `Option`; pass `None` to leave a field unchanged.
    /// `withdrawal_fee_bps` is capped at `MAX_WITHDRAWAL_FEE_BPS` (5 000).
    pub fn update_profile(
        ctx: Context<UpdateProfile>,
        display_name: Option<String>,
        description: Option<String>,
        image_url: Option<String>,
        min_tip_amount: Option<u64>,
        withdrawal_fee_bps: Option<u16>,
        accept_anonymous: Option<bool>,
    ) -> Result<()> {
        instructions::update_profile::handler(
            ctx, display_name, description, image_url,
            min_tip_amount, withdrawal_fee_bps, accept_anonymous,
        )
    }

    // ---- Vault Management ------------------------------------------

    /// Create the SOL escrow vault for a creator.
    ///
    /// Must be called once before any tips can be received. Seeds the vault
    /// with `MIN_VAULT_RENT_BUFFER` lamports to remain rent-exempt.
    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        instructions::initialize_vault::handler(ctx)
    }

    // ---- Tipping ---------------------------------------------------

    /// Send a SOL tip to a creator's vault.
    ///
    /// Enforces rate limiting, reentrancy guard, and min/max tip bounds.
    /// Updates the on-chain leaderboard and emits `TipSentEvent`.
    pub fn send_tip(ctx: Context<SendTip>, amount: u64, message: Option<String>) -> Result<()> {
        instructions::send_tip::handler(ctx, amount, message)
    }

    /// Send an SPL-token tip (USDC, USDT, etc.) directly to the creator's token account.
    ///
    /// Enforces rate limiting and message validation. Emits `SplTipSentEvent`.
    /// The `ENABLE_MULTI_TOKEN` feature flag must be true.
    pub fn send_tip_spl(ctx: Context<SendTipSpl>, amount: u64, message: Option<String>) -> Result<()> {
        instructions::send_tip_spl::handler(ctx, amount, message)
    }

    // ---- Multi-Recipient Splits ------------------------------------

    /// Create or update a tip-split configuration for a profile.
    ///
    /// `recipients` must have 2–5 entries whose `share_bps` values sum to 10 000.
    /// No duplicate wallet addresses are allowed.
    pub fn configure_split(
        ctx: Context<ConfigureSplit>,
        recipients: Vec<SplitRecipient>,
    ) -> Result<()> {
        instructions::configure_split::handler(ctx, recipients)
    }

    /// Send a SOL tip that is atomically distributed across split recipients.
    ///
    /// Pass recipient wallets in order (matching the split config) as
    /// `remaining_accounts`. Uses direct lamport manipulation.
    pub fn send_tip_split(
        ctx: Context<SendTipSplit>,
        amount: u64,
        message: Option<String>,
    ) -> Result<()> {
        instructions::send_tip_split::handler(ctx, amount, message)
    }

    // ---- Withdrawal ------------------------------------------------

    /// Withdraw SOL from the creator vault with creator/platform fee split.
    ///
    /// Fee = `amount × withdrawal_fee_bps / 10_000`. A subset of that fee
    /// (`PLATFORM_FEE_BPS`) flows to the platform treasury PDA.
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        instructions::withdraw::handler(ctx, amount)
    }

    /// Deduct the platform fee from SPL-token tip earnings.
    ///
    /// Transfers `platform_fee` tokens from the creator's token account to
    /// the platform fee token account. The creator retains the remainder in
    /// their own ATA. Requires `ENABLE_MULTI_TOKEN`.
    pub fn withdraw_spl(ctx: Context<WithdrawSpl>, amount: u64) -> Result<()> {
        instructions::withdraw_spl::handler(ctx, amount)
    }

    // ---- Fundraising Goals -----------------------------------------

    /// Create a new fundraising goal for a creator profile.
    ///
    /// Each profile can have up to `MAX_ACTIVE_GOALS` concurrent goals.
    /// `goal_id` must be unique per profile and is used in PDA derivation.
    pub fn create_goal(
        ctx: Context<CreateGoal>,
        goal_id: u64,
        title: String,
        description: String,
        target_amount: u64,
        token_mint: Pubkey,
        deadline: Option<i64>,
    ) -> Result<()> {
        instructions::create_goal::handler(ctx, goal_id, title, description, target_amount, token_mint, deadline)
    }

    /// Contribute SOL toward a fundraising goal.
    ///
    /// Auto-completes the goal if `current_amount >= target_amount`.
    /// Rejected if the goal is already completed or the deadline has passed.
    pub fn contribute_goal(ctx: Context<ContributeGoal>, amount: u64, message: Option<String>) -> Result<()> {
        instructions::contribute_goal::handler(ctx, amount, message)
    }

    /// Close a completed or expired goal and reclaim rent.
    ///
    /// The goal account lamports are returned to the creator. Only the
    /// profile owner can close a goal.
    pub fn close_goal(ctx: Context<CloseGoal>) -> Result<()> {
        instructions::close_goal::handler(ctx)
    }

    // ---- Subscriptions ---------------------------------------------

    /// Create a recurring tip subscription from subscriber to creator.
    ///
    /// `interval_seconds` must be ≥ `SECONDS_PER_DAY`. Supports both SOL
    /// (`is_spl = false`) and SPL-token (`is_spl = true, token_mint = …`) modes.
    pub fn create_subscription(
        ctx: Context<CreateSubscription>,
        amount_per_interval: u64,
        interval_seconds: i64,
        is_spl: bool,
        token_mint: Pubkey,
    ) -> Result<()> {
        instructions::create_subscription::handler(ctx, amount_per_interval, interval_seconds, is_spl, token_mint)
    }

    /// Cancel an active subscription. Only the subscriber can cancel.
    pub fn cancel_subscription(ctx: Context<CancelSubscription>) -> Result<()> {
        instructions::cancel_subscription::handler(ctx)
    }

    /// Process a due subscription payment (SOL only in this version).
    ///
    /// Can be called by anyone once `next_payment_due` has passed.
    /// Auto-renewing subscriptions reschedule; one-shot subscriptions deactivate.
    pub fn process_subscription(ctx: Context<ProcessSubscription>) -> Result<()> {
        instructions::process_subscription::handler(ctx)
    }

    // ---- Platform Admin --------------------------------------------

    /// Initialise the global platform configuration account.
    ///
    /// Sets `authority`, `treasury`, `platform_fee_bps`, and seeds the
    /// treasury PDA with 0.001 SOL. Can only be called once.
    pub fn initialize_platform(ctx: Context<InitializePlatform>) -> Result<()> {
        instructions::initialize_platform::handler(ctx)
    }

    /// Grant or revoke the `is_verified` badge on a creator's tip profile.
    ///
    /// Restricted to the platform `authority` stored in `PlatformConfig`.
    pub fn verify_creator(ctx: Context<VerifyCreator>, verified: bool) -> Result<()> {
        instructions::verify_creator::handler(ctx, verified)
    }

    /// Toggle the global platform pause state.
    ///
    /// When paused, tipping instructions should check `PlatformConfig.paused`
    /// via a constraint or guard. Restricted to the platform `authority`.
    pub fn pause_platform(ctx: Context<PausePlatform>, paused: bool) -> Result<()> {
        instructions::pause_platform::handler(ctx, paused)
    }
}
