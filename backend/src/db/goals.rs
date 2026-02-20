use sqlx::PgPool;

use crate::error::ApiError;
use crate::models::Goal;

pub async fn find_by_profile(pool: &PgPool, profile_pda: &str) -> Result<Vec<Goal>, ApiError> {
    let goals = sqlx::query_as::<_, Goal>(
        "SELECT * FROM goals WHERE profile_pda = $1 ORDER BY created_at DESC"
    )
        .bind(profile_pda)
        .fetch_all(pool)
        .await?;
    Ok(goals)
}

pub async fn find_by_pda(pool: &PgPool, goal_pda: &str) -> Result<Option<Goal>, ApiError> {
    let goal = sqlx::query_as::<_, Goal>(
        "SELECT * FROM goals WHERE goal_pda = $1"
    )
        .bind(goal_pda)
        .fetch_optional(pool)
        .await?;
    Ok(goal)
}

pub async fn find_active_by_profile(pool: &PgPool, profile_pda: &str) -> Result<Vec<Goal>, ApiError> {
    let goals = sqlx::query_as::<_, Goal>(
        "SELECT * FROM goals WHERE profile_pda = $1 AND completed = false ORDER BY created_at DESC"
    )
        .bind(profile_pda)
        .fetch_all(pool)
        .await?;
    Ok(goals)
}

pub async fn find_active_goals(pool: &PgPool, profile_pda: &str) -> Result<Vec<Goal>, sqlx::Error> {
    sqlx::query_as::<_, Goal>(
        "SELECT * FROM goals WHERE profile_pda = $1 AND completed = false ORDER BY created_at DESC"
    )
        .bind(profile_pda)
        .fetch_all(pool)
        .await
}
