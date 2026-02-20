use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::state::{TipProfile, Subscription};
use crate::instructions::initialize_platform::PlatformConfig;
use crate::constants::*;
use crate::error::ErrorCode;

/// Emitted every time a subscription payment is successfully processed.
/// Indexers use this to track recurring-payment history and subscriber stats.
#[event]
pub struct SubscriptionProcessedEvent {
    /// Subscriber's wallet pubkey
    pub subscriber:         Pubkey,
    /// Creator's wallet pubkey
    pub recipient:          Pubkey,
    /// The TipProfile PDA of the recipient
    pub recipient_profile:  Pubkey,
    /// The Subscription PDA
    pub subscription:       Pubkey,
    /// Amount transferred in lamports
    pub amount:             u64,
    /// Cumulative total paid so far (after this payment)
    pub total_paid:         u64,
    /// Number of payments made so far (after this one)
    pub payment_count:      u32,
    /// Whether the subscription is still active after this payment
    pub is_active:          bool,
    /// Unix timestamp of the next scheduled payment (0 if subscription ended)
    pub next_payment_due:   i64,
    pub timestamp:          i64,
}

/// Accounts required to process a subscription payment
#[derive(Accounts)]
pub struct ProcessSubscription<'info> {
    /// The subscriber (payer)
    #[account(mut)]
    pub subscriber: Signer<'info>,

    /// The recipient's tip profile
    #[account(
        mut,
        seeds = [TIP_PROFILE_SEED, recipient_owner.key().as_ref()],
        bump = recipient_profile.bump,
    )]
    pub recipient_profile: Account<'info, TipProfile>,

    /// The recipient's wallet (profile owner)
    /// CHECK: This is validated by the PDA derivation of recipient_profile
    #[account(mut)]
    pub recipient_owner: UncheckedAccount<'info>,

    /// The subscription being processed
    #[account(
        mut,
        seeds = [SUBSCRIPTION_SEED, subscriber.key().as_ref(), recipient_profile.key().as_ref()],
        bump = subscription.bump,
        has_one = subscriber @ ErrorCode::NotSubscriber,
        constraint = subscription.recipient_profile == recipient_profile.key() @ ErrorCode::InvalidAccountData,
    )]
    pub subscription: Account<'info, Subscription>,

    /// Global platform config – checked for pause state and fee BPS.
    #[account(
        seeds = [PLATFORM_CONFIG_SEED],
        bump  = platform_config.bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    /// CHECK: PDA verified by seeds – platform treasury receives platform fee
    #[account(
        mut,
        seeds = [PLATFORM_TREASURY_SEED],
        bump,
    )]
    pub platform_treasury: UncheckedAccount<'info>,

    /// System program for transferring SOL
    pub system_program: Program<'info, System>,
}

/// Handler for processing a subscription payment
/// This should be called when a subscription payment is due
pub fn handler(ctx: Context<ProcessSubscription>) -> Result<()> {
    // Validate feature is enabled
    require!(ENABLE_SUBSCRIPTIONS, ErrorCode::SubscriptionsDisabled);

    // Platform pause check
    require!(!ctx.accounts.platform_config.paused, ErrorCode::PlatformPaused);

    let subscription = &mut ctx.accounts.subscription;
    let recipient_profile = &mut ctx.accounts.recipient_profile;
    let clock = Clock::get()?;

    // Capture payments_made before processing to determine if this is first payment
    let is_first_payment = subscription.payment_count == 0;

    // Process the payment (this validates payment is due and updates state)
    subscription.process_payment(clock.unix_timestamp)?;

    let amount = subscription.amount_per_interval;

    // Calculate platform fee and creator share
    let platform_fee = calculate_fee(amount, PLATFORM_FEE_BPS)?;
    let creator_share = amount
        .checked_sub(platform_fee)
        .ok_or(ErrorCode::MathUnderflow)?;

    // Transfer creator share to recipient
    let transfer_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.subscriber.to_account_info(),
            to: ctx.accounts.recipient_owner.to_account_info(),
        },
    );
    transfer(transfer_ctx, creator_share)?;

    // Transfer platform fee to treasury
    if platform_fee > 0 {
        let fee_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.subscriber.to_account_info(),
                to: ctx.accounts.platform_treasury.to_account_info(),
            },
        );
        transfer(fee_ctx, platform_fee)?;
    }

    // Record tip in profile (only first payment counts as new tipper)
    let subscriber_key = ctx.accounts.subscriber.key();
    recipient_profile.record_tip(subscriber_key, amount, is_first_payment)?;

    // Capture values for event (subscription is already mutably borrowed above)
    let amount_paid    = subscription.amount_per_interval;
    let total_paid     = subscription.total_paid;
    let payment_count  = subscription.payment_count;
    let is_active      = subscription.is_active;
    let next_due       = subscription.next_payment_due;

    emit!(SubscriptionProcessedEvent {
        subscriber:        ctx.accounts.subscriber.key(),
        recipient:         ctx.accounts.recipient_owner.key(),
        recipient_profile: ctx.accounts.recipient_profile.key(),
        subscription:      ctx.accounts.subscription.key(),
        amount:            amount_paid,
        total_paid,
        payment_count,
        is_active,
        next_payment_due:  next_due,
        timestamp:         clock.unix_timestamp,
    });

    msg!("Subscription payment processed");
    msg!("Amount: {} lamports", amount_paid);
    msg!("Total paid: {} lamports", total_paid);
    msg!("Payment count: {}", payment_count);

    if is_active {
        msg!("Next payment due: {}", next_due);
    } else {
        msg!("Subscription completed (auto-renew disabled)");
    }

    Ok(())
}
