use std::path::{Path, PathBuf};

use axum::{
    body::Body,
    http::{HeaderMap, StatusCode, header},
    response::IntoResponse,
};
use tokio_util::io::ReaderStream;

pub async fn file(path: impl AsRef<Path>) -> Result<impl IntoResponse, StatusCode> {
    let file = tokio::fs::File::open(&path)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let stream = ReaderStream::new(file);
    let body = Body::from_stream(stream);
    let mime = mime_guess::from_path(path)
        .first_or_octet_stream()
        .to_string();
    let headers = HeaderMap::from_iter([(header::CONTENT_TYPE, mime.parse().unwrap())].into_iter());
    Ok((headers, body))
}

pub async fn dir(path: impl AsRef<Path>, pwd: PathBuf) -> Result<impl IntoResponse, StatusCode> {
    let (mut okay, mut errs) = (Vec::new(), Vec::new());
    let mut entries = tokio::fs::read_dir(path.as_ref())
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    loop {
        let d = entries.next_entry().await;
        match d {
            Ok(Some(dir)) => {
                let path = dir.path();
                let mut filename = path.file_name().unwrap().to_string_lossy().to_string();
                if path.is_dir() {
                    filename.push('/')
                }
                okay.push(filename)
            }
            Ok(None) => break,
            Err(e) => errs.push(e.to_string()),
        }
    }

    let current = path.as_ref().strip_prefix(pwd).unwrap();
    Ok(axum::Json(
        serde_json::json!({"pwd": current, "entries": okay, "errors": errs }),
    ))
}
