// ==========================================================
// send_tip_spl – SPL-token tip with events  (v2)
//
// Supports USDC, USDT, or any SPL token.
// Transfers directly to recipient's token account.
// Emits SplTipSentEvent for indexers.
// ==========================================================

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer as SplTransfer};
use crate::state::{TipProfile, RateLimit};
use crate::instructions::initialize_platform::PlatformConfig;
use crate::constants::*;
use crate::error::ErrorCode;

#[event]
pub struct SplTipSentEvent {
    pub tipper:            Pubkey,
    pub recipient:         Pubkey,
    pub recipient_profile: Pubkey,
    pub token_mint:        Pubkey,
    pub amount:            u64,
    pub message:           Option<String>,
    pub timestamp:         i64,
}

#[derive(Accounts)]
pub struct SendTipSpl<'info> {
    #[account(mut)]
    pub tipper: Signer<'info>,

    /// Tipper's token account (source)
    #[account(
        mut,
        constraint = tipper_token_account.owner == tipper.key() @ ErrorCode::TokenAccountOwnerMismatch,
    )]
    pub tipper_token_account: Account<'info, TokenAccount>,

    /// Recipient profile
    #[account(
        mut,
        seeds = [TIP_PROFILE_SEED, recipient_owner.key().as_ref()],
        bump  = recipient_profile.bump,
    )]
    pub recipient_profile: Account<'info, TipProfile>,

    /// CHECK: validated by PDA derivation of recipient_profile
    pub recipient_owner: UncheckedAccount<'info>,

    /// Recipient's token account (destination)
    #[account(
        mut,
        constraint = recipient_token_account.owner    == recipient_owner.key()          @ ErrorCode::TokenAccountOwnerMismatch,
        constraint = recipient_token_account.mint     == tipper_token_account.mint      @ ErrorCode::TokenMintMismatch,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    /// Rate-limit PDA
    #[account(
        init_if_needed,
        payer = tipper,
        space = RateLimit::LEN,
        seeds = [RATE_LIMIT_SEED, tipper.key().as_ref(), recipient_profile.key().as_ref()],
        bump,
    )]
    pub rate_limit: Account<'info, RateLimit>,

    /// Global platform config – checked for pause state.
    #[account(
        seeds = [PLATFORM_CONFIG_SEED],
        bump  = platform_config.bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    pub token_program:   Program<'info, Token>,
    pub system_program:  Program<'info, System>,
}

pub fn handler(
    ctx: Context<SendTipSpl>,
    amount: u64,
    message: Option<String>,
) -> Result<()> {
    require!(ENABLE_MULTI_TOKEN, ErrorCode::MultiTokenDisabled);

    let clock = Clock::get()?;
    let ts    = clock.unix_timestamp;

    // Platform pause check
    require!(!ctx.accounts.platform_config.paused, ErrorCode::PlatformPaused);

    // Self-tip prevention
    require!(
        ctx.accounts.tipper.key() != ctx.accounts.recipient_owner.key(),
        ErrorCode::CannotTipSelf
    );

    // Anonymous tip check
    if !ctx.accounts.recipient_profile.accept_anonymous {
        require!(message.is_some(), ErrorCode::AnonymousTipsDisabled);
    }

    // Rate limiting
    let is_new_rl = ctx.accounts.rate_limit.last_tip_at == 0;
    if is_new_rl {
        ctx.accounts.rate_limit.initialize(
            ctx.accounts.tipper.key(),
            ctx.accounts.recipient_profile.key(),
            ts,
            ctx.bumps.rate_limit,
        );
    } else {
        ctx.accounts.rate_limit.check_and_record(ts, DEFAULT_TIP_COOLDOWN_SECONDS)?;
    }

    // Reentrancy guard (consistent with send_tip and send_tip_split)
    ctx.accounts.recipient_profile.acquire_guard()?;

    // Validate
    ctx.accounts.recipient_profile.validate_tip_amount(amount)?;
    if let Some(ref m) = message {
        require!(m.len() <= MAX_MESSAGE_LENGTH, ErrorCode::MessageTooLong);
        require!(validate_text_content(m), ErrorCode::UnsafeTextContent);
    }
    require!(
        ctx.accounts.tipper_token_account.amount >= amount,
        ErrorCode::InsufficientTokenBalance
    );

    // SPL transfer: tipper → recipient token account
    let cpi = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        SplTransfer {
            from:      ctx.accounts.tipper_token_account.to_account_info(),
            to:        ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.tipper.to_account_info(),
        },
    );
    token::transfer(cpi, amount)?;

    // Update SPL stats on profile
    ctx.accounts.recipient_profile.record_spl_tip(amount)?;

    // Emit event
    let mint = ctx.accounts.tipper_token_account.mint;
    emit!(SplTipSentEvent {
        tipper:            ctx.accounts.tipper.key(),
        recipient:         ctx.accounts.recipient_owner.key(),
        recipient_profile: ctx.accounts.recipient_profile.key(),
        token_mint:        mint,
        amount,
        message:           message.clone(),
        timestamp:         ts,
    });

    msg!("SPL tip: {} tokens (mint: {}) → {}", amount, mint, ctx.accounts.recipient_profile.username);
    if let Some(ref m) = message {
        msg!("Message: {}", m);
    }

    // Release reentrancy guard
    ctx.accounts.recipient_profile.release_guard();

    Ok(())
}
