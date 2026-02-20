use sqlx::PgPool;
use crate::models::Referral;

pub async fn create_referral(
    pool: &PgPool,
    referral_pda: &str,
    referrer_address: &str,
    referee_profile_pda: &str,
    fee_share_bps: i32,
) -> Result<Referral, sqlx::Error> {
    sqlx::query_as::<_, Referral>(
        r#"INSERT INTO referrals (referral_pda, referrer_address, referee_profile_pda, fee_share_bps)
           VALUES ($1, $2, $3, $4)
           RETURNING *"#,
    )
    .bind(referral_pda)
    .bind(referrer_address)
    .bind(referee_profile_pda)
    .bind(fee_share_bps)
    .fetch_one(pool)
    .await
}

pub async fn find_referrals_by_referrer(
    pool: &PgPool,
    referrer_address: &str,
) -> Result<Vec<Referral>, sqlx::Error> {
    sqlx::query_as::<_, Referral>(
        "SELECT * FROM referrals WHERE referrer_address = $1 ORDER BY created_at DESC",
    )
    .bind(referrer_address)
    .fetch_all(pool)
    .await
}

pub async fn find_referrals_for_profile(
    pool: &PgPool,
    referee_profile_pda: &str,
) -> Result<Vec<Referral>, sqlx::Error> {
    sqlx::query_as::<_, Referral>(
        "SELECT * FROM referrals WHERE referee_profile_pda = $1 ORDER BY created_at DESC",
    )
    .bind(referee_profile_pda)
    .fetch_all(pool)
    .await
}

pub async fn find_referral_by_pda(
    pool: &PgPool,
    referral_pda: &str,
) -> Result<Option<Referral>, sqlx::Error> {
    sqlx::query_as::<_, Referral>("SELECT * FROM referrals WHERE referral_pda = $1")
        .bind(referral_pda)
        .fetch_optional(pool)
        .await
}

pub async fn update_referral_earnings(
    pool: &PgPool,
    referral_pda: &str,
    earned_amount: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE referrals SET total_earned = total_earned + $2, referral_count = referral_count + 1 WHERE referral_pda = $1",
    )
    .bind(referral_pda)
    .bind(earned_amount)
    .execute(pool)
    .await?;
    Ok(())
}
