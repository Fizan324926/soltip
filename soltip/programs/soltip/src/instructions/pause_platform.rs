use anchor_lang::prelude::*;
use crate::constants::*;
use crate::error::ErrorCode;
use crate::instructions::initialize_platform::PlatformConfig;

#[derive(Accounts)]
pub struct PausePlatform<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds   = [PLATFORM_CONFIG_SEED],
        bump    = platform_config.bump,
        has_one = authority @ ErrorCode::NotAdmin,
    )]
    pub platform_config: Account<'info, PlatformConfig>,
}

pub fn handler(ctx: Context<PausePlatform>, paused: bool) -> Result<()> {
    ctx.accounts.platform_config.paused = paused;
    msg!("Platform paused: {}", paused);
    Ok(())
}
