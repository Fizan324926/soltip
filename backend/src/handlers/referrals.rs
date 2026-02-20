use actix_web::{web, HttpRequest, HttpResponse};
use crate::error::ApiError;
use crate::models::*;
use crate::db;
use crate::AppState;
use crate::app_middleware::require_wallet_auth;

/// POST /referrals – register a referral
pub async fn register_referral(
    state: web::Data<AppState>,
    req: HttpRequest,
    body: web::Json<CreateReferralRequest>,
) -> Result<HttpResponse, ApiError> {
    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Auth required".into()))?;
    let b = body.into_inner();

    if b.fee_share_bps.unwrap_or(500) > 2000 {
        return Err(ApiError::BadRequest("Max referral fee is 2000 bps (20%)".into()));
    }

    let referral_pda = format!("ref_{}_{}",
        &auth.wallet_address[..8.min(auth.wallet_address.len())],
        &b.referee_profile_pda[..8.min(b.referee_profile_pda.len())]);

    let referral = db::referrals::create_referral(
        &state.db, &referral_pda, &auth.wallet_address,
        &b.referee_profile_pda, b.fee_share_bps.unwrap_or(500),
    ).await.map_err(|e| {
        if e.to_string().contains("unique") || e.to_string().contains("duplicate") {
            ApiError::BadRequest("Referral already exists".into())
        } else {
            ApiError::Database(e.to_string())
        }
    })?;

    Ok(HttpResponse::Created().json(to_referral_response(&referral)))
}

/// GET /referrals/referrer/{address} – list referrals by referrer
pub async fn get_by_referrer(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let address = path.into_inner();
    let referrals = db::referrals::find_referrals_by_referrer(&state.db, &address).await?;
    let responses: Vec<ReferralResponse> = referrals.iter().map(to_referral_response).collect();
    Ok(HttpResponse::Ok().json(responses))
}

/// GET /referrals/profile/{profile_pda} – list referrals for a profile
pub async fn get_by_profile(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let profile_pda = path.into_inner();
    let referrals = db::referrals::find_referrals_for_profile(&state.db, &profile_pda).await?;
    let responses: Vec<ReferralResponse> = referrals.iter().map(to_referral_response).collect();
    Ok(HttpResponse::Ok().json(responses))
}

fn to_referral_response(r: &Referral) -> ReferralResponse {
    ReferralResponse {
        public_key: r.referral_pda.clone(),
        referrer: r.referrer_address.clone(),
        referee_profile: r.referee_profile_pda.clone(),
        fee_share_bps: r.fee_share_bps,
        total_earned: r.total_earned.to_string(),
        referral_count: r.referral_count,
        is_active: r.is_active,
        created_at: r.created_at.timestamp(),
    }
}
