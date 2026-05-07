use std::path::PathBuf;

use axum::{extract, http::StatusCode, response::IntoResponse};

pub async fn delete(
    extract::Path(path): extract::Path<PathBuf>,
) -> Result<impl IntoResponse, StatusCode> {
    let path = super::sanitize(path).await?;

    if path.is_file() {
        tokio::fs::remove_file(path)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    } else {
        tokio::fs::remove_dir_all(path)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    }
    Ok(StatusCode::OK)
}
