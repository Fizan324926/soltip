use anchor_lang::prelude::*;
use crate::state::{TipProfile, ContentGate};
use crate::constants::*;
use crate::error::ErrorCode;

#[derive(Accounts)]
#[instruction(gate_id: u64)]
pub struct CreateContentGate<'info> {
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
        space = ContentGate::LEN,
        seeds = [CONTENT_GATE_SEED, tip_profile.key().as_ref(), gate_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub content_gate: Account<'info, ContentGate>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateContentGate>,
    gate_id: u64,
    title: String,
    content_url: String,
    required_amount: u64,
) -> Result<()> {
    require!(ENABLE_CONTENT_GATES, ErrorCode::ContentGatesDisabled);

    let tip_profile = &mut ctx.accounts.tip_profile;
    let content_gate = &mut ctx.accounts.content_gate;
    let clock = Clock::get()?;

    tip_profile.increment_gates()?;

    content_gate.initialize(
        tip_profile.key(),
        gate_id,
        title,
        content_url,
        required_amount,
        clock.unix_timestamp,
        ctx.bumps.content_gate,
    )?;

    msg!("Content gate created: {} | Required: {} lamports", content_gate.title, required_amount);
    Ok(())
}
