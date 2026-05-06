use std::{path::PathBuf, str::FromStr};

use axum::{Router, extract, http::StatusCode, response::IntoResponse, routing};

pub mod get;

async fn get(path: Option<extract::Path<PathBuf>>) -> impl IntoResponse {
    let path = if let Some(extract::Path(path)) = path {
        path
    } else {
        PathBuf::from_str(".").unwrap()
    };

    println!("[info:get] getting for {path:?}");
    let pwd = std::env::current_dir().unwrap();
    let target = pwd.join(path);
    let Ok(path) = tokio::fs::canonicalize(target).await else {
        return StatusCode::NOT_FOUND.into_response();
    };

    if !path.starts_with(&pwd) {
        return StatusCode::RANGE_NOT_SATISFIABLE.into_response();
    }

    if path.is_dir() {
        get::dir(path, pwd).await.into_response()
    } else {
        get::file(path).await.into_response()
    }
}

pub fn route() -> Router {
    Router::new()
        .route("/fs/{*path}", routing::get(get))
        .route("/fs/", routing::get(get))
}
