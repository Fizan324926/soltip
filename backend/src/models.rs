use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// ============================================================
// Profile
// ============================================================
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Profile {
    pub id: Uuid,
    pub owner_address: String,
    pub profile_pda: String,
    pub username: String,
    pub display_name: String,
    pub description: String,
    pub image_url: String,
    pub total_tips_received: i64,
    pub total_amount_received_lamports: i64,
    pub total_amount_received_spl: i64,
    pub total_unique_tippers: i32,
    pub active_goals_count: i32,
    pub min_tip_amount: i64,
    pub withdrawal_fee_bps: i32,
    pub accept_anonymous: bool,
    pub is_verified: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================
// Vault
// ============================================================
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Vault {
    pub id: Uuid,
    pub owner_address: String,
    pub profile_pda: String,
    pub vault_pda: String,
    pub balance: i64,
    pub total_deposited: i64,
    pub total_withdrawn: i64,
    pub created_at: DateTime<Utc>,
}

// ============================================================
// Tip (event log)
// ============================================================
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Tip {
    pub id: Uuid,
    pub tx_signature: String,
    pub tipper_address: String,
    pub recipient_address: String,
    pub recipient_profile_pda: String,
    pub amount_lamports: i64,
    pub tip_type: String,
    pub token_mint: Option<String>,
    pub message: Option<String>,
    pub is_anonymous: bool,
    pub created_at: DateTime<Utc>,
}

// ============================================================
// Goal
// ============================================================
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Goal {
    pub id: Uuid,
    pub goal_pda: String,
    pub profile_pda: String,
    pub goal_id: i64,
    pub title: String,
    pub description: String,
    pub target_amount: i64,
    pub current_amount: i64,
    pub token_mint: String,
    pub deadline: Option<DateTime<Utc>>,
    pub completed: bool,
    pub completed_at: Option<DateTime<Utc>>,
    pub unique_contributors: i32,
    pub created_at: DateTime<Utc>,
}

// ============================================================
// Subscription
// ============================================================
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Subscription {
    pub id: Uuid,
    pub subscription_pda: String,
    pub subscriber_address: String,
    pub recipient_profile_pda: String,
    pub amount_per_interval: i64,
    pub interval_seconds: i64,
    pub next_payment_due: DateTime<Utc>,
    pub auto_renew: bool,
    pub total_paid: i64,
    pub payment_count: i32,
    pub is_active: bool,
    pub is_spl: bool,
    pub token_mint: String,
    pub created_at: DateTime<Utc>,
    pub last_payment_at: Option<DateTime<Utc>>,
}

// ============================================================
// TipSplit
// ============================================================
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct TipSplit {
    pub id: Uuid,
    pub split_pda: String,
    pub profile_pda: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct SplitRecipient {
    pub id: Uuid,
    pub split_id: Uuid,
    pub wallet_address: String,
    pub share_bps: i32,
    pub label: String,
}

// ============================================================
// PlatformConfig
// ============================================================
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct PlatformConfigRow {
    pub id: Uuid,
    pub authority_address: String,
    pub treasury_address: String,
    pub platform_fee_bps: i32,
    pub paused: bool,
    pub created_at: DateTime<Utc>,
}

// ============================================================
// LeaderboardEntry
// ============================================================
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct LeaderboardEntry {
    pub tipper_address: String,
    pub total_amount: i64,
    pub tip_count: i32,
}

// ============================================================
// API request/response DTOs
// ============================================================

#[derive(Debug, Deserialize)]
pub struct CreateProfileRequest {
    pub owner_address: String,
    pub username: String,
    pub display_name: String,
    pub description: String,
    pub image_url: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProfileRequest {
    pub display_name: Option<String>,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub min_tip_amount: Option<i64>,
    pub withdrawal_fee_bps: Option<i32>,
    pub accept_anonymous: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct SendTipRequest {
    pub tipper_address: String,
    pub recipient_address: String,
    pub amount_lamports: i64,
    pub message: Option<String>,
    pub is_anonymous: Option<bool>,
    pub tx_signature: String,
}

#[derive(Debug, Deserialize)]
pub struct SendTipSplRequest {
    pub tipper_address: String,
    pub recipient_address: String,
    pub token_mint: String,
    pub amount: i64,
    pub message: Option<String>,
    pub is_anonymous: Option<bool>,
    pub tx_signature: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateGoalRequest {
    pub owner_address: String,
    pub goal_id: i64,
    pub title: String,
    pub description: String,
    pub target_amount: i64,
    pub token_mint: String,
    pub deadline: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct ContributeGoalRequest {
    pub contributor_address: String,
    pub amount_lamports: i64,
    pub message: Option<String>,
    pub tx_signature: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateSubscriptionRequest {
    pub subscriber_address: String,
    pub recipient_address: String,
    pub amount_per_interval: i64,
    pub interval_seconds: i64,
    pub is_spl: bool,
    pub token_mint: String,
    pub tx_signature: String,
}

#[derive(Debug, Deserialize)]
pub struct ConfigureSplitRequest {
    pub owner_address: String,
    pub recipients: Vec<SplitRecipientInput>,
}

#[derive(Debug, Deserialize)]
pub struct SplitRecipientInput {
    pub wallet: String,
    pub share_bps: i32,
    pub label: String,
}

#[derive(Debug, Deserialize)]
pub struct PauseRequest {
    pub authority_address: String,
    pub paused: bool,
}

#[derive(Debug, Deserialize)]
pub struct VerifyCreatorRequest {
    pub authority_address: String,
    pub creator_address: String,
    pub verified: bool,
}

#[derive(Debug, Serialize)]
pub struct ProfileResponse {
    pub public_key: String,
    pub account: ProfileAccountResponse,
}

#[derive(Debug, Serialize)]
pub struct ProfileAccountResponse {
    pub owner: String,
    pub username: String,
    pub display_name: String,
    pub description: String,
    pub image_url: String,
    pub total_tips_received: String,
    pub total_amount_received_lamports: String,
    pub total_amount_received_spl: String,
    pub total_unique_tippers: i32,
    pub active_goals_count: i32,
    pub min_tip_amount: String,
    pub withdrawal_fee_bps: i32,
    pub accept_anonymous: bool,
    pub is_verified: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub leaderboard: Vec<LeaderboardResponse>,
}

#[derive(Debug, Serialize)]
pub struct LeaderboardResponse {
    pub tipper: String,
    pub total_amount: String,
    pub tip_count: i32,
}

#[derive(Debug, Serialize)]
pub struct VaultResponse {
    pub public_key: String,
    pub account: VaultAccountResponse,
}

#[derive(Debug, Serialize)]
pub struct VaultAccountResponse {
    pub owner: String,
    pub balance: String,
    pub total_deposited: String,
    pub total_withdrawn: String,
    pub created_at: i64,
}

#[derive(Debug, Serialize)]
pub struct GoalResponse {
    pub public_key: String,
    pub account: GoalAccountResponse,
}

#[derive(Debug, Serialize)]
pub struct GoalAccountResponse {
    pub profile: String,
    pub goal_id: String,
    pub title: String,
    pub description: String,
    pub target_amount: String,
    pub current_amount: String,
    pub token_mint: String,
    pub deadline: Option<i64>,
    pub completed: bool,
    pub completed_at: Option<i64>,
    pub unique_contributors: i32,
    pub created_at: i64,
}

#[derive(Debug, Serialize)]
pub struct SubscriptionResponse {
    pub public_key: String,
    pub account: SubscriptionAccountResponse,
}

#[derive(Debug, Serialize)]
pub struct SubscriptionAccountResponse {
    pub subscriber: String,
    pub recipient_profile: String,
    pub amount_per_interval: String,
    pub interval_seconds: i64,
    pub next_payment_due: i64,
    pub auto_renew: bool,
    pub total_paid: String,
    pub payment_count: i32,
    pub is_active: bool,
    pub is_spl: bool,
    pub token_mint: String,
    pub created_at: i64,
    pub last_payment_at: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct TipSplitResponse {
    pub public_key: String,
    pub account: TipSplitAccountResponse,
}

#[derive(Debug, Serialize)]
pub struct TipSplitAccountResponse {
    pub profile: String,
    pub num_recipients: i32,
    pub recipients: Vec<SplitRecipientResponse>,
    pub is_active: bool,
}

#[derive(Debug, Serialize)]
pub struct SplitRecipientResponse {
    pub wallet: String,
    pub share_bps: i32,
    pub label: String,
}

#[derive(Debug, Serialize)]
pub struct PlatformConfigResponse {
    pub authority: String,
    pub treasury: String,
    pub platform_fee_bps: i32,
    pub paused: bool,
    pub created_at: i64,
}

#[derive(Debug, Serialize)]
pub struct TipResponse {
    pub id: String,
    pub tx_signature: String,
    pub tipper_address: String,
    pub recipient_address: String,
    pub amount_lamports: String,
    pub tip_type: String,
    pub token_mint: Option<String>,
    pub message: Option<String>,
    pub is_anonymous: bool,
    pub created_at: i64,
}

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    pub search: Option<String>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    pub only_verified: Option<bool>,
    pub page: Option<i64>,
    pub page_size: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T: Serialize> {
    pub items: Vec<T>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
    pub has_next_page: bool,
}

#[derive(Debug, Serialize)]
pub struct TxResponse {
    pub success: bool,
    pub message: String,
}
