use actix_web::{web, HttpRequest, HttpResponse};
use crate::error::ApiError;
use crate::models::*;
use crate::db;
use crate::AppState;
use crate::app_middleware::require_wallet_auth;

/// POST /polls – create a new poll
pub async fn create_poll(
    state: web::Data<AppState>,
    req: HttpRequest,
    body: web::Json<CreatePollRequest>,
) -> Result<HttpResponse, ApiError> {
    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Auth required".into()))?;
    let b = body.into_inner();

    // Verify caller owns this profile
    let profile = db::profiles::find_by_address(&state.db, &auth.wallet_address)
        .await?
        .ok_or_else(|| ApiError::NotFound("Profile not found".into()))?;

    if b.options.len() < 2 || b.options.len() > 4 {
        return Err(ApiError::BadRequest("Polls need 2-4 options".into()));
    }

    let options_json: serde_json::Value = b.options.iter().map(|o| {
        serde_json::json!({"label": o, "votes": 0, "amount": 0})
    }).collect();

    let poll_pda = format!("poll_{}_{}", &profile.profile_pda[..8.min(profile.profile_pda.len())], b.poll_id);
    let deadline = b.deadline.map(|ts| {
        chrono::DateTime::from_timestamp(ts, 0).unwrap_or_else(chrono::Utc::now)
    });

    let poll = db::polls::create_poll(
        &state.db, &poll_pda, &profile.profile_pda, b.poll_id,
        &b.title, &b.description.unwrap_or_default(), &options_json, deadline,
    ).await?;

    // Update active polls count
    sqlx::query("UPDATE profiles SET active_polls_count = active_polls_count + 1 WHERE profile_pda = $1")
        .bind(&profile.profile_pda)
        .execute(&state.db)
        .await?;

    Ok(HttpResponse::Created().json(to_poll_response(&poll)))
}

/// GET /polls/{profile_pda} – list polls for a profile
pub async fn list_polls(
    state: web::Data<AppState>,
    path: web::Path<String>,
    query: web::Query<PollListQuery>,
) -> Result<HttpResponse, ApiError> {
    let profile_pda = path.into_inner();
    let active_only = query.active_only.unwrap_or(true);
    let polls = db::polls::find_polls_by_profile(&state.db, &profile_pda, active_only).await?;
    let responses: Vec<PollResponse> = polls.iter().map(to_poll_response).collect();
    Ok(HttpResponse::Ok().json(responses))
}

/// POST /polls/{poll_pda}/vote – vote on a poll
pub async fn vote_poll(
    state: web::Data<AppState>,
    req: HttpRequest,
    path: web::Path<String>,
    body: web::Json<VotePollRequest>,
) -> Result<HttpResponse, ApiError> {
    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Auth required".into()))?;
    let poll_pda = path.into_inner();
    let b = body.into_inner();

    let poll = db::polls::find_poll_by_pda(&state.db, &poll_pda)
        .await?
        .ok_or_else(|| ApiError::NotFound("Poll not found".into()))?;

    if !poll.is_active {
        return Err(ApiError::BadRequest("Poll is closed".into()));
    }

    let options: Vec<serde_json::Value> = serde_json::from_value(poll.options.clone())
        .map_err(|_| ApiError::Internal("Invalid poll options".into()))?;
    if b.option_index < 0 || b.option_index as usize >= options.len() {
        return Err(ApiError::BadRequest("Invalid option index".into()));
    }

    let vote = db::polls::record_vote(
        &state.db, poll.id, &auth.wallet_address,
        b.option_index, b.amount.unwrap_or(0), b.tx_signature.as_deref(),
    ).await.map_err(|e| {
        if e.to_string().contains("unique") {
            ApiError::BadRequest("Already voted on this poll".into())
        } else {
            ApiError::Database(e.to_string())
        }
    })?;

    db::polls::update_poll_totals(&state.db, poll.id, b.option_index, b.amount.unwrap_or(0)).await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "vote_id": vote.id.to_string(),
    })))
}

/// DELETE /polls/{poll_pda} – close a poll
pub async fn close_poll(
    state: web::Data<AppState>,
    req: HttpRequest,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Auth required".into()))?;
    let poll_pda = path.into_inner();

    let poll = db::polls::find_poll_by_pda(&state.db, &poll_pda)
        .await?
        .ok_or_else(|| ApiError::NotFound("Poll not found".into()))?;

    // Verify ownership via profile
    let profile = db::profiles::find_by_pda(&state.db, &poll.profile_pda)
        .await?
        .ok_or_else(|| ApiError::NotFound("Profile not found".into()))?;

    if profile.owner_address != auth.wallet_address {
        return Err(ApiError::Unauthorized("Not poll owner".into()));
    }

    db::polls::close_poll(&state.db, &poll_pda).await?;

    sqlx::query("UPDATE profiles SET active_polls_count = GREATEST(active_polls_count - 1, 0) WHERE profile_pda = $1")
        .bind(&poll.profile_pda)
        .execute(&state.db)
        .await?;

    Ok(HttpResponse::Ok().json(TxResponse { success: true, message: "Poll closed".into() }))
}

fn to_poll_response(p: &Poll) -> PollResponse {
    PollResponse {
        public_key: p.poll_pda.clone(),
        poll_id: p.poll_id,
        profile_pda: p.profile_pda.clone(),
        title: p.title.clone(),
        description: p.description.clone(),
        options: p.options.clone(),
        total_votes: p.total_votes,
        total_amount: p.total_amount.to_string(),
        deadline: p.deadline.map(|d| d.timestamp()),
        is_active: p.is_active,
        created_at: p.created_at.timestamp(),
    }
}
