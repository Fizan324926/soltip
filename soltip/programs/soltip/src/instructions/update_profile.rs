use anchor_lang::prelude::*;
use crate::state::TipProfile;
use crate::constants::*;
use crate::error::ErrorCode;

/// Accounts required to update a tip profile
#[derive(Accounts)]
pub struct UpdateProfile<'info> {
    /// The owner of the profile (must sign)
    pub owner: Signer<'info>,

    /// The tip profile to update
    #[account(
        mut,
        seeds = [TIP_PROFILE_SEED, owner.key().as_ref()],
        bump = tip_profile.bump,
        has_one = owner @ ErrorCode::NotProfileOwner,
    )]
    pub tip_profile: Account<'info, TipProfile>,
}

/// Handler for updating profile settings
pub fn handler(
    ctx: Context<UpdateProfile>,
    display_name: Option<String>,
    description: Option<String>,
    image_url: Option<String>,
    min_tip_amount: Option<u64>,
    withdrawal_fee_bps: Option<u16>,
    accept_anonymous: Option<bool>,
) -> Result<()> {
    let tip_profile = &mut ctx.accounts.tip_profile;
    let clock = Clock::get()?;

    tip_profile.update(
        display_name,
        description,
        image_url,
        min_tip_amount,
        withdrawal_fee_bps,
        accept_anonymous,
        clock.unix_timestamp,
    )?;

    msg!("Profile updated for user: {}", tip_profile.username);

    Ok(())
}
