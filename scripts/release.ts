#!/usr/bin/env bun

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import * as path from "node:path";

type BumpType = "patch" | "minor" | "major";

function bumpVersion(current: string, bump: BumpType): string {
  const match = current.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid version string: ${current}`);
  }
  let [major, minor, patch] = match.slice(1).map((n) => parseInt(n, 10));
  if (bump === "patch") {
    patch += 1;
  } else if (bump === "minor") {
    minor += 1;
    patch = 0;
  } else {
    major += 1;
    minor = 0;
    patch = 0;
  }
  return `${major}.${minor}.${patch}`;
}

function ensureCleanWorkingTree() {
  const status = execSync("git status --porcelain", { encoding: "utf8" });
  if (status.trim().length > 0) {
    console.error(
      "Working tree is not clean. Please commit or stash changes before running release.",
    );
    process.exit(1);
  }
}

function updatePackageJson(root: string, newVersion: string) {
  const pkgPath = path.join(root, "package.json");
  const raw = readFileSync(pkgPath, "utf8");
  const json = JSON.parse(raw);
  json.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(json, null, 2) + "\n");
}

function updateTauriConfig(root: string, newVersion: string) {
  const confPath = path.join(root, "src-tauri", "tauri.conf.json");
  const raw = readFileSync(confPath, "utf8");
  const json = JSON.parse(raw);
  json.version = newVersion;
  writeFileSync(confPath, JSON.stringify(json, null, 2) + "\n");
}

function updateCargoToml(root: string, newVersion: string) {
  const cargoTomlPath = path.join(root, "src-tauri", "Cargo.toml");
  let toml = readFileSync(cargoTomlPath, "utf8");
  const pkgIndex = toml.indexOf("[package]");
  if (pkgIndex === -1) {
    throw new Error("Could not find [package] section in Cargo.toml");
  }
  const head = toml.slice(0, pkgIndex);
  let tail = toml.slice(pkgIndex);
  const versionRegex = /^version\s*=\s*".*?"\s*$/m;
  if (!versionRegex.test(tail)) {
    throw new Error(
      "Could not find version field in [package] section of Cargo.toml",
    );
  }
  tail = tail.replace(versionRegex, `version = "${newVersion}"`);
  toml = head + tail;
  writeFileSync(cargoTomlPath, toml);
}

function updateCargoLock(root: string, newVersion: string) {
  const lockPath = path.join(root, "src-tauri", "Cargo.lock");
  let lock = readFileSync(lockPath, "utf8");
  const re =
    /(\[\[package\]\]\s*\nname = "layered-system"\s*\nversion = ")([^"]+)(")/m;
  if (!re.test(lock)) {
    console.warn(
      'Could not find layered-system package entry in Cargo.lock, skipping update.',
    );
    return;
  }
  lock = lock.replace(re, `$1${newVersion}$3`);
  writeFileSync(lockPath, lock);
}

function runGit(args: string) {
  execSync(`git ${args}`, { stdio: "inherit" });
}

function hasStagedChanges(): boolean {
  try {
    execSync("git diff --cached --quiet", { stdio: "inherit" });
    return false;
  } catch {
    return true;
  }
}

async function main() {
  const bumpArg = (process.argv[2] || "patch") as BumpType;
  if (!["patch", "minor", "major"].includes(bumpArg)) {
    console.error(
      `Invalid bump type "${bumpArg}". Expected one of: patch, minor, major.`,
    );
    process.exit(1);
  }

  ensureCleanWorkingTree();

  const root = process.cwd();
  const pkgPath = path.join(root, "package.json");
  const pkgJson = JSON.parse(readFileSync(pkgPath, "utf8"));
  const currentVersion = pkgJson.version as string;
  if (typeof currentVersion !== "string") {
    throw new Error("package.json.version is missing or not a string");
  }

  const newVersion = bumpVersion(currentVersion, bumpArg);
  if (newVersion === currentVersion) {
    console.log(`Version is already ${currentVersion}, nothing to do.`);
    return;
  }

  console.log(`Bumping version: ${currentVersion} -> ${newVersion}`);

  updatePackageJson(root, newVersion);
  updateTauriConfig(root, newVersion);
  updateCargoToml(root, newVersion);
  updateCargoLock(root, newVersion);

  runGit(
    "add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml src-tauri/Cargo.lock",
  );

  if (!hasStagedChanges()) {
    console.log("No changes staged, skipping commit and tag.");
    return;
  }

  const commitMessage = `chore: release v${newVersion}`;
  runGit(`commit -m "${commitMessage}"`);
  runGit(`tag v${newVersion}`);

  console.log(
    `Created commit and tag v${newVersion}. Remember to run 'git push' and 'git push --tags'.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

