use anchor_lang::prelude::*;
use crate::state::{TipProfile, TipSplit, SplitRecipient};
use crate::constants::*;
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct ConfigureSplit<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        seeds   = [TIP_PROFILE_SEED, owner.key().as_ref()],
        bump    = tip_profile.bump,
        has_one = owner @ ErrorCode::NotProfileOwner,
    )]
    pub tip_profile: Account<'info, TipProfile>,

    #[account(
        init_if_needed,
        payer  = owner,
        space  = TipSplit::LEN,
        seeds  = [TIP_SPLIT_SEED, tip_profile.key().as_ref()],
        bump,
    )]
    pub tip_split: Account<'info, TipSplit>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<ConfigureSplit>,
    recipients: Vec<SplitRecipient>,
) -> Result<()> {
    require!(ENABLE_TIP_SPLITS, ErrorCode::TipSplitsDisabled);

    let profile_key = ctx.accounts.tip_profile.key();
    if ctx.accounts.tip_split.num_recipients == 0 {
        ctx.accounts.tip_split.initialize(
            profile_key,
            recipients,
            ctx.bumps.tip_split,
        )?;
        msg!("Tip split configured for profile: {}", ctx.accounts.tip_profile.username);
    } else {
        ctx.accounts.tip_split.update(recipients)?;
        msg!("Tip split updated for profile: {}", ctx.accounts.tip_profile.username);
    }
    Ok(())
}
