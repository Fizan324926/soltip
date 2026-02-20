use anchor_lang::prelude::*;
use crate::state::{TipProfile, ContentGate};
use crate::constants::*;
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct CloseContentGate<'info> {
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
        seeds = [CONTENT_GATE_SEED, tip_profile.key().as_ref(), content_gate.gate_id.to_le_bytes().as_ref()],
        bump = content_gate.bump,
        constraint = content_gate.profile == tip_profile.key() @ ErrorCode::NotGateOwner,
        close = owner,
    )]
    pub content_gate: Account<'info, ContentGate>,
}

pub fn handler(ctx: Context<CloseContentGate>) -> Result<()> {
    require!(ENABLE_CONTENT_GATES, ErrorCode::ContentGatesDisabled);

    ctx.accounts.tip_profile.decrement_gates()?;

    msg!(
        "Content gate closed: {} | Accesses: {}",
        ctx.accounts.content_gate.title,
        ctx.accounts.content_gate.access_count
    );
    Ok(())
}
