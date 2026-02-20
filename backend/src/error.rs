use actix_web::{HttpResponse, ResponseError};
use std::fmt;

#[derive(Debug)]
pub enum ApiError {
    NotFound(String),
    BadRequest(String),
    Unauthorized(String),
    Internal(String),
    Database(String),
    Solana(String),
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ApiError::NotFound(msg) => write!(f, "Not found: {}", msg),
            ApiError::BadRequest(msg) => write!(f, "Bad request: {}", msg),
            ApiError::Unauthorized(msg) => write!(f, "Unauthorized: {}", msg),
            ApiError::Internal(msg) => write!(f, "Internal error: {}", msg),
            ApiError::Database(msg) => write!(f, "Database error: {}", msg),
            ApiError::Solana(msg) => write!(f, "Solana error: {}", msg),
        }
    }
}

impl ResponseError for ApiError {
    fn error_response(&self) -> HttpResponse {
        match self {
            ApiError::NotFound(msg) => HttpResponse::NotFound().json(serde_json::json!({
                "error": "not_found", "message": msg
            })),
            ApiError::BadRequest(msg) => HttpResponse::BadRequest().json(serde_json::json!({
                "error": "bad_request", "message": msg
            })),
            ApiError::Unauthorized(msg) => HttpResponse::Unauthorized().json(serde_json::json!({
                "error": "unauthorized", "message": msg
            })),
            ApiError::Internal(msg) => {
                log::error!("Internal error: {}", msg);
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "internal_error", "message": "An internal error occurred"
                }))
            }
            ApiError::Database(msg) => {
                log::error!("Database error: {}", msg);
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "database_error", "message": "A database error occurred"
                }))
            }
            ApiError::Solana(msg) => {
                log::error!("Solana error: {}", msg);
                HttpResponse::BadGateway().json(serde_json::json!({
                    "error": "solana_error", "message": "A Solana network error occurred"
                }))
            }
        }
    }
}

impl From<sqlx::Error> for ApiError {
    fn from(e: sqlx::Error) -> Self {
        ApiError::Database(e.to_string())
    }
}
