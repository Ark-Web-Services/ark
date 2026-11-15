import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import business from "../../business.config";
import niche from "../../niche.config";

export type CandidateKind = "article" | "lead-page";
export interface PromotionCandidate {
  kind: CandidateKind;
  slug: string;
  queueId: string;
  contentPath: string;
  evidencePath: string;
  sourcePath: string;
  digest: string;
}
export interface PromotionManifest {
  version: 1;
  runId: string;
  candidates: PromotionCandidate[];
  promotedAt?: string;
}

const root = process.env.CONTENT_PROMOTION_TEST_ROOT ?? process.cwd();
const manifestPath = join(root, "data/runs/content-promotion.json");
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const contentDigest = (value: string) => createHash("sha256").update(value).digest("hex");

export function transitionContentStatus(content: string, from: "draft" | "published", to: "draft" | "published"): string {
  const frontmatter = /^---\s*\n([\s\S]*?)\n---/m.exec(content);
  if (!frontmatter) throw new Error("Candidate content has no YAML frontmatter.");
  const updated = frontmatter[1].replace(/^(status:\s*)(["']?)(draft|published)\2\s*$/m, (line, prefix: string, quote: string, status: string) => {
    if (status !== from) throw new Error(`Expected frontmatter status ${from}, found ${status}.`);
    return `${prefix}${quote}${to}${quote}`;
  });
  if (updated === frontmatter[1]) throw new Error(`Frontmatter status ${from} was not found.`);
  return content.slice(0, frontmatter.index) + frontmatter[0].replace(frontmatter[1], updated) + content.slice(frontmatter.index + frontmatter[0].length);
}

export function matchesPublishedContentDigest(content: string, digest: string): boolean {
  try { return contentDigest(transitionContentStatus(content, "published", "draft")) === digest; }
  catch { return false; }
}

export function safeRelativePath(file: string): boolean {
  const absolute = resolve(root, file);
  return Boolean(file) && absolute.startsWith(`${resolve(root)}${sep}`) && !file.startsWith("/");
}

export function createRunManifest(runId: string): PromotionManifest {
  if (!runId || !/^[a-zA-Z0-9._-]{1,120}$/.test(runId)) throw new Error("A valid Drone build ID is required to start content promotion.");
  const manifest: PromotionManifest = { version: 1, runId, candidates: [] };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

function readManifest(): PromotionManifest {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as PromotionManifest;
  if (manifest.version !== 1 || !Array.isArray(manifest.candidates)) throw new Error("Invalid content-promotion manifest.");
  return manifest;
}

export function registerCandidate(input: {
  runId: string;
  kind: CandidateKind;
  slug: string;
  queueId: string;
  contentPath: string;
  evidencePath: string;
  sourcePath: string;
}): PromotionCandidate {
  if (!existsSync(manifestPath)) throw new Error("Promotion run was not initialized; refusing to register generated content.");
  const manifest = readManifest();
  if (manifest.runId !== input.runId) throw new Error("Generated content run ID does not match the active promotion run.");
  if (!slugPattern.test(input.slug) || !slugPattern.test(input.queueId)) throw new Error("Invalid content promotion slug or queue ID.");
  const expectedPrefix = input.kind === "article" ? "src/content/posts/" : "src/content/lead-pages/";
  if (!input.contentPath.startsWith(expectedPrefix) || !safeRelativePath(input.contentPath)) throw new Error("Candidate content path is outside its allowed collection.");
  for (const path of [input.evidencePath, input.sourcePath]) if (!safeRelativePath(path)) throw new Error("Candidate metadata path escapes the repository.");
  if (manifest.candidates.length >= 2 || manifest.candidates.some((candidate) => candidate.kind === input.kind)) throw new Error("This run is limited to one article and one lead page.");
  const content = readFileSync(join(root, input.contentPath), "utf8");
  const candidate: PromotionCandidate = { ...input, digest: contentDigest(content) };
  manifest.candidates.push(candidate);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return candidate;
}

function frontmatterStatus(content: string): string | undefined {
  const block = /^---\s*\n([\s\S]*?)\n---/m.exec(content)?.[1] ?? "";
  return /^status:\s*["']?([^\n"']+)["']?\s*$/m.exec(block)?.[1]?.trim();
}

export function candidateGateErrors(candidate: PromotionCandidate, runId: string, manifest: PromotionManifest): string[] {
  const errors: string[] = [];
  if (manifest.runId !== runId) errors.push("Run ID mismatch.");
  if (candidate.kind !== "article" && candidate.kind !== "lead-page") errors.push("Invalid candidate kind.");
  if (!slugPattern.test(candidate.slug) || !slugPattern.test(candidate.queueId)) errors.push("Invalid candidate slug or queue ID.");
  const expectedPrefix = candidate.kind === "article" ? "src/content/posts/" : "src/content/lead-pages/";
  const expectedQueue = candidate.kind === "article" ? "data/editorial/article-queue.json" : "data/lead-pages/queue.json";
  const expectedEvidence = candidate.kind === "article" ? `data/briefs/${candidate.slug}.json` : `data/briefs/lead-${candidate.slug}.json`;
  if (!candidate.contentPath.startsWith(expectedPrefix) || !safeRelativePath(candidate.contentPath)) errors.push("Candidate path is outside its allowed collection.");
  if (candidate.contentPath !== `${expectedPrefix}${candidate.slug}.md` || candidate.sourcePath !== expectedQueue || candidate.evidencePath !== expectedEvidence) errors.push("Candidate paths do not match the exact generated output and queue paths.");
  if (!safeRelativePath(candidate.evidencePath) || !safeRelativePath(candidate.sourcePath)) errors.push("Candidate metadata path escapes the repository.");
  if (!existsSync(join(root, candidate.contentPath)) || !existsSync(join(root, candidate.evidencePath)) || !existsSync(join(root, candidate.sourcePath))) return [...errors, "Candidate content, evidence, or queue file is missing."];
  const content = readFileSync(join(root, candidate.contentPath), "utf8");
  if (contentDigest(content) !== candidate.digest) errors.push("Candidate content changed after its quality gates completed.");
  if (frontmatterStatus(content) !== "draft") errors.push("Only a current-run draft can be promoted.");
  const evidence = JSON.parse(readFileSync(join(root, candidate.evidencePath), "utf8")) as any;
  errors.push(...evidenceGateErrors(evidence, runId, candidate.slug));
  const queue = JSON.parse(readFileSync(join(root, candidate.sourcePath), "utf8")) as { items?: Array<Record<string, any>> };
  const item = queue.items?.find((entry) => (candidate.kind === "article" ? entry.suggestedSlug === candidate.slug : entry.id === candidate.queueId));
  if (!item || item.status !== "drafted") errors.push("Matching content queue item is not marked drafted.");
  if (candidate.kind === "article") {
    const category = /^category:\s*["']?([^\n"']+)/m.exec(content)?.[1]?.trim();
    if (!category || !niche.silos.some((silo) => silo.id === category) || evidence.category !== category) errors.push("Article category does not match a configured content silo.");
  } else {
    const serviceId = /^service:\s*["']?([^\n"']+)/m.exec(content)?.[1]?.trim();
    const service = business.services.find((entry) => entry.id === serviceId);
    if (!service || evidence.serviceId !== serviceId) errors.push("Lead page does not match a configured business service.");
  }
  return errors;
}

export function evidenceGateErrors(evidence: any, runId: string, slug: string): string[] {
  const errors: string[] = [];
  if (evidence.runId !== runId || evidence.slug !== slug) errors.push("Evidence receipt does not match this run and candidate.");
  if (evidence.factCheck?.passed !== true || evidence.factCheck?.businessScopePassed !== true) errors.push("Independent fact-check or supported-business-scope gate did not pass.");
  if (evidence.review?.passed !== true || typeof evidence.review?.score !== "number" || !Number.isFinite(evidence.review.score) || evidence.review.score < 7 || evidence.review?.flaggedForHuman === true) errors.push("Independent quality review did not pass its threshold.");
  if (!Array.isArray(evidence.sources) || evidence.sources.length < 2 || evidence.sources.some((source: any) => typeof source?.url !== "string" || !source.url.startsWith("https://"))) errors.push("Candidate lacks two HTTPS source references in its evidence receipt.");
  return errors;
}

export function promoteRun(manifest: PromotionManifest): string[] {
  if (manifest.candidates.length < 1 || manifest.candidates.length > 2) throw new Error("Promotion requires one or two candidates generated by this run.");
  const errors = manifest.candidates.flatMap((candidate) => candidateGateErrors(candidate, manifest.runId, manifest).map((error) => `${candidate.slug}: ${error}`));
  if (errors.length) throw new Error(`Promotion gate denied publication:\n${errors.join("\n")}`);
  const changed: string[] = [];
  const queues = new Map<string, { value: any; item: any }>();
  for (const candidate of manifest.candidates) {
    const contentPath = join(root, candidate.contentPath);
    const content = transitionContentStatus(readFileSync(contentPath, "utf8"), "draft", "published");
    writeFileSync(contentPath, content);
    changed.push(candidate.contentPath);
    const queuePath = join(root, candidate.sourcePath);
    if (!queues.has(candidate.sourcePath)) {
      const value = JSON.parse(readFileSync(queuePath, "utf8"));
      queues.set(candidate.sourcePath, { value, item: null });
    }
    const queue = queues.get(candidate.sourcePath)!;
    const item = queue.value.items.find((entry: any) => (candidate.kind === "article" ? entry.suggestedSlug === candidate.slug : entry.id === candidate.queueId));
    item.status = "published";
    item.publishedAt = new Date().toISOString();
    item.note = "Automated evidence, review, preflight, and build gates passed; published by the bounded weekly pipeline.";
    changed.push(candidate.sourcePath, candidate.evidencePath);
  }
  for (const [path, { value }] of queues) writeFileSync(join(root, path), `${JSON.stringify(value, null, 2)}\n`);
  manifest.promotedAt = new Date().toISOString();
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  changed.push("data/runs/content-promotion.json");
  return [...new Set(changed)];
}

export function promotionCommitPaths(manifest: PromotionManifest): string[] {
  if (!manifest.promotedAt) throw new Error("Refusing to persist candidates before the promotion gate completed.");
  if (manifest.candidates.length < 1 || manifest.candidates.length > 2) throw new Error("Refusing to persist an invalid candidate count.");
  for (const candidate of manifest.candidates) {
    if (!existsSync(join(root, candidate.contentPath))) {
      throw new Error(`Refusing to persist ${candidate.slug}: publication status is missing.`);
    }
    const publishedContent = readFileSync(join(root, candidate.contentPath), "utf8");
    if (frontmatterStatus(publishedContent) !== "published") throw new Error(`Refusing to persist ${candidate.slug}: publication status is missing.`);
    if (!matchesPublishedContentDigest(publishedContent, candidate.digest)) throw new Error(`Refusing to persist ${candidate.slug}: content changed after the review gates.`);
    const evidence = JSON.parse(readFileSync(join(root, candidate.evidencePath), "utf8"));
    const gateErrors = evidenceGateErrors(evidence, manifest.runId, candidate.slug);
    if (gateErrors.length) throw new Error(`Refusing to persist ${candidate.slug}: ${gateErrors.join("; ")}`);
    const queue = JSON.parse(readFileSync(join(root, candidate.sourcePath), "utf8"));
    const item = queue.items?.find((entry: any) => (candidate.kind === "article" ? entry.suggestedSlug === candidate.slug : entry.id === candidate.queueId));
    if (!item || item.status !== "published") throw new Error(`Refusing to persist ${candidate.slug}: matching queue item is not published.`);
  }
  return manifestCandidatePaths(manifest);
}

export function manifestCandidatePaths(manifest: PromotionManifest): string[] {
  return [...new Set([
    "data/runs/content-promotion.json",
    ...manifest.candidates.flatMap((candidate) => [candidate.contentPath, candidate.evidencePath, candidate.sourcePath]),
  ])];
}

export { manifestPath };
