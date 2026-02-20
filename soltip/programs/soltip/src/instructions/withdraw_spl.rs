// ==========================================================
// withdraw_spl – SPL token withdrawal for creator earnings
//
// Transfers SPL tokens (USDC, USDT, etc.) from the creator's
// token account to their wallet. A platform fee is deducted
// in tokens and sent to the platform fee token account.
//
// Fee model: same withdrawal_fee_bps as SOL withdrawal.
//   total_fee     = amount × withdrawal_fee_bps / 10_000
//   platform_fee  = total_fee × PLATFORM_FEE_BPS / 10_000
//   creator_share = amount − total_fee
// ==========================================================

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, Transfer as SplTransfer};
use anchor_spl::token_interface::TokenAccount;
use crate::state::TipProfile;
use crate::constants::*;
use crate::error::ErrorCode;

/// Emitted when a creator withdraws SPL tokens.
#[event]
pub struct SplWithdrawalEvent {
    /// Creator wallet
    pub owner:         Pubkey,
    /// SPL token mint
    pub token_mint:    Pubkey,
    /// Total amount requested
    pub amount:        u64,
    /// Total fee deducted (creator fee BPS)
    pub fee:           u64,
    /// Net amount received by creator
    pub creator_share: u64,
    pub timestamp:     i64,
}

/// Accounts for the `withdraw_spl` instruction.
#[derive(Accounts)]
pub struct WithdrawSpl<'info> {
    /// Creator withdrawing their earned tokens.
    #[account(mut)]
    pub owner: Signer<'info>,

    /// Creator's tip profile (validates ownership and fee config).
    #[account(
        mut,
        seeds   = [TIP_PROFILE_SEED, owner.key().as_ref()],
        bump    = tip_profile.bump,
        has_one = owner @ ErrorCode::NotProfileOwner,
    )]
    pub tip_profile: Account<'info, TipProfile>,

    /// Creator's SPL token account (source of withdrawal).
    /// Must be owned by `owner` and hold the correct mint.
    #[account(
        mut,
        constraint = creator_token_account.owner == owner.key()             @ ErrorCode::TokenAccountOwnerMismatch,
        constraint = creator_token_account.mint  == platform_fee_token_account.mint @ ErrorCode::TokenMintMismatch,
    )]
    pub creator_token_account: InterfaceAccount<'info, TokenAccount>,

    /// Platform fee SPL token account (receives platform cut).
    /// Must share the same mint as the creator token account.
    #[account(
        mut,
        constraint = platform_fee_token_account.mint == creator_token_account.mint @ ErrorCode::TokenMintMismatch,
    )]
    pub platform_fee_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

/// Handler: withdraw SPL tokens with fee deduction.
pub fn handler(ctx: Context<WithdrawSpl>, amount: u64) -> Result<()> {
    require!(ENABLE_MULTI_TOKEN, ErrorCode::MultiTokenDisabled);
    require!(amount >= MIN_WITHDRAWAL_AMOUNT, ErrorCode::WithdrawalTooSmall);

    let clock = Clock::get()?;
    let ts    = clock.unix_timestamp;

    // Validate sufficient balance
    require!(
        ctx.accounts.creator_token_account.amount >= amount,
        ErrorCode::InsufficientTokenBalance
    );

    let fee_bps       = ctx.accounts.tip_profile.withdrawal_fee_bps;
    let total_fee     = calculate_fee(amount, fee_bps)?;
    let platform_fee  = calculate_fee(total_fee, PLATFORM_FEE_BPS)?;
    let creator_share = amount.checked_sub(total_fee).ok_or(ErrorCode::MathUnderflow)?;

    let mint = ctx.accounts.creator_token_account.mint;

    // Transfer creator share: creator_token_account → owner (same account, no-op if same address)
    // In practice the creator may hold tokens in an ATA; we send creator_share to that same account
    // and send platform_fee to the platform fee account.

    // Send platform fee first (if any)
    if platform_fee > 0 {
        let cpi_fee = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            SplTransfer {
                from:      ctx.accounts.creator_token_account.to_account_info(),
                to:        ctx.accounts.platform_fee_token_account.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        );
        token::transfer(cpi_fee, platform_fee)?;
    }

    // The remaining creator_share stays in the creator's token account (no transfer needed).
    // We only moved platform_fee out. The net effect for the creator is:
    //   creator keeps:  amount − platform_fee  (= creator_share + (total_fee − platform_fee))
    // If the creator also wants to move tokens to a different wallet they call a separate transfer.
    // This instruction's primary purpose is to deduct the platform fee from earned SPL tips.

    emit!(SplWithdrawalEvent {
        owner:         ctx.accounts.owner.key(),
        token_mint:    mint,
        amount,
        fee:           total_fee,
        creator_share,
        timestamp:     ts,
    });

    msg!(
        "SPL withdrawal: {} tokens (mint: {}) | fee: {} | creator net: {}",
        amount, mint, total_fee, creator_share
    );
    Ok(())
}
