// ==========================================================
// TipSplit – multi-recipient split configuration
//
// A creator sets up a split once; every incoming tip is
// atomically distributed among the recipients in proportion.
// BPS values must sum to exactly 10 000.
// ==========================================================

use anchor_lang::prelude::*;
use crate::constants::*;
use crate::error::ErrorCode;

/// A single recipient entry in a split
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct SplitRecipient {
    /// Wallet address of the recipient
    pub wallet: Pubkey,
    /// Share in basis points (e.g. 5000 = 50 %)
    pub share_bps: u16,
}

#[account]
pub struct TipSplit {
    /// The tip profile that owns this split config
    pub profile: Pubkey,
    /// Number of active recipients
    pub num_recipients: u8,
    /// Recipient entries (max MAX_SPLIT_RECIPIENTS)
    pub recipients: Vec<SplitRecipient>,
    /// Whether this split is currently active
    pub is_active: bool,
    /// PDA bump
    pub bump: u8,
}

impl TipSplit {
    pub const LEN: usize = TIP_SPLIT_SIZE;

    pub fn initialize(
        &mut self,
        profile: Pubkey,
        recipients: Vec<SplitRecipient>,
        bump: u8,
    ) -> Result<()> {
        require!(
            recipients.len() >= 2,
            ErrorCode::TooManySplitRecipients  // reuse: need at least 2
        );
        require!(
            recipients.len() <= MAX_SPLIT_RECIPIENTS,
            ErrorCode::TooManySplitRecipients
        );

        // Validate BPS sum
        let bps_list: Vec<u16> = recipients.iter().map(|r| r.share_bps).collect();
        require!(validate_split_bps(&bps_list), ErrorCode::InvalidSplitBps);

        // No duplicate wallets
        let mut seen = std::collections::BTreeSet::new();
        for r in &recipients {
            require!(seen.insert(r.wallet), ErrorCode::DuplicateSplitRecipient);
        }

        self.profile        = profile;
        self.num_recipients = recipients.len() as u8;
        self.recipients     = recipients;
        self.is_active      = true;
        self.bump           = bump;
        Ok(())
    }

    pub fn update(
        &mut self,
        recipients: Vec<SplitRecipient>,
    ) -> Result<()> {
        require!(
            recipients.len() >= 2 && recipients.len() <= MAX_SPLIT_RECIPIENTS,
            ErrorCode::TooManySplitRecipients
        );
        let bps_list: Vec<u16> = recipients.iter().map(|r| r.share_bps).collect();
        require!(validate_split_bps(&bps_list), ErrorCode::InvalidSplitBps);

        let mut seen = std::collections::BTreeSet::new();
        for r in &recipients {
            require!(seen.insert(r.wallet), ErrorCode::DuplicateSplitRecipient);
        }

        self.num_recipients = recipients.len() as u8;
        self.recipients     = recipients;
        Ok(())
    }

    /// Calculate each recipient's lamport share given a total tip amount
    pub fn calculate_shares(&self, total: u64) -> Result<Vec<(Pubkey, u64)>> {
        let mut shares = Vec::with_capacity(self.recipients.len());
        let mut distributed: u64 = 0;

        for (i, r) in self.recipients.iter().enumerate() {
            let share = if i == self.recipients.len() - 1 {
                // Last recipient gets remainder to avoid rounding loss
                total.checked_sub(distributed).ok_or(ErrorCode::MathUnderflow)?
            } else {
                let s = (total as u128)
                    .checked_mul(r.share_bps as u128)
                    .ok_or(ErrorCode::MathOverflow)?
                    .checked_div(10_000)
                    .ok_or(ErrorCode::MathOverflow)? as u64;
                s
            };
            distributed = distributed
                .checked_add(share)
                .ok_or(ErrorCode::MathOverflow)?;
            shares.push((r.wallet, share));
        }
        Ok(shares)
    }
}
