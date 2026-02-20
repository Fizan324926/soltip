use actix_web::HttpResponse;

pub async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "service": "soltip-backend",
        "version": env!("CARGO_PKG_VERSION"),
    }))
}
