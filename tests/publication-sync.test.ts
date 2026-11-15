import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  assertConfiguredGitHubUrl,
  assertPublicationIdentity,
  EXPECTED_GITHUB_PUBLICATION_URL,
  EXPECTED_PUBLICATION_BRANCH,
  GITHUB_ED25519_KNOWN_HOST,
  PartialPublicationPushError,
  pushPublicationCommit,
  runPublicationPreflight,
  type GitResult,
  type GitRunner,
} from "../scripts/lib/publication-sync";

function git(cwd: string, args: string[], env: NodeJS.ProcessEnv = process.env): string {
  const result = spawnSync("git", args, { cwd, env, encoding: "utf8" });
  assert.equal(result.status, 0, "git " + args.join(" ") + ": " + (result.stderr ?? ""));
  return (result.stdout ?? "").trim();
}

function runner(cwd: string, args: string[], env?: NodeJS.ProcessEnv): GitResult {
  const result = spawnSync("git", args, { cwd, env, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function newFixture() {
  const root = mkdtempSync(join(tmpdir(), "publication-sync-"));
  const branch = EXPECTED_PUBLICATION_BRANCH;
  const repo = join(root, "work");
  const origin = join(root, "origin.git");
  const github = join(root, "github.git");
  mkdirSync(repo);
  git(root, ["init", "--bare", "--initial-branch=" + branch, origin]);
  git(root, ["init", "--bare", "--initial-branch=" + branch, github]);
  git(repo, ["init", "--initial-branch=" + branch]);
  git(repo, ["config", "user.name", "Fixture"]);
  git(repo, ["config", "user.email", "fixture@example.test"]);
  writeFileSync(join(repo, "base.txt"), "base\n");
  git(repo, ["add", "base.txt"]);
  git(repo, ["commit", "-m", "base"]);
  const baseSha = git(repo, ["rev-parse", "HEAD"]);
  git(repo, ["remote", "add", "origin", origin]);
  git(repo, ["remote", "add", "github", EXPECTED_GITHUB_PUBLICATION_URL]);
  git(repo, ["push", "origin", "HEAD:refs/heads/" + branch]);
  git(repo, ["push", github, "HEAD:refs/heads/" + branch]);

  const keyFile = join(root, "github-key");
  const knownHostsFile = join(root, "known_hosts");
  writeFileSync(keyFile, "fixture-only-not-a-real-key\n", { mode: 0o600 });
  writeFileSync(knownHostsFile, GITHUB_ED25519_KNOWN_HOST + "\n", { mode: 0o600 });
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PROMOTION_BRANCH: branch,
    DRONE_BRANCH: branch,
    DRONE_COMMIT_SHA: baseSha,
    GITHUB_PUBLICATION_URL: EXPECTED_GITHUB_PUBLICATION_URL,
    GITHUB_PUBLICATION_SSH_KEY: "fixture-placeholder",
    GITHUB_PUBLICATION_SSH_KEY_FILE: keyFile,
    GITHUB_KNOWN_HOSTS_FILE: knownHostsFile,
  };
  const fixtureRunner: GitRunner = (cwd, args, childEnv) => {
    const mapped = [...args];
    if (mapped[0] === "ls-remote" && mapped[3] === "github") mapped[3] = github;
    if (mapped[0] === "push" && mapped[1] === "github") mapped[1] = github;
    return runner(cwd, mapped, childEnv);
  };
  return { root, repo, origin, github, branch, baseSha, env, runner: fixtureRunner };
}

function commitCandidate(repo: string): string {
  writeFileSync(join(repo, "candidate.txt"), "reviewed publication\n");
  git(repo, ["add", "candidate.txt"]);
  git(repo, ["commit", "-m", "publish candidate"]);
  return git(repo, ["rev-parse", "HEAD"]);
}

function advanceRemote(remote: string, branch: string, root: string): string {
  const clone = join(root, "remote-change-" + Math.random().toString(16).slice(2));
  git(root, ["clone", "--branch", branch, remote, clone]);
  git(clone, ["config", "user.name", "Concurrent writer"]);
  git(clone, ["config", "user.email", "concurrent@example.test"]);
  writeFileSync(join(clone, "concurrent.txt"), "concurrent\n");
  git(clone, ["add", "concurrent.txt"]);
  git(clone, ["commit", "-m", "concurrent change"]);
  git(clone, ["push", "origin", "HEAD:refs/heads/" + branch]);
  return git(clone, ["rev-parse", "HEAD"]);
}

test("GitHub publication config and event branch identity are fixed", () => {
  assert.doesNotThrow(() => assertConfiguredGitHubUrl(EXPECTED_GITHUB_PUBLICATION_URL));
  assert.throws(() => assertConfiguredGitHubUrl("git@github.com:other/repo.git"), /fixed GitHub repository/);
  assert.doesNotThrow(() => assertPublicationIdentity(EXPECTED_PUBLICATION_BRANCH, EXPECTED_PUBLICATION_BRANCH, EXPECTED_PUBLICATION_BRANCH, "a".repeat(40), "a".repeat(40)));
  assert.throws(() => assertPublicationIdentity("other", "other", "other", "a".repeat(40), "a".repeat(40)), /branch mismatch/);
  assert.throws(() => assertPublicationIdentity(EXPECTED_PUBLICATION_BRANCH, EXPECTED_PUBLICATION_BRANCH, "other", "a".repeat(40), "a".repeat(40)), /branch mismatch/);
  assert.throws(() => assertPublicationIdentity(EXPECTED_PUBLICATION_BRANCH, EXPECTED_PUBLICATION_BRANCH, EXPECTED_PUBLICATION_BRANCH, "b".repeat(40), "a".repeat(40)), /HEAD must exactly match/);
});

test("preflight permits only equal origin, GitHub and Drone base refs", () => {
  const f = newFixture();
  try {
    assert.equal(runPublicationPreflight(f.repo, f.env, f.runner), f.baseSha);
    const changed = advanceRemote(f.github, f.branch, f.root);
    assert.throws(() => runPublicationPreflight(f.repo, f.env, f.runner), /must both equal DRONE_COMMIT_SHA/);
    assert.notEqual(changed, f.baseSha);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test("successful publication pushes only the explicit branch to both fast-forward remotes", () => {
  const f = newFixture();
  try {
    runPublicationPreflight(f.repo, f.env, f.runner);
    const headSha = commitCandidate(f.repo);
    const calls: string[][] = [];
    const recordingRunner: GitRunner = (cwd, args, env) => {
      calls.push(args);
      return f.runner(cwd, args, env);
    };
    pushPublicationCommit(f.repo, f.branch, f.baseSha, headSha, f.env, recordingRunner);
    assert.equal(git(f.repo, ["ls-remote", "origin", "refs/heads/" + f.branch]).split(/\s+/)[0], headSha);
    assert.equal(git(f.repo, ["ls-remote", f.github, "refs/heads/" + f.branch]).split(/\s+/)[0], headSha);
    const pushCalls = calls.filter((args) => args[0] === "push");
    assert.deepEqual(pushCalls, [
      ["push", "github", "HEAD:refs/heads/" + f.branch],
      ["push", "origin", "HEAD:refs/heads/" + f.branch],
    ]);
    assert.ok(pushCalls.every((args) => !args.some((arg) => arg.includes("force"))));
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test("remote advance between preflight and persist is rejected before either push", () => {
  const f = newFixture();
  try {
    runPublicationPreflight(f.repo, f.env, f.runner);
    const headSha = commitCandidate(f.repo);
    const changed = advanceRemote(f.github, f.branch, f.root);
    assert.throws(() => pushPublicationCommit(f.repo, f.branch, f.baseSha, headSha, f.env, f.runner), /must both equal DRONE_COMMIT_SHA/);
    assert.equal(git(f.repo, ["ls-remote", "origin", "refs/heads/" + f.branch]).split(/\s+/)[0], f.baseSha);
    assert.equal(git(f.repo, ["ls-remote", f.github, "refs/heads/" + f.branch]).split(/\s+/)[0], changed);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test("GitHub push failure prevents Gitea push", () => {
  const f = newFixture();
  try {
    const headSha = commitCandidate(f.repo);
    let originPushAttempted = false;
    const failingGithubRunner: GitRunner = (cwd, args, env) => {
      if (args[0] === "push" && args[1] === "github") return { status: 1, stdout: "", stderr: "fixture failure" };
      if (args[0] === "push" && args[1] === "origin") originPushAttempted = true;
      return f.runner(cwd, args, env);
    };
    assert.throws(() => pushPublicationCommit(f.repo, f.branch, f.baseSha, headSha, f.env, failingGithubRunner), /GitHub fast-forward push failed/);
    assert.equal(originPushAttempted, false);
    assert.equal(git(f.repo, ["ls-remote", "origin", "refs/heads/" + f.branch]).split(/\s+/)[0], f.baseSha);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test("Gitea push failure after GitHub success is reported as partial without rollback", () => {
  const f = newFixture();
  try {
    const headSha = commitCandidate(f.repo);
    const failingOriginRunner: GitRunner = (cwd, args, env) => {
      if (args[0] === "push" && args[1] === "origin") return { status: 1, stdout: "", stderr: "fixture failure" };
      return f.runner(cwd, args, env);
    };
    assert.throws(
      () => pushPublicationCommit(f.repo, f.branch, f.baseSha, headSha, f.env, failingOriginRunner),
      (error: unknown) => error instanceof PartialPublicationPushError && /GitHub is updated/.test(error.message),
    );
    assert.equal(git(f.repo, ["ls-remote", f.github, "refs/heads/" + f.branch]).split(/\s+/)[0], headSha);
    assert.equal(git(f.repo, ["ls-remote", "origin", "refs/heads/" + f.branch]).split(/\s+/)[0], f.baseSha);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test("concurrent Gitea advance after GitHub push reports partial and stops", () => {
  const f = newFixture();
  try {
    const headSha = commitCandidate(f.repo);
    let githubPushed = false;
    let raced = false;
    let originPushAttempted = false;
    const racingRunner: GitRunner = (cwd, args, env) => {
      if (args[0] === "ls-remote" && args[3] === "origin" && githubPushed && !raced) {
        raced = true;
        advanceRemote(f.origin, f.branch, f.root);
      }
      if (args[0] === "push" && args[1] === "origin") originPushAttempted = true;
      const result = f.runner(cwd, args, env);
      if (args[0] === "push" && args[1] === "github" && result.status === 0) githubPushed = true;
      return result;
    };
    assert.throws(
      () => pushPublicationCommit(f.repo, f.branch, f.baseSha, headSha, f.env, racingRunner),
      (error: unknown) => error instanceof PartialPublicationPushError && /Gitea advanced concurrently/.test(error.message),
    );
    assert.equal(raced, true);
    assert.equal(originPushAttempted, false);
    assert.equal(git(f.repo, ["ls-remote", f.github, "refs/heads/" + f.branch]).split(/\s+/)[0], headSha);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});
