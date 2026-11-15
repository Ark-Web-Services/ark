import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import business from "../business.config";
import niche from "../niche.config";

const postsDir = join(process.cwd(), "src/content/posts");
const queuePath = join(process.cwd(), "data/lead-pages/queue.json");
const articleQueuePath = join(process.cwd(), "data/editorial/article-queue.json");
const errors: string[] = [];

if (!business.enabled || business.contentEnabled !== true) errors.push("Business content publishing is disabled.");
if (niche.silos.length < 3) errors.push("Configure at least three focused content categories.");
if (niche.silos.some((silo) => !silo.id || !silo.pillar.startsWith("/") || !silo.pillar.endsWith("/"))) errors.push("Every silo needs a stable id and canonical pillar path.");

if (!existsSync(articleQueuePath)) errors.push("Editorial article queue is missing.");
else {
  try {
    const queue = JSON.parse(readFileSync(articleQueuePath, "utf8")) as { version: number; items: Array<Record<string, any>> };
    const ids = new Set<string>();
    if (queue.version !== 1 || !Array.isArray(queue.items)) errors.push("Editorial queue must use version 1 and contain items.");
    for (const item of queue.items ?? []) {
      const id = String(item.id ?? "");
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || ids.has(id)) errors.push(`Invalid or duplicate editorial queue id: ${id}`);
      ids.add(id);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(item.suggestedSlug ?? ""))) errors.push(`${id} has an invalid slug.`);
      if (!niche.silos.some((silo) => silo.id === item.category)) errors.push(`${id} references an unconfigured silo.`);
      if (!Array.isArray(item.outline) || item.outline.length < 3) errors.push(`${id} needs an editorial outline.`);
      if (!Array.isArray(item.sources) || item.sources.length < 2 || item.sources.some((source: any) => typeof source?.url !== "string" || !source.url.startsWith("https://"))) errors.push(`${id} needs at least two HTTPS research sources.`);
    }
  } catch (error) {
    errors.push(`Editorial queue could not be parsed: ${(error as Error).message}`);
  }
}

const postFiles = existsSync(postsDir) ? readdirSync(postsDir).filter((file) => /\.mdx?$/.test(file) && !/^EXAMPLE[-_]/i.test(file)) : [];
if (postFiles.length < 3) errors.push(`Need at least three non-example editorial posts before the weekly writer can link a new post; found ${postFiles.length}.`);

for (const file of postFiles) {
  const raw = readFileSync(join(postsDir, file), "utf8");
  const frontmatter = /^---\s*\n([\s\S]*?)\n---/m.exec(raw)?.[1] ?? "";
  const category = /^category:\s*["']?([^\n"']+)/m.exec(frontmatter)?.[1]?.trim();
  if (!category || !niche.silos.some((silo) => silo.id === category)) errors.push(`${file} has no configured category.`);
  const wordCount = raw.replace(/^---[\s\S]*?---/m, "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 500) errors.push(`${file} is ${wordCount} words; short posts need editorial review before publishing.`);
  const sourceLinks = [...new Set([...raw.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map((match) => match[1]))];
  if (sourceLinks.length < 2) errors.push(`${file} needs at least two cited HTTPS sources.`);
}

if (!existsSync(queuePath)) errors.push("Lead-page brief queue is missing.");
else {
  try {
    const queue = JSON.parse(readFileSync(queuePath, "utf8")) as { version: number; items: Array<Record<string, unknown>> };
    const ids = new Set<string>();
    if (queue.version !== 1 || !Array.isArray(queue.items)) errors.push("Lead-page queue must use version 1 and contain items.");
    for (const item of queue.items ?? []) {
      const id = String(item.id ?? "");
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || ids.has(id)) errors.push(`Invalid or duplicate lead-page queue id: ${id}`);
      ids.add(id);
      if (!business.services.some((service) => service.id === item.service)) errors.push(`${id} references an unconfigured service.`);
      if (!Array.isArray(item.sources) || item.sources.length < 2 || item.sources.some((source: any) => typeof source?.url !== "string" || !source.url.startsWith("https://"))) errors.push(`${id} needs at least two HTTPS research sources.`);
    }
  } catch (error) {
    errors.push(`Lead-page queue could not be parsed: ${(error as Error).message}`);
  }
}

if (errors.length) {
  for (const error of errors) console.error(`✗ ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Editorial preflight passed: ${postFiles.length} non-example articles, ${niche.silos.length} categories, lead-page queue validated.`);
}
