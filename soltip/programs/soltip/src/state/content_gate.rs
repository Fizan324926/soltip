use anchor_lang::prelude::*;
use crate::constants::*;
use crate::error::ErrorCode;

/// Token-gated content: creator sets a minimum total tipped amount
/// to unlock access to a content link. Tippers who have tipped >= required_amount
/// can access the gated content. The actual content URL is served off-chain;
/// only its sha256 hash is stored on-chain for verification.
///
/// **PDA seeds:** `[b"content_gate", profile.key(), gate_id.to_le_bytes()]`
#[account]
pub struct ContentGate {
    /// The TipProfile PDA that owns this gate
    pub profile: Pubkey,
    /// Unique gate ID (monotonic counter per profile)
    pub gate_id: u64,
    /// Title/description of the gated content
    pub title: String,
    /// SHA-256 hash of the content URL (actual URL served off-chain)
    pub content_url_hash: [u8; 32],
    /// Minimum total amount tipped (lamports) to gain access
    pub required_amount: u64,
    /// Number of successful accesses
    pub access_count: u32,
    /// Unix timestamp when gate was created
    pub created_at: i64,
    /// Whether this gate is active
    pub is_active: bool,
    /// PDA bump
    pub bump: u8,
}

impl ContentGate {
    pub const LEN: usize = CONTENT_GATE_SIZE;

    pub fn initialize(
        &mut self,
        profile: Pubkey,
        gate_id: u64,
        title: String,
        content_url_hash: [u8; 32],
        required_amount: u64,
        timestamp: i64,
        bump: u8,
    ) -> Result<()> {
        require!(title.len() <= MAX_CONTENT_TITLE_LENGTH, ErrorCode::ContentTitleTooLong);
        require!(required_amount > 0, ErrorCode::InvalidGoalAmount);
        require!(validate_text_content(&title), ErrorCode::UnsafeTextContent);

        self.profile = profile;
        self.gate_id = gate_id;
        self.title = title;
        self.content_url_hash = content_url_hash;
        self.required_amount = required_amount;
        self.access_count = 0;
        self.created_at = timestamp;
        self.is_active = true;
        self.bump = bump;
        Ok(())
    }

    /// Check if a tipper qualifies for access based on their total tipped amount
    pub fn check_access(&self, tipper_total_amount: u64) -> Result<bool> {
        require!(self.is_active, ErrorCode::ContentGateNotActive);
        Ok(tipper_total_amount >= self.required_amount)
    }

    pub fn record_access(&mut self) -> Result<()> {
        self.access_count = self.access_count
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;
        Ok(())
    }

    pub fn deactivate(&mut self) -> Result<()> {
        require!(self.is_active, ErrorCode::ContentGateNotActive);
        self.is_active = false;
        Ok(())
    }
}
