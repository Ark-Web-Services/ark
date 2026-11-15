// ═══════════════════════════════════════════════════════════════
// REPO-COMMIT.TS — Shared non-blocking CI commit helper
// ═══════════════════════════════════════════════════════════════

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import nicheConfig, { getSiteDomain } from '../../niche.config';

function git(args: string[], allowFailure = false): boolean {
  const result = spawnSync('git', args, { cwd: process.cwd(), stdio: 'inherit' });
  if (result.status === 0) return true;
  if (allowFailure) return false;
  throw new Error(`git ${args[0]} failed with exit code ${result.status ?? 'unknown'}`);
}

export function commitAndPush(paths: string[], message: string): boolean {
  if (!paths.length) throw new Error('repo-commit requires at least one path.');
  const stageable = paths.filter((path) => {
    if (existsSync(path)) return true;
    const tracked = spawnSync('git', ['ls-files', '--', path], { cwd: process.cwd(), encoding: 'utf8' });
    return tracked.status === 0 && tracked.stdout.trim().length > 0;
  });
  if (!stageable.length) { console.log('📭 No generated paths exist or are tracked.'); return false; }
  git(['add', '-A', '--', ...stageable]);
  const diff = spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: process.cwd() });
  if (diff.status === 0) {
    console.log('📭 No generated changes to commit.');
    return false;
  }
  git(['config', 'user.email', process.env.GIT_BOT_EMAIL || `bot@${getSiteDomain()}`]);
  git(['config', 'user.name', process.env.GIT_BOT_NAME || `${nicheConfig.siteName} Bot`]);
  git(['commit', '-m', message]);
  if (!git(['push', 'origin', 'HEAD:main'], true)) {
    console.warn('⚠️ Generated changes were committed locally, but push failed (non-fatal).');
  }
  return true;
}

export function assertPublicationBranch(expected: string, checkedOut: string, droneBranch: string): void {
  if (!/^[a-z0-9][a-z0-9._/-]{0,99}$/.test(expected) || expected.includes("..")) throw new Error("Publication branch configuration is invalid.");
  if (checkedOut !== expected || droneBranch !== expected) throw new Error(`Publication branch mismatch (expected ${expected}; checkout ${checkedOut}; Drone ${droneBranch}).`);
}

export function assertScopedStage(stagedPaths: string[], allowedPaths: string[]): void {
  const allowed = new Set(allowedPaths);
  const extra = stagedPaths.filter((path) => !allowed.has(path));
  if (extra.length) throw new Error(`Refusing publication commit with staged paths outside the current-run allowlist: ${extra.join(", ")}`);
}

export function assertPublicationPushSucceeded(exitCode: number | null): void {
  if (exitCode !== 0) throw new Error(`Publication commit could not be pushed to its configured branch (exit ${exitCode ?? "unknown"}).`);
}

export function commitAndPushStrict(paths: string[], message: string, branch: string): boolean {
  if (!paths.length) throw new Error("Strict repo-commit requires at least one exact path.");
  const checkedOutResult = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: process.cwd(), encoding: "utf8" });
  const checkedOut = checkedOutResult.status === 0 ? checkedOutResult.stdout.trim() : "";
  assertPublicationBranch(branch, checkedOut, process.env.DRONE_BRANCH ?? "");
  const preStaged = spawnSync("git", ["diff", "--cached", "--name-only"], { cwd: process.cwd(), encoding: "utf8" });
  if (preStaged.status !== 0) throw new Error("Could not inspect the staging area before publication.");
  if (preStaged.stdout.trim()) throw new Error(`Refusing publication with pre-staged user files: ${preStaged.stdout.trim().replace(/\n/g, ", ")}`);
  const stageable = paths.filter((path) => {
    if (existsSync(path)) return true;
    const tracked = spawnSync("git", ["ls-files", "--", path], { cwd: process.cwd(), encoding: 'utf8' });
    return tracked.status === 0 && tracked.stdout.trim().length > 0;
  });
  if (!stageable.length) throw new Error("No current-run publication paths exist.");
  git(["add", "-A", "--", ...stageable]);
  const stagedResult = spawnSync("git", ["diff", "--cached", "--name-only"], { cwd: process.cwd(), encoding: "utf8" });
  if (stagedResult.status !== 0) throw new Error("Could not verify staged publication paths.");
  const stagedPaths = stagedResult.stdout.split(/\r?\n/).filter(Boolean);
  assertScopedStage(stagedPaths, stageable);
  const diff = spawnSync("git", ["diff", "--cached", "--quiet"], { cwd: process.cwd() });
  if (diff.status === 0) throw new Error("No publication changes were staged.");
  git(["config", "user.email", process.env.GIT_BOT_EMAIL || `bot@${getSiteDomain()}`]);
  git(["config", "user.name", process.env.GIT_BOT_NAME || `${nicheConfig.siteName} Bot`]);
  git(["commit", "-m", message]);
  const pushed = spawnSync("git", ["push", "origin", `HEAD:${branch}`], { cwd: process.cwd(), stdio: "inherit" });
  assertPublicationPushSucceeded(pushed.status);
  return true;
}

function main(): void {
  const separator = process.argv.indexOf('--');
  const args = separator >= 0 ? process.argv.slice(separator + 1) : process.argv.slice(2);
  const messageIndex = args.indexOf('--message');
  if (messageIndex < 0 || !args[messageIndex + 1]) {
    throw new Error('Usage: repo-commit.ts --message "commit message" path [path...]');
  }
  const message = args[messageIndex + 1];
  const paths = args.filter((_, index) => index !== messageIndex && index !== messageIndex + 1);
  commitAndPush(paths, message);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); } catch (error) {
    console.error(`❌ ${(error as Error).message}`);
    process.exitCode = 1;
  }
}
