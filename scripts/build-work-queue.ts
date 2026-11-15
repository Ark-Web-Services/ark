// ═══════════════════════════════════════════════════════════════
// BUILD-WORK-QUEUE.TS — Compact, machine-readable "what to do next"
//
// Collapses four scattered sources into one small file:
//   • data/engine-ledger.json   → proposed content gaps / tools / CTR rewrites
//   • data/audits/<latest>.json → open P0/P1/P2 SEO issues
//   • data/backlinks/prospects.json → outreach prospects awaiting a human
//   • data/trends/<latest>.json → striking-distance and zero-click queries
//
// Written to data/work-queue.json and served by /api/work-queue.
//
// Why a generated snapshot rather than reading the sources at request
// time: the API route is SSR on Cloudflare Workers, where node:fs does
// not exist. Data has to be bundled at build time, and bundling every
// dated audit and trend file via import.meta.glob would ship megabytes
// into the Worker. One compact file keeps the bundle small and makes the
// payload stable and reviewable.
//
// Runs from the prebuild hook, so a deploy always ships a current queue.
// ═══════════════════════════════════════════════════════════════

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import nicheConfig from '../niche.config';

const ROOT = process.cwd();
const OUT = join(ROOT, 'data', 'work-queue.json');

type Priority = 'P0' | 'P1' | 'P2' | 'P3';

interface WorkItem {
  id: string;
  priority: Priority;
  kind: 'seo-issue' | 'content-gap' | 'interactive-tool' | 'ctr-rewrite' | 'outreach' | 'striking-distance';
  title: string;
  /** Where the work lands: a route, a slug to create, or an external URL. */
  target: string;
  /** Why this is worth doing, in the engine's or auditor's own words. */
  evidence: string;
  /** Concrete next action, phrased so an agent can act without guessing. */
  action: string;
  /** How many weekly cycles have proposed this. Higher = more durable demand. */
  weeksProposed?: number;
  metrics?: Record<string, number | string>;
}

const readJson = <T>(path: string): T | null => {
  try { return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as T) : null; }
  catch { return null; }
};

/**
 * Newest dated file in a directory.
 *
 * Only `YYYY-MM-DD.json` / `YYYY-Wnn.json` names count. data/observations/
 * also holds thread-labels.json, index.json and community-index.json, and a
 * plain alphabetical sort picked thread-labels.json as "latest" — which
 * silently produced an empty striking-distance list instead of an error.
 */
const latestIn = (dir: string): string | null => {
  const full = join(ROOT, dir);
  if (!existsSync(full)) return null;
  const files = readdirSync(full)
    .filter((f) => /^\d{4}-(\d{2}-\d{2}|W\d{2})\.json$/.test(f))
    .sort();
  return files.length ? join(full, files[files.length - 1]) : null;
};

const items: WorkItem[] = [];

// ── 1. Open SEO audit issues ─────────────────────────────────
// These are the only items that can be genuinely urgent: a P0 means a
// live page or sitemap entry is broken right now.
const auditPath = latestIn('data/audits');
const audit = auditPath ? readJson<{ generatedAt: string; issues: Array<{ id: string; severity: Priority; page?: string; message: string }> }>(auditPath) : null;
for (const issue of audit?.issues ?? []) {
  // Migration bookkeeping is noise in a work queue: it records that a
  // renamed URL correctly redirects. Nothing to do.
  if (/^indexation-(migrated|uncheckable):/.test(issue.id)) continue;
  items.push({
    id: issue.id,
    priority: issue.severity,
    kind: 'seo-issue',
    title: issue.message,
    target: issue.page ?? issue.id.split(':').slice(1).join(':') ?? '/',
    evidence: `Weekly SEO audit ${audit?.generatedAt?.slice(0, 10) ?? ''}.`,
    action: 'Reproduce against the live site, fix the cause in src/, and confirm the next audit no longer reports it.',
  });
}

// ── 2. Engine suggestions still awaiting implementation ──────
const ledger = readJson<Array<{
  id: string; type: WorkItem['kind']; title: string; target: string; status: string;
  weeks?: string[]; evidence?: string; detail?: Record<string, unknown>;
}>>(join(ROOT, 'data/engine-ledger.json')) ?? [];

for (const entry of ledger.filter((e) => e.status === 'proposed')) {
  const weeks = entry.weeks?.length ?? 1;
  const action = entry.type === 'content-gap'
    ? `Write a new post at src/content/posts/${entry.target}.md following docs/seo/house-style.md. Populate title, description, category, targetKeyword, keyTakeaways (5), faq (5) and atomicAnswer.`
    : entry.type === 'interactive-tool'
      ? `Build src/pages/tools/${entry.target}.astro, modelled on the existing tool pages (FAQ block + FAQPage JSON-LD + inline vanilla JS). Add it to the /tools/ index.`
      : `Update the title and/or description frontmatter on the target page. Keep title <=41 chars and description 120-155 chars.`;
  items.push({
    id: entry.id,
    // Something proposed in two or more separate weekly cycles is durable
    // demand rather than one week's noise, so it outranks a single sighting.
    priority: weeks >= 2 ? 'P2' : 'P3',
    kind: entry.type,
    title: entry.title,
    target: entry.target,
    evidence: entry.evidence ?? '',
    action,
    weeksProposed: weeks,
  });
}

