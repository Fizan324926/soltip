use actix_cors::Cors;
use actix_web::{middleware, web, App, HttpServer};
use dotenv::dotenv;
use log::info;
use sqlx::postgres::PgPoolOptions;
use std::env;

mod config;
mod db;
mod error;
mod handlers;
mod models;
mod routes;
mod services;

// Auth middleware placeholder - imported when needed
#[path = "middleware/mod.rs"]
mod app_middleware;

pub struct AppState {
    pub db: sqlx::PgPool,
    pub rpc_url: String,
    pub program_id: String,
    pub jwt_secret: String,
    pub platform_authority: String,
    pub webhook_timeout_secs: u64,
    pub webhook_max_retries: u32,
    pub coingecko_api_key: Option<String>,
    pub price_cache_ttl_secs: i64,
    pub auth_token_max_age_secs: i64,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env_logger::init();

    // Required
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    // Solana / on-chain
    let rpc_url = env::var("SOLANA_RPC_URL")
        .unwrap_or_else(|_| "https://api.devnet.solana.com".to_string());
    let program_id = env::var("PROGRAM_ID")
        .unwrap_or_else(|_| "BhynwWdN5g5S5FfCEgDovajaYQDq925S2Xs8vXas58uo".to_string());
    let platform_authority = env::var("PLATFORM_AUTHORITY").unwrap_or_default();

    // Auth
    let jwt_secret = env::var("JWT_SECRET")
        .unwrap_or_else(|_| "dev-secret-change-me".to_string());
    let auth_token_max_age_secs: i64 = env::var("AUTH_TOKEN_MAX_AGE_SECS")
        .unwrap_or_else(|_| "300".to_string())
        .parse()
        .expect("AUTH_TOKEN_MAX_AGE_SECS must be a number");

    // Server
    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .expect("PORT must be a number");
    let cors_origins = env::var("CORS_ORIGINS").unwrap_or_else(|_| "*".to_string());

    // Database
    let db_max_connections: u32 = env::var("DB_MAX_CONNECTIONS")
        .unwrap_or_else(|_| "10".to_string())
        .parse()
        .expect("DB_MAX_CONNECTIONS must be a number");

    // Webhooks
    let webhook_timeout_secs: u64 = env::var("WEBHOOK_TIMEOUT_SECS")
        .unwrap_or_else(|_| "10".to_string())
        .parse()
        .expect("WEBHOOK_TIMEOUT_SECS must be a number");
    let webhook_max_retries: u32 = env::var("WEBHOOK_MAX_RETRIES")
        .unwrap_or_else(|_| "3".to_string())
        .parse()
        .expect("WEBHOOK_MAX_RETRIES must be a number");

    // Price feed
    let coingecko_api_key = env::var("COINGECKO_API_KEY").ok().filter(|s| !s.is_empty());
    let price_cache_ttl_secs: i64 = env::var("PRICE_CACHE_TTL_SECS")
        .unwrap_or_else(|_| "60".to_string())
        .parse()
        .expect("PRICE_CACHE_TTL_SECS must be a number");

    info!("Connecting to database...");
    let pool = PgPoolOptions::new()
        .max_connections(db_max_connections)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    info!("Running migrations...");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    let state = web::Data::new(AppState {
        db: pool,
        rpc_url: rpc_url.clone(),
        program_id: program_id.clone(),
        jwt_secret,
        platform_authority,
        webhook_timeout_secs,
        webhook_max_retries,
        coingecko_api_key,
        price_cache_ttl_secs,
        auth_token_max_age_secs,
    });

    info!("RPC endpoint: {}", rpc_url);
    info!("Program ID: {}", program_id);
    info!("Starting server at {}:{}", host, port);

    let cors_origins_clone = cors_origins.clone();

    HttpServer::new(move || {
        let cors = if cors_origins_clone == "*" {
            Cors::default()
                .allow_any_origin()
                .allow_any_method()
                .allow_any_header()
                .max_age(3600)
        } else {
            let mut cors_builder = Cors::default()
                .allow_any_method()
                .allow_any_header()
                .max_age(3600);
            for origin in cors_origins_clone.split(',') {
                let origin = origin.trim();
                if !origin.is_empty() {
                    cors_builder = cors_builder.allowed_origin(origin);
                }
            }
            cors_builder
        };

        App::new()
            .app_data(state.clone())
            .wrap(cors)
            .wrap(middleware::Logger::default())
            .configure(routes::configure)
    })
    .bind(format!("{}:{}", host, port))?
    .run()
    .await
}
