// ============================================================
// SolTip Platform Constants  –  v3.0.0
// Full competitive feature parity: polls, referrals, content gates,
// preset amounts, time-window leaderboards, media tips, badges
// ============================================================

use anchor_lang::prelude::*;

pub const VERSION: &str = "3.0.0";

// ------------------------------------------------------------------
// PDA Seeds
// ------------------------------------------------------------------
pub const TIP_PROFILE_SEED: &[u8]      = b"tip_profile";
pub const TIP_GOAL_SEED: &[u8]         = b"tip_goal";
pub const SUBSCRIPTION_SEED: &[u8]     = b"subscription";
pub const PLATFORM_TREASURY_SEED: &[u8]= b"treasury";
pub const VAULT_SEED: &[u8]            = b"vault";
pub const SPL_VAULT_SEED: &[u8]        = b"spl_vault";
pub const TIPPER_RECORD_SEED: &[u8]    = b"tipper_record";
pub const TIP_SPLIT_SEED: &[u8]        = b"tip_split";
pub const RATE_LIMIT_SEED: &[u8]       = b"rate_limit";
pub const PLATFORM_CONFIG_SEED: &[u8]  = b"platform_config";
pub const TIP_POLL_SEED: &[u8]         = b"tip_poll";
pub const REFERRAL_SEED: &[u8]         = b"referral";
pub const CONTENT_GATE_SEED: &[u8]     = b"content_gate";

// ------------------------------------------------------------------
// String Length Limits
// ------------------------------------------------------------------
pub const MAX_USERNAME_LENGTH: usize         = 32;
pub const MAX_DISPLAY_NAME_LENGTH: usize     = 64;
pub const MAX_DESCRIPTION_LENGTH: usize      = 256;
pub const MAX_IMAGE_URL_LENGTH: usize        = 200;
pub const MAX_MESSAGE_LENGTH: usize          = 280;
pub const MAX_GOAL_TITLE_LENGTH: usize       = 64;
pub const MAX_GOAL_DESCRIPTION_LENGTH: usize = 256;
pub const MAX_SPLIT_LABEL_LENGTH: usize      = 32;
pub const MAX_MEDIA_URL_LENGTH: usize        = 200;
pub const MAX_POLL_TITLE_LENGTH: usize       = 64;
pub const MAX_POLL_OPTION_LENGTH: usize      = 32;
pub const MAX_CONTENT_TITLE_LENGTH: usize    = 64;
pub const MAX_CONTENT_URL_LENGTH: usize      = 200;
pub const MAX_WEBHOOK_URL_LENGTH: usize      = 200;
pub const MAX_SOCIAL_LINKS_LENGTH: usize     = 256;

// ------------------------------------------------------------------
// Financial Limits
// ------------------------------------------------------------------
pub const MIN_TIP_AMOUNT: u64             = 1_000;
pub const MAX_TIP_AMOUNT: u64             = 1_000_000_000_000;
pub const DEFAULT_WITHDRAWAL_FEE_BPS: u16 = 200;
pub const MAX_WITHDRAWAL_FEE_BPS: u16     = 1_000;
pub const MIN_WITHDRAWAL_AMOUNT: u64      = 10_000_000;
pub const PLATFORM_FEE_BPS: u16           = 100;
pub const MIN_VAULT_RENT_BUFFER: u64      = 1_000_000;

// ------------------------------------------------------------------
// Leaderboard / Limits
// ------------------------------------------------------------------
pub const MAX_TOP_TIPPERS: usize      = 10;
pub const MAX_TOP_CONTRIBUTORS: usize = 10;
pub const MAX_ACTIVE_GOALS: u8        = 5;
pub const MAX_SPLIT_RECIPIENTS: usize = 5;
pub const MAX_PRESET_AMOUNTS: usize   = 5;

// ------------------------------------------------------------------
// Rate Limiting
// ------------------------------------------------------------------
pub const DEFAULT_TIP_COOLDOWN_SECONDS: i64 = 3;
pub const MAX_TIPS_PER_DAY: u32             = 100;

// ------------------------------------------------------------------
// Time Constants
// ------------------------------------------------------------------
pub const SECONDS_PER_DAY: i64   = 86_400;
pub const SECONDS_PER_WEEK: i64  = 604_800;
pub const SECONDS_PER_MONTH: i64 = 2_592_000;
pub const MAX_GOAL_DURATION: i64 = 31_536_000;

// ------------------------------------------------------------------
// Poll Constants
// ------------------------------------------------------------------
pub const MAX_POLL_OPTIONS: usize = 4;
pub const MIN_POLL_OPTIONS: usize = 2;
pub const MAX_ACTIVE_POLLS: u8    = 3;

// ------------------------------------------------------------------
// Referral Constants
// ------------------------------------------------------------------
pub const DEFAULT_REFERRAL_FEE_BPS: u16 = 500;  // 5% of fees
pub const MAX_REFERRAL_FEE_BPS: u16     = 2_000; // 20% max

