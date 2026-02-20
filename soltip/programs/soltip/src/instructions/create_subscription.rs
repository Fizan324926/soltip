// create_subscription – v2 with SPL token support
use anchor_lang::prelude::*;
use crate::state::{TipProfile, Subscription};
use crate::constants::*;
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct CreateSubscription<'info> {
    #[account(mut)]
    pub subscriber: Signer<'info>,

    #[account(
        seeds = [TIP_PROFILE_SEED, recipient_owner.key().as_ref()],
        bump  = recipient_profile.bump,
    )]
    pub recipient_profile: Account<'info, TipProfile>,

    /// CHECK: validated by PDA derivation of recipient_profile
    pub recipient_owner: UncheckedAccount<'info>,

    #[account(
        init,
        payer = subscriber,
        space = Subscription::LEN,
        seeds = [SUBSCRIPTION_SEED, subscriber.key().as_ref(), recipient_profile.key().as_ref()],
        bump,
    )]
    pub subscription: Account<'info, Subscription>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateSubscription>,
    amount_per_interval: u64,
    interval_seconds: i64,
    is_spl: bool,
    token_mint: Pubkey,
) -> Result<()> {
    require!(ENABLE_SUBSCRIPTIONS, ErrorCode::SubscriptionsDisabled);
    require!(
        ctx.accounts.subscriber.key() != ctx.accounts.recipient_owner.key(),
        ErrorCode::CannotTipSelf
    );

    let clock = Clock::get()?;
    ctx.accounts.subscription.initialize(
        ctx.accounts.subscriber.key(),
        ctx.accounts.recipient_profile.key(),
        amount_per_interval,
        interval_seconds,
        is_spl,
        token_mint,
        clock.unix_timestamp,
        ctx.bumps.subscription,
    )?;

    msg!("Subscription created | amount: {} | interval: {}s | SPL: {}", amount_per_interval, interval_seconds, is_spl);
    Ok(())
}
