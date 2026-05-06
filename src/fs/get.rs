use std::path::{Path, PathBuf};

use axum::{
    body::Body,
    http::{HeaderMap, StatusCode, header},
    response::IntoResponse,
};
use tokio_util::io::ReaderStream;

pub async fn file(path: impl AsRef<Path>) -> impl IntoResponse {
    let file = tokio::fs::File::open(&path).await.unwrap();
    let stream = ReaderStream::new(file);
    let body = Body::from_stream(stream);
    let mime = mime_guess::from_path(path)
        .first_or_octet_stream()
        .to_string();
    let headers = HeaderMap::from_iter([(header::CONTENT_TYPE, mime.parse().unwrap())].into_iter());
    (headers, body)
}

pub async fn dir(path: impl AsRef<Path>, pwd: PathBuf) -> impl IntoResponse {
    let (okay, errs) =
        path.as_ref()
            .read_dir()
            .unwrap()
            .fold((Vec::new(), Vec::new()), |(mut ok, mut er), d| {
                match d {
                    Ok(dir) => {
                        let path = dir.path();
                        let mut filename = path.file_name().unwrap().to_string_lossy().to_string();
                        if path.is_dir() {
                            filename.push('/')
                        }
                        ok.push(filename)
                    }
                    Err(e) => er.push(e.to_string()),
                }
                (ok, er)
            });

    let current = path.as_ref().strip_prefix(pwd).unwrap();
    return (
        StatusCode::OK,
        axum::Json(serde_json::json!({"pwd": current, "entries": okay, "errors": errs })),
    )
        .into_response();
}
