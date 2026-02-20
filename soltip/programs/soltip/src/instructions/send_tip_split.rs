use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, system_instruction};
use crate::state::{TipProfile, Vault, TipSplit, RateLimit};
use crate::instructions::initialize_platform::PlatformConfig;
use crate::constants::*;
use crate::error::ErrorCode;

#[event]
pub struct TipSplitSentEvent {
    pub tipper:    Pubkey,
    pub profile:   Pubkey,
    pub amount:    u64,
    pub timestamp: i64,
}

#[derive(Accounts)]
pub struct SendTipSplit<'info> {
    #[account(mut)]
    pub tipper: Signer<'info>,

    #[account(
        mut,
        seeds = [TIP_PROFILE_SEED, profile_owner.key().as_ref()],
        bump  = recipient_profile.bump,
    )]
    pub recipient_profile: Account<'info, TipProfile>,

    /// CHECK: validated by profile PDA seeds
    #[account(mut)]
    pub profile_owner: UncheckedAccount<'info>,

    /// Vault for the primary profile (receives remaining after splits)
    #[account(
        mut,
        seeds      = [VAULT_SEED, recipient_profile.key().as_ref()],
        bump       = vault.bump,
        constraint = vault.owner == profile_owner.key() @ ErrorCode::VaultNotInitialized,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        seeds      = [TIP_SPLIT_SEED, recipient_profile.key().as_ref()],
        bump       = tip_split.bump,
        constraint = tip_split.profile == recipient_profile.key() @ ErrorCode::SplitNotFound,
        constraint = tip_split.is_active                          @ ErrorCode::SplitNotFound,
    )]
    pub tip_split: Account<'info, TipSplit>,

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

/// Send a SOL tip distributed across recipients.
/// Recipient wallets must be passed as remaining_accounts in order matching split config.
pub fn handler<'info>(
    ctx: Context<'_, '_, 'info, 'info, SendTipSplit<'info>>,
    amount: u64,
    message: Option<String>,
) -> Result<()> {
    require!(ENABLE_TIP_SPLITS, ErrorCode::TipSplitsDisabled);

    let clock = Clock::get()?;
    let ts    = clock.unix_timestamp;

    // Platform pause check
    require!(!ctx.accounts.platform_config.paused, ErrorCode::PlatformPaused);

    // Self-tip prevention
    require!(
        ctx.accounts.tipper.key() != ctx.accounts.profile_owner.key(),
        ErrorCode::CannotTipSelf
    );

    // Rate limit
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

    // Anonymous tip check
    if !ctx.accounts.recipient_profile.accept_anonymous {
        require!(message.is_some(), ErrorCode::AnonymousTipsDisabled);
    }

    // Reentrancy guard
    ctx.accounts.recipient_profile.acquire_guard()?;

    // Validate amount and message
    ctx.accounts.recipient_profile.validate_tip_amount(amount)?;
    if let Some(ref m) = message {
        require!(m.len() <= MAX_MESSAGE_LENGTH, ErrorCode::MessageTooLong);
        require!(validate_text_content(m), ErrorCode::UnsafeTextContent);
    }

    // Calculate per-recipient shares
    let shares = ctx.accounts.tip_split.calculate_shares(amount)?;
    let num_recipients = shares.len();

    require!(
        ctx.remaining_accounts.len() == num_recipients,
        ErrorCode::SplitRecipientMismatch
    );

    // Validate all recipient addresses match remaining_accounts
    for (i, (wallet, _share)) in shares.iter().enumerate() {
        require!(
            ctx.remaining_accounts[i].key() == *wallet,
            ErrorCode::SplitRecipientMismatch
        );
    }

    // Determine if this is the first split tip from this tipper to this profile.
    // We use the rate_limit account as a proxy: if it was just initialized (last_tip_at == ts),
    // this is the first interaction.
    let is_new_tipper = is_new_rl;

    // Transfer SOL from tipper to each recipient via system_program invoke
    let tipper_key = ctx.accounts.tipper.key();
    for (i, (wallet, share)) in shares.iter().enumerate() {
        if *share > 0 {
            invoke(
                &system_instruction::transfer(&tipper_key, wallet, *share),
                &[
                    ctx.accounts.tipper.to_account_info(),
                    ctx.remaining_accounts[i].clone(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }
    }

    // Update profile stats
    ctx.accounts.recipient_profile.record_tip(
        ctx.accounts.tipper.key(),
        amount,
        is_new_tipper,
    )?;

    emit!(TipSplitSentEvent {
        tipper:    ctx.accounts.tipper.key(),
        profile:   ctx.accounts.recipient_profile.key(),
        amount,
        timestamp: ts,
    });

    msg!("Split tip {} lamports across {} recipients", amount, num_recipients);
    if let Some(ref m) = message { msg!("Message: {}", m); }

    // Release reentrancy guard
    ctx.accounts.recipient_profile.release_guard();

    Ok(())
}
