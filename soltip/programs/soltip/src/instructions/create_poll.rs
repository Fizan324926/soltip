use anchor_lang::prelude::*;
use crate::state::{TipProfile, TipPoll};
use crate::constants::*;
use crate::error::ErrorCode;

#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct CreatePoll<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [TIP_PROFILE_SEED, owner.key().as_ref()],
        bump = tip_profile.bump,
        has_one = owner @ ErrorCode::NotProfileOwner,
    )]
    pub tip_profile: Account<'info, TipProfile>,

    #[account(
        init,
        payer = owner,
        space = TipPoll::LEN,
        seeds = [TIP_POLL_SEED, tip_profile.key().as_ref(), poll_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub tip_poll: Account<'info, TipPoll>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreatePoll>,
    poll_id: u64,
    title: String,
    description: String,
    options: Vec<String>,
    deadline: Option<i64>,
) -> Result<()> {
    require!(ENABLE_POLLS, ErrorCode::PollsDisabled);

    let tip_profile = &mut ctx.accounts.tip_profile;
    let tip_poll = &mut ctx.accounts.tip_poll;
    let clock = Clock::get()?;

    tip_profile.increment_polls()?;

    tip_poll.initialize(
        tip_profile.key(),
        poll_id,
        title,
        description,
        options,
        deadline,
        clock.unix_timestamp,
        ctx.bumps.tip_poll,
    )?;

    msg!("Poll created: {}", tip_poll.title);
    Ok(())
}
