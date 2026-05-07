use std::path::PathBuf;

use axum::{Router, http::StatusCode, routing};

pub mod delete;
pub mod get;
pub mod post;
pub mod put;

pub fn route() -> Router {
    Router::new()
        .route("/fs/{*path}", routing::get(get::get))
        .route("/fs/", routing::get(get::get))
        .route("/fs/{*path}", routing::post(post::post))
        .route("/fs/", routing::post(post::post))
        .route("/fs/{*path}", routing::put(put::put))
        .route("/fs/{*path}", routing::delete(delete::delete))
}

pub async fn sanitize(path: PathBuf) -> Result<PathBuf, StatusCode> {
    println!("[info:get] getting for {path:?}");
    let pwd = std::env::current_dir().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let target = pwd.join(path);
    let path = tokio::fs::canonicalize(target)
        .await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    if !path.starts_with(&pwd) {
        return Err(StatusCode::FORBIDDEN);
    }
    Ok(path)
}
