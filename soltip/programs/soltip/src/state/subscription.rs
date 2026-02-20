// ==========================================================
// Subscription – recurring tip  (v2)
// Additions:
//  • is_spl + token_mint fields for SPL-token subscriptions
//  • grace_period_seconds for late-payment tolerance
// ==========================================================

use anchor_lang::prelude::*;
use crate::constants::*;
use crate::error::ErrorCode;

/// Recurring tip subscription from a subscriber to a creator.
///
/// Supports both SOL and SPL-token payment modes. The subscription stores
/// a `next_payment_due` timestamp; anyone can trigger `process_subscription`
/// once that timestamp is reached. Auto-renewing subscriptions reschedule
/// after each successful payment; one-shot subscriptions deactivate.
///
/// **PDA seeds:** `[b"subscription", subscriber.key(), recipient_profile.key()]`
#[account]
pub struct Subscription {
    /// The wallet that created and pays for this subscription.
    pub subscriber: Pubkey,
    /// The TipProfile PDA of the creator receiving payments.
    pub recipient_profile: Pubkey,
    /// Amount due each interval (lamports or token base units).
    pub amount_per_interval: u64,
    /// Interval length in seconds. Minimum: `SECONDS_PER_DAY` (86 400).
    pub interval_seconds: i64,
    /// Unix timestamp when the next payment becomes due.
    pub next_payment_due: i64,
    /// If true, the subscription auto-schedules the next payment after each one.
    pub auto_renew: bool,
    /// Cumulative amount paid to date.
    pub total_paid: u64,
    /// Number of payments successfully processed.
    pub payment_count: u32,
    /// Unix timestamp of subscription creation.
    pub created_at: i64,
    /// Unix timestamp of the most recent processed payment.
    pub last_payment_at: i64,
    /// Whether the subscription is active and can accept payments.
    pub is_active: bool,
    /// If `true`, payments are in an SPL token (e.g. USDC). If `false`, SOL.
    pub is_spl: bool,
    /// The SPL token mint address. Only meaningful when `is_spl == true`.
    pub token_mint: Pubkey,
    /// PDA bump seed.
    pub bump: u8,
}

impl Subscription {
    pub const LEN: usize = SUBSCRIPTION_SIZE;

    pub fn initialize(
        &mut self,
        subscriber: Pubkey,
        recipient_profile: Pubkey,
        amount_per_interval: u64,
        interval_seconds: i64,
        is_spl: bool,
        token_mint: Pubkey,
        timestamp: i64,
        bump: u8,
    ) -> Result<()> {
        require!(amount_per_interval > 0, ErrorCode::InvalidSubscriptionAmount);
        require!(interval_seconds >= SECONDS_PER_DAY, ErrorCode::InvalidSubscriptionInterval);

        let next_payment = timestamp
            .checked_add(interval_seconds)
            .ok_or(ErrorCode::MathOverflow)?;

        self.subscriber          = subscriber;
        self.recipient_profile   = recipient_profile;
        self.amount_per_interval = amount_per_interval;
        self.interval_seconds    = interval_seconds;
        self.next_payment_due    = next_payment;
        self.auto_renew          = true;
        self.total_paid          = 0;
        self.payment_count       = 0;
        self.created_at          = timestamp;
        self.last_payment_at     = timestamp;
        self.is_active           = true;
        self.is_spl              = is_spl;
        self.token_mint          = token_mint;
        self.bump                = bump;
        Ok(())
    }

    pub fn process_payment(&mut self, timestamp: i64) -> Result<()> {
        require!(self.is_active, ErrorCode::SubscriptionNotActive);
        require!(timestamp >= self.next_payment_due, ErrorCode::SubscriptionNotDue);

        self.total_paid = self.total_paid
            .checked_add(self.amount_per_interval)
            .ok_or(ErrorCode::MathOverflow)?;
        self.payment_count = self.payment_count
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;
        self.last_payment_at = timestamp;

        if self.auto_renew {
            self.next_payment_due = timestamp
                .checked_add(self.interval_seconds)
                .ok_or(ErrorCode::MathOverflow)?;
        } else {
            self.is_active = false;
        }
        Ok(())
    }

    pub fn cancel(&mut self) -> Result<()> {
        require!(self.is_active, ErrorCode::SubscriptionNotActive);
        self.is_active = false;
        Ok(())
    }

    pub fn reactivate(&mut self, timestamp: i64) -> Result<()> {
        require!(!self.is_active, ErrorCode::AccountAlreadyInitialized);
        self.next_payment_due = timestamp
            .checked_add(self.interval_seconds)
            .ok_or(ErrorCode::MathOverflow)?;
        self.is_active  = true;
        self.auto_renew = true;
        Ok(())
    }

    pub fn is_payment_due(&self, ts: i64) -> bool {
        self.is_active && ts >= self.next_payment_due
    }

    pub fn days_until_next_payment(&self, ts: i64) -> i64 {
        if !self.is_active { return -1; }
        let remaining = self.next_payment_due.saturating_sub(ts);
        if remaining <= 0 { 0 } else { remaining / SECONDS_PER_DAY }
    }
}
