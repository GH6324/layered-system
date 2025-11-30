use std::path::Path;

use crate::error::Result;
use crate::sys::{run_elevated_command, CommandOutput};

/// Run bcdboot using the host's default system BCD store (omit /s and /f).
pub fn run_bcdboot(system_dir: &Path) -> Result<CommandOutput> {
    let sys_path = system_dir
        .to_str()
        .map(|s| s.to_string())
        .unwrap_or_else(|| system_dir.to_string_lossy().to_string());
    let sys_arg = format!("{sys_path}\\Windows");
    run_elevated_command("bcdboot", &[&sys_arg, "/d"], None)
}

pub fn bcdedit_enum_all() -> Result<CommandOutput> {
    run_elevated_command("bcdedit", &["/enum", "all", "/v"], None)
}

pub fn bcdedit_boot_sequence(guid: &str) -> Result<CommandOutput> {
    run_elevated_command("bcdedit", &["/bootsequence", guid], None)
}

pub fn bcdedit_delete(guid: &str) -> Result<CommandOutput> {
    run_elevated_command("bcdedit", &["/delete", guid], None)
}

pub fn bcdedit_set_description(guid: &str, desc: &str) -> Result<CommandOutput> {
    run_elevated_command("bcdedit", &["/set", guid, "description", desc], None)
}

/// Extract the identifier (GUID) for an entry whose device path references the given VHD path.
pub fn extract_guid_for_vhd(bcd_output: &str, vhd_path: &str) -> Option<String> {
    let mut current_guid: Option<String> = None;
    let needle = normalize_vhd_path(vhd_path);
    for line in bcd_output.lines() {
        let lower = line.to_ascii_lowercase();
        if lower.starts_with("identifier") {
            if let Some(guid) = line.split_whitespace().nth(1) {
                current_guid = Some(guid.trim().to_string());
            }
        }
        if let Some(dev_path) = parse_vhd_device_path(line) {
            let candidate = normalize_vhd_path(&dev_path);
            if candidate == needle {
                if let Some(guid) = &current_guid {
                    return Some(guid.clone());
                }
            }
        }
    }
    None
}

/// Extract identifier whose device/osdevice references a specific partition letter (e.g., "partition=U:").
pub fn extract_guid_for_partition_letter(bcd_output: &str, letter: char) -> Option<String> {
    let mut current_guid: Option<String> = None;
    let needle = format!("partition={}:", letter.to_ascii_lowercase());
    for line in bcd_output.lines() {
        let lower = line.to_ascii_lowercase();
        if lower.starts_with("identifier") {
            if let Some(guid) = line.split_whitespace().nth(1) {
                current_guid = Some(guid.trim().to_string());
            }
        }
        if lower.contains("device") || lower.contains("osdevice") {
            if lower.contains(&needle) {
                if let Some(guid) = &current_guid {
                    return Some(guid.clone());
                }
            }
        }
    }
    None
}

/// Extract raw VHD path from a device/osdevice line; strips trailing ",locate=..." if present.
fn parse_vhd_device_path(line: &str) -> Option<String> {
    let lower = line.to_ascii_lowercase();
    if !(lower.contains("device") || lower.contains("osdevice")) {
        return None;
    }
    let before_comma = line.split_once(',').map(|(h, _)| h).unwrap_or(line);
    let lower_before = before_comma.to_ascii_lowercase();
    let pos = lower_before.find("vhd=")?;
    let path_part = before_comma[pos + 4..].trim();
    let token = path_part.split_whitespace().next().unwrap_or("");
    if token.is_empty() {
        None
    } else {
        Some(token.to_string())
    }
}

/// Normalize VHD paths for comparison: remove brackets, unify separators, drop \\?\ prefix, lowercase.
fn normalize_vhd_path(path: &str) -> String {
    let mut normalized = path.trim().trim_start_matches("\\\\?\\").replace('/', "\\");
    if normalized.starts_with('[') {
        if let Some(end) = normalized.find(']') {
            let drive = &normalized[1..end];
            let rest = &normalized[end + 1..];
            normalized = format!("{drive}{rest}");
        }
    }
    normalized.replace(['[', ']'], "").to_ascii_lowercase()
}
