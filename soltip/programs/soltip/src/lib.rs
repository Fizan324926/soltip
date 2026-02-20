// ==========================================================
// SolTip – Decentralized Tipping Platform  v3.0.0
//
// Architecture overview:
//   - Creators create a TipProfile PDA and optionally a Vault PDA.
//   - Tips (SOL or SPL) flow into the Vault; creators withdraw with fee split.
//   - RateLimit PDAs prevent spam (cooldown + daily cap per tipper/creator pair).
//   - TipperRecord PDAs power the on-chain leaderboard without linear scans.
//   - TipGoal PDAs track fundraising campaigns with optional deadlines.
//   - Subscription PDAs manage recurring payments (SOL or SPL).
//   - TipSplit PDAs distribute a single tip across multiple wallets atomically.
//   - PlatformConfig PDA stores admin settings (fee BPS, pause state, treasury).
//   - Reentrancy guard on TipProfile prevents cross-instruction reentrancy.
//
// v3 additions:
//   - TipPoll PDAs for tip-funded polls/voting (beats StreamElements)
//   - ContentGate PDAs for token-gated content (beats Glass/Ko-fi)
//   - Referral PDAs for on-chain referral program (beats OnlyFans)
//   - Preset tip amounts on TipProfile (beats StreamElements)
//   - Time-window leaderboards on TipperRecord (beats Tipeeestream)
//   - Media URL support on tips (beats Tipeeestream)
//   - Badge tiers computed from cumulative amounts (gamification)
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
    TipPoll, PollOption, Referral, ContentGate,
};

// Import instruction contexts
pub use instructions::{
    CreateProfile, UpdateProfile, SendTip, SendTipSpl,
    Withdraw, WithdrawSpl, CreateGoal, ContributeGoal, CloseGoal,
    CreateSubscription, CancelSubscription, ProcessSubscription,
    InitializeVault, ConfigureSplit, SendTipSplit,
    InitializePlatform, VerifyCreator, PausePlatform, PlatformConfig,
    CreatePoll, VotePoll, ClosePoll,
    CreateContentGate, VerifyContentAccess, CloseContentGate,
    RegisterReferral, UpdateProfileExtended,
    WithdrawTreasury, ResetReentrancyGuard,
};

// Import events
pub use instructions::send_tip::TipSentEvent;
pub use instructions::send_tip_spl::SplTipSentEvent;
pub use instructions::withdraw::WithdrawalEvent;
pub use instructions::withdraw_spl::SplWithdrawalEvent;
pub use instructions::send_tip_split::TipSplitSentEvent;
pub use instructions::contribute_goal::GoalContributionEvent;
pub use instructions::process_subscription::SubscriptionProcessedEvent;
pub use instructions::vote_poll::PollVoteEvent;
pub use instructions::verify_content_access::ContentAccessEvent;
pub use instructions::register_referral::ReferralCreatedEvent;

// Re-export __client_accounts_* modules to crate root (required by #[program] macro)
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
pub(crate) use instructions::create_poll::__client_accounts_create_poll;
pub(crate) use instructions::vote_poll::__client_accounts_vote_poll;
pub(crate) use instructions::close_poll::__client_accounts_close_poll;
pub(crate) use instructions::create_content_gate::__client_accounts_create_content_gate;
pub(crate) use instructions::verify_content_access::__client_accounts_verify_content_access;
pub(crate) use instructions::close_content_gate::__client_accounts_close_content_gate;
pub(crate) use instructions::register_referral::__client_accounts_register_referral;
pub(crate) use instructions::update_profile_extended::__client_accounts_update_profile_extended;
pub(crate) use instructions::withdraw_treasury::__client_accounts_withdraw_treasury;
pub(crate) use instructions::reset_reentrancy_guard::__client_accounts_reset_reentrancy_guard;

declare_id!("BhynwWdN5g5S5FfCEgDovajaYQDq925S2Xs8vXas58uo");

#[program]
pub mod soltip {
    use super::*;

    // ---- Profile Management ----------------------------------------

    pub fn create_profile(
        ctx: Context<CreateProfile>,
        username: String,
        display_name: String,
        description: String,
        image_url: String,
    ) -> Result<()> {
        instructions::create_profile::handler(ctx, username, display_name, description, image_url)
    }

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

    /// Update extended profile settings: preset amounts, social links, webhook URL
    pub fn update_profile_extended(
        ctx: Context<UpdateProfileExtended>,
        preset_amounts: Option<Vec<u64>>,
        social_links: Option<String>,
        webhook_url: Option<String>,
    ) -> Result<()> {
        instructions::update_profile_extended::handler(ctx, preset_amounts, social_links, webhook_url)
    }

