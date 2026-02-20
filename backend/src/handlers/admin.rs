use actix_web::{web, HttpRequest, HttpResponse};

use crate::app_middleware::require_wallet_auth;
use crate::error::ApiError;
use crate::models::*;
use crate::AppState;

pub async fn get_platform_config(
    req: HttpRequest,
    state: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    // BE-10: Require auth to access admin config
    let _auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Wallet auth required".to_string()))?;

    let config: Option<PlatformConfigRow> = sqlx::query_as(
        "SELECT * FROM platform_config ORDER BY created_at DESC LIMIT 1"
    )
        .fetch_optional(&state.db)
        .await?;

    match config {
        Some(c) => Ok(HttpResponse::Ok().json(PlatformConfigResponse {
            authority: c.authority_address,
            treasury: c.treasury_address,
            platform_fee_bps: c.platform_fee_bps,
            paused: c.paused,
            created_at: c.created_at.timestamp(),
        })),
        None => Err(ApiError::NotFound("Platform config not found".to_string())),
    }
}

pub async fn pause_platform(
    req: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<PauseRequest>,
) -> Result<HttpResponse, ApiError> {
    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Wallet auth required".to_string()))?;
    if auth.wallet_address != body.authority_address {
        return Err(ApiError::Unauthorized("Wallet does not match authority_address".to_string()));
    }

    // Verify authority
    let config: Option<PlatformConfigRow> = sqlx::query_as(
        "SELECT * FROM platform_config ORDER BY created_at DESC LIMIT 1"
    )
        .fetch_optional(&state.db)
        .await?;

    let config = config.ok_or_else(|| ApiError::NotFound("Platform config not found".to_string()))?;

    if config.authority_address != body.authority_address {
        return Err(ApiError::Unauthorized("Not platform authority".to_string()));
    }

    sqlx::query("UPDATE platform_config SET paused = $1 WHERE id = $2")
        .bind(body.paused)
        .bind(config.id)
        .execute(&state.db)
        .await?;

    Ok(HttpResponse::Ok().json(TxResponse {
        success: true,
        message: format!("Platform {}", if body.paused { "paused" } else { "unpaused" }),
    }))
}

pub async fn verify_creator(
    req: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<VerifyCreatorRequest>,
) -> Result<HttpResponse, ApiError> {
    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Wallet auth required".to_string()))?;
    if auth.wallet_address != body.authority_address {
        return Err(ApiError::Unauthorized("Wallet does not match authority_address".to_string()));
    }

    // Verify authority
    let config: Option<PlatformConfigRow> = sqlx::query_as(
        "SELECT * FROM platform_config ORDER BY created_at DESC LIMIT 1"
    )
        .fetch_optional(&state.db)
        .await?;

    let config = config.ok_or_else(|| ApiError::NotFound("Platform config not found".to_string()))?;

    if config.authority_address != body.authority_address {
        return Err(ApiError::Unauthorized("Not platform authority".to_string()));
    }

    let result = sqlx::query(
        "UPDATE profiles SET is_verified = $1, updated_at = NOW() WHERE owner_address = $2"
    )
        .bind(body.verified)
        .bind(&body.creator_address)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound("Creator profile not found".to_string()));
    }

    Ok(HttpResponse::Ok().json(TxResponse {
        success: true,
        message: format!("Creator {} {}", body.creator_address, if body.verified { "verified" } else { "unverified" }),
    }))
}
