import test from "node:test";
import assert from "node:assert/strict";
import { contentDigest, evidenceGateErrors, manifestCandidatePaths, matchesPublishedContentDigest, transitionContentStatus, type PromotionManifest } from "../scripts/lib/publish-promotion";
import { assertPublicationBranch, assertPublicationPushSucceeded, assertScopedStage } from "../scripts/lib/repo-commit";

const receipt = {
  runId: "build-41",
  slug: "new-brief",
  sources: [{ url: "https://example.org/a" }, { url: "https://example.org/b" }],
  factCheck: { passed: true, businessScopePassed: true },
  review: { passed: true, score: 8, flaggedForHuman: false },
};

test("promotion rejects unreviewed or failed fact/business-scope receipts", () => {
  assert.deepEqual(evidenceGateErrors(receipt, "build-41", "new-brief"), []);
  assert.ok(evidenceGateErrors({ ...receipt, review: { passed: false, score: 9 } }, "build-41", "new-brief").some((error) => error.includes("quality review")));
  assert.ok(evidenceGateErrors({ ...receipt, factCheck: { passed: false, businessScopePassed: true } }, "build-41", "new-brief").some((error) => error.includes("fact-check")));
  assert.ok(evidenceGateErrors({ ...receipt, review: { passed: true, flaggedForHuman: false } }, "build-41", "new-brief").some((error) => error.includes("quality review")));
  assert.ok(evidenceGateErrors({ ...receipt, review: { passed: true, score: Number.NaN } }, "build-41", "new-brief").some((error) => error.includes("quality review")));
});

test("publication push requires the configured checkout and successful remote push", () => {
  assert.doesNotThrow(() => assertPublicationBranch("main", "main", "main"));
  assert.throws(() => assertPublicationBranch("main", "master", "main"), /branch mismatch/);
  assert.throws(() => assertPublicationBranch("main", "main", "master"), /branch mismatch/);
  assert.doesNotThrow(() => assertPublicationPushSucceeded(0));
  assert.throws(() => assertPublicationPushSucceeded(1), /could not be pushed/);
  assert.throws(() => assertScopedStage(["src/content/posts/a.md", "wrangler.toml"], ["src/content/posts/a.md"]), /outside the current-run allowlist/);
});

test("publication manifest scopes paths to current-run candidates only", () => {
  const manifest: PromotionManifest = {
    version: 1,
    runId: "build-41",
    promotedAt: "2026-11-14T12:00:00.000Z",
    candidates: [{
      kind: "article",
      slug: "new-brief",
      queueId: "new-brief",
      contentPath: "src/content/posts/new-brief.md",
      evidencePath: "data/briefs/new-brief.json",
      sourcePath: "data/editorial/article-queue.json",
      digest: "abc123",
    }],
  };
  const paths = manifestCandidatePaths(manifest);
  assert.ok(paths.includes("src/content/posts/new-brief.md"));
  assert.ok(paths.includes("data/briefs/new-brief.json"));
  assert.ok(!paths.some((path) => path.includes("unrelated-existing-draft")));
  assert.equal(paths.filter((path) => path.startsWith("src/content/posts/")).length, 1);
});

test("quoted lead-page draft promotes with its reviewed digest and rejects later edits", () => {
  const reviewedDraft = `---\ntitle: \"A scoped website review\"\nservice: \"white-label-website-fulfillment\"\nstatus: \"draft\"\n---\n\nReviewed body.\n`;
  const digest = contentDigest(reviewedDraft);
  const published = transitionContentStatus(reviewedDraft, "draft", "published");
  assert.match(published, /status: "published"/);
  assert.equal(matchesPublishedContentDigest(published, digest), true);
  assert.equal(matchesPublishedContentDigest(published.replace("Reviewed body", "Changed body"), digest), false);
});
