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

            // Polls (v3)
            .route("/polls", web::post().to(handlers::polls::create_poll))
            .route("/polls/{profile_pda}", web::get().to(handlers::polls::list_polls))
            .route("/polls/{poll_pda}/vote", web::post().to(handlers::polls::vote_poll))
            .route("/polls/{poll_pda}/close", web::delete().to(handlers::polls::close_poll))

            // Content Gates (v3)
            .route("/content-gates", web::post().to(handlers::content_gates::create_gate))
            .route("/content-gates/{profile_pda}", web::get().to(handlers::content_gates::list_gates))
            .route("/content-gates/{gate_pda}/verify", web::post().to(handlers::content_gates::verify_access))
            .route("/content-gates/{gate_pda}/close", web::delete().to(handlers::content_gates::close_gate))

            // Referrals (v3)
            .route("/referrals", web::post().to(handlers::referrals::register_referral))
            .route("/referrals/referrer/{address}", web::get().to(handlers::referrals::get_by_referrer))
            .route("/referrals/profile/{profile_pda}", web::get().to(handlers::referrals::get_by_profile))

            // Analytics (v3)
            .route("/analytics/{profile_pda}", web::get().to(handlers::analytics::get_analytics))
            .route("/leaderboard/{profile_pda}/{window}", web::get().to(handlers::analytics::get_window_leaderboard))
            .route("/price/sol", web::get().to(handlers::analytics::get_sol_price))

            // Widget & Overlay (v3)
            .route("/widget/{username}", web::get().to(handlers::widget::get_widget_config))
            .route("/overlay/{username}", web::get().to(handlers::widget::get_overlay_config))
            .route("/export/{profile_pda}/tips", web::get().to(handlers::widget::export_tips_csv))

            // Admin
            .route("/admin/config", web::get().to(handlers::admin::get_platform_config))
            .route("/admin/pause", web::post().to(handlers::admin::pause_platform))
            .route("/admin/verify", web::post().to(handlers::admin::verify_creator))

            // Transactions (generic query)
            .route("/transactions/{address}", web::get().to(handlers::tips::get_tip_history)),
    );
}
