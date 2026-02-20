use sqlx::PgPool;
use uuid::Uuid;

use crate::error::ApiError;
use crate::models::Profile;

pub async fn find_by_address(pool: &PgPool, address: &str) -> Result<Option<Profile>, ApiError> {
    let profile = sqlx::query_as::<_, Profile>(
        "SELECT * FROM profiles WHERE owner_address = $1 OR profile_pda = $1 OR username = $1"
    )
        .bind(address)
        .fetch_optional(pool)
        .await?;
    Ok(profile)
}

pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Profile>, ApiError> {
    let profile = sqlx::query_as::<_, Profile>(
        "SELECT * FROM profiles WHERE id = $1"
    )
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(profile)
}

pub async fn exists_by_username(pool: &PgPool, username: &str) -> Result<bool, ApiError> {
    let result: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM profiles WHERE username = $1"
    )
        .bind(username)
        .fetch_one(pool)
        .await?;
    Ok(result.0 > 0)
}

pub async fn find_by_pda(pool: &PgPool, profile_pda: &str) -> Result<Option<Profile>, ApiError> {
    let profile = sqlx::query_as::<_, Profile>(
        "SELECT * FROM profiles WHERE profile_pda = $1"
    )
        .bind(profile_pda)
        .fetch_optional(pool)
        .await?;
    Ok(profile)
}

pub async fn find_by_username(pool: &PgPool, username: &str) -> Result<Option<Profile>, ApiError> {
    let profile = sqlx::query_as::<_, Profile>(
        "SELECT * FROM profiles WHERE username = $1"
    )
        .bind(username)
        .fetch_optional(pool)
        .await?;
    Ok(profile)
}
