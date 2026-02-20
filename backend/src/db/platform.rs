use sqlx::PgPool;

use crate::error::ApiError;
use crate::models::PlatformConfigRow;

pub async fn get_config(pool: &PgPool) -> Result<Option<PlatformConfigRow>, ApiError> {
    let config = sqlx::query_as::<_, PlatformConfigRow>(
        "SELECT * FROM platform_config ORDER BY created_at DESC LIMIT 1"
    )
        .fetch_optional(pool)
        .await?;
    Ok(config)
}

pub async fn is_paused(pool: &PgPool) -> Result<bool, ApiError> {
    let config = get_config(pool).await?;
    Ok(config.map(|c| c.paused).unwrap_or(false))
}
