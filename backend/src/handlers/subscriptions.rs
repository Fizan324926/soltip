use actix_web::{web, HttpRequest, HttpResponse};
use uuid::Uuid;

use crate::app_middleware::require_wallet_auth;
use crate::error::ApiError;
use crate::models::*;
use crate::services;
use crate::db;
use crate::AppState;

pub async fn create_subscription(
    req: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<CreateSubscriptionRequest>,
) -> Result<HttpResponse, ApiError> {
    // BE-26: Check platform pause
    if db::platform::is_paused(&state.db).await? {
        return Err(ApiError::BadRequest("Platform is currently paused".to_string()));
    }

    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Wallet auth required".to_string()))?;
    if auth.wallet_address != body.subscriber_address {
        return Err(ApiError::Unauthorized("Wallet does not match subscriber_address".to_string()));
    }

    // BE-09: Validate Solana addresses
    services::solana::validate_address(&body.subscriber_address)
        .map_err(|e| ApiError::BadRequest(format!("Invalid subscriber_address: {}", e)))?;
    services::solana::validate_address(&body.recipient_address)
        .map_err(|e| ApiError::BadRequest(format!("Invalid recipient_address: {}", e)))?;

    if body.amount_per_interval <= 0 {
        return Err(ApiError::BadRequest("Amount must be positive".to_string()));
    }
    if body.interval_seconds <= 0 {
        return Err(ApiError::BadRequest("Interval must be positive".to_string()));
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
    let subscription_pda = format!("sub_{}_{}", &body.subscriber_address[..8.min(body.subscriber_address.len())], id.to_string().split('-').next().unwrap_or("x"));

    let next_payment = chrono::Utc::now() + chrono::Duration::seconds(body.interval_seconds);

    sqlx::query(
        "INSERT INTO subscriptions (id, subscription_pda, subscriber_address, recipient_profile_pda, amount_per_interval, interval_seconds, next_payment_due, auto_renew, total_paid, payment_count, is_active, is_spl, token_mint, created_at, last_payment_at) VALUES ($1, $2, $3, $4, $5, $6, $7, true, $5, 1, true, $8, $9, NOW(), NOW())"
    )
        .bind(id)
        .bind(&subscription_pda)
        .bind(&body.subscriber_address)
        .bind(&profile_pda)
        .bind(body.amount_per_interval)
        .bind(body.interval_seconds)
        .bind(next_payment)
        .bind(body.is_spl)
        .bind(&body.token_mint)
        .execute(&state.db)
        .await?;

    let sub: Subscription = sqlx::query_as("SELECT * FROM subscriptions WHERE id = $1")
        .bind(id)
        .fetch_one(&state.db)
        .await?;

    Ok(HttpResponse::Created().json(subscription_to_response(sub)))
}

pub async fn get_by_subscriber(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let address = path.into_inner();

    // BE-14: Add pagination limit
    let subs: Vec<Subscription> = sqlx::query_as(
        "SELECT * FROM subscriptions WHERE subscriber_address = $1 ORDER BY created_at DESC LIMIT 100"
    )
        .bind(&address)
        .fetch_all(&state.db)
        .await?;

    let items: Vec<SubscriptionResponse> = subs.into_iter().map(subscription_to_response).collect();
    Ok(HttpResponse::Ok().json(items))
}

pub async fn cancel_subscription(
    req: HttpRequest,
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    // BE-04: Actually use auth for ownership check
    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Wallet auth required".to_string()))?;
    let subscription_pda = path.into_inner();

    // Query subscription from DB to verify ownership
    let subscription: Option<Subscription> = sqlx::query_as(
        "SELECT * FROM subscriptions WHERE subscription_pda = $1"
    )
        .bind(&subscription_pda)
        .fetch_optional(&state.db)
        .await?;

    let subscription = subscription.ok_or_else(|| ApiError::NotFound("Subscription not found".to_string()))?;

    // Verify caller is the subscriber
    if auth.wallet_address != subscription.subscriber_address {
        return Err(ApiError::Unauthorized("Only the subscriber can cancel this subscription".to_string()));
    }

    sqlx::query(
        "UPDATE subscriptions SET is_active = false WHERE subscription_pda = $1"
    )
        .bind(&subscription_pda)
        .execute(&state.db)
        .await?;

    Ok(HttpResponse::Ok().json(TxResponse {
        success: true,
        message: "Subscription cancelled".to_string(),
    }))
}

fn subscription_to_response(s: Subscription) -> SubscriptionResponse {
    SubscriptionResponse {
        public_key: s.subscription_pda.clone(),
        account: SubscriptionAccountResponse {
            subscriber: s.subscriber_address,
            recipient_profile: s.recipient_profile_pda,
            amount_per_interval: s.amount_per_interval.to_string(),
            interval_seconds: s.interval_seconds,
            next_payment_due: s.next_payment_due.timestamp(),
            auto_renew: s.auto_renew,
            total_paid: s.total_paid.to_string(),
            payment_count: s.payment_count,
            is_active: s.is_active,
            is_spl: s.is_spl,
            token_mint: s.token_mint,
            created_at: s.created_at.timestamp(),
            last_payment_at: s.last_payment_at.map(|d| d.timestamp()),
        },
    }
}
