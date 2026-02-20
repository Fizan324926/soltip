use actix_web::web;

use crate::handlers;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/v1")
            // Health
            .route("/health", web::get().to(handlers::health::health_check))
            // Profiles
            .route("/profiles", web::get().to(handlers::profiles::list_profiles))
            .route("/profiles", web::post().to(handlers::profiles::create_profile))
            .route("/profiles/{address}", web::get().to(handlers::profiles::get_profile))
            .route("/profiles/{address}", web::put().to(handlers::profiles::update_profile))
            .route("/profiles/{address}/leaderboard", web::get().to(handlers::profiles::get_leaderboard))
            // Vault
            .route("/vault/{profile_pda}", web::get().to(handlers::vault::get_vault))
            .route("/vault/initialize", web::post().to(handlers::vault::initialize_vault))
            .route("/vault/withdraw", web::post().to(handlers::vault::withdraw))
            // Tips
            .route("/tips", web::post().to(handlers::tips::record_tip))
            .route("/tips/spl", web::post().to(handlers::tips::record_tip_spl))
            .route("/tips/split", web::post().to(handlers::tips::record_tip_split))
            .route("/tips/history/{address}", web::get().to(handlers::tips::get_tip_history))
            // Goals
            .route("/goals/{profile_pda}", web::get().to(handlers::goals::list_goals))
            .route("/goals", web::post().to(handlers::goals::create_goal))
            .route("/goals/{goal_pda}/contribute", web::post().to(handlers::goals::contribute_goal))
            .route("/goals/{goal_pda}", web::delete().to(handlers::goals::close_goal))
            // Subscriptions
            .route("/subscriptions", web::post().to(handlers::subscriptions::create_subscription))
            .route("/subscriptions/subscriber/{address}", web::get().to(handlers::subscriptions::get_by_subscriber))
            .route("/subscriptions/{subscription_pda}", web::delete().to(handlers::subscriptions::cancel_subscription))
            // Splits
            .route("/splits/{profile_pda}", web::get().to(handlers::splits::get_split))
            .route("/splits", web::post().to(handlers::splits::configure_split))
            // Admin
            .route("/admin/config", web::get().to(handlers::admin::get_platform_config))
            .route("/admin/pause", web::post().to(handlers::admin::pause_platform))
            .route("/admin/verify", web::post().to(handlers::admin::verify_creator))
            // Transactions (generic query)
            .route("/transactions/{address}", web::get().to(handlers::tips::get_tip_history)),
    );
}
