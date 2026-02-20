use sqlx::PgPool;

use crate::error::ApiError;
use crate::models::Vault;

pub async fn find_by_profile(pool: &PgPool, profile_pda: &str) -> Result<Option<Vault>, ApiError> {
    let vault = sqlx::query_as::<_, Vault>(
        "SELECT * FROM vaults WHERE profile_pda = $1"
    )
        .bind(profile_pda)
        .fetch_optional(pool)
        .await?;
    Ok(vault)
}

pub async fn find_by_pda(pool: &PgPool, vault_pda: &str) -> Result<Option<Vault>, ApiError> {
    let vault = sqlx::query_as::<_, Vault>(
        "SELECT * FROM vaults WHERE vault_pda = $1"
    )
        .bind(vault_pda)
        .fetch_optional(pool)
        .await?;
    Ok(vault)
}
