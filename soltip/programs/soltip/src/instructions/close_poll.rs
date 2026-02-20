use anchor_lang::prelude::*;
use crate::state::{TipProfile, TipPoll};
use crate::constants::*;
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct ClosePoll<'info> {
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
        mut,
        seeds = [TIP_POLL_SEED, tip_profile.key().as_ref(), tip_poll.poll_id.to_le_bytes().as_ref()],
        bump = tip_poll.bump,
        constraint = tip_poll.profile == tip_profile.key() @ ErrorCode::NotPollOwner,
        close = owner,
    )]
    pub tip_poll: Account<'info, TipPoll>,
}

pub fn handler(ctx: Context<ClosePoll>) -> Result<()> {
    require!(ENABLE_POLLS, ErrorCode::PollsDisabled);

    // Deactivate the poll before account closure
    if ctx.accounts.tip_poll.is_active {
        ctx.accounts.tip_poll.deactivate()?;
    }

    let title = ctx.accounts.tip_poll.title.clone();
    let total_votes = ctx.accounts.tip_poll.total_votes;
    let total_amount = ctx.accounts.tip_poll.total_amount;
    let winner = ctx.accounts.tip_poll.winning_option();

    // Decrement active polls count
    ctx.accounts.tip_profile.decrement_polls()?;

    msg!("Poll closed: {} | Votes: {} | Total: {} lamports", title, total_votes, total_amount);

    if let Some(w) = winner {
        msg!("Winner: option {}", w);
    }

    Ok(())
}
