// ═══════════════════════════════════════════════════════════════
// GIT-DATES.TS — real last-modified dates, derived from git history
//
// Why this exists: `lastModified` in frontmatter is a manual field, and
// nobody remembers to bump it. In September 2026 all 57 posts advertised a
// sitemap lastmod months older than their real last edit, so Google had no
// signal that anything had changed and never re-crawled the renamed URLs —
// which left the pre-rename URLs holding the canonical and produced a
// "Duplicate, Google chose different canonical than user" report.
//
// Git already knows when every file actually changed. Read it instead of
// asking humans to maintain a date by hand.
//
// This is NOT the same as stamping build time on every deploy. That was a
// separate bug fixed here earlier: it moved lastmod even when nothing
// changed, which teaches Google to ignore the field. A git commit date only
// moves when the file genuinely changed.
// ═══════════════════════════════════════════════════════════════

import { execFileSync } from "node:child_process";

/** repo-relative path → YYYY-MM-DD of the commit that last touched it */
type DateMap = Map<string, string>;

let cache: DateMap | null = null;
let warned = false;

function git(args: string[]): string {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    maxBuffer: 32 * 1024 * 1024,
  }).trim();
}

/**
 * A shallow clone only has the tip commit, so `git log` would report that one
 * date for every file — indistinguishable from a build-time stamp, and the
 * exact failure mode we are trying to avoid. Detect it and refuse to use git.
 */
function usable(): boolean {
  try {
    if (git(["rev-parse", "--is-shallow-repository"]) === "true") {
      if (!warned) {
        console.warn(
          "[git-dates] Repository is a SHALLOW clone — falling back to frontmatter dates.\n" +
            "            Set `clone: { depth: 0 }` in .drone.yml so sitemap lastmod stays honest.",
        );
        warned = true;
      }
      return false;
    }
    return true;
  } catch {
    if (!warned) {
      console.warn("[git-dates] git unavailable — falling back to frontmatter dates.");
      warned = true;
    }
    return false;
  }
}

/**
 * One `git log` pass over the whole repo history, newest first, recording the
 * first (therefore most recent) date seen for each path. Spawning one process
 * per file would mean ~130 spawns per build.
 */
function build(): DateMap {
  const map: DateMap = new Map();
  if (!usable()) return map;
  let log: string;
  try {
    log = git([
      "log",
      "--pretty=format:@%ad",
      "--date=short",
      "--name-only",
      // A rename is a change to the new path, which is what a renamed post is.
      "--diff-filter=AMR",
    ]);
  } catch {
    if (!warned) { console.warn("[git-dates] git log failed — falling back to frontmatter dates."); warned = true; }
    return map;
  }

  let current = "";
  for (const line of log.split("\n")) {
    if (line.startsWith("@")) { current = line.slice(1); continue; }
    const path = line.trim();
    // Newest commit wins: only record a path the first time we see it.
    if (path && current && !map.has(path)) map.set(path, current);
  }
  return map;
}

function dates(): DateMap {
  if (!cache) cache = build();
  return cache;
}

/**
 * The honest last-modified date for a content file.
 *
 * Returns the LATER of the git commit date and any explicit frontmatter
 * `lastModified`, so an author can still pin a date forward (a meaningful
 * content revision recorded ahead of the commit) without git silently
 * overriding it — while a forgotten field can no longer make the sitemap lie.
 */
export function lastModifiedFor(repoPath: string, declared?: Date): Date {
  const git = dates().get(repoPath);
  if (!git) return declared ?? new Date(0);
  const fromGit = new Date(`${git}T12:00:00Z`);
  if (!declared) return fromGit;
  return fromGit > declared ? fromGit : declared;
}

/** True when git history was actually usable, for callers that want to warn. */
export function gitDatesAvailable(): boolean {
  return dates().size > 0;
}
