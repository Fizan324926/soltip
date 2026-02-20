use sqlx::PgPool;
use uuid::Uuid;
use crate::models::{ContentGate, ContentAccess};

pub async fn create_gate(
    pool: &PgPool,
    gate_pda: &str,
    profile_pda: &str,
    gate_id: i64,
    title: &str,
    content_url: &str,
    required_amount: i64,
) -> Result<ContentGate, sqlx::Error> {
    sqlx::query_as::<_, ContentGate>(
        r#"INSERT INTO content_gates (gate_pda, profile_pda, gate_id, title, content_url, required_amount)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *"#,
    )
    .bind(gate_pda)
    .bind(profile_pda)
    .bind(gate_id)
    .bind(title)
    .bind(content_url)
    .bind(required_amount)
    .fetch_one(pool)
    .await
}

pub async fn find_gates_by_profile(
    pool: &PgPool,
    profile_pda: &str,
    active_only: bool,
) -> Result<Vec<ContentGate>, sqlx::Error> {
    if active_only {
        sqlx::query_as::<_, ContentGate>(
            "SELECT * FROM content_gates WHERE profile_pda = $1 AND is_active = TRUE ORDER BY created_at DESC",
        )
        .bind(profile_pda)
        .fetch_all(pool)
        .await
    } else {
        sqlx::query_as::<_, ContentGate>(
            "SELECT * FROM content_gates WHERE profile_pda = $1 ORDER BY created_at DESC",
        )
        .bind(profile_pda)
        .fetch_all(pool)
        .await
    }
}

pub async fn find_gate_by_pda(pool: &PgPool, gate_pda: &str) -> Result<Option<ContentGate>, sqlx::Error> {
    sqlx::query_as::<_, ContentGate>("SELECT * FROM content_gates WHERE gate_pda = $1")
        .bind(gate_pda)
        .fetch_optional(pool)
        .await
}

pub async fn record_access(
    pool: &PgPool,
    gate_db_id: Uuid,
    accessor_address: &str,
) -> Result<ContentAccess, sqlx::Error> {
    let access = sqlx::query_as::<_, ContentAccess>(
        "INSERT INTO content_access (gate_id, accessor_address) VALUES ($1, $2) RETURNING *",
    )
    .bind(gate_db_id)
    .bind(accessor_address)
    .fetch_one(pool)
    .await?;

    sqlx::query("UPDATE content_gates SET access_count = access_count + 1 WHERE id = $1")
        .bind(gate_db_id)
        .execute(pool)
        .await?;

    Ok(access)
}

pub async fn check_access(
    pool: &PgPool,
    gate_db_id: Uuid,
    accessor_address: &str,
) -> Result<bool, sqlx::Error> {
    let row = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM content_access WHERE gate_id = $1 AND accessor_address = $2",
    )
    .bind(gate_db_id)
    .bind(accessor_address)
    .fetch_one(pool)
    .await?;
    Ok(row > 0)
}

pub async fn close_gate(pool: &PgPool, gate_pda: &str) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE content_gates SET is_active = FALSE WHERE gate_pda = $1")
        .bind(gate_pda)
        .execute(pool)
        .await?;
    Ok(())
}
