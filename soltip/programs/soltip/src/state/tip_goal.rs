use anchor_lang::prelude::*;
use crate::constants::*;
use crate::error::ErrorCode;

/// Represents a fundraising goal for a creator
/// Goals can be for specific purposes and have optional deadlines
#[account]
pub struct TipGoal {
    /// The profile this goal belongs to
    pub profile: Pubkey,

    /// Unique goal ID (monotonic counter per profile)
    pub goal_id: u64,

    /// Goal title
    pub title: String,

    /// Goal description
    pub description: String,

    /// Target amount in lamports or token base units
    pub target_amount: u64,

    /// Current amount raised
    pub current_amount: u64,

    /// Token mint address (System Program for SOL)
    pub token_mint: Pubkey,

    /// Optional deadline timestamp
    pub deadline: Option<i64>,

    /// Whether the goal has been completed
    pub completed: bool,

    /// Timestamp when goal was completed
    pub completed_at: Option<i64>,

    /// Number of unique contributors
    pub unique_contributors: u32,

    /// Timestamp when goal was created
    pub created_at: i64,

    /// PDA bump seed
    pub bump: u8,
}

impl TipGoal {
    /// Calculate space needed for the account
    pub const LEN: usize = TIP_GOAL_SIZE;

    /// Initialize a new tip goal
    pub fn initialize(
        &mut self,
        profile: Pubkey,
        goal_id: u64,
        title: String,
        description: String,
        target_amount: u64,
        token_mint: Pubkey,
        deadline: Option<i64>,
        timestamp: i64,
        bump: u8,
    ) -> Result<()> {
        // Validate inputs
        require!(
            title.len() <= MAX_GOAL_TITLE_LENGTH,
            ErrorCode::GoalTitleTooLong
        );
        require!(
            description.len() <= MAX_GOAL_DESCRIPTION_LENGTH,
            ErrorCode::GoalDescriptionTooLong
        );
        require!(
            target_amount > 0,
            ErrorCode::InvalidGoalAmount
        );

        // Validate deadline if provided
        if let Some(deadline_ts) = deadline {
            require!(
                deadline_ts > timestamp,
                ErrorCode::InvalidGoalDeadline
            );

            let duration = deadline_ts
                .checked_sub(timestamp)
                .ok_or(ErrorCode::MathUnderflow)?;

            require!(
                duration <= MAX_GOAL_DURATION,
                ErrorCode::GoalDurationTooLong
            );
        }

        self.profile = profile;
        self.goal_id = goal_id;
        self.title = title;
        self.description = description;
        self.target_amount = target_amount;
        self.current_amount = 0;
        self.token_mint = token_mint;
        self.deadline = deadline;
        self.completed = false;
        self.completed_at = None;
        self.unique_contributors = 0;
        self.created_at = timestamp;
        self.bump = bump;

        Ok(())
    }

    /// Add a contribution to the goal
    pub fn add_contribution(&mut self, amount: u64, is_new_contributor: bool, timestamp: i64) -> Result<()> {
        // Check if goal is still active
        require!(!self.completed, ErrorCode::GoalAlreadyCompleted);

        // Check deadline if set
        if let Some(deadline_ts) = self.deadline {
            require!(timestamp <= deadline_ts, ErrorCode::GoalDeadlineExpired);
        }

        // Add contribution
        self.current_amount = self.current_amount
            .checked_add(amount)
            .ok_or(ErrorCode::MathOverflow)?;

        // Update unique contributors count
        if is_new_contributor {
            self.unique_contributors = self.unique_contributors
                .checked_add(1)
                .ok_or(ErrorCode::MathOverflow)?;
        }

        // Check if goal is now complete
        if self.current_amount >= self.target_amount {
            self.completed = true;
            self.completed_at = Some(timestamp);
        }

        Ok(())
    }

    /// Mark goal as completed (manual completion)
    pub fn mark_completed(&mut self, timestamp: i64) -> Result<()> {
        require!(!self.completed, ErrorCode::GoalAlreadyCompleted);

        self.completed = true;
        self.completed_at = Some(timestamp);

        Ok(())
    }

    /// Calculate completion percentage (in basis points: 0-10000)
    pub fn completion_percentage(&self) -> u16 {
        if self.target_amount == 0 {
            return 10000; // 100%
        }

        let percentage = (self.current_amount as u128)
            .checked_mul(10000)
            .and_then(|v| v.checked_div(self.target_amount as u128))
            .unwrap_or(0);

        // Cap at 100%
        if percentage > 10000 {
            10000
        } else {
            percentage as u16
        }
    }

    /// Check if goal is expired
    pub fn is_expired(&self, current_timestamp: i64) -> bool {
        if let Some(deadline_ts) = self.deadline {
            current_timestamp > deadline_ts
        } else {
            false
        }
    }

    /// Validate that the goal can accept contributions
    pub fn validate_can_contribute(&self, timestamp: i64) -> Result<()> {
        require!(!self.completed, ErrorCode::GoalAlreadyCompleted);

        if let Some(deadline_ts) = self.deadline {
            require!(timestamp <= deadline_ts, ErrorCode::GoalDeadlineExpired);
        }

        Ok(())
    }
}
