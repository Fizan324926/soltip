// ==========================================================
// send_tip – SOL tip with vault escrow  (v2)
//
// Flow:
//  1. Rate-limit check (cooldown + daily cap)
//  2. Reentrancy guard acquire
//  3. Validate amount & message
//  4. Transfer SOL: tipper → vault PDA
//  5. Credit vault balance tracking
//  6. Update / create TipperRecord
//  7. Update TipProfile stats + leaderboard
//  8. Emit TipSentEvent
//  9. Release reentrancy guard
// ==========================================================

use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::state::{TipProfile, Vault, TipperRecord, RateLimit};
use crate::instructions::initialize_platform::PlatformConfig;
use crate::constants::*;
use crate::error::ErrorCode;

// ------------------------------------------------------------------
// Anchor Event
// ------------------------------------------------------------------
#[event]
pub struct TipSentEvent {
    pub tipper:            Pubkey,
    pub recipient:         Pubkey,
    pub recipient_profile: Pubkey,
    pub amount:            u64,
    pub message:           Option<String>,
    pub is_new_tipper:     bool,
    pub timestamp:         i64,
}

// ------------------------------------------------------------------
// Accounts
// ------------------------------------------------------------------
#[derive(Accounts)]
pub struct SendTip<'info> {
    /// Tipper signs and pays
    #[account(mut)]
    pub tipper: Signer<'info>,

    /// Recipient profile – validated via PDA seeds
    #[account(
        mut,
        seeds = [TIP_PROFILE_SEED, recipient_owner.key().as_ref()],
        bump  = recipient_profile.bump,
    )]
    pub recipient_profile: Account<'info, TipProfile>,

    /// Creator wallet – validated by PDA derivation above
    /// CHECK: verified implicitly by PDA constraint on recipient_profile
    #[account(mut)]
    pub recipient_owner: UncheckedAccount<'info>,

    /// SOL vault for this creator
    #[account(
        mut,
        seeds = [VAULT_SEED, recipient_profile.key().as_ref()],
        bump  = vault.bump,
        constraint = vault.owner == recipient_owner.key() @ ErrorCode::VaultNotInitialized,
    )]
    pub vault: Account<'info, Vault>,

    /// Per-(tipper, profile) record: init if first tip, else mut
    #[account(
        init_if_needed,
        payer  = tipper,
        space  = TipperRecord::LEN,
        seeds  = [TIPPER_RECORD_SEED, tipper.key().as_ref(), recipient_profile.key().as_ref()],
        bump,
    )]
    pub tipper_record: Account<'info, TipperRecord>,

    /// Rate-limit account: init if first tip, else mut
    #[account(
        init_if_needed,
        payer  = tipper,
        space  = RateLimit::LEN,
        seeds  = [RATE_LIMIT_SEED, tipper.key().as_ref(), recipient_profile.key().as_ref()],
        bump,
    )]
    pub rate_limit: Account<'info, RateLimit>,

    /// Global platform config – checked for pause state.
    #[account(
        seeds = [PLATFORM_CONFIG_SEED],
        bump  = platform_config.bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    pub system_program: Program<'info, System>,
}

// ------------------------------------------------------------------
// Handler
// ------------------------------------------------------------------
pub fn handler(
    ctx: Context<SendTip>,
    amount: u64,
    message: Option<String>,
) -> Result<()> {
    let clock = Clock::get()?;
    let ts    = clock.unix_timestamp;

    // ── 1. Self-tip prevention ──────────────────────────────────────
    require!(
        ctx.accounts.tipper.key() != ctx.accounts.recipient_owner.key(),
        ErrorCode::CannotTipSelf
    );

    // ── 2. Platform pause check ─────────────────────────────────────
    require!(!ctx.accounts.platform_config.paused, ErrorCode::PlatformPaused);

    // ── 3. Anonymous tip check ─────────────────────────────────────
    // If the creator has disabled anonymous tips, a message must be provided.
    if !ctx.accounts.recipient_profile.accept_anonymous {
        require!(message.is_some(), ErrorCode::AnonymousTipsDisabled);
    }

    // ── 4. Rate-limit ───────────────────────────────────────────────
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

    // ── 5. Reentrancy guard ─────────────────────────────────────────
    ctx.accounts.recipient_profile.acquire_guard()?;

    // ── 6. Amount & message validation ─────────────────────────────
    ctx.accounts.recipient_profile.validate_tip_amount(amount)?;
    if let Some(ref m) = message {
        require!(m.len() <= MAX_MESSAGE_LENGTH, ErrorCode::MessageTooLong);
        require!(validate_text_content(m), ErrorCode::UnsafeTextContent);
    }

    // ── 7. Transfer SOL tipper → vault ─────────────────────────────
    let cpi = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.tipper.to_account_info(),
            to:   ctx.accounts.vault.to_account_info(),
        },
    );
    transfer(cpi, amount)?;
    ctx.accounts.vault.deposit(amount)?;

    // ── 7. TipperRecord – init or update ───────────────────────────
    let is_new_tipper = ctx.accounts.tipper_record.tip_count == 0;
    if is_new_tipper {
        ctx.accounts.tipper_record.initialize(
            ctx.accounts.tipper.key(),
            ctx.accounts.recipient_profile.key(),
            amount,
            ts,
            ctx.bumps.tipper_record,
        )?;
    } else {
        ctx.accounts.tipper_record.record_tip(amount, ts)?;
    }

    // ── 8. Profile stats + leaderboard ─────────────────────────────
    let tipper_key = ctx.accounts.tipper.key();
    ctx.accounts.recipient_profile.record_tip(tipper_key, amount, is_new_tipper)?;

    // ── 9. Emit event ───────────────────────────────────────────────
    emit!(TipSentEvent {
        tipper:            ctx.accounts.tipper.key(),
        recipient:         ctx.accounts.recipient_owner.key(),
        recipient_profile: ctx.accounts.recipient_profile.key(),
        amount,
        message:           message.clone(),
        is_new_tipper,
        timestamp:         ts,
    });

    msg!("Tip: {} lamports → {} (vault)", amount, ctx.accounts.recipient_profile.username);
    if let Some(ref m) = message {
        msg!("Message: {}", m);
    }

    // ── 10. Release reentrancy guard ───────────────────────────────
    ctx.accounts.recipient_profile.release_guard();

    Ok(())
}
