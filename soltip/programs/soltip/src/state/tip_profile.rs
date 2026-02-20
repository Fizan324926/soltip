// ==========================================================
// TipProfile – creator account  (v3)
// Additions v3:
//  • preset_amounts – creator-configurable tip presets (max 5)
//  • social_links – JSON string of social media URLs
//  • webhook_url – webhook endpoint for tip notifications
//  • active_polls_count – track active polls per profile
//  • active_gates_count – track active content gates per profile
// ==========================================================

use anchor_lang::prelude::*;
use crate::constants::*;
use crate::error::ErrorCode;
use crate::state::tipper_record::{LeaderboardEntry, upsert_leaderboard};

#[account]
pub struct TipProfile {
    pub owner: Pubkey,
    pub username: String,
    pub display_name: String,
    pub description: String,
    pub image_url: String,

    // ---- Stats ----
    pub total_tips_received: u64,
    pub total_amount_received_lamports: u64,
    pub total_amount_received_spl: u64,
    pub total_unique_tippers: u32,
    pub active_goals_count: u8,

    // ---- Config ----
    pub min_tip_amount: u64,
    pub withdrawal_fee_bps: u16,
    pub accept_anonymous: bool,
    pub is_verified: bool,

    // ---- Security ----
    pub reentrancy_guard: bool,

    // ---- Timestamps ----
    pub created_at: i64,
    pub updated_at: i64,

    pub bump: u8,

    // ---- On-chain leaderboard ----
    pub top_tippers: Vec<LeaderboardEntry>,

    // ---- v3: Preset tip amounts (creator configurable) ----
    pub preset_amounts: Vec<u64>,

    // ---- v3: Social links (JSON string) ----
    pub social_links: String,

    // ---- v3: Webhook URL for tip notifications ----
    pub webhook_url: String,

    // ---- v3: Active polls count ----
    pub active_polls_count: u8,

    // ---- v3: Active content gates count ----
    pub active_gates_count: u8,
}

impl TipProfile {
    pub const LEN: usize = TIP_PROFILE_SIZE;

    pub fn initialize(
        &mut self,
        owner: Pubkey,
        username: String,
        display_name: String,
        description: String,
        image_url: String,
        timestamp: i64,
        bump: u8,
    ) -> Result<()> {
        require!(username.len() <= MAX_USERNAME_LENGTH, ErrorCode::UsernameTooLong);
        require!(!username.is_empty(), ErrorCode::EmptyUsername);
        require!(validate_username(&username), ErrorCode::InvalidUsername);
        require!(display_name.len() <= MAX_DISPLAY_NAME_LENGTH, ErrorCode::DisplayNameTooLong);
        require!(description.len() <= MAX_DESCRIPTION_LENGTH, ErrorCode::DescriptionTooLong);
        require!(image_url.len() <= MAX_IMAGE_URL_LENGTH, ErrorCode::ImageUrlTooLong);

        self.owner                          = owner;
        self.username                       = username;
        self.display_name                   = display_name;
        self.description                    = description;
        self.image_url                      = image_url;
        self.total_tips_received            = 0;
        self.total_amount_received_lamports = 0;
        self.total_amount_received_spl      = 0;
        self.total_unique_tippers           = 0;
        self.active_goals_count             = 0;
        self.min_tip_amount                 = MIN_TIP_AMOUNT;
        self.withdrawal_fee_bps             = DEFAULT_WITHDRAWAL_FEE_BPS;
        self.accept_anonymous               = true;
        self.is_verified                    = false;
        self.reentrancy_guard               = false;
        self.created_at                     = timestamp;
        self.updated_at                     = timestamp;
        self.bump                           = bump;
        self.top_tippers                    = Vec::new();
        self.preset_amounts                 = Vec::new();
        self.social_links                   = String::new();
        self.webhook_url                    = String::new();
        self.active_polls_count             = 0;
        self.active_gates_count             = 0;
        Ok(())
    }

    pub fn update(
        &mut self,
        display_name: Option<String>,
        description: Option<String>,
        image_url: Option<String>,
        min_tip_amount: Option<u64>,
        withdrawal_fee_bps: Option<u16>,
        accept_anonymous: Option<bool>,
        timestamp: i64,
    ) -> Result<()> {
        if let Some(v) = display_name {
            require!(v.len() <= MAX_DISPLAY_NAME_LENGTH, ErrorCode::DisplayNameTooLong);
            self.display_name = v;
        }
        if let Some(v) = description {
            require!(v.len() <= MAX_DESCRIPTION_LENGTH, ErrorCode::DescriptionTooLong);
            self.description = v;
        }
        if let Some(v) = image_url {
            require!(v.len() <= MAX_IMAGE_URL_LENGTH, ErrorCode::ImageUrlTooLong);
            self.image_url = v;
        }
        if let Some(v) = min_tip_amount {
            require!(v >= MIN_TIP_AMOUNT && v <= MAX_TIP_AMOUNT, ErrorCode::InvalidMinTipAmount);
            self.min_tip_amount = v;
        }
        if let Some(v) = withdrawal_fee_bps {
            require!(v <= MAX_WITHDRAWAL_FEE_BPS, ErrorCode::InvalidWithdrawalFee);
            self.withdrawal_fee_bps = v;
        }
        if let Some(v) = accept_anonymous {
            self.accept_anonymous = v;
        }
        self.updated_at = timestamp;
        Ok(())
    }

