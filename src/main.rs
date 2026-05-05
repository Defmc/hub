use std::path::PathBuf;

use axum::{Router, extract, http::StatusCode, routing};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let app = Router::new().route("/fs/{*path}", routing::get(fs_get));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:8080").await?;
    axum::serve(listener, app).await?;
    Ok(())
}

async fn fs_get(
    extract::Path(path): extract::Path<PathBuf>,
) -> (StatusCode, axum::Json<serde_json::Value>) {
    println!("reaching for {path:?}");
    let Ok(path) = tokio::fs::canonicalize(path).await else {
        return (
            StatusCode::NOT_FOUND,
            serde_json::json!({ "message": "not found" }).into(),
        );
    };

    if path.is_dir() {
        let (okay, errs) =
            path.read_dir()
                .unwrap()
                .fold((Vec::new(), Vec::new()), |(mut ok, mut er), d| {
                    match d {
                        Ok(dir) => ok.push(dir.path()),
                        Err(e) => er.push(e.to_string()),
                    }
                    (ok, er)
                });

        return (
            StatusCode::OK,
            serde_json::json!({ "directories": okay, "errors": errs }).into(),
        );
    }

    (
        StatusCode::OK,
        serde_json::json!({ "message": "coming!" }).into(),
    )
}
