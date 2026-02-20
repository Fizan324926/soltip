// ==========================================================
// TipperRecord – tracks a (tipper, profile) relationship  (v3)
//
// v3 Additions:
//  • weekly_amount / weekly_start – time-window leaderboard (weekly)
//  • monthly_amount / monthly_start – time-window leaderboard (monthly)
//  • Badge tier computed from total_amount
// ==========================================================

use anchor_lang::prelude::*;
use crate::constants::*;

#[account]
pub struct TipperRecord {
    /// The tipper wallet
    pub tipper: Pubkey,
    /// The recipient's tip profile PDA
    pub recipient_profile: Pubkey,
    /// Cumulative amount tipped (lamports or token base units)
    pub total_amount: u64,
    /// Number of individual tips made
    pub tip_count: u32,
    /// Timestamp of first tip
    pub first_tip_at: i64,
    /// Timestamp of most recent tip
    pub last_tip_at: i64,
    /// PDA bump
    pub bump: u8,

    // ---- v3: Time-window tracking ----
    /// Amount tipped in current weekly window
    pub weekly_amount: u64,
    /// Start timestamp of current weekly window
    pub weekly_start: i64,
    /// Amount tipped in current monthly window
    pub monthly_amount: u64,
    /// Start timestamp of current monthly window
    pub monthly_start: i64,
}

impl TipperRecord {
    pub const LEN: usize = TIPPER_RECORD_SIZE;

    pub fn initialize(
        &mut self,
        tipper: Pubkey,
        recipient_profile: Pubkey,
        first_amount: u64,
        timestamp: i64,
        bump: u8,
    ) -> Result<()> {
        self.tipper            = tipper;
        self.recipient_profile = recipient_profile;
        self.total_amount      = first_amount;
        self.tip_count         = 1;
        self.first_tip_at      = timestamp;
        self.last_tip_at       = timestamp;
        self.bump              = bump;
        self.weekly_amount     = first_amount;
        self.weekly_start      = timestamp;
        self.monthly_amount    = first_amount;
        self.monthly_start     = timestamp;
        Ok(())
    }

    /// Record an additional tip from this tipper to this profile
    pub fn record_tip(&mut self, amount: u64, timestamp: i64) -> Result<()> {
        self.total_amount = self.total_amount
            .checked_add(amount)
            .ok_or(anchor_lang::error!(crate::error::ErrorCode::MathOverflow))?;
        self.tip_count = self.tip_count
            .checked_add(1)
            .ok_or(anchor_lang::error!(crate::error::ErrorCode::MathOverflow))?;
        self.last_tip_at = timestamp;

        // Update weekly window
        if timestamp.saturating_sub(self.weekly_start) >= SECONDS_PER_WEEK {
            // Reset weekly window
            self.weekly_amount = amount;
            self.weekly_start  = timestamp;
        } else {
            self.weekly_amount = self.weekly_amount
                .checked_add(amount)
                .ok_or(anchor_lang::error!(crate::error::ErrorCode::MathOverflow))?;
        }

        // Update monthly window
        if timestamp.saturating_sub(self.monthly_start) >= SECONDS_PER_MONTH {
            // Reset monthly window
            self.monthly_amount = amount;
            self.monthly_start  = timestamp;
        } else {
            self.monthly_amount = self.monthly_amount
                .checked_add(amount)
                .ok_or(anchor_lang::error!(crate::error::ErrorCode::MathOverflow))?;
        }

        Ok(())
    }

    /// True on the very first tip (tip_count == 1 after initialize)
    pub fn is_new_tipper(&self) -> bool {
        self.tip_count == 1
    }

    /// Compute badge tier from cumulative amount
    pub fn badge_tier(&self) -> u8 {
        compute_badge_tier(self.total_amount)
    }
}

// ==========================================================
// LeaderboardEntry – stored inline in TipProfile
// Sorted in descending order by total_amount.
// ==========================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct LeaderboardEntry {
    pub tipper: Pubkey,
    pub total_amount: u64,
    pub tip_count: u32,
}

/// Insert-or-update an entry in a leaderboard vec (max MAX_TOP_TIPPERS).
/// Keeps the list sorted descending by total_amount.
pub fn upsert_leaderboard(
    board: &mut Vec<LeaderboardEntry>,
    tipper: Pubkey,
    amount: u64,
    is_new: bool,
) {
    // Check if this tipper already has an entry
    if let Some(pos) = board.iter().position(|e| e.tipper == tipper) {
        board[pos].total_amount = board[pos].total_amount.saturating_add(amount);
        if !is_new {
            board[pos].tip_count = board[pos].tip_count.saturating_add(1);
        }
    } else {
        // New entry – only insert if it earns a spot
        let new_entry = LeaderboardEntry {
            tipper,
            total_amount: amount,
            tip_count: 1,
        };
        if board.len() < MAX_TOP_TIPPERS {
            board.push(new_entry);
        } else if let Some(min_pos) = board
            .iter()
            .enumerate()
            .min_by_key(|(_, e)| e.total_amount)
            .map(|(i, _)| i)
        {
            if board[min_pos].total_amount < amount {
                board[min_pos] = new_entry;
            }
        }
    }

    // Sort descending
    board.sort_by(|a, b| b.total_amount.cmp(&a.total_amount));
}
