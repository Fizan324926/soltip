pub mod create_profile;
pub mod update_profile;
pub mod send_tip;
pub mod send_tip_spl;
pub mod withdraw;
pub mod withdraw_spl;
pub mod create_goal;
pub mod contribute_goal;
pub mod close_goal;
pub mod create_subscription;
pub mod cancel_subscription;
pub mod process_subscription;
pub mod initialize_vault;
// Split instructions: one #[derive(Accounts)] per file (Anchor requirement)
pub mod configure_split;
pub mod send_tip_split;
// Admin instructions: one #[derive(Accounts)] per file (Anchor requirement)
pub mod initialize_platform;
pub mod verify_creator;
pub mod pause_platform;

// Export Accounts structs and events explicitly (avoids handler name collisions)
pub use create_profile::CreateProfile;
pub use update_profile::UpdateProfile;
pub use send_tip::{SendTip, TipSentEvent};
pub use send_tip_spl::{SendTipSpl, SplTipSentEvent};
pub use withdraw::{Withdraw, WithdrawalEvent};
pub use withdraw_spl::{WithdrawSpl, SplWithdrawalEvent};
pub use create_goal::CreateGoal;
pub use contribute_goal::{ContributeGoal, GoalContributionEvent};
pub use close_goal::CloseGoal;
pub use create_subscription::CreateSubscription;
pub use cancel_subscription::CancelSubscription;
pub use process_subscription::{ProcessSubscription, SubscriptionProcessedEvent};
pub use initialize_vault::InitializeVault;
pub use configure_split::ConfigureSplit;
pub use send_tip_split::{SendTipSplit, TipSplitSentEvent};
pub use initialize_platform::{InitializePlatform, PlatformConfig};
pub use verify_creator::VerifyCreator;
pub use pause_platform::PausePlatform;
