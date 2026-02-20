use anchor_lang::prelude::*;
use crate::state::TipProfile;
use crate::constants::*;
use crate::error::ErrorCode;
use crate::instructions::initialize_platform::PlatformConfig;

#[derive(Accounts)]
pub struct VerifyCreator<'info> {
    pub authority: Signer<'info>,

    #[account(
        seeds   = [PLATFORM_CONFIG_SEED],
        bump    = platform_config.bump,
        has_one = authority @ ErrorCode::NotAdmin,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(mut)]
    pub tip_profile: Account<'info, TipProfile>,
}

pub fn handler(ctx: Context<VerifyCreator>, verified: bool) -> Result<()> {
    ctx.accounts.tip_profile.is_verified = verified;
    msg!(
        "Creator {} verification set to: {}",
        ctx.accounts.tip_profile.username,
        verified
    );
    Ok(())
}
