use sqlx::PgPool;

use crate::error::ApiError;
use crate::models::{TipSplit, SplitRecipient};

pub async fn find_by_profile(pool: &PgPool, profile_pda: &str) -> Result<Option<TipSplit>, ApiError> {
    let split = sqlx::query_as::<_, TipSplit>(
        "SELECT * FROM tip_splits WHERE profile_pda = $1"
    )
        .bind(profile_pda)
        .fetch_optional(pool)
        .await?;
    Ok(split)
}

pub async fn find_recipients(pool: &PgPool, split_id: uuid::Uuid) -> Result<Vec<SplitRecipient>, ApiError> {
    let recipients = sqlx::query_as::<_, SplitRecipient>(
        "SELECT * FROM split_recipients WHERE split_id = $1 ORDER BY share_bps DESC"
    )
        .bind(split_id)
        .fetch_all(pool)
        .await?;
    Ok(recipients)
}
