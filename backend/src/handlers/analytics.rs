use actix_web::{web, HttpResponse};
use crate::error::ApiError;
use crate::models::*;
use crate::db;
use crate::services;
use crate::AppState;

/// GET /analytics/{profile_pda} – get creator analytics
pub async fn get_analytics(
    state: web::Data<AppState>,
    path: web::Path<String>,
    query: web::Query<AnalyticsQuery>,
) -> Result<HttpResponse, ApiError> {
    let profile_pda = path.into_inner();
    let days = query.days.unwrap_or(30).min(365);

    // Rebuild analytics from tips data
    let _ = db::analytics::rebuild_daily_analytics(&state.db, &profile_pda).await;

    let daily = db::analytics::get_daily_analytics(&state.db, &profile_pda, days).await?;

    // Get current SOL price for USD conversion
    let sol_price = services::price::get_sol_price(&state.db).await.unwrap_or(0.0);

    // Aggregate stats
    let total_tips: i64 = daily.iter().map(|d| d.tip_count as i64).sum();
    let total_amount: i64 = daily.iter().map(|d| d.total_amount).sum();
    let total_spl: i64 = daily.iter().map(|d| d.spl_amount).sum();

    let daily_entries: Vec<AnalyticsDayResponse> = daily.iter().map(|d| AnalyticsDayResponse {
        date: d.date.to_string(),
        tip_count: d.tip_count,
        total_amount: d.total_amount.to_string(),
        total_amount_usd: services::price::lamports_to_usd(d.total_amount, sol_price),
        unique_tippers: d.unique_tippers,
        spl_amount: d.spl_amount.to_string(),
    }).collect();

    // Time-window stats
    let (week_tips, week_amount, week_tippers) =
        db::analytics::get_window_stats(&state.db, &profile_pda, "weekly").await.unwrap_or((0, 0, 0));
    let (month_tips, month_amount, month_tippers) =
        db::analytics::get_window_stats(&state.db, &profile_pda, "monthly").await.unwrap_or((0, 0, 0));

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "profile_pda": profile_pda,
        "period_days": days,
        "sol_price_usd": sol_price,
        "summary": {
            "total_tips": total_tips,
            "total_amount_lamports": total_amount.to_string(),
            "total_amount_usd": services::price::lamports_to_usd(total_amount, sol_price),
            "total_spl": total_spl.to_string(),
        },
        "weekly": {
            "tips": week_tips,
            "amount_lamports": week_amount.to_string(),
            "amount_usd": services::price::lamports_to_usd(week_amount, sol_price),
            "unique_tippers": week_tippers,
        },
        "monthly": {
            "tips": month_tips,
            "amount_lamports": month_amount.to_string(),
            "amount_usd": services::price::lamports_to_usd(month_amount, sol_price),
            "unique_tippers": month_tippers,
        },
        "daily": daily_entries,
    })))
}

/// GET /leaderboard/{profile_pda}/window – time-window leaderboard
pub async fn get_window_leaderboard(
    state: web::Data<AppState>,
    path: web::Path<(String, String)>,
) -> Result<HttpResponse, ApiError> {
    let (profile_pda, window) = path.into_inner();

    if !["weekly", "monthly", "yearly"].contains(&window.as_str()) {
        return Err(ApiError::BadRequest("Window must be: weekly, monthly, yearly".into()));
    }

    let entries = db::analytics::get_time_window_leaderboard(&state.db, &profile_pda, &window, 10).await?;

    let sol_price = services::price::get_sol_price(&state.db).await.unwrap_or(0.0);

    let response: Vec<serde_json::Value> = entries.iter().map(|e| serde_json::json!({
        "tipper": e.tipper_address,
        "total_amount": e.total_amount.to_string(),
        "total_amount_usd": services::price::lamports_to_usd(e.total_amount, sol_price),
        "tip_count": e.tip_count,
    })).collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "profile_pda": profile_pda,
        "window": window,
        "leaderboard": response,
    })))
}

/// GET /price/sol – current SOL price
pub async fn get_sol_price(
    state: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let price = services::price::get_sol_price(&state.db)
        .await
        .map_err(|e| ApiError::Internal(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "token": "SOL",
        "price_usd": price,
        "updated_at": chrono::Utc::now().timestamp(),
    })))
}
