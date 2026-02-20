use sqlx::PgPool;
use crate::models::{AnalyticsDaily, LeaderboardEntry};

pub async fn get_daily_analytics(
    pool: &PgPool,
    profile_pda: &str,
    days: i32,
) -> Result<Vec<AnalyticsDaily>, sqlx::Error> {
    sqlx::query_as::<_, AnalyticsDaily>(
        r#"SELECT * FROM analytics_daily
           WHERE profile_pda = $1 AND date >= CURRENT_DATE - $2::int
           ORDER BY date ASC"#,
    )
    .bind(profile_pda)
    .bind(days)
    .fetch_all(pool)
    .await
}

/// Rebuild daily analytics from tips table for a profile
pub async fn rebuild_daily_analytics(
    pool: &PgPool,
    profile_pda: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"INSERT INTO analytics_daily (profile_pda, date, tip_count, total_amount, unique_tippers, spl_amount)
           SELECT
               recipient_profile_pda,
               DATE(created_at),
               COUNT(*)::int,
               COALESCE(SUM(CASE WHEN tip_type = 'sol' THEN amount_lamports ELSE 0 END), 0),
               COUNT(DISTINCT tipper_address)::int,
               COALESCE(SUM(CASE WHEN tip_type = 'spl' THEN amount_lamports ELSE 0 END), 0)
           FROM tips
           WHERE recipient_profile_pda = $1
           GROUP BY recipient_profile_pda, DATE(created_at)
           ON CONFLICT (profile_pda, date)
           DO UPDATE SET
               tip_count = EXCLUDED.tip_count,
               total_amount = EXCLUDED.total_amount,
               unique_tippers = EXCLUDED.unique_tippers,
               spl_amount = EXCLUDED.spl_amount"#,
    )
    .bind(profile_pda)
    .execute(pool)
    .await?;
    Ok(())
}

/// Time-window leaderboard: top tippers within a time range
pub async fn get_time_window_leaderboard(
    pool: &PgPool,
    profile_pda: &str,
    window: &str,
    limit: i64,
) -> Result<Vec<LeaderboardEntry>, sqlx::Error> {
    let interval = match window {
        "weekly" => "7 days",
        "monthly" => "30 days",
        "yearly" => "365 days",
        _ => "7 days",
    };

    let query = format!(
        r#"SELECT
               tipper_address,
               SUM(amount_lamports)::bigint as total_amount,
               COUNT(*)::int as tip_count
           FROM tips
           WHERE recipient_profile_pda = $1
             AND created_at >= NOW() - INTERVAL '{}'
             AND is_anonymous = FALSE
           GROUP BY tipper_address
           ORDER BY total_amount DESC
           LIMIT $2"#,
        interval
    );

    sqlx::query_as::<_, LeaderboardEntry>(&query)
        .bind(profile_pda)
        .bind(limit)
        .fetch_all(pool)
        .await
}

/// Get total stats for a time window
pub async fn get_window_stats(
    pool: &PgPool,
    profile_pda: &str,
    window: &str,
) -> Result<(i64, i64, i64), sqlx::Error> {
    let interval = match window {
        "weekly" => "7 days",
        "monthly" => "30 days",
        "yearly" => "365 days",
        _ => "7 days",
    };

    let query = format!(
        r#"SELECT
               COALESCE(COUNT(*), 0)::bigint as tip_count,
               COALESCE(SUM(amount_lamports), 0)::bigint as total_amount,
               COALESCE(COUNT(DISTINCT tipper_address), 0)::bigint as unique_tippers
           FROM tips
           WHERE recipient_profile_pda = $1
             AND created_at >= NOW() - INTERVAL '{}'"#,
        interval
    );

    let row = sqlx::query_as::<_, (i64, i64, i64)>(&query)
        .bind(profile_pda)
        .fetch_one(pool)
        .await?;

    Ok(row)
}
