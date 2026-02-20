use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::state::{TipProfile, TipPoll, Vault};
use crate::instructions::initialize_platform::PlatformConfig;
use crate::constants::*;
use crate::error::ErrorCode;

#[event]
pub struct PollVoteEvent {
    pub voter:          Pubkey,
    pub profile:        Pubkey,
    pub poll:           Pubkey,
    pub option_index:   u8,
    pub amount:         u64,
    pub message:        Option<String>,
    pub timestamp:      i64,
}

#[derive(Accounts)]
pub struct VotePoll<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(
        mut,
        seeds = [TIP_PROFILE_SEED, profile_owner.key().as_ref()],
        bump = recipient_profile.bump,
    )]
    pub recipient_profile: Account<'info, TipProfile>,

    /// CHECK: validated by PDA derivation of recipient_profile
    #[account(mut)]
    pub profile_owner: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [VAULT_SEED, recipient_profile.key().as_ref()],
        bump = vault.bump,
        constraint = vault.owner == profile_owner.key() @ ErrorCode::VaultNotInitialized,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [TIP_POLL_SEED, recipient_profile.key().as_ref(), tip_poll.poll_id.to_le_bytes().as_ref()],
        bump = tip_poll.bump,
        constraint = tip_poll.profile == recipient_profile.key() @ ErrorCode::InvalidAccountData,
    )]
    pub tip_poll: Account<'info, TipPoll>,

    #[account(
        seeds = [PLATFORM_CONFIG_SEED],
        bump = platform_config.bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<VotePoll>,
    option_index: u8,
    amount: u64,
    message: Option<String>,
) -> Result<()> {
    require!(ENABLE_POLLS, ErrorCode::PollsDisabled);
    require!(!ctx.accounts.platform_config.paused, ErrorCode::PlatformPaused);

    let clock = Clock::get()?;
    let ts = clock.unix_timestamp;

    // Self-vote prevention
    require!(
        ctx.accounts.voter.key() != ctx.accounts.profile_owner.key(),
        ErrorCode::CannotTipSelf
    );

    // Validate amount
    ctx.accounts.recipient_profile.validate_tip_amount(amount)?;

    // Validate message
    if let Some(ref m) = message {
        require!(m.len() <= MAX_MESSAGE_LENGTH, ErrorCode::MessageTooLong);
        require!(validate_text_content(m), ErrorCode::UnsafeTextContent);
    }

    // Record vote on poll
    ctx.accounts.tip_poll.vote(option_index, amount, ts)?;

    // Transfer SOL to vault
    let cpi = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.voter.to_account_info(),
            to:   ctx.accounts.vault.to_account_info(),
        },
    );
    transfer(cpi, amount)?;
    ctx.accounts.vault.deposit(amount)?;

    // Update profile stats
    let voter_key = ctx.accounts.voter.key();
    ctx.accounts.recipient_profile.record_tip(voter_key, amount, true)?;

    emit!(PollVoteEvent {
        voter:        ctx.accounts.voter.key(),
        profile:      ctx.accounts.recipient_profile.key(),
        poll:         ctx.accounts.tip_poll.key(),
        option_index,
        amount,
        message:      message.clone(),
        timestamp:    ts,
    });

    msg!("Poll vote: option {} with {} lamports", option_index, amount);
    Ok(())
}
