use anchor_lang::prelude::*;
use crate::state::{TipProfile, Referral};
use crate::constants::*;
use crate::error::ErrorCode;

#[event]
pub struct ReferralCreatedEvent {
    pub referrer:        Pubkey,
    pub referee_profile: Pubkey,
    pub fee_share_bps:   u16,
    pub timestamp:       i64,
}

#[derive(Accounts)]
pub struct RegisterReferral<'info> {
    /// The referrer (existing creator who is making the referral)
    #[account(mut)]
    pub referrer: Signer<'info>,

    /// The referrer's own profile (must exist to make referrals)
    #[account(
        seeds = [TIP_PROFILE_SEED, referrer.key().as_ref()],
        bump = referrer_profile.bump,
        has_one = owner @ ErrorCode::NotProfileOwner,
    )]
    pub referrer_profile: Account<'info, TipProfile>,

    /// The referred creator's profile
    #[account(
        seeds = [TIP_PROFILE_SEED, referee_owner.key().as_ref()],
        bump = referee_profile.bump,
    )]
    pub referee_profile: Account<'info, TipProfile>,

    /// CHECK: validated by PDA derivation of referee_profile
    pub referee_owner: UncheckedAccount<'info>,

    /// The referral PDA linking referrer → referee
    #[account(
        init,
        payer = referrer,
        space = Referral::LEN,
        seeds = [REFERRAL_SEED, referrer.key().as_ref(), referee_profile.key().as_ref()],
        bump,
    )]
    pub referral: Account<'info, Referral>,

    /// Alias so Anchor `has_one` matches the profile field
    /// CHECK: must equal referrer_profile.owner
    #[account(address = referrer_profile.owner)]
    pub owner: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RegisterReferral>,
    fee_share_bps: u16,
) -> Result<()> {
    require!(ENABLE_REFERRALS, ErrorCode::ReferralsDisabled);

    // Cannot refer yourself
    require!(
        ctx.accounts.referrer.key() != ctx.accounts.referee_owner.key(),
        ErrorCode::CannotReferSelf
    );

    let clock = Clock::get()?;
    let referral = &mut ctx.accounts.referral;

    referral.initialize(
        ctx.accounts.referrer.key(),
        ctx.accounts.referee_profile.key(),
        fee_share_bps,
        clock.unix_timestamp,
        ctx.bumps.referral,
    )?;

    emit!(ReferralCreatedEvent {
        referrer:        ctx.accounts.referrer.key(),
        referee_profile: ctx.accounts.referee_profile.key(),
        fee_share_bps,
        timestamp:       clock.unix_timestamp,
    });

    msg!(
        "Referral registered: {} → {} at {}bps",
        ctx.accounts.referrer.key(),
        ctx.accounts.referee_profile.key(),
        fee_share_bps
    );
    Ok(())
}
