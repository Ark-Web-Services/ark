import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { commitAndPushStrict } from "./lib/repo-commit";
import { createRunManifest, manifestPath, promoteRun, promotionCommitPaths, type PromotionManifest } from "./lib/publish-promotion";

const [action, runId] = process.argv.slice(2);

function readManifest(): PromotionManifest {
  if (!existsSync(manifestPath)) throw new Error("Content promotion run has not been initialized.");
  return JSON.parse(readFileSync(manifestPath, "utf8")) as PromotionManifest;
}

function main(): void {
  if (action === "init") {
    mkdirSync(dirname(manifestPath), { recursive: true });
    createRunManifest(runId);
    console.log(`Started bounded content run ${runId}.`);
    return;
  }
  const manifest = readManifest();
  if (!runId || manifest.runId !== runId) throw new Error("Requested run ID does not match the generated candidates.");
  if (action === "promote") {
    const paths = promoteRun(manifest);
    console.log(`Promoted ${manifest.candidates.length} current-run page(s): ${paths.join(", ")}`);
    return;
  }
  if (action === "persist") {
    if (!manifest.promotedAt) throw new Error("Refusing to commit before publication gates pass.");
    const paths = promotionCommitPaths(manifest);
    const branch = process.env.PROMOTION_BRANCH ?? "";
    commitAndPushStrict(paths, `feat(content): publish ${manifest.candidates.map((candidate) => candidate.slug).join(" and ")}`, branch);
    return;
  }
  throw new Error("Usage: publish-generated-content.ts init|promote|persist <drone-build-number>");
}

try { main(); } catch (error) { console.error(`Content publication gate failed: ${(error as Error).message}`); process.exitCode = 1; }
