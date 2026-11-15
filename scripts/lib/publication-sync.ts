import { existsSync, readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";

export const EXPECTED_PUBLICATION_BRANCH = "master";
export const EXPECTED_GITHUB_PUBLICATION_URL = "git@github.com:Ark-Web-Services/ark.git";
export const GITHUB_ED25519_KNOWN_HOST =
  "github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl";

export type GitResult = { status: number | null; stdout: string; stderr: string };
export type GitRunner = (cwd: string, args: string[], env?: NodeJS.ProcessEnv) => GitResult;

const defaultGitRunner: GitRunner = (cwd, args, env) => {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", env });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
};

function runGit(cwd: string, args: string[], env: NodeJS.ProcessEnv, runner: GitRunner): GitResult {
  const result = runner(cwd, args, env);
  if (result.status !== 0) {
    throw new Error("Git command failed: git " + args[0] + " (exit " + (result.status ?? "unknown") + ").");
  }
  return result;
}

function validSha(value: string): boolean {
  return /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/i.test(value);
}

export function assertPublicationIdentity(
  branch: string,
  droneBranch: string,
  checkedOutBranch: string,
  headSha: string,
  droneCommitSha: string,
): void {
  if (branch !== EXPECTED_PUBLICATION_BRANCH || droneBranch !== branch || checkedOutBranch !== branch) {
    throw new Error(
      "Publication branch mismatch; expected " + EXPECTED_PUBLICATION_BRANCH +
      " and got PROMOTION_BRANCH=" + branch + ", DRONE_BRANCH=" + droneBranch +
      ", checkout=" + checkedOutBranch + ".",
    );
  }
  if (!validSha(droneCommitSha) || headSha !== droneCommitSha) {
    throw new Error("Checkout HEAD must exactly match the Drone event commit SHA before content generation.");
  }
}

export function assertConfiguredGitHubUrl(url: string): void {
  if (url !== EXPECTED_GITHUB_PUBLICATION_URL || !url.startsWith("git@github.com:")) {
    throw new Error("GITHUB_PUBLICATION_URL does not match this site's fixed GitHub repository.");
  }
}

function gitOutput(cwd: string, args: string[], env: NodeJS.ProcessEnv, runner: GitRunner): string {
  return runGit(cwd, args, env, runner).stdout.trim();
}

export function readRemoteBranchSha(
  cwd: string,
  remote: string,
  branch: string,
  env: NodeJS.ProcessEnv = process.env,
  runner: GitRunner = defaultGitRunner,
): string {
  if (!["origin", "github"].includes(remote)) throw new Error("Publication sync uses only origin and github remotes.");
  if (branch !== EXPECTED_PUBLICATION_BRANCH) throw new Error("Refusing to read an unexpected publication branch.");
  const result = runGit(
    cwd,
    ["ls-remote", "--exit-code", "--heads", remote, "refs/heads/" + branch],
    env,
    runner,
  );
  const matching = result.stdout.trim().split(/\r?\n/).filter((line) => line.split(/\s+/)[1] === "refs/heads/" + branch);
  if (matching.length !== 1) throw new Error("Could not resolve exactly one " + remote + " branch ref.");
  const sha = matching[0].split(/\s+/)[0];
  if (!validSha(sha)) throw new Error("Remote returned an invalid branch SHA.");
  return sha;
}

export function assertRemoteBranchesAtBase(
  cwd: string,
  branch: string,
  baseSha: string,
  env: NodeJS.ProcessEnv = process.env,
  runner: GitRunner = defaultGitRunner,
): void {
  if (branch !== EXPECTED_PUBLICATION_BRANCH || !validSha(baseSha)) {
    throw new Error("Invalid publication branch or base SHA.");
  }
  const originEnv: NodeJS.ProcessEnv = { ...env };
  delete originEnv.GITHUB_PUBLICATION_SSH_KEY;
  delete originEnv.GIT_SSH_COMMAND;
  delete originEnv.GIT_SSH_VARIANT;
  const originSha = readRemoteBranchSha(cwd, "origin", branch, originEnv, runner);
  const githubSha = readRemoteBranchSha(cwd, "github", branch, env, runner);
  if (originSha !== baseSha || githubSha !== baseSha) {
    throw new Error(
      "Publication preflight failed: origin and GitHub must both equal DRONE_COMMIT_SHA " +
      "before generation/push (origin=" + originSha + ", github=" + githubSha + ").",
    );
  }
}

function safeSshPath(value: string): boolean {
  return value.startsWith("/") && !value.includes("..") && /^\/[A-Za-z0-9._/-]+$/.test(value);
}

export function githubSshEnvironment(
  env: NodeJS.ProcessEnv,
  requireSecretValue: boolean = true,
): NodeJS.ProcessEnv {
  if (requireSecretValue && !env.GITHUB_PUBLICATION_SSH_KEY) throw new Error("Missing repo-scoped GITHUB_PUBLICATION_SSH_KEY secret.");
  const keyFile = env.GITHUB_PUBLICATION_SSH_KEY_FILE ?? "";
  const knownHostsFile = env.GITHUB_KNOWN_HOSTS_FILE ?? "";
  if (!safeSshPath(keyFile) || !safeSshPath(knownHostsFile)) {
    throw new Error("GitHub SSH key and known-host paths must be fixed absolute paths.");
  }
  if (!existsSync(keyFile) || !existsSync(knownHostsFile)) {
    throw new Error("GitHub deploy key or pinned known-host file is missing.");
  }
  const keyStat = statSync(keyFile);
  if (!keyStat.isFile() || keyStat.size === 0 || (keyStat.mode & 0o077) !== 0) {
    throw new Error("GitHub deploy key file must be nonempty and mode 0600.");
  }
  const knownHosts = readFileSync(knownHostsFile, "utf8").split(/\r?\n/);
  if (!knownHosts.includes(GITHUB_ED25519_KNOWN_HOST)) {
    throw new Error("GitHub known-host file does not contain the official pinned Ed25519 host key.");
  }
  const childEnv: NodeJS.ProcessEnv = { ...env };
  delete childEnv.GITHUB_PUBLICATION_SSH_KEY;
  childEnv.GIT_SSH_COMMAND =
    "ssh -i " + keyFile +
    " -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes" +
    " -o UserKnownHostsFile=" + knownHostsFile +
    " -o GlobalKnownHostsFile=/dev/null";
  childEnv.GIT_SSH_VARIANT = "ssh";
  return childEnv;
}

function ensureGitHubRemote(
  cwd: string,
  url: string,
  env: NodeJS.ProcessEnv,
  runner: GitRunner,
): void {
  assertConfiguredGitHubUrl(url);
  const current = runner(cwd, ["remote", "get-url", "github"], env);
  if (current.status === 0) {
    if (current.stdout.trim() !== url) throw new Error("Existing github remote differs from GITHUB_PUBLICATION_URL.");
    return;
  }
  runGit(cwd, ["remote", "add", "github", url], env, runner);
}

export function runPublicationPreflight(
  cwd: string = process.cwd(),
  env: NodeJS.ProcessEnv = process.env,
  runner: GitRunner = defaultGitRunner,
): string {
  const branch = env.PROMOTION_BRANCH ?? "";
  const droneBranch = env.DRONE_BRANCH ?? "";
  const droneCommitSha = env.DRONE_COMMIT_SHA ?? "";
  const githubUrl = env.GITHUB_PUBLICATION_URL ?? "";
  assertConfiguredGitHubUrl(githubUrl);
  const githubEnv = githubSshEnvironment(env);
  const safeEnv: NodeJS.ProcessEnv = { ...env };
  delete safeEnv.GITHUB_PUBLICATION_SSH_KEY;
  delete safeEnv.GIT_SSH_COMMAND;
  delete safeEnv.GIT_SSH_VARIANT;
  const checkedOutBranch = gitOutput(cwd, ["rev-parse", "--abbrev-ref", "HEAD"], safeEnv, runner);
  const headSha = gitOutput(cwd, ["rev-parse", "HEAD"], safeEnv, runner);
  assertPublicationIdentity(branch, droneBranch, checkedOutBranch, headSha, droneCommitSha);
  const originUrl = gitOutput(cwd, ["remote", "get-url", "origin"], safeEnv, runner);
  if (!originUrl) throw new Error("The Gitea origin remote is missing.");
  ensureGitHubRemote(cwd, githubUrl, safeEnv, runner);
  assertRemoteBranchesAtBase(cwd, branch, droneCommitSha, githubEnv, runner);
  return droneCommitSha;
}

export class PartialPublicationPushError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PartialPublicationPushError";
  }
}

