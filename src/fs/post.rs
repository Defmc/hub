use std::path::PathBuf;

use axum::{
    body::BodyDataStream,
    extract::{self, Request},
    http::StatusCode,
    response::IntoResponse,
};
use futures_util::TryStreamExt;
use tokio::io;
use tokio_util::io::StreamReader;

pub async fn post(
    extract::Path(path): extract::Path<PathBuf>,
    req: Request,
) -> Result<impl IntoResponse, StatusCode> {
    if path.ends_with("/") {
        Ok(create_dir(path).await?.into_response())
    } else {
        let body = req.into_body().into_data_stream();
        Ok(create_file(path, body).await?.into_response())
    }
}

pub async fn create_file(
    path: PathBuf,
    body: BodyDataStream,
) -> Result<impl IntoResponse, StatusCode> {
    let mut file = tokio::fs::File::create_new(path)
        .await
        .map_err(|_| StatusCode::METHOD_NOT_ALLOWED)?;
    let body = body.map_err(|er| tokio::io::Error::new(io::ErrorKind::Other, er));
    let mut stream = StreamReader::new(body);

    tokio::io::copy(&mut stream, &mut file)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(StatusCode::OK)
}

pub async fn create_dir(path: PathBuf) -> Result<impl IntoResponse, StatusCode> {
    tokio::fs::create_dir_all(path)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(StatusCode::OK)
}