// ── 3. Outreach prospects ────────────────────────────────────
// Never auto-actioned. Reddit and forum posting under an agent is how a
// site earns a spam reputation; these are queued for a human.
type Prospect = { url: string; sourceType?: string; status?: string; whyRelevant?: string; pageToLink?: string; personalisedAngle?: string };
// prospects.json is an object wrapping a `prospects` array, but tolerate a
// bare array too — the backlinks job has used both shapes.
const prospectFile = readJson<Prospect[] | { prospects?: Prospect[] }>(join(ROOT, 'data/backlinks/prospects.json'));
const prospects: Prospect[] = Array.isArray(prospectFile) ? prospectFile : prospectFile?.prospects ?? [];
for (const [index, p] of prospects.filter((x) => (x.status ?? 'queued') === 'queued').entries()) {
  items.push({
    id: `outreach:${index}:${p.url}`,
    priority: 'P3',
    kind: 'outreach',
    title: `${p.sourceType ?? 'prospect'}: ${p.url}`,
    target: p.pageToLink ?? '/tools/',
    evidence: p.whyRelevant ?? '',
    action: `HUMAN ONLY — do not post automatically. ${p.personalisedAngle ?? 'Answer the question on its merits first; link only if it genuinely saves the reader work.'}`,
  });
}

// ── 4. Striking-distance queries ─────────────────────────────
// Position 5-20 with real impressions: the cheapest ranking wins available.
// Computed here from the latest daily observation rather than read from the
// trend file, which stores the model's synthesis but not the raw aggregates.
const trendPath = latestIn('data/trends');
const trend = trendPath ? readJson<{ week: string }>(trendPath) : null;
const obsPath = latestIn('data/observations');
type Row = { key: string; clicks: number; impressions: number; ctr: number; position: number };
const observation = obsPath ? readJson<{ date?: string; gsc?: { '7d'?: { current?: { query?: Row[]; page?: Row[] } } } }>(obsPath) : null;
const queryRows = observation?.gsc?.['7d']?.current?.query ?? [];

const striking = queryRows
  .filter((q) => q.position >= 5 && q.position <= 20 && q.impressions >= 5)
  // Impressions already earned but not converted is the size of the prize.
  .sort((a, b) => b.impressions - a.impressions)
  .slice(0, 10);
for (const q of striking) {
  items.push({
    id: `striking:${q.key}`,
    priority: 'P3',
    kind: 'striking-distance',
    title: `Improve ranking for "${q.key}"`,
    target: q.key,
    evidence: `${q.impressions} impressions at average position ${q.position.toFixed(1)} over the last 7 days, with ${q.clicks} click(s).`,
    action: 'Find the page already ranking for this query and deepen it on this specific sub-topic. Do NOT create a competing page — that causes cannibalization.',
    metrics: { impressions: q.impressions, clicks: q.clicks, position: Number(q.position.toFixed(1)) },
  });
}

const RANK: Record<Priority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
items.sort((a, b) => RANK[a.priority] - RANK[b.priority] || (b.weeksProposed ?? 0) - (a.weeksProposed ?? 0));

const payload = {
  generatedAt: new Date().toISOString(),
  site: nicheConfig.url,
  sources: {
    audit: auditPath ? auditPath.replace(`${ROOT}/`, '') : null,
    trend: trendPath ? trendPath.replace(`${ROOT}/`, '') : null,
    observation: obsPath ? obsPath.replace(`${ROOT}/`, "") : null,
    ledgerEntries: ledger.length,
    prospects: prospects.length,
  },
  counts: {
    total: items.length,
    P0: items.filter((i) => i.priority === 'P0').length,
    P1: items.filter((i) => i.priority === 'P1').length,
    P2: items.filter((i) => i.priority === 'P2').length,
    P3: items.filter((i) => i.priority === 'P3').length,
  },
  /** Ground rules an autonomous consumer of this queue must respect. */
  policy: {
    autoImplementable: ['seo-issue', 'content-gap', 'interactive-tool', 'ctr-rewrite'],
    humanOnly: ['outreach'],
    notes: [
      'Never post to Reddit, forums or email from an agent. Outreach items are for a human.',
      'Content must follow docs/seo/house-style.md: no invented experience, no invented statistics, a number with every claim.',
      `Niche-specific technical figures and safety claims are load-bearing. Follow the configured context: ${nicheConfig.nicheContext}`,
      'Open a branch and a pull request. Do not push to main.',
      'Run npm run build before proposing any change.',
    ],
  },
  items,
};

mkdirSync(join(ROOT, 'data'), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`📋 Work queue: ${items.length} items (P0 ${payload.counts.P0} · P1 ${payload.counts.P1} · P2 ${payload.counts.P2} · P3 ${payload.counts.P3}) → data/work-queue.json`);