    /// Update preset tip amounts (v3)
    pub fn set_preset_amounts(&mut self, amounts: Vec<u64>) -> Result<()> {
        require!(amounts.len() <= MAX_PRESET_AMOUNTS, ErrorCode::TooManyPresetAmounts);
        for &a in &amounts {
            require!(a >= MIN_TIP_AMOUNT && a <= MAX_TIP_AMOUNT, ErrorCode::InvalidPresetAmount);
        }
        self.preset_amounts = amounts;
        Ok(())
    }

    /// Update social links (v3)
    pub fn set_social_links(&mut self, links: String) -> Result<()> {
        require!(links.len() <= MAX_SOCIAL_LINKS_LENGTH, ErrorCode::SocialLinksTooLong);
        self.social_links = links;
        Ok(())
    }

    /// Update webhook URL (v3)
    pub fn set_webhook_url(&mut self, url: String) -> Result<()> {
        require!(url.len() <= MAX_WEBHOOK_URL_LENGTH, ErrorCode::WebhookUrlTooLong);
        self.webhook_url = url;
        Ok(())
    }

    /// Record an incoming SOL tip and update leaderboard.
    pub fn record_tip(
        &mut self,
        tipper: Pubkey,
        amount: u64,
        is_new_tipper: bool,
    ) -> Result<()> {
        self.total_tips_received = self.total_tips_received
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;
        self.total_amount_received_lamports = self.total_amount_received_lamports
            .checked_add(amount)
            .ok_or(ErrorCode::MathOverflow)?;
        if is_new_tipper {
            self.total_unique_tippers = self.total_unique_tippers
                .checked_add(1)
                .ok_or(ErrorCode::MathOverflow)?;
        }
        upsert_leaderboard(&mut self.top_tippers, tipper, amount, is_new_tipper);
        Ok(())
    }

    /// Record an incoming SPL tip
    pub fn record_spl_tip(&mut self, amount: u64) -> Result<()> {
        self.total_tips_received = self.total_tips_received
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;
        self.total_amount_received_spl = self.total_amount_received_spl
            .checked_add(amount)
            .ok_or(ErrorCode::MathOverflow)?;
        Ok(())
    }

    pub fn increment_goals(&mut self) -> Result<()> {
        require!(self.active_goals_count < MAX_ACTIVE_GOALS, ErrorCode::MaxActiveGoalsReached);
        self.active_goals_count = self.active_goals_count
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;
        Ok(())
    }

    pub fn decrement_goals(&mut self) -> Result<()> {
        self.active_goals_count = self.active_goals_count
            .checked_sub(1)
            .ok_or(ErrorCode::MathUnderflow)?;
        Ok(())
    }

    pub fn increment_polls(&mut self) -> Result<()> {
        require!(self.active_polls_count < MAX_ACTIVE_POLLS, ErrorCode::MaxActivePollsReached);
        self.active_polls_count = self.active_polls_count
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;
        Ok(())
    }

    pub fn decrement_polls(&mut self) -> Result<()> {
        self.active_polls_count = self.active_polls_count
            .checked_sub(1)
            .ok_or(ErrorCode::MathUnderflow)?;
        Ok(())
    }

    pub fn increment_gates(&mut self) -> Result<()> {
        require!(self.active_gates_count < MAX_ACTIVE_GATES, ErrorCode::MaxActiveGatesReached);
        self.active_gates_count = self.active_gates_count
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;
        Ok(())
    }

    pub fn decrement_gates(&mut self) -> Result<()> {
        self.active_gates_count = self.active_gates_count
            .checked_sub(1)
            .ok_or(ErrorCode::MathUnderflow)?;
        Ok(())
    }

    pub fn validate_tip_amount(&self, amount: u64) -> Result<()> {
        require!(amount >= self.min_tip_amount, ErrorCode::TipAmountTooSmall);
        require!(amount <= MAX_TIP_AMOUNT, ErrorCode::TipAmountTooLarge);
        Ok(())
    }

    // ------------------------------------------------------------------
    // Reentrancy guard helpers
    // ------------------------------------------------------------------

    pub fn acquire_guard(&mut self) -> Result<()> {
        require!(!self.reentrancy_guard, ErrorCode::ReentrancyDetected);
        self.reentrancy_guard = true;
        Ok(())
    }

    pub fn release_guard(&mut self) {
        self.reentrancy_guard = false;
    }
}
