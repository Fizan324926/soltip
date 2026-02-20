// ==========================================================
// initialize_vault – create a per-creator SOL escrow vault
//
// Must be called once before send_tip can deposit into vault.
// The vault PDA is funded with MIN_VAULT_RENT_BUFFER on init
// to keep it rent-exempt.
// ==========================================================

use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::state::{TipProfile, Vault};
use crate::constants::*;
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        seeds = [TIP_PROFILE_SEED, owner.key().as_ref()],
        bump  = tip_profile.bump,
        has_one = owner @ ErrorCode::NotProfileOwner,
    )]
    pub tip_profile: Account<'info, TipProfile>,

    #[account(
        init,
        payer = owner,
        space = Vault::LEN,
        seeds = [VAULT_SEED, tip_profile.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, Vault>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeVault>) -> Result<()> {
    let clock = Clock::get()?;

    ctx.accounts.vault.initialize(
        ctx.accounts.owner.key(),
        clock.unix_timestamp,
        ctx.bumps.vault,
    );

    // Seed vault with minimum rent buffer so it stays alive
    let seed_amount = MIN_VAULT_RENT_BUFFER;
    let cpi_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.owner.to_account_info(),
            to:   ctx.accounts.vault.to_account_info(),
        },
    );
    transfer(cpi_ctx, seed_amount)?;

    // Record the seeded amount as a deposit
    ctx.accounts.vault.deposit(seed_amount)?;

    msg!("Vault initialized for profile: {}", ctx.accounts.tip_profile.username);
    msg!("Vault PDA: {}", ctx.accounts.vault.key());
    Ok(())
}