export function pushPublicationCommit(
  cwd: string,
  branch: string,
  baseSha: string,
  headSha: string,
  env: NodeJS.ProcessEnv = process.env,
  runner: GitRunner = defaultGitRunner,
): void {
  if (branch !== EXPECTED_PUBLICATION_BRANCH) throw new Error("Refusing to publish to an unexpected branch.");
  const githubUrl = env.GITHUB_PUBLICATION_URL ?? "";
  assertConfiguredGitHubUrl(githubUrl);
  const githubEnv = githubSshEnvironment(env, false);
  const originEnv: NodeJS.ProcessEnv = { ...env };
  delete originEnv.GITHUB_PUBLICATION_SSH_KEY;
  delete originEnv.GIT_SSH_COMMAND;
  delete originEnv.GIT_SSH_VARIANT;
  const checkedOutBranch = gitOutput(cwd, ["rev-parse", "--abbrev-ref", "HEAD"], originEnv, runner);
  const actualHead = gitOutput(cwd, ["rev-parse", "HEAD"], originEnv, runner);
  if (checkedOutBranch !== branch || actualHead !== headSha) throw new Error("Publication checkout changed before push.");
  if (!validSha(baseSha) || !validSha(headSha)) throw new Error("Publication base or commit SHA is invalid.");
  const parentSha = gitOutput(cwd, ["rev-parse", "HEAD^"], originEnv, runner);
  if (parentSha !== baseSha) throw new Error("Publication commit must directly descend from the reviewed Drone base.");
  ensureGitHubRemote(cwd, githubUrl, originEnv, runner);
  assertRemoteBranchesAtBase(cwd, branch, baseSha, githubEnv, runner);

  const refspec = "HEAD:refs/heads/" + branch;
  const githubPush = runner(cwd, ["push", "github", refspec], githubEnv);
  if (githubPush.status !== 0) {
    let githubAtHead = false;
    try { githubAtHead = readRemoteBranchSha(cwd, "github", branch, githubEnv, runner) === headSha; } catch { /* status remains uncertain */ }
    if (githubAtHead) {
      throw new PartialPublicationPushError("GitHub now has the publication commit, but the push returned an error; Gitea was not pushed.");
    }
    throw new Error("GitHub fast-forward push failed; Gitea was not pushed. Reconcile refs before retrying.");
  }

  let githubAfter: string;
  try { githubAfter = readRemoteBranchSha(cwd, "github", branch, githubEnv, runner); }
  catch {
    throw new PartialPublicationPushError("GitHub push returned success but its ref could not be verified; Gitea was not pushed.");
  }
  if (githubAfter !== headSha) {
    throw new PartialPublicationPushError("GitHub ref does not equal the publication commit after push; Gitea was not pushed.");
  }

  let originBefore: string;
  try { originBefore = readRemoteBranchSha(cwd, "origin", branch, originEnv, runner); }
  catch {
    throw new PartialPublicationPushError("GitHub is updated but Gitea's ref could not be checked; Gitea push was not attempted.");
  }
  if (originBefore !== baseSha) {
    throw new PartialPublicationPushError("GitHub is updated but Gitea advanced concurrently; reconcile with a reviewed fast-forward.");
  }

  const originPush = runner(cwd, ["push", "origin", refspec], originEnv);
  if (originPush.status !== 0) {
    throw new PartialPublicationPushError("GitHub is updated but the Gitea push failed; reconcile with a reviewed fast-forward. No rollback was attempted.");
  }
  try {
    const githubFinal = readRemoteBranchSha(cwd, "github", branch, githubEnv, runner);
    const originFinal = readRemoteBranchSha(cwd, "origin", branch, originEnv, runner);
    if (githubFinal !== headSha || originFinal !== headSha) {
      throw new Error("final refs do not match the publication commit");
    }
  } catch {
    throw new PartialPublicationPushError("Both pushes returned success, but matching GitHub/Gitea refs could not be verified.");
  }
}
