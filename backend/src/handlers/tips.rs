use actix_web::{web, HttpRequest, HttpResponse};
use uuid::Uuid;

use crate::app_middleware::require_wallet_auth;
use crate::error::ApiError;
use crate::models::*;
use crate::AppState;

pub async fn record_tip(
    req: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<SendTipRequest>,
) -> Result<HttpResponse, ApiError> {
    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Wallet auth required".to_string()))?;
    if auth.wallet_address != body.tipper_address {
        return Err(ApiError::Unauthorized("Wallet does not match tipper_address".to_string()));
    }

    if body.amount_lamports <= 0 {
        return Err(ApiError::BadRequest("Amount must be positive".to_string()));
    }

    let profile: Option<(String,)> = sqlx::query_as(
        "SELECT profile_pda FROM profiles WHERE owner_address = $1"
    )
        .bind(&body.recipient_address)
        .fetch_optional(&state.db)
        .await?;

    let profile_pda = profile
        .ok_or_else(|| ApiError::NotFound("Recipient profile not found".to_string()))?
        .0;

    let id = Uuid::new_v4();
    let is_anonymous = body.is_anonymous.unwrap_or(false);

    sqlx::query(
        "INSERT INTO tips (id, tx_signature, tipper_address, recipient_address, recipient_profile_pda, amount_lamports, tip_type, token_mint, message, is_anonymous, created_at) VALUES ($1, $2, $3, $4, $5, $6, 'sol', NULL, $7, $8, NOW())"
    )
        .bind(id)
        .bind(&body.tx_signature)
        .bind(&body.tipper_address)
        .bind(&body.recipient_address)
        .bind(&profile_pda)
        .bind(body.amount_lamports)
        .bind(&body.message)
        .bind(is_anonymous)
        .execute(&state.db)
        .await?;

    // Update profile stats
    sqlx::query(
        "UPDATE profiles SET total_tips_received = total_tips_received + 1, total_amount_received_lamports = total_amount_received_lamports + $1, updated_at = NOW() WHERE profile_pda = $2"
    )
        .bind(body.amount_lamports)
        .bind(&profile_pda)
        .execute(&state.db)
        .await?;

    // Update unique tippers count
    let existing_tipper: Option<(i64,)> = sqlx::query_as(
        "SELECT COUNT(*) FROM tips WHERE recipient_profile_pda = $1 AND tipper_address = $2 AND id != $3"
    )
        .bind(&profile_pda)
        .bind(&body.tipper_address)
        .bind(id)
        .fetch_one(&state.db)
        .await
        .ok();

    if existing_tipper.map(|c| c.0).unwrap_or(0) == 0 {
        sqlx::query(
            "UPDATE profiles SET total_unique_tippers = total_unique_tippers + 1 WHERE profile_pda = $1"
        )
            .bind(&profile_pda)
            .execute(&state.db)
            .await?;
    }

    Ok(HttpResponse::Created().json(TxResponse {
        success: true,
        message: "Tip recorded successfully".to_string(),
    }))
}

pub async fn record_tip_spl(
    req: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<SendTipSplRequest>,
) -> Result<HttpResponse, ApiError> {
    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Wallet auth required".to_string()))?;
    if auth.wallet_address != body.tipper_address {
        return Err(ApiError::Unauthorized("Wallet does not match tipper_address".to_string()));
    }

    if body.amount <= 0 {
        return Err(ApiError::BadRequest("Amount must be positive".to_string()));
    }

    let profile: Option<(String,)> = sqlx::query_as(
        "SELECT profile_pda FROM profiles WHERE owner_address = $1"
    )
        .bind(&body.recipient_address)
        .fetch_optional(&state.db)
        .await?;

    let profile_pda = profile
        .ok_or_else(|| ApiError::NotFound("Recipient profile not found".to_string()))?
        .0;

    let id = Uuid::new_v4();
    let is_anonymous = body.is_anonymous.unwrap_or(false);

    sqlx::query(
        "INSERT INTO tips (id, tx_signature, tipper_address, recipient_address, recipient_profile_pda, amount_lamports, tip_type, token_mint, message, is_anonymous, created_at) VALUES ($1, $2, $3, $4, $5, $6, 'spl', $7, $8, $9, NOW())"
    )
        .bind(id)
        .bind(&body.tx_signature)
        .bind(&body.tipper_address)
        .bind(&body.recipient_address)
        .bind(&profile_pda)
        .bind(body.amount)
        .bind(&body.token_mint)
        .bind(&body.message)
        .bind(is_anonymous)
        .execute(&state.db)
        .await?;

    sqlx::query(
        "UPDATE profiles SET total_tips_received = total_tips_received + 1, total_amount_received_spl = total_amount_received_spl + $1, updated_at = NOW() WHERE profile_pda = $2"
    )
        .bind(body.amount)
        .bind(&profile_pda)
        .execute(&state.db)
        .await?;

    Ok(HttpResponse::Created().json(TxResponse {
        success: true,
        message: "SPL tip recorded successfully".to_string(),
    }))
}

