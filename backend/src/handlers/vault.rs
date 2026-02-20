use actix_web::{web, HttpRequest, HttpResponse};

use crate::app_middleware::require_wallet_auth;
use crate::error::ApiError;
use crate::models::*;
use crate::AppState;

pub async fn get_vault(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let profile_pda = path.into_inner();

    let vault: Option<Vault> = sqlx::query_as(
        "SELECT * FROM vaults WHERE profile_pda = $1"
    )
        .bind(&profile_pda)
        .fetch_optional(&state.db)
        .await?;

    match vault {
        Some(v) => Ok(HttpResponse::Ok().json(VaultResponse {
            public_key: v.vault_pda.clone(),
            account: VaultAccountResponse {
                owner: v.owner_address,
                balance: v.balance.to_string(),
                total_deposited: v.total_deposited.to_string(),
                total_withdrawn: v.total_withdrawn.to_string(),
                created_at: v.created_at.timestamp(),
            },
        })),
        None => Err(ApiError::NotFound("Vault not found".to_string())),
    }
}

pub async fn initialize_vault(
    req: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<serde_json::Value>,
) -> Result<HttpResponse, ApiError> {
    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Wallet auth required".to_string()))?;
    let owner = body.get("owner_address")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ApiError::BadRequest("owner_address required".to_string()))?;

    if auth.wallet_address != owner {
        return Err(ApiError::Unauthorized("Wallet does not match owner_address".to_string()));
    }

    let profile_pda = body.get("profile_pda")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ApiError::BadRequest("profile_pda required".to_string()))?;

    let vault_pda = body.get("vault_pda")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ApiError::BadRequest("vault_pda required".to_string()))?;

    let id = uuid::Uuid::new_v4();

    sqlx::query(
        "INSERT INTO vaults (id, owner_address, profile_pda, vault_pda, balance, total_deposited, total_withdrawn, created_at) VALUES ($1, $2, $3, $4, 0, 0, 0, NOW()) ON CONFLICT (vault_pda) DO NOTHING"
    )
        .bind(id)
        .bind(owner)
        .bind(profile_pda)
        .bind(vault_pda)
        .execute(&state.db)
        .await?;

    Ok(HttpResponse::Created().json(TxResponse {
        success: true,
        message: "Vault initialized".to_string(),
    }))
}

pub async fn withdraw(
    req: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<serde_json::Value>,
) -> Result<HttpResponse, ApiError> {
    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Wallet auth required".to_string()))?;
    let vault_pda = body.get("vault_pda")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ApiError::BadRequest("vault_pda required".to_string()))?;

    let amount = body.get("amount")
        .and_then(|v| v.as_i64())
        .ok_or_else(|| ApiError::BadRequest("amount required".to_string()))?;

    let tx_signature = body.get("tx_signature")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ApiError::BadRequest("tx_signature required".to_string()))?;

    let vault: Option<Vault> = sqlx::query_as(
        "SELECT * FROM vaults WHERE vault_pda = $1"
    )
        .bind(vault_pda)
        .fetch_optional(&state.db)
        .await?;

    let vault = vault.ok_or_else(|| ApiError::NotFound("Vault not found".to_string()))?;

    if auth.wallet_address != vault.owner_address {
        return Err(ApiError::Unauthorized("Wallet does not match vault owner".to_string()));
    }

    if vault.balance < amount {
        return Err(ApiError::BadRequest("Insufficient vault balance".to_string()));
    }

    sqlx::query(
        "UPDATE vaults SET balance = balance - $1, total_withdrawn = total_withdrawn + $1 WHERE vault_pda = $2"
    )
        .bind(amount)
        .bind(vault_pda)
        .execute(&state.db)
        .await?;

    log::info!("Withdrawal of {} lamports from vault {} (tx: {})", amount, vault_pda, tx_signature);

    Ok(HttpResponse::Ok().json(TxResponse {
        success: true,
        message: "Withdrawal recorded".to_string(),
    }))
}
