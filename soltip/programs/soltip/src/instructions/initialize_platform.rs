use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::constants::*;

// ---- PlatformConfig account (owned here, re-exported) --------

#[account]
pub struct PlatformConfig {
    pub authority:        Pubkey,
    pub treasury:         Pubkey,
    pub platform_fee_bps: u16,
    pub paused:           bool,
    pub created_at:       i64,
    pub bump:             u8,
}

impl PlatformConfig {
    pub const LEN: usize = PLATFORM_CONFIG_SIZE;
}

// ---- InitializePlatform instruction --------------------------

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer  = authority,
        space  = PlatformConfig::LEN,
        seeds  = [PLATFORM_CONFIG_SEED],
        bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    /// CHECK: treasury is a SOL wallet PDA, validated by seeds
    #[account(
        mut,
        seeds = [PLATFORM_TREASURY_SEED],
        bump,
    )]
    pub platform_treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializePlatform>) -> Result<()> {
    let clock = Clock::get()?;
    let cfg   = &mut ctx.accounts.platform_config;

    cfg.authority        = ctx.accounts.authority.key();
    cfg.treasury         = ctx.accounts.platform_treasury.key();
    cfg.platform_fee_bps = PLATFORM_FEE_BPS;
    cfg.paused           = false;
    cfg.created_at       = clock.unix_timestamp;
    cfg.bump             = ctx.bumps.platform_config;

    // Seed treasury with a small lamport amount to keep it rent-exempt alive
    let cpi = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.authority.to_account_info(),
            to:   ctx.accounts.platform_treasury.to_account_info(),
        },
    );
    transfer(cpi, 1_000_000u64)?;

    msg!("Platform initialized. Authority: {}", cfg.authority);
    msg!("Treasury: {}", cfg.treasury);
    Ok(())
}
