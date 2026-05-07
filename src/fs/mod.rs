use std::{path::PathBuf, str::FromStr};

use axum::{Router, extract, http::StatusCode, response::IntoResponse, routing};

pub mod get;
pub mod post;

pub fn route() -> Router {
    Router::new()
        .route("/fs/{*path}", routing::get(get))
        .route("/fs/", routing::get(get))
}
