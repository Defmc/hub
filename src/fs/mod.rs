use axum::{Router, routing};

pub mod get;
pub mod post;

pub fn route() -> Router {
    Router::new()
        .route("/fs/{*path}", routing::get(get::get))
        .route("/fs/", routing::get(get::get))
        .route("/fs/{*path}", routing::post(post::post))
        .route("/fs/", routing::post(post::post))
}