    // ---- Vault Management ------------------------------------------

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        instructions::initialize_vault::handler(ctx)
    }

    // ---- Tipping ---------------------------------------------------

    pub fn send_tip(ctx: Context<SendTip>, amount: u64, message: Option<String>) -> Result<()> {
        instructions::send_tip::handler(ctx, amount, message)
    }

    pub fn send_tip_spl(ctx: Context<SendTipSpl>, amount: u64, message: Option<String>) -> Result<()> {
        instructions::send_tip_spl::handler(ctx, amount, message)
    }

    // ---- Multi-Recipient Splits ------------------------------------

    pub fn configure_split(
        ctx: Context<ConfigureSplit>,
        recipients: Vec<SplitRecipient>,
    ) -> Result<()> {
        instructions::configure_split::handler(ctx, recipients)
    }

    pub fn send_tip_split<'info>(
        ctx: Context<'_, '_, 'info, 'info, SendTipSplit<'info>>,
        amount: u64,
        message: Option<String>,
    ) -> Result<()> {
        instructions::send_tip_split::handler(ctx, amount, message)
    }

    // ---- Withdrawal ------------------------------------------------

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        instructions::withdraw::handler(ctx, amount)
    }

    pub fn withdraw_spl(ctx: Context<WithdrawSpl>, amount: u64) -> Result<()> {
        instructions::withdraw_spl::handler(ctx, amount)
    }

    // ---- Fundraising Goals -----------------------------------------

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

    pub fn contribute_goal(ctx: Context<ContributeGoal>, amount: u64, message: Option<String>) -> Result<()> {
        instructions::contribute_goal::handler(ctx, amount, message)
    }

    pub fn close_goal(ctx: Context<CloseGoal>) -> Result<()> {
        instructions::close_goal::handler(ctx)
    }

    // ---- Subscriptions ---------------------------------------------

    pub fn create_subscription(
        ctx: Context<CreateSubscription>,
        amount_per_interval: u64,
        interval_seconds: i64,
        is_spl: bool,
        token_mint: Pubkey,
    ) -> Result<()> {
        instructions::create_subscription::handler(ctx, amount_per_interval, interval_seconds, is_spl, token_mint)
    }

    pub fn cancel_subscription(ctx: Context<CancelSubscription>) -> Result<()> {
        instructions::cancel_subscription::handler(ctx)
    }

    pub fn process_subscription(ctx: Context<ProcessSubscription>) -> Result<()> {
        instructions::process_subscription::handler(ctx)
    }

    // ---- Platform Admin --------------------------------------------

    pub fn initialize_platform(ctx: Context<InitializePlatform>) -> Result<()> {
        instructions::initialize_platform::handler(ctx)
    }

    pub fn verify_creator(ctx: Context<VerifyCreator>, verified: bool) -> Result<()> {
        instructions::verify_creator::handler(ctx, verified)
    }

    pub fn pause_platform(ctx: Context<PausePlatform>, paused: bool) -> Result<()> {
        instructions::pause_platform::handler(ctx, paused)
    }

    // ---- v3: Tip-Funded Polls ──────────────────────────────────────

    /// Create a tip-funded poll with 2-4 options.
    /// Viewers vote by tipping toward their preferred option.
    pub fn create_poll(
        ctx: Context<CreatePoll>,
        poll_id: u64,
        title: String,
        description: String,
        options: Vec<String>,
        deadline: Option<i64>,
    ) -> Result<()> {
        instructions::create_poll::handler(ctx, poll_id, title, description, options, deadline)
    }

    /// Vote on a poll by sending a SOL tip toward an option.
    pub fn vote_poll(
        ctx: Context<VotePoll>,
        option_index: u8,
        amount: u64,
        message: Option<String>,
    ) -> Result<()> {
        instructions::vote_poll::handler(ctx, option_index, amount, message)
    }

    /// Close a poll and return rent to the creator.
    pub fn close_poll(ctx: Context<ClosePoll>) -> Result<()> {
        instructions::close_poll::handler(ctx)
    }

    // ---- v3: Token-Gated Content ───────────────────────────────────

    /// Create a content gate: tippers who have tipped >= required_amount
    /// can access the gated content. The actual URL is served off-chain;
    /// only a sha256 hash is stored on-chain for verification.
    pub fn create_content_gate(
        ctx: Context<CreateContentGate>,
        gate_id: u64,
        title: String,
        content_url_hash: [u8; 32],
        required_amount: u64,
    ) -> Result<()> {
        instructions::create_content_gate::handler(ctx, gate_id, title, content_url_hash, required_amount)
    }

    /// Verify if a viewer has tipped enough to access gated content.
    pub fn verify_content_access(ctx: Context<VerifyContentAccess>) -> Result<()> {
        instructions::verify_content_access::handler(ctx)
    }

    /// Close a content gate and return rent.
    pub fn close_content_gate(ctx: Context<CloseContentGate>) -> Result<()> {
        instructions::close_content_gate::handler(ctx)
    }

    // ---- v3: Referral Program ──────────────────────────────────────

    /// Register a referral: referrer earns a share of platform fees
    /// from the referred creator.
    pub fn register_referral(
        ctx: Context<RegisterReferral>,
        fee_share_bps: u16,
    ) -> Result<()> {
        instructions::register_referral::handler(ctx, fee_share_bps)
    }

    // ---- Admin: Treasury Withdrawal ────────────────────────────────

    /// Withdraw accumulated SOL from the platform treasury PDA.
    /// Only the platform authority can call this.
    pub fn withdraw_treasury(
        ctx: Context<WithdrawTreasury>,
        amount: u64,
    ) -> Result<()> {
        instructions::withdraw_treasury::handler(ctx, amount)
    }

    // ---- Admin: Reentrancy Guard Reset ─────────────────────────────

    /// Reset a stuck reentrancy guard on a tip profile.
    /// Only the platform authority can call this.
    pub fn reset_reentrancy_guard(
        ctx: Context<ResetReentrancyGuard>,
    ) -> Result<()> {
        instructions::reset_reentrancy_guard::handler(ctx)
    }
}
