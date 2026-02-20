use anchor_lang::prelude::*;
use crate::constants::*;
use crate::error::ErrorCode;

/// Tracks a referral relationship: Creator A referred Creator B.
/// A earns a percentage of B's platform fees for the lifetime of the referral.
///
/// **PDA seeds:** `[b"referral", referrer.key(), referee_profile.key()]`
#[account]
pub struct Referral {
    /// The wallet that made the referral
    pub referrer: Pubkey,
    /// The TipProfile PDA of the referred creator
    pub referee_profile: Pubkey,
    /// Fee share in basis points (percentage of platform fees that go to referrer)
    pub fee_share_bps: u16,
    /// Total lamports earned from this referral
    pub total_earned: u64,
    /// Number of fee payments received
    pub referral_count: u32,
    /// Unix timestamp when referral was created
    pub created_at: i64,
    /// Whether this referral is still active
    pub is_active: bool,
    /// PDA bump
    pub bump: u8,
}

impl Referral {
    pub const LEN: usize = REFERRAL_SIZE;

    pub fn initialize(
        &mut self,
        referrer: Pubkey,
        referee_profile: Pubkey,
        fee_share_bps: u16,
        timestamp: i64,
        bump: u8,
    ) -> Result<()> {
        require!(fee_share_bps <= MAX_REFERRAL_FEE_BPS, ErrorCode::InvalidReferralFee);

        self.referrer = referrer;
        self.referee_profile = referee_profile;
        self.fee_share_bps = fee_share_bps;
        self.total_earned = 0;
        self.referral_count = 0;
        self.created_at = timestamp;
        self.is_active = true;
        self.bump = bump;
        Ok(())
    }

    pub fn record_earning(&mut self, amount: u64) -> Result<()> {
        require!(self.is_active, ErrorCode::ReferralNotActive);
        self.total_earned = self.total_earned
            .checked_add(amount)
            .ok_or(ErrorCode::MathOverflow)?;
        self.referral_count = self.referral_count
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;
        Ok(())
    }

    pub fn deactivate(&mut self) -> Result<()> {
        require!(self.is_active, ErrorCode::ReferralNotActive);
        self.is_active = false;
        Ok(())
    }
}
