import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import business from "../business.config";

const fixtureRoot = mkdtempSync(join(tmpdir(), "content-promotion-fixture-"));
process.env.CONTENT_PROMOTION_TEST_ROOT = fixtureRoot;
const promotion = await import("../scripts/lib/publish-promotion");
const runId = "fixture-build-17";
const slug = "reviewed-fixture-lead";
const serviceId = business.services[0].id;
const contentPath = `src/content/lead-pages/${slug}.md`;
const evidencePath = `data/briefs/lead-${slug}.json`;
const sourcePath = "data/lead-pages/queue.json";

after(() => {
  delete process.env.CONTENT_PROMOTION_TEST_ROOT;
  rmSync(fixtureRoot, { recursive: true, force: true });
});

test("a quoted reviewed lead promotes and persists; unrelated or edited drafts are excluded", () => {
  for (const dir of ["data/runs", "data/briefs", "data/lead-pages", "src/content/lead-pages"]) mkdirSync(join(fixtureRoot, dir), { recursive: true });
  const draft = `---\ntitle: "A reviewed service page"\ndescription: "A source-grounded guide for a configured service."\nservice: "${serviceId}"\nstatus: "draft"\n---\n\nReviewed text.\n`;
  writeFileSync(join(fixtureRoot, contentPath), draft);
  writeFileSync(join(fixtureRoot, "src/content/lead-pages/unrelated-existing-draft.md"), draft.replace("Reviewed text", "Unrelated text"));
  writeFileSync(join(fixtureRoot, sourcePath), JSON.stringify({ version: 1, items: [{ id: slug, service: serviceId, status: "drafted" }] }));
  writeFileSync(join(fixtureRoot, evidencePath), JSON.stringify({
    runId,
    slug,
    serviceId,
    sources: [{ url: "https://example.org/one" }, { url: "https://example.org/two" }],
    factCheck: { passed: true, businessScopePassed: true },
    review: { passed: true, score: 8, flaggedForHuman: false },
  }));

  promotion.createRunManifest(runId);
  promotion.registerCandidate({ runId, kind: "lead-page", slug, queueId: slug, contentPath, evidencePath, sourcePath });
  const manifest = JSON.parse(readFileSync(promotion.manifestPath, "utf8"));
  promotion.promoteRun(manifest);

  const published = readFileSync(join(fixtureRoot, contentPath), "utf8");
  assert.match(published, /status: "published"/);
  const persistedPaths = promotion.promotionCommitPaths(manifest);
  assert.ok(persistedPaths.includes(contentPath));
  assert.ok(!persistedPaths.includes("src/content/lead-pages/unrelated-existing-draft.md"));

  writeFileSync(join(fixtureRoot, contentPath), published.replace("Reviewed text", "Edited after review"));
  assert.throws(() => promotion.promotionCommitPaths(manifest), /content changed after the review gates/);
});
