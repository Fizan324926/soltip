// ==========================================================
// RateLimit – spam-prevention cooldown PDA
//
// One PDA per (tipper, recipient) pair.
// Enforces minimum interval between tips and a daily cap.
// Automatically resets the daily window every 24 hours.
// ==========================================================

use anchor_lang::prelude::*;
use crate::constants::*;
use crate::error::ErrorCode;

/// Spam-prevention cooldown tracker for a (tipper, recipient) pair.
///
/// Created on demand (`init_if_needed`) on the first tip from a given tipper
/// to a given profile. Enforces both a per-tip cooldown (default 3 s) and a
/// rolling 24-hour daily cap (default 100 tips/day).
///
/// **PDA seeds:** `[b"rate_limit", tipper.key(), recipient_profile.key()]`
#[account]
pub struct RateLimit {
    /// The tipper wallet.
    pub tipper: Pubkey,
    /// The recipient profile PDA.
    pub recipient: Pubkey,
    /// Unix timestamp of the most recent tip.
    pub last_tip_at: i64,
    /// Number of tips sent within the current 24 h window.
    pub tip_count_today: u32,
    /// Start timestamp of the current 24 h rolling window.
    pub window_start: i64,
    /// PDA bump seed.
    pub bump: u8,
}

impl RateLimit {
    pub const LEN: usize = RATE_LIMIT_SIZE;

    pub fn initialize(
        &mut self,
        tipper: Pubkey,
        recipient: Pubkey,
        timestamp: i64,
        bump: u8,
    ) {
        self.tipper          = tipper;
        self.recipient       = recipient;
        self.last_tip_at     = timestamp;
        self.tip_count_today = 1;
        self.window_start    = timestamp;
        self.bump            = bump;
    }

    /// Check and record a new tip attempt.
    /// Returns Err if cooldown or daily limit is active.
    pub fn check_and_record(&mut self, timestamp: i64, cooldown: i64) -> Result<()> {
        if !ENABLE_RATE_LIMITING {
            return Ok(());
        }

        // Reset daily window if 24 h have passed
        if timestamp.saturating_sub(self.window_start) >= SECONDS_PER_DAY {
            self.tip_count_today = 0;
            self.window_start    = timestamp;
        }

        // Enforce cooldown between tips
        let elapsed = timestamp.saturating_sub(self.last_tip_at);
        require!(elapsed >= cooldown, ErrorCode::RateLimitExceeded);

        // Enforce daily cap
        require!(
            self.tip_count_today < MAX_TIPS_PER_DAY,
            ErrorCode::DailyLimitExceeded
        );

        self.last_tip_at = timestamp;
        self.tip_count_today = self.tip_count_today
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;
        Ok(())
    }
}
