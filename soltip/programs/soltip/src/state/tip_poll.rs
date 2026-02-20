use anchor_lang::prelude::*;
use crate::constants::*;
use crate::error::ErrorCode;

/// A single option in a tip-funded poll
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct PollOption {
    /// Display label for this option (max 32 chars)
    pub label: String,
    /// Number of votes (tips) for this option
    pub vote_count: u32,
    /// Total lamports tipped toward this option
    pub total_amount: u64,
}

/// Tip-funded poll: viewers vote by tipping toward their preferred option.
/// Most-tipped option wins. Creates engagement and revenue simultaneously.
///
/// **PDA seeds:** `[b"tip_poll", profile.key(), poll_id.to_le_bytes()]`
#[account]
pub struct TipPoll {
    /// The TipProfile PDA that owns this poll
    pub profile: Pubkey,
    /// Unique poll ID (monotonic counter per profile)
    pub poll_id: u64,
    /// Poll title/question
    pub title: String,
    /// Poll description
    pub description: String,
    /// Voting options (2-4)
    pub options: Vec<PollOption>,
    /// Total votes across all options
    pub total_votes: u32,
    /// Total lamports across all options
    pub total_amount: u64,
    /// Optional deadline timestamp
    pub deadline: Option<i64>,
    /// Whether this poll is still accepting votes
    pub is_active: bool,
    /// Unix timestamp of poll creation
    pub created_at: i64,
    /// PDA bump
    pub bump: u8,
}

impl TipPoll {
    pub const LEN: usize = TIP_POLL_SIZE;

    pub fn initialize(
        &mut self,
        profile: Pubkey,
        poll_id: u64,
        title: String,
        description: String,
        options: Vec<String>,
        deadline: Option<i64>,
        timestamp: i64,
        bump: u8,
    ) -> Result<()> {
        require!(title.len() <= MAX_POLL_TITLE_LENGTH, ErrorCode::PollTitleTooLong);
        require!(description.len() <= MAX_DESCRIPTION_LENGTH, ErrorCode::DescriptionTooLong);
        require!(options.len() >= MIN_POLL_OPTIONS, ErrorCode::TooFewPollOptions);
        require!(options.len() <= MAX_POLL_OPTIONS, ErrorCode::TooManyPollOptions);

        for opt in &options {
            require!(opt.len() <= MAX_POLL_OPTION_LENGTH, ErrorCode::PollOptionTooLong);
            require!(validate_text_content(opt), ErrorCode::UnsafeTextContent);
        }

        if let Some(dl) = deadline {
            require!(dl > timestamp, ErrorCode::InvalidGoalDeadline);
        }

        let poll_options: Vec<PollOption> = options
            .into_iter()
            .map(|label| PollOption {
                label,
                vote_count: 0,
                total_amount: 0,
            })
            .collect();

        self.profile = profile;
        self.poll_id = poll_id;
        self.title = title;
        self.description = description;
        self.options = poll_options;
        self.total_votes = 0;
        self.total_amount = 0;
        self.deadline = deadline;
        self.is_active = true;
        self.created_at = timestamp;
        self.bump = bump;
        Ok(())
    }

    pub fn vote(&mut self, option_index: u8, amount: u64, timestamp: i64) -> Result<()> {
        require!(self.is_active, ErrorCode::PollNotActive);

        if let Some(dl) = self.deadline {
            require!(timestamp <= dl, ErrorCode::PollDeadlineExpired);
        }

        let idx = option_index as usize;
        require!(idx < self.options.len(), ErrorCode::InvalidPollOption);

        self.options[idx].vote_count = self.options[idx]
            .vote_count
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;
        self.options[idx].total_amount = self.options[idx]
            .total_amount
            .checked_add(amount)
            .ok_or(ErrorCode::MathOverflow)?;

        self.total_votes = self.total_votes
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;
        self.total_amount = self.total_amount
            .checked_add(amount)
            .ok_or(ErrorCode::MathOverflow)?;

        Ok(())
    }

    pub fn deactivate(&mut self) -> Result<()> {
        require!(self.is_active, ErrorCode::PollNotActive);
        self.is_active = false;
        Ok(())
    }

    /// Returns the index of the winning option (most total amount)
    pub fn winning_option(&self) -> Option<usize> {
        if self.options.is_empty() {
            return None;
        }
        self.options
            .iter()
            .enumerate()
            .max_by_key(|(_, o)| o.total_amount)
            .map(|(i, _)| i)
    }
}
