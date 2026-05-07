use std::path::PathBuf;

use axum::{
    extract::{self, Request},
    http::StatusCode,
    response::IntoResponse,
};
use futures_util::TryStreamExt;
use tokio::io;
use tokio_util::io::StreamReader;

pub async fn put(
    extract::Path(path): extract::Path<PathBuf>,
    req: Request,
) -> Result<impl IntoResponse, StatusCode> {
    let path = super::sanitize(path).await?;
    let body = req
        .into_body()
        .into_data_stream()
        .map_err(|e| io::Error::new(io::ErrorKind::Other, e.to_string()));

    let mut stream = StreamReader::new(body);
    let mut file = tokio::fs::OpenOptions::new()
        .read(false)
        .write(true)
        .create(false)
        .open(path)
        .await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    tokio::io::copy(&mut stream, &mut file)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::OK)
}
