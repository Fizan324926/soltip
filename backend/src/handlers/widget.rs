use actix_web::{web, HttpRequest, HttpResponse};
use crate::app_middleware::require_wallet_auth;
use crate::error::ApiError;
use crate::db;
use crate::services;
use crate::AppState;

/// GET /widget/{username} -- embeddable tip widget config
/// Returns JSON that the frontend widget component consumes.
pub async fn get_widget_config(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let username = path.into_inner();

    let profile = db::profiles::find_by_username(&state.db, &username)
        .await?
        .ok_or_else(|| ApiError::NotFound("Creator not found".into()))?;

    let sol_price = services::price::get_sol_price(&state.db).await.unwrap_or(0.0);

    let preset_amounts: Vec<i64> = serde_json::from_value(profile.preset_amounts.clone())
        .unwrap_or_default();

    Ok(HttpResponse::Ok()
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .insert_header(("Cache-Control", "public, max-age=60"))
        .json(serde_json::json!({
            "creator": {
                "username": profile.username,
                "display_name": profile.display_name,
                "image_url": profile.image_url,
                "is_verified": profile.is_verified,
                "profile_pda": profile.profile_pda,
                "owner_address": profile.owner_address,
            },
            "config": {
                "min_tip_amount": profile.min_tip_amount,
                "accept_anonymous": profile.accept_anonymous,
                "preset_amounts": preset_amounts,
                "sol_price_usd": sol_price,
            },
            "stats": {
                "total_tips": profile.total_tips_received,
                "total_amount_lamports": profile.total_amount_received_lamports.to_string(),
                "total_unique_tippers": profile.total_unique_tippers,
            },
        })))
}

/// GET /overlay/{username} -- alert overlay data for OBS browser source
/// Returns config for the live streaming overlay.
pub async fn get_overlay_config(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let username = path.into_inner();

    let profile = db::profiles::find_by_username(&state.db, &username)
        .await?
        .ok_or_else(|| ApiError::NotFound("Creator not found".into()))?;

    let sol_price = services::price::get_sol_price(&state.db).await.unwrap_or(0.0);

    // Get recent tips for the alert feed (last 10)
    let recent_tips: Vec<crate::models::Tip> = sqlx::query_as::<_, crate::models::Tip>(
        "SELECT * FROM tips WHERE recipient_profile_pda = $1 ORDER BY created_at DESC LIMIT 10",
    )
    .bind(&profile.profile_pda)
    .fetch_all(&state.db)
    .await?;

    let tips_json: Vec<serde_json::Value> = recent_tips.iter().map(|t| serde_json::json!({
        "tipper": if t.is_anonymous { "Anonymous".to_string() } else { t.tipper_address.clone() },
        "amount_lamports": t.amount_lamports.to_string(),
        "amount_usd": services::price::lamports_to_usd(t.amount_lamports, sol_price),
        "message": t.message,
        "tip_type": t.tip_type,
        "created_at": t.created_at.timestamp(),
    })).collect();

    // Active goals progress
    let goals = db::goals::find_active_goals(&state.db, &profile.profile_pda).await?;
    let goals_json: Vec<serde_json::Value> = goals.iter().map(|g| serde_json::json!({
        "title": g.title,
        "current_amount": g.current_amount,
        "target_amount": g.target_amount,
        "progress_pct": if g.target_amount > 0 { (g.current_amount as f64 / g.target_amount as f64 * 100.0).round() } else { 0.0 },
    })).collect();

    // Active polls
    let polls = db::polls::find_polls_by_profile(&state.db, &profile.profile_pda, true).await?;
    let polls_json: Vec<serde_json::Value> = polls.iter().map(|p| serde_json::json!({
        "title": p.title,
        "options": p.options,
        "total_votes": p.total_votes,
    })).collect();

    Ok(HttpResponse::Ok()
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .insert_header(("Cache-Control", "no-cache"))
        .json(serde_json::json!({
            "creator": {
                "username": profile.username,
                "display_name": profile.display_name,
                "image_url": profile.image_url,
            },
            "sol_price_usd": sol_price,
            "recent_tips": tips_json,
            "active_goals": goals_json,
            "active_polls": polls_json,
        })))
}

/// BE-19: Sanitize a CSV field to prevent CSV injection
fn sanitize_csv_field(field: &str) -> String {
    let trimmed = field.trim();
    if trimmed.starts_with('=') || trimmed.starts_with('+') || trimmed.starts_with('-') || trimmed.starts_with('@') {
        format!("'{}", trimmed)
    } else {
        trimmed.to_string()
    }
}

/// GET /export/{profile_pda}/tips -- CSV export of tips
pub async fn export_tips_csv(
    req: HttpRequest,
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    // BE-07: Require auth for CSV export
    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Wallet auth required".to_string()))?;
    let profile_pda = path.into_inner();

    // Verify the caller owns the profile
    let profile = db::profiles::find_by_pda(&state.db, &profile_pda)
        .await?
        .ok_or_else(|| ApiError::NotFound("Profile not found".into()))?;
    if profile.owner_address != auth.wallet_address {
        return Err(ApiError::Unauthorized("Only the profile owner can export tips".to_string()));
    }

    let tips = sqlx::query_as::<_, crate::models::Tip>(
        "SELECT * FROM tips WHERE recipient_profile_pda = $1 ORDER BY created_at DESC LIMIT 10000",
    )
    .bind(&profile_pda)
    .fetch_all(&state.db)
    .await?;

    let mut csv = String::from("Date,Tipper,Amount (lamports),Type,Token Mint,Message,Anonymous\n");
    for t in &tips {
        // BE-19: Sanitize fields to prevent CSV injection
        let tipper = if t.is_anonymous {
            "anonymous".to_string()
        } else {
            sanitize_csv_field(&t.tipper_address)
        };
        let message = t.message.as_deref().unwrap_or("").replace(',', ";");
        let message = sanitize_csv_field(&message);
        csv.push_str(&format!(
            "{},{},{},{},{},{},{}\n",
            t.created_at.format("%Y-%m-%d %H:%M:%S"),
            tipper,
            t.amount_lamports,
            t.tip_type,
            t.token_mint.as_deref().unwrap_or("SOL"),
            message,
            t.is_anonymous,
        ));
    }

    Ok(HttpResponse::Ok()
        .content_type("text/csv")
        .insert_header(("Content-Disposition", "attachment; filename=tips_export.csv"))
        .body(csv))
}