// ------------------------------------------------------------------
// Content Gate Constants
// ------------------------------------------------------------------
pub const MAX_ACTIVE_GATES: u8 = 10;

// ------------------------------------------------------------------
// Badge Tier Thresholds (lamports)
// ------------------------------------------------------------------
pub const BADGE_BRONZE_THRESHOLD: u64  = 100_000_000;     // 0.1 SOL
pub const BADGE_SILVER_THRESHOLD: u64  = 1_000_000_000;   // 1 SOL
pub const BADGE_GOLD_THRESHOLD: u64    = 10_000_000_000;  // 10 SOL
pub const BADGE_DIAMOND_THRESHOLD: u64 = 100_000_000_000; // 100 SOL

// ------------------------------------------------------------------
// Account Sizes
// ------------------------------------------------------------------

pub const TIP_PROFILE_SIZE: usize = 8
    + 32
    + (4 + MAX_USERNAME_LENGTH)
    + (4 + MAX_DISPLAY_NAME_LENGTH)
    + (4 + MAX_DESCRIPTION_LENGTH)
    + (4 + MAX_IMAGE_URL_LENGTH)
    + 8   // total_tips_received
    + 8   // total_amount_received_lamports
    + 8   // total_amount_received_spl
    + 4   // total_unique_tippers
    + 1   // active_goals_count
    + 8   // min_tip_amount
    + 2   // withdrawal_fee_bps
    + 1   // accept_anonymous
    + 1   // is_verified
    + 1   // reentrancy_guard
    + 8   // created_at
    + 8   // updated_at
    + 1   // bump
    // leaderboard: 10 * (32 + 8 + 4) = 440
    + 4 + (MAX_TOP_TIPPERS * (32 + 8 + 4))
    // preset_amounts: Vec<u64> max 5
    + 4 + (MAX_PRESET_AMOUNTS * 8)
    // social_links
    + (4 + MAX_SOCIAL_LINKS_LENGTH)
    // webhook_url
    + (4 + MAX_WEBHOOK_URL_LENGTH)
    // active_polls_count
    + 1
    // active_gates_count
    + 1
    + 256; // reserved

pub const TIP_GOAL_SIZE: usize = 8
    + 32
    + 8
    + (4 + MAX_GOAL_TITLE_LENGTH)
    + (4 + MAX_GOAL_DESCRIPTION_LENGTH)
    + 8   // target_amount
    + 8   // current_amount
    + 32  // token_mint
    + 9   // Option<i64> deadline
    + 1   // completed
    + 9   // Option<i64> completed_at
    + 4   // unique_contributors
    + 8   // created_at
    + 1   // bump
    + 128;

pub const SUBSCRIPTION_SIZE: usize = 8
    + 32  // subscriber
    + 32  // recipient_profile
    + 8   // amount_per_interval
    + 8   // interval_seconds
    + 8   // next_payment_due
    + 1   // auto_renew
    + 8   // total_paid
    + 4   // payment_count
    + 8   // created_at
    + 8   // last_payment_at
    + 1   // is_active
    + 1   // is_spl
    + 32  // token_mint
    + 1   // bump
    + 64;

pub const VAULT_SIZE: usize = 8
    + 32  // owner
    + 8   // balance
    + 8   // total_deposited
    + 8   // total_withdrawn
    + 8   // created_at
    + 1   // bump
    + 32;

pub const TIPPER_RECORD_SIZE: usize = 8
    + 32  // tipper
    + 32  // recipient_profile
    + 8   // total_amount
    + 4   // tip_count
    + 8   // first_tip_at
    + 8   // last_tip_at
    + 1   // bump
    // Time-window tracking
    + 8   // weekly_amount
    + 8   // weekly_start
    + 8   // monthly_amount
    + 8   // monthly_start
    + 16; // reserved

pub const TIP_SPLIT_SIZE: usize = 8
    + 32  // profile (owner)
    + 1   // num_recipients
    + (MAX_SPLIT_RECIPIENTS * (32 + 2))  // recipients: pubkey + bps
    + 1   // is_active
    + 1   // bump
    + 32;

pub const RATE_LIMIT_SIZE: usize = 8
    + 32  // tipper
    + 32  // recipient
    + 8   // last_tip_at
    + 4   // tip_count_today
    + 8   // window_start
    + 1   // bump
    + 16;

pub const PLATFORM_CONFIG_SIZE: usize = 8
    + 32  // authority
    + 32  // treasury
    + 2   // platform_fee_bps
    + 1   // paused
    + 8   // created_at
    + 1   // bump
    + 64;

