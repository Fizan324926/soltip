use log::{info, warn};
use sqlx::PgPool;
use std::net::IpAddr;

/// BE-06: Validate webhook URL to prevent SSRF attacks
/// Only allows https:// scheme and rejects private/reserved IP ranges
pub fn validate_webhook_url(url: &str) -> Result<(), String> {
    let parsed = url::Url::parse(url).map_err(|e| format!("Invalid URL: {}", e))?;

    // Only allow HTTPS
    if parsed.scheme() != "https" {
        return Err("Only https:// URLs are allowed for webhooks".to_string());
    }

    // Get the host
    let host = parsed.host_str().ok_or("URL has no host")?;

    // Check if host is an IP address and reject private ranges
    if let Ok(ip) = host.parse::<IpAddr>() {
        if is_private_ip(&ip) {
            return Err("Private/reserved IP addresses are not allowed".to_string());
        }
    }

    // Also reject common private hostnames
    let host_lower = host.to_lowercase();
    if host_lower == "localhost" || host_lower.ends_with(".local") || host_lower.ends_with(".internal") {
        return Err("Private hostnames are not allowed".to_string());
    }

    Ok(())
}

fn is_private_ip(ip: &IpAddr) -> bool {
    match ip {
        IpAddr::V4(ipv4) => {
            let octets = ipv4.octets();
            // 10.0.0.0/8
            octets[0] == 10
            // 172.16.0.0/12
            || (octets[0] == 172 && (16..=31).contains(&octets[1]))
            // 192.168.0.0/16
            || (octets[0] == 192 && octets[1] == 168)
            // 127.0.0.0/8 (loopback)
            || octets[0] == 127
            // 169.254.0.0/16 (link-local)
            || (octets[0] == 169 && octets[1] == 254)
            // 0.0.0.0
            || (octets[0] == 0)
        }
        IpAddr::V6(ipv6) => {
            ipv6.is_loopback() || ipv6.is_unspecified()
        }
    }
}

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

    // Validate webhook URL before delivery
    if let Err(e) = validate_webhook_url(webhook_url) {
        warn!("Webhook URL validation failed for {}: {}", webhook_url, e);
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
            .redirect(reqwest::redirect::Policy::none())
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
