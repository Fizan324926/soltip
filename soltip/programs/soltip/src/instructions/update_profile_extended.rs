use anchor_lang::prelude::*;
use crate::state::TipProfile;
use crate::constants::*;
use crate::error::ErrorCode;

/// Extended profile update: preset amounts, social links, webhook URL
#[derive(Accounts)]
pub struct UpdateProfileExtended<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [TIP_PROFILE_SEED, owner.key().as_ref()],
        bump = tip_profile.bump,
        has_one = owner @ ErrorCode::NotProfileOwner,
    )]
    pub tip_profile: Account<'info, TipProfile>,
}

pub fn handler(
    ctx: Context<UpdateProfileExtended>,
    preset_amounts: Option<Vec<u64>>,
    social_links: Option<String>,
    webhook_url: Option<String>,
) -> Result<()> {
    let tip_profile = &mut ctx.accounts.tip_profile;
    let clock = Clock::get()?;

    if let Some(amounts) = preset_amounts {
        tip_profile.set_preset_amounts(amounts)?;
    }
    if let Some(links) = social_links {
        tip_profile.set_social_links(links)?;
    }
    if let Some(url) = webhook_url {
        tip_profile.set_webhook_url(url)?;
    }

    tip_profile.updated_at = clock.unix_timestamp;

    msg!("Profile extended settings updated for: {}", tip_profile.username);
    Ok(())
}