pub const TIP_POLL_SIZE: usize = 8
    + 32  // profile
    + 8   // poll_id
    + (4 + MAX_POLL_TITLE_LENGTH)      // title
    + (4 + MAX_DESCRIPTION_LENGTH)     // description
    // options: Vec<PollOption> max 4, each = (4+32) + 4 + 8 = 48
    + 4 + (MAX_POLL_OPTIONS * (4 + MAX_POLL_OPTION_LENGTH + 4 + 8))
    + 4   // total_votes
    + 8   // total_amount
    + 9   // deadline: Option<i64>
    + 1   // is_active
    + 8   // created_at
    + 1   // bump
    + 64; // reserved

pub const REFERRAL_SIZE: usize = 8
    + 32  // referrer
    + 32  // referee_profile
    + 2   // fee_share_bps
    + 8   // total_earned
    + 4   // referral_count
    + 8   // created_at
    + 1   // is_active
    + 1   // bump
    + 32; // reserved

pub const CONTENT_GATE_SIZE: usize = 8
    + 32  // profile
    + 8   // gate_id
    + (4 + MAX_CONTENT_TITLE_LENGTH)   // title
    + 32  // content_url_hash ([u8; 32] sha256)
    + 8   // required_amount
    + 4   // access_count
    + 8   // created_at
    + 1   // is_active
    + 1   // bump
    + 64; // reserved

// ------------------------------------------------------------------
// Feature Flags
// ------------------------------------------------------------------
pub const ENABLE_SUBSCRIPTIONS: bool  = true;
pub const ENABLE_GOALS: bool          = true;
pub const ENABLE_ANONYMOUS_TIPS: bool = true;
pub const ENABLE_MULTI_TOKEN: bool    = true;
pub const ENABLE_RATE_LIMITING: bool  = true;
pub const ENABLE_TIP_SPLITS: bool     = true;
pub const ENABLE_POLLS: bool          = true;
pub const ENABLE_REFERRALS: bool      = true;
pub const ENABLE_CONTENT_GATES: bool  = true;

// ------------------------------------------------------------------
// Utility Functions
// ------------------------------------------------------------------

pub fn validate_username(username: &str) -> bool {
    if username.is_empty() || username.len() > MAX_USERNAME_LENGTH {
        return false;
    }
    username
        .chars()
        .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_')
}

pub fn validate_text_content(text: &str) -> bool {
    !text.contains('<') && !text.contains('>') && !text.contains('&')
}

pub fn calculate_fee(amount: u64, fee_bps: u16) -> Result<u64> {
    let fee = (amount as u128)
        .checked_mul(fee_bps as u128)
        .ok_or(error!(crate::error::ErrorCode::MathOverflow))?
        .checked_div(10_000)
        .ok_or(error!(crate::error::ErrorCode::MathOverflow))?;
    Ok(fee as u64)
}

pub fn validate_split_bps(bps_list: &[u16]) -> bool {
    let total: u32 = bps_list.iter().map(|&b| b as u32).sum();
    total == 10_000
}

/// Compute badge tier from cumulative tip amount (lamports).
/// 0 = none, 1 = bronze, 2 = silver, 3 = gold, 4 = diamond
pub fn compute_badge_tier(total_amount: u64) -> u8 {
    if total_amount >= BADGE_DIAMOND_THRESHOLD {
        4
    } else if total_amount >= BADGE_GOLD_THRESHOLD {
        3
    } else if total_amount >= BADGE_SILVER_THRESHOLD {
        2
    } else if total_amount >= BADGE_BRONZE_THRESHOLD {
        1
    } else {
        0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_username() {
        assert!(validate_username("alice"));
        assert!(validate_username("alice_123"));
        assert!(!validate_username("Alice"));
        assert!(!validate_username("alice-bob"));
        assert!(!validate_username(""));
    }

    #[test]
    fn test_validate_text_content() {
        assert!(validate_text_content("Hello world!"));
        assert!(!validate_text_content("<script>"));
        assert!(!validate_text_content("A & B"));
    }

    #[test]
    fn test_calculate_fee() {
        let fee = calculate_fee(1_000_000_000, 200).unwrap();
        assert_eq!(fee, 20_000_000);
    }

    #[test]
    fn test_validate_split_bps() {
        assert!(validate_split_bps(&[5_000, 3_000, 2_000]));
        assert!(!validate_split_bps(&[5_000, 3_000, 1_000]));
    }

    #[test]
    fn test_compute_badge_tier() {
        assert_eq!(compute_badge_tier(0), 0);
        assert_eq!(compute_badge_tier(50_000_000), 0);
        assert_eq!(compute_badge_tier(100_000_000), 1); // bronze
        assert_eq!(compute_badge_tier(500_000_000), 1);
        assert_eq!(compute_badge_tier(1_000_000_000), 2); // silver
        assert_eq!(compute_badge_tier(10_000_000_000), 3); // gold
        assert_eq!(compute_badge_tier(100_000_000_000), 4); // diamond
    }
}
