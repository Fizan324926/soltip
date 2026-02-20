use anchor_lang::prelude::*;
use crate::state::{TipProfile, TipperRecord, ContentGate};
use crate::constants::*;
use crate::error::ErrorCode;

#[event]
pub struct ContentAccessEvent {
    pub viewer:       Pubkey,
    pub profile:      Pubkey,
    pub gate:         Pubkey,
    pub gate_id:      u64,
    pub total_tipped: u64,
    pub timestamp:    i64,
}

#[derive(Accounts)]
pub struct VerifyContentAccess<'info> {
    pub viewer: Signer<'info>,

    #[account(
        seeds = [TIP_PROFILE_SEED, profile_owner.key().as_ref()],
        bump = recipient_profile.bump,
    )]
    pub recipient_profile: Account<'info, TipProfile>,

    /// CHECK: validated by PDA derivation
    pub profile_owner: UncheckedAccount<'info>,

    #[account(
        seeds = [TIPPER_RECORD_SEED, viewer.key().as_ref(), recipient_profile.key().as_ref()],
        bump = tipper_record.bump,
    )]
    pub tipper_record: Account<'info, TipperRecord>,

    #[account(
        mut,
        seeds = [CONTENT_GATE_SEED, recipient_profile.key().as_ref(), content_gate.gate_id.to_le_bytes().as_ref()],
        bump = content_gate.bump,
        constraint = content_gate.profile == recipient_profile.key() @ ErrorCode::NotGateOwner,
    )]
    pub content_gate: Account<'info, ContentGate>,
}

pub fn handler(ctx: Context<VerifyContentAccess>) -> Result<()> {
    require!(ENABLE_CONTENT_GATES, ErrorCode::ContentGatesDisabled);

    let tipper_total = ctx.accounts.tipper_record.total_amount;
    let clock = Clock::get()?;

    // Capture values before mutable borrow
    let gate_key = ctx.accounts.content_gate.key();
    let gate_id = ctx.accounts.content_gate.gate_id;
    let required = ctx.accounts.content_gate.required_amount;

    let has_access = ctx.accounts.content_gate.check_access(tipper_total)?;
    require!(has_access, ErrorCode::InsufficientTipsForAccess);

    ctx.accounts.content_gate.record_access()?;

    emit!(ContentAccessEvent {
        viewer:       ctx.accounts.viewer.key(),
        profile:      ctx.accounts.recipient_profile.key(),
        gate:         gate_key,
        gate_id,
        total_tipped: tipper_total,
        timestamp:    clock.unix_timestamp,
    });

    msg!(
        "Content access granted: {} tipped {} lamports (required: {})",
        ctx.accounts.viewer.key(),
        tipper_total,
        required
    );
    Ok(())
}
