use sqlx::PgPool;
use uuid::Uuid;
use crate::models::{Poll, PollVote};

pub async fn create_poll(
    pool: &PgPool,
    poll_pda: &str,
    profile_pda: &str,
    poll_id: i64,
    title: &str,
    description: &str,
    options: &serde_json::Value,
    deadline: Option<chrono::DateTime<chrono::Utc>>,
) -> Result<Poll, sqlx::Error> {
    sqlx::query_as::<_, Poll>(
        r#"INSERT INTO polls (poll_pda, profile_pda, poll_id, title, description, options, deadline)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *"#,
    )
    .bind(poll_pda)
    .bind(profile_pda)
    .bind(poll_id)
    .bind(title)
    .bind(description)
    .bind(options)
    .bind(deadline)
    .fetch_one(pool)
    .await
}

pub async fn find_polls_by_profile(
    pool: &PgPool,
    profile_pda: &str,
    active_only: bool,
) -> Result<Vec<Poll>, sqlx::Error> {
    if active_only {
        sqlx::query_as::<_, Poll>(
            "SELECT * FROM polls WHERE profile_pda = $1 AND is_active = TRUE ORDER BY created_at DESC",
        )
        .bind(profile_pda)
        .fetch_all(pool)
        .await
    } else {
        sqlx::query_as::<_, Poll>(
            "SELECT * FROM polls WHERE profile_pda = $1 ORDER BY created_at DESC",
        )
        .bind(profile_pda)
        .fetch_all(pool)
        .await
    }
}

pub async fn find_poll_by_pda(pool: &PgPool, poll_pda: &str) -> Result<Option<Poll>, sqlx::Error> {
    sqlx::query_as::<_, Poll>("SELECT * FROM polls WHERE poll_pda = $1")
        .bind(poll_pda)
        .fetch_optional(pool)
        .await
}

pub async fn record_vote(
    pool: &PgPool,
    poll_db_id: Uuid,
    voter_address: &str,
    option_index: i32,
    amount: i64,
    tx_signature: Option<&str>,
) -> Result<PollVote, sqlx::Error> {
    sqlx::query_as::<_, PollVote>(
        r#"INSERT INTO poll_votes (poll_id, voter_address, option_index, amount, tx_signature)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *"#,
    )
    .bind(poll_db_id)
    .bind(voter_address)
    .bind(option_index)
    .bind(amount)
    .bind(tx_signature)
    .fetch_one(pool)
    .await
}

pub async fn update_poll_totals(
    pool: &PgPool,
    poll_db_id: Uuid,
    option_index: i32,
    amount: i64,
) -> Result<(), sqlx::Error> {
    // Update total_votes and total_amount
    sqlx::query("UPDATE polls SET total_votes = total_votes + 1, total_amount = total_amount + $2 WHERE id = $1")
        .bind(poll_db_id)
        .bind(amount)
        .execute(pool)
        .await?;

    // Update option vote count in JSONB
    sqlx::query(
        r#"UPDATE polls SET options = jsonb_set(
            options,
            ARRAY[$2::text, 'votes'],
            (COALESCE((options->$2::int->>'votes')::int, 0) + 1)::text::jsonb
        ) WHERE id = $1"#,
    )
    .bind(poll_db_id)
    .bind(option_index)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn close_poll(pool: &PgPool, poll_pda: &str) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE polls SET is_active = FALSE WHERE poll_pda = $1")
        .bind(poll_pda)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn get_poll_votes(pool: &PgPool, poll_db_id: Uuid) -> Result<Vec<PollVote>, sqlx::Error> {
    sqlx::query_as::<_, PollVote>(
        "SELECT * FROM poll_votes WHERE poll_id = $1 ORDER BY created_at DESC",
    )
    .bind(poll_db_id)
    .fetch_all(pool)
    .await
}
