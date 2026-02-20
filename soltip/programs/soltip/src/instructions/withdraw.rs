// withdraw – vault-based withdrawal with fee split  (v2)
use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::state::{TipProfile, Vault};
use crate::constants::*;
use crate::error::ErrorCode;

#[event]
pub struct WithdrawalEvent {
    pub owner:         Pubkey,
    pub amount:        u64,
    pub fee:           u64,
    pub creator_share: u64,
    pub timestamp:     i64,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds   = [TIP_PROFILE_SEED, owner.key().as_ref()],
        bump    = tip_profile.bump,
        has_one = owner @ ErrorCode::NotProfileOwner,
    )]
    pub tip_profile: Account<'info, TipProfile>,

    #[account(
        mut,
        seeds      = [VAULT_SEED, tip_profile.key().as_ref()],
        bump       = vault.bump,
        constraint = vault.owner == owner.key() @ ErrorCode::NotProfileOwner,
    )]
    pub vault: Account<'info, Vault>,

    /// CHECK: PDA verified by seeds
    #[account(
        mut,
        seeds = [PLATFORM_TREASURY_SEED],
        bump,
    )]
    pub platform_treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    let clock = Clock::get()?;
    let ts    = clock.unix_timestamp;

    require!(amount >= MIN_WITHDRAWAL_AMOUNT, ErrorCode::WithdrawalTooSmall);

    let withdrawable = ctx.accounts.vault.withdrawable();
    require!(withdrawable >= amount, ErrorCode::InsufficientBalance);

    let fee_bps       = ctx.accounts.tip_profile.withdrawal_fee_bps;
    let total_fee     = calculate_fee(amount, fee_bps)?;
    let platform_fee  = calculate_fee(total_fee, PLATFORM_FEE_BPS)?;
    let creator_share = amount.checked_sub(total_fee).ok_or(ErrorCode::MathUnderflow)?;

    ctx.accounts.vault.withdraw(amount)?;

    let profile_key  = ctx.accounts.tip_profile.key();
    let vault_bump   = ctx.accounts.vault.bump;
    let vault_seeds: &[&[u8]] = &[VAULT_SEED, profile_key.as_ref(), &[vault_bump]];
    let signer_seeds = &[vault_seeds];

    let cpi_owner = CpiContext::new_with_signer(
        ctx.accounts.system_program.to_account_info(),
        Transfer { from: ctx.accounts.vault.to_account_info(), to: ctx.accounts.owner.to_account_info() },
        signer_seeds,
    );
    transfer(cpi_owner, creator_share)?;

    if platform_fee > 0 {
        let cpi_treasury = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer { from: ctx.accounts.vault.to_account_info(), to: ctx.accounts.platform_treasury.to_account_info() },
            signer_seeds,
        );
        transfer(cpi_treasury, platform_fee)?;
    }

    emit!(WithdrawalEvent { owner: ctx.accounts.owner.key(), amount, fee: total_fee, creator_share, timestamp: ts });
    msg!("Withdrawal: {} | fee: {} | creator: {}", amount, total_fee, creator_share);
    Ok(())
}
