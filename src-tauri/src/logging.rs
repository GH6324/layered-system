use std::fs;
use std::path::Path;

use once_cell::sync::OnceCell;
use tracing_appender::non_blocking::WorkerGuard;
use tracing_appender::rolling;
use tracing_subscriber::{fmt, layer::SubscriberExt, EnvFilter, Registry};

use crate::error::Result;

static LOG_GUARD: OnceCell<WorkerGuard> = OnceCell::new();

/// Initialize tracing subscriber writing to the given log file path.
pub fn init_tracing(log_path: &Path) -> Result<()> {
    if let Some(parent) = log_path.parent() {
        fs::create_dir_all(parent)?;
    }
    let file_name = log_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("app.log");
    let dir = log_path
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or_else(|| std::path::PathBuf::from("."));
    let rolling = rolling::never(dir, file_name);
    let (writer, guard) = tracing_appender::non_blocking(rolling);

    let env_filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    let subscriber = Registry::default()
        .with(env_filter)
        .with(fmt::Layer::default().with_writer(writer).with_ansi(false));

    tracing::subscriber::set_global_default(subscriber)
        .map_err(|e| crate::error::AppError::Message(format!("tracing init failed: {e}")))?;

    let _ = LOG_GUARD.set(guard);
    Ok(())
}
