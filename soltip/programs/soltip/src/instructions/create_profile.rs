use anchor_lang::prelude::*;
use crate::state::TipProfile;
use crate::constants::*;
use crate::error::ErrorCode;

/// Accounts required to create a new creator tip profile.
///
/// The profile PDA is derived from `["tip_profile", owner.pubkey]`, so
/// each wallet can have exactly one profile. The owner pays the rent.
#[derive(Accounts)]
#[instruction(username: String)]
pub struct CreateProfile<'info> {
    /// The user creating their profile (pays for account creation)
    #[account(mut)]
    pub owner: Signer<'info>,

    /// The tip profile account to be created
    /// PDA derived from ["tip_profile", owner pubkey]
    #[account(
        init,
        payer = owner,
        space = TipProfile::LEN,
        seeds = [TIP_PROFILE_SEED, owner.key().as_ref()],
        bump
    )]
    pub tip_profile: Account<'info, TipProfile>,

    /// System program for account creation
    pub system_program: Program<'info, System>,
}

/// Handler for creating a new tip profile
pub fn handler(
    ctx: Context<CreateProfile>,
    username: String,
    display_name: String,
    description: String,
    image_url: String,
) -> Result<()> {
    // Validate text content on all user-provided strings
    require!(validate_text_content(&display_name), ErrorCode::UnsafeTextContent);
    require!(validate_text_content(&description), ErrorCode::UnsafeTextContent);
    require!(validate_text_content(&image_url), ErrorCode::UnsafeTextContent);

    let tip_profile = &mut ctx.accounts.tip_profile;
    let clock = Clock::get()?;

    tip_profile.initialize(
        ctx.accounts.owner.key(),
        username,
        display_name,
        description,
        image_url,
        clock.unix_timestamp,
        ctx.bumps.tip_profile,
    )?;

    msg!("Tip profile created for user: {}", tip_profile.username);
    msg!("Profile owner: {}", tip_profile.owner);

    Ok(())
}
