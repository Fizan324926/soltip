use actix_web::{web, HttpRequest, HttpResponse};
use crate::error::ApiError;
use crate::models::*;
use crate::db;
use crate::AppState;
use crate::app_middleware::require_wallet_auth;

/// POST /content-gates -- create a content gate
pub async fn create_gate(
    state: web::Data<AppState>,
    req: HttpRequest,
    body: web::Json<CreateGateRequest>,
) -> Result<HttpResponse, ApiError> {
    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Auth required".into()))?;
    let b = body.into_inner();

    let profile = db::profiles::find_by_address(&state.db, &auth.wallet_address)
        .await?
        .ok_or_else(|| ApiError::NotFound("Profile not found".into()))?;

    let gate_pda = format!("gate_{}_{}", &profile.profile_pda[..8.min(profile.profile_pda.len())], b.gate_id);

    let gate = db::content_gates::create_gate(
        &state.db, &gate_pda, &profile.profile_pda, b.gate_id,
        &b.title, &b.content_url, b.required_amount,
    ).await?;

    sqlx::query("UPDATE profiles SET active_gates_count = active_gates_count + 1 WHERE profile_pda = $1")
        .bind(&profile.profile_pda)
        .execute(&state.db)
        .await?;

    Ok(HttpResponse::Created().json(to_gate_response(&gate)))
}

/// GET /content-gates/{profile_pda} -- list content gates
pub async fn list_gates(
    state: web::Data<AppState>,
    path: web::Path<String>,
    query: web::Query<GateListQuery>,
) -> Result<HttpResponse, ApiError> {
    let profile_pda = path.into_inner();
    let active_only = query.active_only.unwrap_or(true);
    let gates = db::content_gates::find_gates_by_profile(&state.db, &profile_pda, active_only).await?;
    // BE-13: Use list response that hides content_url
    let responses: Vec<GateResponse> = gates.iter().map(to_gate_list_response).collect();
    Ok(HttpResponse::Ok().json(responses))
}

/// POST /content-gates/{gate_pda}/verify -- verify and grant access
pub async fn verify_access(
    state: web::Data<AppState>,
    req: HttpRequest,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Auth required".into()))?;
    let gate_pda = path.into_inner();

    let gate = db::content_gates::find_gate_by_pda(&state.db, &gate_pda)
        .await?
        .ok_or_else(|| ApiError::NotFound("Content gate not found".into()))?;

    if !gate.is_active {
        return Err(ApiError::BadRequest("Gate is closed".into()));
    }

    // Check if already has access
    let has_access = db::content_gates::check_access(&state.db, gate.id, &auth.wallet_address).await?;
    if has_access {
        return Ok(HttpResponse::Ok().json(serde_json::json!({
            "access_granted": true,
            "content_url": gate.content_url,
            "message": "Access already granted",
        })));
    }

    // Check tip history: total tips from this user to this profile >= required_amount
    let total_tipped: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(amount_lamports), 0) FROM tips WHERE tipper_address = $1 AND recipient_profile_pda = $2",
    )
    .bind(&auth.wallet_address)
    .bind(&gate.profile_pda)
    .fetch_one(&state.db)
    .await?;

    if total_tipped < gate.required_amount {
        return Err(ApiError::BadRequest(format!(
            "Insufficient tips: {} < {} required", total_tipped, gate.required_amount
        )));
    }

    // Grant access
    db::content_gates::record_access(&state.db, gate.id, &auth.wallet_address).await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "access_granted": true,
        "content_url": gate.content_url,
    })))
}

/// DELETE /content-gates/{gate_pda} -- close a content gate
pub async fn close_gate(
    state: web::Data<AppState>,
    req: HttpRequest,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Auth required".into()))?;
    let gate_pda = path.into_inner();

    let gate = db::content_gates::find_gate_by_pda(&state.db, &gate_pda)
        .await?
        .ok_or_else(|| ApiError::NotFound("Gate not found".into()))?;

    let profile = db::profiles::find_by_pda(&state.db, &gate.profile_pda)
        .await?
        .ok_or_else(|| ApiError::NotFound("Profile not found".into()))?;

    if profile.owner_address != auth.wallet_address {
        return Err(ApiError::Unauthorized("Not gate owner".into()));
    }

    db::content_gates::close_gate(&state.db, &gate_pda).await?;

    sqlx::query("UPDATE profiles SET active_gates_count = GREATEST(active_gates_count - 1, 0) WHERE profile_pda = $1")
        .bind(&gate.profile_pda)
        .execute(&state.db)
        .await?;

    Ok(HttpResponse::Ok().json(TxResponse { success: true, message: "Gate closed".into() }))
}

/// BE-13: Gate response for listing - hides content_url
fn to_gate_list_response(g: &ContentGate) -> GateResponse {
    GateResponse {
        public_key: g.gate_pda.clone(),
        profile_pda: g.profile_pda.clone(),
        gate_id: g.gate_id,
        title: g.title.clone(),
        content_url: String::new(), // Hidden in list responses
        required_amount: g.required_amount.to_string(),
        access_count: g.access_count,
        is_active: g.is_active,
        created_at: g.created_at.timestamp(),
    }
}

/// Full gate response - includes content_url (used for create/verify)
fn to_gate_response(g: &ContentGate) -> GateResponse {
    GateResponse {
        public_key: g.gate_pda.clone(),
        profile_pda: g.profile_pda.clone(),
        gate_id: g.gate_id,
        title: g.title.clone(),
        content_url: g.content_url.clone(),
        required_amount: g.required_amount.to_string(),
        access_count: g.access_count,
        is_active: g.is_active,
        created_at: g.created_at.timestamp(),
    }
}
