import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import niche from "../niche.config";

interface QueueItem {
  id: string;
  rank: number;
  title: string;
  suggestedSlug: string;
  targetKeyword: string;
  category: string;
  demandEvidence: string;
  whyWeCanWin: string;
  outline: string[];
  sources: Array<{ label: string; url: string; use: string }>;
  status: "queued" | "drafted" | "published" | "rejected";
}

const root = process.cwd();
const queuePath = join(root, "data/editorial/article-queue.json");
const outputDir = join(root, "data/trends");
const postsDir = join(root, "src/content/posts");

function isoWeek(date = new Date()): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  utc.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function prepare(): void {
  if (!existsSync(queuePath)) throw new Error("Editorial article queue is missing.");
  const queue = JSON.parse(readFileSync(queuePath, "utf8")) as { version: number; items: QueueItem[] };
  if (queue.version !== 1 || !Array.isArray(queue.items)) throw new Error("Editorial queue must use version 1 and contain items.");
  const files = readdirSync(postsDir).filter((name) => /\.mdx?$/.test(name));
  const existing = new Set(files.map((name) => name.replace(/\.mdx?$/, "")));
  const queued = queue.items.find((item) => item.status === "queued" && !existing.has(item.suggestedSlug));
  if (!queued) throw new Error("No queued article brief remains without an existing post slug.");
  if (!niche.silos.some((silo) => silo.id === queued.category)) throw new Error(`Unknown silo for queue item ${queued.id}: ${queued.category}`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(queued.suggestedSlug)) throw new Error(`Invalid slug in queue: ${queued.suggestedSlug}`);
  if (queued.sources.length < 2 || queued.sources.some((source) => !/^https:\/\//.test(source.url))) throw new Error(`Queue item ${queued.id} needs two HTTPS primary sources.`);

  const week = isoWeek();
  mkdirSync(outputDir, { recursive: true });
  const path = join(outputDir, `${week}.json`);
  if (existsSync(path)) {
    const current = JSON.parse(readFileSync(path, "utf8")) as { analysis?: { source?: string } };
    if (current.analysis?.source !== "editorial-queue") throw new Error(`Refusing to replace non-queue trend file ${week}.json.`);
  }
  const trend = {
    generatedAt: new Date().toISOString(),
    week,
    communityTopics: [],
    patterns: [],
    pages: { rising: [], decaying: [] },
    contentGaps: [{
      rank: 1,
      title: queued.title,
      suggestedSlug: queued.suggestedSlug,
      targetKeyword: queued.targetKeyword,
      category: queued.category,
      demandEvidence: queued.demandEvidence,
      whyWeCanWin: queued.whyWeCanWin,
      outline: queued.outline,
      sources: queued.sources,
    }],
    interactiveTool: { name: "", slug: "", problemSolved: "", evidence: "Not proposed in this editorial-only run.", reasoning: "This run only processes one queued article brief." },
    ctrRewrites: [],
    analysis: {
      source: "editorial-queue",
      observationDays: 0,
      uniqueThreads: 0,
      stage0Calls: 0,
      stage1Calls: 0,
      stage1Requests: 0,
      stage1CacheHits: 0,
      stage1PredictSeconds: 0,
      stage1EstimatedCostUsd: 0,
      stage2Calls: 0,
      stage2Requests: 0,
      stage2PredictSeconds: 0,
      stage2EstimatedCostUsd: 0,
      totalLogicalCalls: 0,
      totalRequests: 0,
      predictSeconds: 0,
      estimatedCostUsd: 0,
    },
  };
  writeFileSync(path, `${JSON.stringify(trend, null, 2)}\n`);
  console.log(`Prepared ${week} editorial brief ${queued.id}; no search-demand metrics were measured.`);
}

prepare();
