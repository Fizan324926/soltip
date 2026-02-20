// ==========================================================
// Vault – per-creator SOL escrow account
// Tips flow into the vault; creator withdraws from vault.
// This separates tipping funds from the creator's wallet,
// enabling proper fee deduction and balance tracking.
// ==========================================================

use anchor_lang::prelude::*;
use crate::constants::*;
use crate::error::ErrorCode;

#[account]
pub struct Vault {
    /// The creator who owns this vault
    pub owner: Pubkey,
    /// Current SOL balance held in escrow (lamports)
    pub balance: u64,
    /// Lifetime total deposited (lamports)
    pub total_deposited: u64,
    /// Lifetime total withdrawn (lamports)
    pub total_withdrawn: u64,
    /// Unix timestamp of vault creation
    pub created_at: i64,
    /// PDA bump
    pub bump: u8,
}

impl Vault {
    pub const LEN: usize = VAULT_SIZE;

    pub fn initialize(&mut self, owner: Pubkey, timestamp: i64, bump: u8) {
        self.owner         = owner;
        self.balance       = 0;
        self.total_deposited = 0;
        self.total_withdrawn = 0;
        self.created_at    = timestamp;
        self.bump          = bump;
    }

    /// Credit funds into the vault (called after a CPI transfer into the vault PDA)
    pub fn deposit(&mut self, amount: u64) -> Result<()> {
        self.balance = self.balance
            .checked_add(amount)
            .ok_or(ErrorCode::MathOverflow)?;
        self.total_deposited = self.total_deposited
            .checked_add(amount)
            .ok_or(ErrorCode::MathOverflow)?;
        Ok(())
    }

    /// Debit funds from vault tracking (actual lamport transfer done via CPI)
    /// Enforces a minimum rent buffer so the vault account stays alive.
    pub fn withdraw(&mut self, amount: u64) -> Result<()> {
        let remaining = self.balance
            .checked_sub(amount)
            .ok_or(ErrorCode::InsufficientBalance)?;
        require!(remaining >= MIN_VAULT_RENT_BUFFER, ErrorCode::VaultBelowRentBuffer);
        self.balance = remaining;
        self.total_withdrawn = self.total_withdrawn
            .checked_add(amount)
            .ok_or(ErrorCode::MathOverflow)?;
        Ok(())
    }

    /// Returns withdrawable amount (balance minus rent buffer)
    pub fn withdrawable(&self) -> u64 {
        self.balance.saturating_sub(MIN_VAULT_RENT_BUFFER)
    }
}
