use anchor_lang::prelude::*;
use crate::state::{TipProfile, Subscription};
use crate::constants::*;
use crate::error::ErrorCode;

/// Accounts required to cancel a subscription
#[derive(Accounts)]
pub struct CancelSubscription<'info> {
    /// The subscriber cancelling the subscription
    pub subscriber: Signer<'info>,

    /// The recipient's tip profile
    #[account(
        seeds = [TIP_PROFILE_SEED, recipient_owner.key().as_ref()],
        bump = recipient_profile.bump,
    )]
    pub recipient_profile: Account<'info, TipProfile>,

    /// The recipient's wallet (profile owner)
    /// CHECK: This is validated by the PDA derivation of recipient_profile
    pub recipient_owner: UncheckedAccount<'info>,

    /// The subscription to cancel
    #[account(
        mut,
        seeds = [SUBSCRIPTION_SEED, subscriber.key().as_ref(), recipient_profile.key().as_ref()],
        bump = subscription.bump,
        has_one = subscriber @ ErrorCode::NotSubscriber,
        constraint = subscription.recipient_profile == recipient_profile.key() @ ErrorCode::InvalidAccountData,
    )]
    pub subscription: Account<'info, Subscription>,
}

/// Handler for cancelling a subscription
pub fn handler(ctx: Context<CancelSubscription>) -> Result<()> {
    // Validate feature is enabled
    require!(ENABLE_SUBSCRIPTIONS, ErrorCode::SubscriptionsDisabled);

    let subscription = &mut ctx.accounts.subscription;

    subscription.cancel()?;

    msg!("Subscription cancelled");
    msg!("Subscriber: {}", subscription.subscriber);
    msg!("Recipient: {}", ctx.accounts.recipient_profile.username);
    msg!("Total paid: {} lamports", subscription.total_paid);
    msg!("Payment count: {}", subscription.payment_count);

    Ok(())
}
