use sqlx::PgPool;

use crate::error::ApiError;
use crate::models::Subscription;

pub async fn find_by_subscriber(pool: &PgPool, address: &str) -> Result<Vec<Subscription>, ApiError> {
    let subs = sqlx::query_as::<_, Subscription>(
        "SELECT * FROM subscriptions WHERE subscriber_address = $1 ORDER BY created_at DESC LIMIT 100"
    )
        .bind(address)
        .fetch_all(pool)
        .await?;
    Ok(subs)
}

pub async fn find_by_pda(pool: &PgPool, subscription_pda: &str) -> Result<Option<Subscription>, ApiError> {
    let sub = sqlx::query_as::<_, Subscription>(
        "SELECT * FROM subscriptions WHERE subscription_pda = $1"
    )
        .bind(subscription_pda)
        .fetch_optional(pool)
        .await?;
    Ok(sub)
}

pub async fn find_active_by_recipient(pool: &PgPool, profile_pda: &str) -> Result<Vec<Subscription>, ApiError> {
    let subs = sqlx::query_as::<_, Subscription>(
        "SELECT * FROM subscriptions WHERE recipient_profile_pda = $1 AND is_active = true ORDER BY created_at DESC LIMIT 100"
    )
        .bind(profile_pda)
        .fetch_all(pool)
        .await?;
    Ok(subs)
}

pub async fn find_due_subscriptions(pool: &PgPool) -> Result<Vec<Subscription>, ApiError> {
    let subs = sqlx::query_as::<_, Subscription>(
        "SELECT * FROM subscriptions WHERE is_active = true AND auto_renew = true AND next_payment_due <= NOW()"
    )
        .fetch_all(pool)
        .await?;
    Ok(subs)
}
