use std::time::Duration;
use tokio::time::interval;
use sqlx::PgPool;
use log::{info, error};

/// Background service that processes recurring subscriptions
pub async fn run_subscription_processor(db: PgPool) {
    info!("Starting subscription processor...");

    // Check every hour
    let mut ticker = interval(Duration::from_secs(3600));

    loop {
        ticker.tick().await;
        if let Err(e) = process_due_subscriptions(&db).await {
            error!("Error processing subscriptions: {}", e);
        }
    }
}

async fn process_due_subscriptions(db: &PgPool) -> Result<(), Box<dyn std::error::Error>> {
    // Find subscriptions that are due for payment
    let due_subs: Vec<DueSubscription> = sqlx::query_as(
        r#"
        SELECT id, subscriber_address, recipient_profile_pda, amount_per_interval,
               last_processed_at, interval_seconds
        FROM subscriptions
        WHERE is_active = true
          AND (last_processed_at IS NULL
               OR last_processed_at + (interval_seconds || ' seconds')::interval < NOW())
        "#
    )
    .fetch_all(db)
    .await?;

    info!("Found {} subscriptions due for processing", due_subs.len());

    for sub in due_subs {
        match process_single_subscription(db, &sub).await {
            Ok(_) => info!("Processed subscription {}", sub.id),
            Err(e) => error!("Failed to process subscription {}: {}", sub.id, e),
        }
    }

    Ok(())
}

async fn process_single_subscription(
    db: &PgPool,
    sub: &DueSubscription
) -> Result<(), Box<dyn std::error::Error>> {
    // In a real implementation, this would:
    // 1. Check if subscriber has sufficient balance
    // 2. Call the on-chain process_subscription instruction
    // 3. Update the database with the new last_processed_at

    // For now, just update the timestamp
    sqlx::query(
        "UPDATE subscriptions SET last_processed_at = NOW() WHERE id = $1"
    )
    .bind(&sub.id)
    .execute(db)
    .await?;

    // Record the payment
    let payment_id = uuid::Uuid::new_v4();
    sqlx::query(
        r#"
        INSERT INTO subscription_payments (id, subscription_id, amount, processed_at, status)
        VALUES ($1, $2, $3, NOW(), 'pending')
        "#
    )
    .bind(payment_id)
    .bind(&sub.id)
    .bind(sub.amount_per_interval)
    .execute(db)
    .await?;

    Ok(())
}

#[derive(sqlx::FromRow)]
struct DueSubscription {
    id: uuid::Uuid,
    subscriber_address: String,
    recipient_profile_pda: String,
    amount_per_interval: i64,
    last_processed_at: Option<chrono::DateTime<chrono::Utc>>,
    interval_seconds: i64,
}