pub async fn record_tip_split(
    req: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<SendTipRequest>,
) -> Result<HttpResponse, ApiError> {
    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Wallet auth required".to_string()))?;
    if auth.wallet_address != body.tipper_address {
        return Err(ApiError::Unauthorized("Wallet does not match tipper_address".to_string()));
    }

    // For split tips, record similarly but mark as split type
    let profile: Option<(String,)> = sqlx::query_as(
        "SELECT profile_pda FROM profiles WHERE owner_address = $1"
    )
        .bind(&body.recipient_address)
        .fetch_optional(&state.db)
        .await?;

    let profile_pda = profile
        .ok_or_else(|| ApiError::NotFound("Recipient profile not found".to_string()))?
        .0;

    let id = Uuid::new_v4();
    let is_anonymous = body.is_anonymous.unwrap_or(false);

    sqlx::query(
        "INSERT INTO tips (id, tx_signature, tipper_address, recipient_address, recipient_profile_pda, amount_lamports, tip_type, token_mint, message, is_anonymous, created_at) VALUES ($1, $2, $3, $4, $5, $6, 'split', NULL, $7, $8, NOW())"
    )
        .bind(id)
        .bind(&body.tx_signature)
        .bind(&body.tipper_address)
        .bind(&body.recipient_address)
        .bind(&profile_pda)
        .bind(body.amount_lamports)
        .bind(&body.message)
        .bind(is_anonymous)
        .execute(&state.db)
        .await?;

    Ok(HttpResponse::Created().json(TxResponse {
        success: true,
        message: "Split tip recorded successfully".to_string(),
    }))
}

pub async fn get_tip_history(
    state: web::Data<AppState>,
    path: web::Path<String>,
    query: web::Query<ListQuery>,
) -> Result<HttpResponse, ApiError> {
    let address = path.into_inner();
    let page = query.page.unwrap_or(1).max(1);
    let page_size = query.page_size.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * page_size;

    let tips: Vec<Tip> = sqlx::query_as(
        "SELECT * FROM tips WHERE tipper_address = $1 OR recipient_address = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"
    )
        .bind(&address)
        .bind(page_size)
        .bind(offset)
        .fetch_all(&state.db)
        .await?;

    let total: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM tips WHERE tipper_address = $1 OR recipient_address = $1"
    )
        .bind(&address)
        .fetch_one(&state.db)
        .await?;

    let items: Vec<TipResponse> = tips
        .into_iter()
        .map(|t| TipResponse {
            id: t.id.to_string(),
            tx_signature: t.tx_signature,
            tipper_address: t.tipper_address,
            recipient_address: t.recipient_address,
            amount_lamports: t.amount_lamports.to_string(),
            tip_type: t.tip_type,
            token_mint: t.token_mint,
            message: t.message,
            is_anonymous: t.is_anonymous,
            created_at: t.created_at.timestamp(),
        })
        .collect();

    Ok(HttpResponse::Ok().json(PaginatedResponse {
        has_next_page: (page * page_size) < total.0,
        items,
        total: total.0,
        page,
        page_size,
    }))
}
