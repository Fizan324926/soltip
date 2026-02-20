use anchor_lang::prelude::*;
use crate::state::{TipProfile, TipGoal};
use crate::constants::*;
use crate::error::ErrorCode;

/// Accounts required to create a fundraising goal
#[derive(Accounts)]
#[instruction(goal_id: u64)]
pub struct CreateGoal<'info> {
    /// The profile owner creating the goal
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

    /// The goal account to be created
    #[account(
        init,
        payer = owner,
        space = TipGoal::LEN,
        seeds = [TIP_GOAL_SEED, tip_profile.key().as_ref(), goal_id.to_le_bytes().as_ref()],
        bump
    )]
    pub tip_goal: Account<'info, TipGoal>,

    /// System program for account creation
    pub system_program: Program<'info, System>,
}

/// Handler for creating a fundraising goal
pub fn handler(
    ctx: Context<CreateGoal>,
    goal_id: u64,
    title: String,
    description: String,
    target_amount: u64,
    token_mint: Pubkey,
    deadline: Option<i64>,
) -> Result<()> {
    // Validate feature is enabled
    require!(ENABLE_GOALS, ErrorCode::GoalsDisabled);

    // Validate text content on all user-provided strings
    require!(validate_text_content(&title), ErrorCode::UnsafeTextContent);
    require!(validate_text_content(&description), ErrorCode::UnsafeTextContent);

    let tip_profile = &mut ctx.accounts.tip_profile;
    let tip_goal = &mut ctx.accounts.tip_goal;
    let clock = Clock::get()?;

    // Check if profile can create more goals
    tip_profile.increment_goals()?;

    // Initialize the goal
    tip_goal.initialize(
        tip_profile.key(),
        goal_id,
        title,
        description,
        target_amount,
        token_mint,
        deadline,
        clock.unix_timestamp,
        ctx.bumps.tip_goal,
    )?;

    msg!("Goal created: {}", tip_goal.title);
    msg!("Target amount: {} (mint: {})", target_amount, token_mint);
    if let Some(deadline_ts) = deadline {
        msg!("Deadline: {}", deadline_ts);
    }

    Ok(())
}
