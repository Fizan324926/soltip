use actix_web::{web, HttpRequest, HttpResponse};
use uuid::Uuid;

use crate::app_middleware::require_wallet_auth;
use crate::error::ApiError;
use crate::models::*;
use crate::AppState;

pub async fn get_split(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let profile_pda = path.into_inner();

    let split: Option<TipSplit> = sqlx::query_as(
        "SELECT * FROM tip_splits WHERE profile_pda = $1"
    )
        .bind(&profile_pda)
        .fetch_optional(&state.db)
        .await?;

    match split {
        Some(s) => {
            let recipients: Vec<SplitRecipient> = sqlx::query_as(
                "SELECT * FROM split_recipients WHERE split_id = $1 ORDER BY share_bps DESC"
            )
                .bind(s.id)
                .fetch_all(&state.db)
                .await?;

            Ok(HttpResponse::Ok().json(TipSplitResponse {
                public_key: s.split_pda.clone(),
                account: TipSplitAccountResponse {
                    profile: s.profile_pda,
                    num_recipients: recipients.len() as i32,
                    recipients: recipients.into_iter().map(|r| SplitRecipientResponse {
                        wallet: r.wallet_address,
                        share_bps: r.share_bps,
                        label: r.label,
                    }).collect(),
                    is_active: s.is_active,
                },
            }))
        }
        None => Err(ApiError::NotFound("Tip split config not found".to_string())),
    }
}

pub async fn configure_split(
    req: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<ConfigureSplitRequest>,
) -> Result<HttpResponse, ApiError> {
    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Wallet auth required".to_string()))?;
    if auth.wallet_address != body.owner_address {
        return Err(ApiError::Unauthorized("Wallet does not match owner_address".to_string()));
    }

    if body.recipients.is_empty() || body.recipients.len() > crate::config::MAX_SPLIT_RECIPIENTS {
        return Err(ApiError::BadRequest(
            format!("Recipients must be between 1 and {}", crate::config::MAX_SPLIT_RECIPIENTS)
        ));
    }

    let total_bps: i32 = body.recipients.iter().map(|r| r.share_bps).sum();
    if total_bps != 10_000 {
        return Err(ApiError::BadRequest("Share BPS must sum to 10000".to_string()));
    }

    let profile: Option<(String,)> = sqlx::query_as(
        "SELECT profile_pda FROM profiles WHERE owner_address = $1"
    )
        .bind(&body.owner_address)
        .fetch_optional(&state.db)
        .await?;

    let profile_pda = profile
        .ok_or_else(|| ApiError::NotFound("Profile not found".to_string()))?
        .0;

    // BE-12: Wrap delete+insert in a database transaction to prevent race conditions
    let mut tx = state.db.begin().await.map_err(|e| ApiError::Database(e.to_string()))?;

    // Delete existing split config
    let existing: Option<TipSplit> = sqlx::query_as(
        "SELECT * FROM tip_splits WHERE profile_pda = $1 FOR UPDATE"
    )
        .bind(&profile_pda)
        .fetch_optional(&mut *tx)
        .await?;

    if let Some(existing_split) = &existing {
        sqlx::query("DELETE FROM split_recipients WHERE split_id = $1")
            .bind(existing_split.id)
            .execute(&mut *tx)
            .await?;
        sqlx::query("DELETE FROM tip_splits WHERE id = $1")
            .bind(existing_split.id)
            .execute(&mut *tx)
            .await?;
    }

    let split_id = Uuid::new_v4();
    let split_pda = format!("split_{}", &profile_pda[..8.min(profile_pda.len())]);

    sqlx::query(
        "INSERT INTO tip_splits (id, split_pda, profile_pda, is_active, created_at) VALUES ($1, $2, $3, true, NOW())"
    )
        .bind(split_id)
        .bind(&split_pda)
        .bind(&profile_pda)
        .execute(&mut *tx)
        .await?;

    for recipient in &body.recipients {
        let rid = Uuid::new_v4();
        sqlx::query(
            "INSERT INTO split_recipients (id, split_id, wallet_address, share_bps, label) VALUES ($1, $2, $3, $4, $5)"
        )
            .bind(rid)
            .bind(split_id)
            .bind(&recipient.wallet)
            .bind(recipient.share_bps)
            .bind(&recipient.label)
            .execute(&mut *tx)
            .await?;
    }

    tx.commit().await.map_err(|e| ApiError::Database(e.to_string()))?;

    Ok(HttpResponse::Created().json(TxResponse {
        success: true,
        message: "Split configuration saved".to_string(),
    }))
}
