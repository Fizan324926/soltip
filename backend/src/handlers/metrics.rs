use actix_web::{HttpResponse, Responder};

use crate::metrics;

pub async fn get_metrics() -> impl Responder {
    let body = metrics::get_metrics();
    HttpResponse::Ok()
        .content_type("text/plain; version=0.0.4; charset=utf-8")
        .body(body)
}
