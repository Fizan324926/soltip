use sqlx::PgPool;

use crate::error::ApiError;
use crate::models::Tip;

pub async fn find_by_address(pool: &PgPool, address: &str, limit: i64, offset: i64) -> Result<Vec<Tip>, ApiError> {
    let tips = sqlx::query_as::<_, Tip>(
        "SELECT * FROM tips WHERE tipper_address = $1 OR recipient_address = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"
    )
        .bind(address)
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await?;
    Ok(tips)
}

pub async fn count_by_address(pool: &PgPool, address: &str) -> Result<i64, ApiError> {
    let result: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM tips WHERE tipper_address = $1 OR recipient_address = $1"
    )
        .bind(address)
        .fetch_one(pool)
        .await?;
    Ok(result.0)
}

pub async fn find_by_tx(pool: &PgPool, tx_signature: &str) -> Result<Option<Tip>, ApiError> {
    let tip = sqlx::query_as::<_, Tip>(
        "SELECT * FROM tips WHERE tx_signature = $1"
    )
        .bind(tx_signature)
        .fetch_optional(pool)
        .await?;
    Ok(tip)
}
