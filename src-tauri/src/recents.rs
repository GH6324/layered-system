use std::{fs, path::PathBuf};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

use crate::error::{AppError, Result};

const MAX_RECENT: usize = 10;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RecentStatus {
    Ok,
    MissingRoot,
    MissingStateDb,
    InitFailed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentWorkspace {
    pub path: String,
    pub last_opened_at: DateTime<Utc>,
    pub pinned: bool,
    pub last_status: RecentStatus,
    pub node_count: Option<u32>,
    pub locale: Option<String>,
}

pub fn list(app: &AppHandle) -> Result<Vec<RecentWorkspace>> {
    let mut items = load(app)?;
    let mut changed = false;

    for item in items.iter_mut() {
        let status = infer_status(item);
        if status != item.last_status {
            item.last_status = status;
            changed = true;
        }
    }

    sort_items(&mut items);
    if changed {
        save(app, &items)?;
    }
    Ok(items)
}

pub fn touch(
    app: &AppHandle,
    path: PathBuf,
    status: RecentStatus,
    locale: Option<String>,
    node_count: Option<u32>,
) -> Result<()> {
    let normalized = normalize_path(&path);
    let mut items = load(app)?;
    let now = Utc::now();

    if let Some(existing) = items
        .iter_mut()
        .find(|i| normalize_path(&PathBuf::from(&i.path)) == normalized)
    {
        existing.path = path.to_string_lossy().to_string();
        existing.last_opened_at = now;
        existing.last_status = status.clone();
        if let Some(locale) = locale {
            existing.locale = Some(locale);
        }
        if let Some(count) = node_count {
            existing.node_count = Some(count);
        }
    } else {
        items.push(RecentWorkspace {
            path: path.to_string_lossy().to_string(),
            last_opened_at: now,
            pinned: false,
            last_status: status,
            node_count,
            locale,
        });
    }

    prune(&mut items);
    sort_items(&mut items);
    save(app, &items)
}

pub fn remove(app: &AppHandle, path: &str) -> Result<()> {
    let target = normalize_path(&PathBuf::from(path));
    let mut items: Vec<_> = load(app)?
        .into_iter()
        .filter(|i| normalize_path(&PathBuf::from(&i.path)) != target)
        .collect();
    sort_items(&mut items);
    save(app, &items)
}

pub fn clear(app: &AppHandle) -> Result<()> {
    let path = recents_path(app)?;
    if path.exists() {
        fs::remove_file(path)?;
    }
    Ok(())
}

fn load(app: &AppHandle) -> Result<Vec<RecentWorkspace>> {
    let path = recents_path(app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = fs::read_to_string(&path)?;
    let mut items: Vec<RecentWorkspace> = serde_json::from_str(&content).unwrap_or_default();
    // guard against corrupted timestamps by falling back to now
    for item in items.iter_mut() {
        if item.last_opened_at.timestamp() == 0 && item.last_opened_at.timestamp_subsec_nanos() == 0 {
            item.last_opened_at = Utc::now();
        }
    }
    Ok(items)
}

fn save(app: &AppHandle, items: &[RecentWorkspace]) -> Result<()> {
    let path = recents_path(app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let content = serde_json::to_string_pretty(items)?;
    fs::write(path, content)?;
    Ok(())
}

fn recents_path(app: &AppHandle) -> Result<PathBuf> {
    let mut dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| AppError::Message(format!("failed to get app data dir: {e}")))?;
    dir.push("recents.json");
    Ok(dir)
}

fn normalize_path(path: &PathBuf) -> String {
    path.to_string_lossy()
        .trim()
        .trim_start_matches("\\\\?\\")
        .replace('/', "\\")
        .to_ascii_lowercase()
}

fn infer_status(item: &RecentWorkspace) -> RecentStatus {
    let root = PathBuf::from(&item.path);
    if !root.exists() {
        return RecentStatus::MissingRoot;
    }
    let state_db = root.join("meta").join("state.db");
    if !state_db.exists() {
        return RecentStatus::MissingStateDb;
    }
    item.last_status.clone()
}

fn prune(items: &mut Vec<RecentWorkspace>) {
    if items.len() <= MAX_RECENT {
        return;
    }
    items.sort_by(|a, b| {
        match (a.pinned, b.pinned) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => b.last_opened_at.cmp(&a.last_opened_at),
        }
    });
    while items.len() > MAX_RECENT {
        if let Some(idx) = items
            .iter()
            .enumerate()
            .rfind(|(_, i)| !i.pinned)
            .map(|(idx, _)| idx)
        {
            items.remove(idx);
        } else {
            break;
        }
    }
}

fn sort_items(items: &mut Vec<RecentWorkspace>) {
    items.sort_by(|a, b| {
        match (a.pinned, b.pinned) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => b.last_opened_at.cmp(&a.last_opened_at),
        }
    });
}
