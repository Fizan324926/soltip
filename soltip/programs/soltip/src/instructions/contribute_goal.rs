use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::state::{TipProfile, TipGoal};
use crate::instructions::initialize_platform::PlatformConfig;
use crate::constants::*;
use crate::error::ErrorCode;

/// Emitted when a contributor sends SOL toward a fundraising goal.
/// Indexers use this event to track goal progress and contributor history.
#[event]
pub struct GoalContributionEvent {
    /// Contributor's wallet pubkey
    pub contributor:        Pubkey,
    /// Creator who owns the goal
    pub recipient:          Pubkey,
    /// The TipProfile PDA of the recipient
    pub recipient_profile:  Pubkey,
    /// The TipGoal PDA
    pub tip_goal:           Pubkey,
    /// Numeric goal identifier (used in PDA derivation)
    pub goal_id:            u64,
    /// Contribution amount in lamports
    pub amount:             u64,
    /// Running total after this contribution
    pub current_amount:     u64,
    /// Whether this contribution completed the goal
    pub goal_completed:     bool,
    /// Optional message from contributor
    pub message:            Option<String>,
    pub timestamp:          i64,
}

/// Accounts required to contribute to a fundraising goal
#[derive(Accounts)]
pub struct ContributeGoal<'info> {
    /// The contributor
    #[account(mut)]
    pub contributor: Signer<'info>,

    /// The recipient's tip profile
    #[account(
        mut,
        seeds = [TIP_PROFILE_SEED, recipient_owner.key().as_ref()],
        bump = recipient_profile.bump,
    )]
    pub recipient_profile: Account<'info, TipProfile>,

    /// The goal being contributed to
    #[account(
        mut,
        seeds = [TIP_GOAL_SEED, recipient_profile.key().as_ref(), tip_goal.goal_id.to_le_bytes().as_ref()],
        bump = tip_goal.bump,
        constraint = tip_goal.profile == recipient_profile.key() @ ErrorCode::InvalidAccountData,
    )]
    pub tip_goal: Account<'info, TipGoal>,

    /// The recipient's wallet (profile owner)
    /// CHECK: This is validated by the PDA derivation of recipient_profile
    #[account(mut)]
    pub recipient_owner: UncheckedAccount<'info>,

    /// Global platform config – checked for pause state and fee BPS.
    #[account(
        seeds = [PLATFORM_CONFIG_SEED],
        bump  = platform_config.bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    /// CHECK: PDA verified by seeds – platform treasury receives platform fee
    #[account(
        mut,
        seeds = [PLATFORM_TREASURY_SEED],
        bump,
    )]
    pub platform_treasury: UncheckedAccount<'info>,

    /// System program for transferring SOL
    pub system_program: Program<'info, System>,
}

/// Handler for contributing to a fundraising goal (SOL only in this example)
pub fn handler(
    ctx: Context<ContributeGoal>,
    amount: u64,
    message: Option<String>,
) -> Result<()> {
    let recipient_profile = &mut ctx.accounts.recipient_profile;
    let tip_goal = &mut ctx.accounts.tip_goal;
    let clock = Clock::get()?;

    // Prevent self-contribution
    require!(
        ctx.accounts.contributor.key() != ctx.accounts.recipient_owner.key(),
        ErrorCode::CannotTipSelf
    );

    // Platform pause check
    require!(!ctx.accounts.platform_config.paused, ErrorCode::PlatformPaused);

    // Validate feature is enabled
    require!(ENABLE_GOALS, ErrorCode::GoalsDisabled);

    // Validate contribution amount
    require!(
        amount >= MIN_TIP_AMOUNT,
        ErrorCode::InvalidContributionAmount
    );

    // Validate message length if provided
    if let Some(ref msg) = message {
        require!(
            msg.len() <= MAX_MESSAGE_LENGTH,
            ErrorCode::MessageTooLong
        );
    }

    // Validate goal can accept contributions
    tip_goal.validate_can_contribute(clock.unix_timestamp)?;

    // Calculate platform fee and creator share
    let platform_fee = calculate_fee(amount, PLATFORM_FEE_BPS)?;
    let creator_share = amount
        .checked_sub(platform_fee)
        .ok_or(ErrorCode::MathUnderflow)?;

    // Transfer creator share to recipient
    let transfer_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.contributor.to_account_info(),
            to: ctx.accounts.recipient_owner.to_account_info(),
        },
    );
    transfer(transfer_ctx, creator_share)?;

    // Transfer platform fee to treasury
    if platform_fee > 0 {
        let fee_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.contributor.to_account_info(),
                to: ctx.accounts.platform_treasury.to_account_info(),
            },
        );
        transfer(fee_ctx, platform_fee)?;
    }

    // Record contribution in goal (unique contributor tracking is best-effort;
    // a full deduplication system would require a per-(contributor, goal) PDA)
    tip_goal.add_contribution(amount, false, clock.unix_timestamp)?;

    // Record tip in profile (contributor = tipper for leaderboard)
    let contributor_key = ctx.accounts.contributor.key();
    recipient_profile.record_tip(contributor_key, amount, false)?;

    // Capture values for event before references are released
    let current_amount = tip_goal.current_amount;
    let goal_id        = tip_goal.goal_id;
    let goal_completed = tip_goal.completed;

    msg!("Contribution to goal '{}': {} lamports", tip_goal.title, amount);
    msg!("Goal progress: {}/{}  ({}%)",
        tip_goal.current_amount,
        tip_goal.target_amount,
        tip_goal.completion_percentage() as f64 / 100.0
    );

    if goal_completed {
        msg!("Goal completed!");
    }

    emit!(GoalContributionEvent {
        contributor:       ctx.accounts.contributor.key(),
        recipient:         ctx.accounts.recipient_owner.key(),
        recipient_profile: ctx.accounts.recipient_profile.key(),
        tip_goal:          ctx.accounts.tip_goal.key(),
        goal_id,
        amount,
        current_amount,
        goal_completed,
        message:           message.clone(),
        timestamp:         clock.unix_timestamp,
    });

    if let Some(msg_text) = message {
        msg!("Message: {}", msg_text);
    }

    Ok(())
}
