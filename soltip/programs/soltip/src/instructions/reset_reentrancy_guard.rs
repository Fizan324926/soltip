use anchor_lang::prelude::*;
use crate::state::TipProfile;
use crate::instructions::initialize_platform::PlatformConfig;
use crate::constants::*;
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct ResetReentrancyGuard<'info> {
    pub authority: Signer<'info>,

    #[account(
        seeds   = [PLATFORM_CONFIG_SEED],
        bump    = platform_config.bump,
        has_one = authority @ ErrorCode::NotAdmin,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        mut,
        seeds = [TIP_PROFILE_SEED, tip_profile.owner.as_ref()],
        bump  = tip_profile.bump,
    )]
    pub tip_profile: Account<'info, TipProfile>,
}

pub fn handler(ctx: Context<ResetReentrancyGuard>) -> Result<()> {
    ctx.accounts.tip_profile.reentrancy_guard = false;

    msg!(
        "Reentrancy guard reset for profile: {}",
        ctx.accounts.tip_profile.username,
    );
    Ok(())
}
