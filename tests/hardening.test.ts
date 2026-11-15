import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const scratchDirs: string[] = [];

afterEach(() => {
  for (const directory of scratchDirs.splice(0)) rmSync(directory, { recursive: true, force: true });
});

async function runGate(enabled?: string) {
  const cwd = mkdtempSync(join(tmpdir(), "admin-gate-"));
  scratchDirs.push(cwd);
  mkdirSync(join(cwd, "dist", "admin"), { recursive: true });
  mkdirSync(join(cwd, "dist", "_admin"), { recursive: true });
  const previousCwd = process.cwd();
  const previousEnabled = process.env.ENABLE_ADMIN_DASHBOARD;
  process.chdir(cwd);
  if (enabled === undefined) delete process.env.ENABLE_ADMIN_DASHBOARD;
  else process.env.ENABLE_ADMIN_DASHBOARD = enabled;
  try {
    await import(`../scripts/gate-admin-dashboard.ts?run=${Date.now()}-${Math.random()}`);
  } finally {
    process.chdir(previousCwd);
    if (previousEnabled === undefined) delete process.env.ENABLE_ADMIN_DASHBOARD;
    else process.env.ENABLE_ADMIN_DASHBOARD = previousEnabled;
  }
  return cwd;
}

describe("admin static asset gate", () => {
  it("strips both admin URL trees by default", async () => {
    const cwd = await runGate();
    assert.equal(existsSync(join(cwd, "dist", "admin")), false);
    assert.equal(existsSync(join(cwd, "dist", "_admin")), false);
  });

  it("strips both trees even when the legacy dashboard flag is set", async () => {
    const cwd = await runGate("true");
    assert.equal(existsSync(join(cwd, "dist", "admin")), false);
    assert.equal(existsSync(join(cwd, "dist", "_admin")), false);
  });
});
