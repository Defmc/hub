use std::{path::PathBuf, str::FromStr};

use axum::{Router, extract, http::StatusCode, response::IntoResponse, routing};

pub mod get;

async fn get(path: Option<extract::Path<PathBuf>>) -> Result<impl IntoResponse, StatusCode> {
    let path = if let Some(extract::Path(path)) = path {
        path
    } else {
        PathBuf::from_str(".").unwrap()
    };

    println!("[info:get] getting for {path:?}");
    let pwd = std::env::current_dir().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let target = pwd.join(path);
    let path = tokio::fs::canonicalize(target)
        .await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    if !path.starts_with(&pwd) {
        return Err(StatusCode::FORBIDDEN);
    }

    if path.is_dir() {
        Ok(get::dir(path, pwd).await?.into_response())
    } else {
        Ok(get::file(path).await?.into_response())
    }
}

pub fn route() -> Router {
    Router::new()
        .route("/fs/{*path}", routing::get(get))
        .route("/fs/", routing::get(get))
}
