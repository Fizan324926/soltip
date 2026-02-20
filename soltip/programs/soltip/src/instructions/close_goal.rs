use anchor_lang::prelude::*;
use crate::state::{TipProfile, TipGoal};
use crate::constants::*;
use crate::error::ErrorCode;

/// Accounts required to close a fundraising goal
#[derive(Accounts)]
pub struct CloseGoal<'info> {
    /// The profile owner (goal creator)
    #[account(mut)]
    pub owner: Signer<'info>,

    /// The tip profile
    #[account(
        mut,
        seeds = [TIP_PROFILE_SEED, owner.key().as_ref()],
        bump = tip_profile.bump,
        has_one = owner @ ErrorCode::NotProfileOwner,
    )]
    pub tip_profile: Account<'info, TipProfile>,

    /// The goal to close
    #[account(
        mut,
        seeds = [TIP_GOAL_SEED, tip_profile.key().as_ref(), tip_goal.goal_id.to_le_bytes().as_ref()],
        bump = tip_goal.bump,
        constraint = tip_goal.profile == tip_profile.key() @ ErrorCode::NotGoalOwner,
        close = owner,
    )]
    pub tip_goal: Account<'info, TipGoal>,
}

/// Handler for closing a fundraising goal
/// Can be called when goal is completed or cancelled
pub fn handler(ctx: Context<CloseGoal>) -> Result<()> {
    let tip_profile = &mut ctx.accounts.tip_profile;
    let tip_goal = &ctx.accounts.tip_goal;

    // Validate feature is enabled
    require!(ENABLE_GOALS, ErrorCode::GoalsDisabled);

    // Decrement active goals count
    tip_profile.decrement_goals()?;

    msg!("Goal closed: {}", tip_goal.title);
    msg!("Final amount: {}/{}", tip_goal.current_amount, tip_goal.target_amount);
    msg!("Completed: {}", tip_goal.completed);
    msg!("Unique contributors: {}", tip_goal.unique_contributors);

    // The account will be closed and rent returned to owner via the close constraint

    Ok(())
}
