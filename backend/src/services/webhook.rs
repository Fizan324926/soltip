use log::{info, warn};
use sqlx::PgPool;

/// Deliver a webhook to a creator's registered URL.
/// Fire-and-forget: failures are logged but don't block the caller.
pub async fn deliver_webhook(
    pool: &PgPool,
    profile_pda: &str,
    webhook_url: &str,
    event_type: &str,
    payload: serde_json::Value,
) {
    if webhook_url.is_empty() {
        return;
    }

    let pool = pool.clone();
    let profile_pda = profile_pda.to_string();
    let webhook_url = webhook_url.to_string();
    let event_type = event_type.to_string();

    // Spawn as background task so we don't block the request
    tokio::spawn(async move {
        let client = match reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()
        {
            Ok(c) => c,
            Err(e) => {
                warn!("Webhook client error: {}", e);
                return;
            }
        };

        let body = serde_json::json!({
            "event": event_type,
            "data": payload,
            "timestamp": chrono::Utc::now().timestamp(),
        });

        let result = client
            .post(&webhook_url)
            .header("Content-Type", "application/json")
            .header("X-SolTip-Event", &event_type)
            .json(&body)
            .send()
            .await;

        let (status_code, success) = match result {
            Ok(resp) => {
                let code = resp.status().as_u16() as i32;
                let ok = resp.status().is_success();
                if ok {
                    info!("Webhook delivered: {} -> {}", event_type, webhook_url);
                } else {
                    warn!("Webhook failed: {} -> {} ({})", event_type, webhook_url, code);
                }
                (Some(code), ok)
            }
            Err(e) => {
                warn!("Webhook error: {} -> {} ({})", event_type, webhook_url, e);
                (None, false)
            }
        };

        // Log delivery
        let _ = sqlx::query(
            r#"INSERT INTO webhook_deliveries (profile_pda, webhook_url, event_type, payload, status_code, success)
               VALUES ($1, $2, $3, $4, $5, $6)"#,
        )
        .bind(&profile_pda)
        .bind(&webhook_url)
        .bind(&event_type)
        .bind(&body)
        .bind(status_code)
        .bind(success)
        .execute(&pool)
        .await;
    });
}
