use log::{info, warn};
use sqlx::PgPool;

const COINGECKO_URL: &str = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";
const CACHE_TTL_SECS: i64 = 60; // 1 minute cache

/// Fetch SOL/USD price, with database cache.
pub async fn get_sol_price(pool: &PgPool) -> Result<f64, String> {
    // Check cache first
    let cached = sqlx::query_as::<_, (f64, chrono::DateTime<chrono::Utc>)>(
        "SELECT price_usd, updated_at FROM price_cache WHERE id = 'SOL'",
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("DB error: {}", e))?;

    if let Some((price, updated_at)) = cached {
        let age = chrono::Utc::now().signed_duration_since(updated_at).num_seconds();
        if age < CACHE_TTL_SECS && price > 0.0 {
            return Ok(price);
        }
    }

    // Fetch from CoinGecko
    let price = fetch_from_coingecko().await?;

    // Update cache
    let _ = sqlx::query(
        "UPDATE price_cache SET price_usd = $1, updated_at = NOW() WHERE id = 'SOL'",
    )
    .bind(price)
    .execute(pool)
    .await;

    info!("SOL price updated: ${:.2}", price);
    Ok(price)
}

async fn fetch_from_coingecko() -> Result<f64, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| format!("HTTP client error: {}", e))?;

    let resp = client
        .get(COINGECKO_URL)
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| {
            warn!("CoinGecko request failed: {}", e);
            format!("Price feed unavailable: {}", e)
        })?;

    let json: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("Price parse error: {}", e))?;

    json["solana"]["usd"]
        .as_f64()
        .ok_or_else(|| "Missing SOL price in response".to_string())
}

/// Convert lamports to USD
pub fn lamports_to_usd(lamports: i64, sol_price: f64) -> f64 {
    (lamports as f64 / 1_000_000_000.0) * sol_price
}
