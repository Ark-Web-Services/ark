// ═══════════════════════════════════════════════════════════════
// ANALYZE.TS — Three-stage, budget-aware weekly analysis
// ═══════════════════════════════════════════════════════════════

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import nicheConfig, { getSiloIds } from '../niche.config';
import { SOURCE_WEIGHTS } from './lib/community';
import type { CommunitySource } from './lib/community';
import { recordSuggestions, resolveImplementations, writeWeeklyReview } from './lib/ledger';
import { assertLlmReady, callModel, getLlmRunStats, logLlmRunSummary, printLlmError } from './lib/llm';
import { escalate } from './lib/escalation';

export interface WeeklyTrend {
  generatedAt: string;
  week: string;
  communityTopics: Array<{ topic: string; evidence: Array<{ title: string; permalink: string; subreddit: string }>; reasoning: string }>;
  patterns: Array<{ pattern: string; direction: 'rising' | 'steady' | 'falling'; evidence: string }>;
  pages: { rising: Array<{ url: string; evidence: string; likelyReason: string }>; decaying: Array<{ url: string; evidence: string; likelyReason: string }> };
  contentGaps: Array<{ rank: number; title: string; suggestedSlug: string; targetKeyword: string; category: string; demandEvidence: string; whyWeCanWin: string; outline: string[]; sources?: Array<{ label: string; url: string; use: string }> }>;
  interactiveTool: { name: string; slug: string; problemSolved: string; evidence: string; reasoning: string };
  ctrRewrites: Array<{ url: string; currentTitle: string; proposedTitle: string; proposedDescription: string; impressions: number; ctr: number; position: number; rationale: string }>;
  analysis: {
    source?: "editorial-queue" | "gsc-community";
    observationDays: number;
    uniqueThreads: number;
    stage0Calls: 0;
    stage1Calls: number;
    stage1Requests: number;
    stage1CacheHits: number;
    stage1PredictSeconds: number;
    stage1EstimatedCostUsd: number;
    stage2Calls: number;
    stage2Requests: number;
    stage2PredictSeconds: number;
    stage2EstimatedCostUsd: number;
    totalLogicalCalls: number;
    totalRequests: number;
    predictSeconds: number;
    estimatedCostUsd: number;
  };
}

interface InventoryItem { title: string; slug: string; category: string; targetKeyword: string; date: string; wordCount: number }
interface CommunityThread {
  id: string;
  source: CommunitySource;
  sourceName: string;
  hasEngagement: boolean;
  subreddit: string;
  title: string;
  selftext: string;
  score: number | null;
  num_comments: number | null;
  upvote_ratio: number | null;
  flair: string | null;
  permalink: string;
  created_utc: number;
  sorts: string[];
  score_growth?: number | null;
}
interface ThreadLabel {
  id: string;
  topic: string;
  intent: 'question' | 'showcase' | 'problem' | 'buying-advice';
  entities: string[];
  existingPostSlug: string | null;
}
interface Metric { key: string; clicks: number; impressions: number; ctr: number; position: number }
interface DeltaRow { key: string; current: Metric; previous: Metric; delta: Metric }

const OBS_DIR = join(process.cwd(), 'data/observations');
const TREND_DIR = join(process.cwd(), 'data/trends');
const POSTS_DIR = join(process.cwd(), 'src/content/posts');
const LABEL_CACHE = join(OBS_DIR, 'thread-labels.json');
const LATEST_MD = join(process.cwd(), 'docs/trends/latest.md');
const LABEL_BATCH_SIZE = Math.max(20, Math.min(30, Number(process.env.LLM_LABEL_BATCH_SIZE || 25)));
const MAX_THREADS_TO_LABEL = Math.max(LABEL_BATCH_SIZE, Number(process.env.LLM_MAX_THREADS_TO_LABEL || 75));
const TITLE_SUFFIX = ` | ${nicheConfig.siteName}`;
const MAX_BRANDED_TITLE_LENGTH = Math.max(1, 60 - TITLE_SUFFIX.length);

function isoWeek(date = new Date()): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  utc.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function scalar(frontmatter: string, key: string): string {
  const raw = new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(frontmatter)?.[1]?.trim() ?? '';
  return raw.replace(/^['"]|['"]$/g, '');
}

function inventory(): InventoryItem[] {
  return readdirSync(POSTS_DIR).filter((file) => /\.mdx?$/.test(file)).map((file) => {
    const raw = readFileSync(join(POSTS_DIR, file), 'utf8');
    const parts = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    const frontmatter = parts?.[1] ?? '';
    const body = parts?.[2] ?? raw;
    const tagsLine = scalar(frontmatter, 'tags');
    const firstTag = tagsLine.replace(/^\[|\]$/g, '').split(',')[0]?.trim().replace(/^['"]|['"]$/g, '');
    return {
      title: scalar(frontmatter, 'title') || basename(file, file.endsWith('.mdx') ? '.mdx' : '.md'),
      slug: file.replace(/\.mdx?$/, ''),
      category: scalar(frontmatter, 'category'),
      targetKeyword: scalar(frontmatter, 'targetKeyword') || firstTag || scalar(frontmatter, 'title'),
      date: scalar(frontmatter, 'date'),
      wordCount: body.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length,
    };
  });
}

function observations(): any[] {
  if (!existsSync(OBS_DIR)) return [];
  return readdirSync(OBS_DIR).filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file)).sort().slice(-7)
    .map((file) => JSON.parse(readFileSync(join(OBS_DIR, file), 'utf8')));
}

function priorTrends(currentWeek: string): unknown[] {
  if (!existsSync(TREND_DIR)) return [];
  return readdirSync(TREND_DIR).filter((file) => /^\d{4}-W\d{2}\.json$/.test(file) && file !== `${currentWeek}.json`).sort().slice(-8)
    .map((file) => {
      const trend = JSON.parse(readFileSync(join(TREND_DIR, file), 'utf8')) as any;
      return { week: trend.week, communityTopics: trend.communityTopics, patterns: trend.patterns, pages: trend.pages };
    });
}

function isString(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0; }
function isTrend(value: unknown): value is Omit<WeeklyTrend, 'generatedAt' | 'week' | 'analysis'> {
  if (!value || typeof value !== 'object') return false;
  const item = value as any;
  const validGaps = Array.isArray(item.contentGaps) && item.contentGaps.length === 3 && item.contentGaps.every((gap: any) =>
    Number.isFinite(gap.rank) && isString(gap.title) && isString(gap.suggestedSlug) && isString(gap.targetKeyword) && getSiloIds().includes(gap.category) && isString(gap.demandEvidence) && isString(gap.whyWeCanWin) && Array.isArray(gap.outline));
  // Structural only. Length is enforced after the call by trimRewrites(),
  // because a description landing at 158 characters is a 3-character trim,
  // not a reason to discard an otherwise sound $0.30 weekly analysis.
  // Rejecting the batch here just meant the engine published nothing at all.
  const validRewrites = Array.isArray(item.ctrRewrites) && item.ctrRewrites.length === 5 && item.ctrRewrites.every((rewrite: any) =>
    isString(rewrite.url) && isString(rewrite.proposedTitle) && isString(rewrite.proposedDescription));
  return Array.isArray(item.communityTopics) && Array.isArray(item.patterns) && item.pages && Array.isArray(item.pages.rising) && Array.isArray(item.pages.decaying)
    && validGaps && item.interactiveTool && isString(item.interactiveTool.slug) && validRewrites;
}

/**
 * Bring proposed titles and descriptions inside their SERP limits.
 *
 * Both limits are real: a description over 155 characters is truncated by
 * Google, and a title longer than the available budget stops the site from
 * appending its configured brand suffix within 60 characters. But the model
 * lands a few characters over often enough that
 * treating it as a validation failure meant discarding the whole analysis.
 *
 * Trim at the last sentence, then clause, then word boundary — never
 * mid-word, and never with an ellipsis, which wastes SERP characters.
 * Anything still outside range after repair is reported, not silently kept.
 */
function trimToLimit(value: string, limit: number): string {
  const text = value.trim().replace(/\s+/g, ' ');
  if (text.length <= limit) return text;
  const window = text.slice(0, limit + 1);
  for (const pattern of [/[.!?](?=[^.!?]*$)/, /[;,](?=[^;,]*$)/]) {
    const at = window.search(pattern);
    // Only accept a boundary that keeps most of the text; trimming a
    // 158-character description back to 40 is worse than a word-boundary cut.
    if (at >= limit * 0.6) return window.slice(0, at + 1).replace(/[;,]$/, '').trim();
  }
  return window.slice(0, window.lastIndexOf(' ')).replace(/[\s,;:]+$/, '').trim();
}

function trimRewrites(rewrites: Array<{ url: string; proposedTitle: string; proposedDescription: string }>): string[] {
  const notes: string[] = [];
  for (const rewrite of rewrites) {
    const title = trimToLimit(rewrite.proposedTitle, MAX_BRANDED_TITLE_LENGTH);
    const description = trimToLimit(rewrite.proposedDescription, 155);
    if (title !== rewrite.proposedTitle) {
      notes.push(`trimmed title ${rewrite.proposedTitle.length}→${title.length} for ${rewrite.url}`);
      rewrite.proposedTitle = title;
    }
    if (description !== rewrite.proposedDescription) {
      notes.push(`trimmed description ${rewrite.proposedDescription.length}→${description.length} for ${rewrite.url}`);
      rewrite.proposedDescription = description;
    }
    // Too SHORT is not repairable by trimming — surface it rather than ship it.
    if (rewrite.proposedTitle.length < Math.min(25, MAX_BRANDED_TITLE_LENGTH)) notes.push(`⚠ title only ${rewrite.proposedTitle.length} chars (want ${Math.min(25, MAX_BRANDED_TITLE_LENGTH)}-${MAX_BRANDED_TITLE_LENGTH}) for ${rewrite.url}`);
    if (rewrite.proposedDescription.length < 120) notes.push(`⚠ description only ${rewrite.proposedDescription.length} chars (want 120-155) for ${rewrite.url}`);
  }
  return notes;
}

/**
 * Flag proposed content gaps that duplicate a page we already have.
 *
 * The content inventory is supplied in the Stage 2 prompt, but a weaker model
 * will still propose recreating an existing page with a suffix, such as
 * `<topic>-guide` when `<topic>` already exists. Acting on those would
 * manufacture the exact cannibalization the duplicate check is meant to stop.
 *
 * Annotated rather than dropped: contentGaps must be exactly 3, and silently
 * discarding one would leave the analysis structurally invalid. The annotation
 * rides along into the ledger and the work queue so nothing auto-implements a
 * duplicate.
 */
function flagDuplicateGaps(
  gaps: Array<{ title: string; suggestedSlug: string; demandEvidence: string }>,
  inventory: InventoryItem[],
): string[] {
  const notes: string[] = [];
  const slugs = inventory.map((item) => item.slug);
  const words = (value: string) => new Set(value.split('-').filter(Boolean));
  for (const gap of gaps) {
    const proposed = words(gap.suggestedSlug);
    const match = slugs.find((slug) => {
      if (slug === gap.suggestedSlug) return true;
      const existing = words(slug);
      const overlap = [...proposed].filter((word) => existing.has(word)).length;
      // Either side being almost wholly contained in the other means the same
      // page: "topic-overview" vs "topic-overview-guide".
      return overlap >= Math.min(proposed.size, existing.size) * 0.8;
    });
    if (!match) continue;
    notes.push(`"${gap.suggestedSlug}" duplicates existing /posts/${match}/`);
    gap.demandEvidence = `⚠ DUPLICATE RISK: /posts/${match}/ already covers this — improve that page instead of creating a new one. ${gap.demandEvidence}`;
  }
  return notes;
}

function engagement(thread: CommunityThread): number | null {
  return !thread.hasEngagement || thread.score === null ? null : thread.score + Math.max(0, thread.num_comments ?? 0);
}

function demandWeight(thread: CommunityThread): number {
  const measuredEngagement = engagement(thread);
  return SOURCE_WEIGHTS[thread.source] * (1 + (measuredEngagement === null ? 0 : Math.log1p(Math.max(0, measuredEngagement))));
}

const CLUSTER_STOPWORDS = new Set([
  ...'about after again also been being could from have into just more most only other over same some such than that their them then there these they this those through very what when where which while with would your help question anyone please'.split(' '),
  ...nicheConfig.nicheNoun.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/),
].filter(Boolean));
function tokens(value: string): string[] {
  return value.toLowerCase().replace(/^https?:\/\/[^/]+/i, '').replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/)
    .map((word) => word.endsWith('s') && word.length > 4 ? word.slice(0, -1) : word)
    .filter((word) => word.length > 2 && !CLUSTER_STOPWORDS.has(word));
}

function uniqueThreads(items: any[]): CommunityThread[] {
  const result = new Map<string, CommunityThread>();
  for (const observation of items) {
    const observedRecords = Array.isArray(observation.community?.records)
      ? observation.community.records
      : (observation.community?.reddit?.threads ?? []);
    for (const value of observedRecords) {
      const fallbackId = /comments\/([a-z0-9]+)/i.exec(String(value?.permalink ?? ''))?.[1];
      const id = String(value?.id ?? fallbackId ?? '').trim();
      if (!id || !value?.title) continue;
      const legacySource = value.source === 'rss' ? 'reddit-rss' : 'reddit-oauth';
      const source = Object.hasOwn(SOURCE_WEIGHTS, value.source) ? value.source as CommunitySource : legacySource;
      const sourceName = String(value.sourceName ?? (source.startsWith('reddit-') ? `r/${value.subreddit ?? '(unknown)'}` : value.subreddit ?? source));
      const thread = {
        ...value,
        id,
        source,
        sourceName,
        hasEngagement: typeof value.hasEngagement === 'boolean' ? value.hasEngagement : typeof value.score === 'number',
        subreddit: String(value.subreddit ?? sourceName),
        selftext: String(value.selftext ?? ''),
        num_comments: typeof value.num_comments === 'number' ? value.num_comments : (typeof value.commentCount === 'number' ? value.commentCount : null),
        upvote_ratio: typeof value.upvote_ratio === 'number' ? value.upvote_ratio : null,
        flair: typeof value.flair === 'string' ? value.flair : null,
        created_utc: typeof value.created_utc === 'number' ? value.created_utc : Date.parse(String(value.createdAt ?? '')) / 1000,
        sorts: Array.isArray(value.sorts) ? value.sorts : ['new'],
      } as CommunityThread;
      const key = thread.source.startsWith('reddit-') ? `reddit:${thread.id}` : `${thread.source}:${thread.id}`;
      const previous = result.get(key);
      const oauthRecord = thread.source === 'reddit-oauth' ? thread : previous?.source === 'reddit-oauth' ? previous : null;
      result.set(key, previous ? {
        ...previous, ...thread, ...(oauthRecord ?? {}),
        selftext: thread.selftext || previous.selftext,
        score: thread.score ?? previous.score,
        num_comments: thread.num_comments ?? previous.num_comments,
        hasEngagement: thread.hasEngagement || previous.hasEngagement,
        sorts: [...new Set([...(previous.sorts ?? []), ...(thread.sorts ?? [])])],
      } : thread);
    }
  }
  return [...result.values()].sort((a, b) => demandWeight(b) - demandWeight(a) || b.created_utc - a.created_utc || a.id.localeCompare(b.id));
}

function clustersFor(threads: CommunityThread[]): unknown[] {
  const candidates = new Map<string, { ids: Set<string>; weightedEngagement: number; weightedDemand: number; sources: Map<CommunitySource, number> }>();
  for (const thread of threads) {
    const threadTokens = tokens(`${thread.title} ${thread.selftext}`);
    const weight = engagement(thread) ?? 0;
    for (let size = 1; size <= 3; size++) {
      const phrases = new Set<string>();
      for (let index = 0; index <= threadTokens.length - size; index++) phrases.add(threadTokens.slice(index, index + size).join(' '));
      for (const phrase of phrases) {
        const value = candidates.get(phrase) ?? { ids: new Set<string>(), weightedEngagement: 0, weightedDemand: 0, sources: new Map<CommunitySource, number>() };
        value.ids.add(thread.id);
        value.weightedEngagement += weight;
        value.weightedDemand += demandWeight(thread);
        value.sources.set(thread.source, (value.sources.get(thread.source) ?? 0) + 1);
        candidates.set(phrase, value);
      }
    }
  }
  return [...candidates].filter(([, value]) => value.ids.size >= 3)
    .sort((a, b) => b[1].weightedDemand - a[1].weightedDemand || b[1].ids.size - a[1].ids.size || a[0].localeCompare(b[0]))
    .slice(0, 15)
    .map(([term, value]) => ({
      term,
      threadCount: value.ids.size,
      weightedEngagement: value.weightedEngagement,
      weightedDemand: Number(value.weightedDemand.toFixed(4)),
      sources: [...value.sources].map(([source, recordCount]) => ({ source, recordCount }))
        .sort((a, b) => b.recordCount - a.recordCount || a.source.localeCompare(b.source)),
      evidence: threads.filter((thread) => value.ids.has(thread.id)).slice(0, 5).map((thread) => ({
        id: thread.id, title: thread.title, source: thread.source, sourceName: thread.sourceName, subreddit: thread.subreddit, permalink: thread.permalink,
        score: thread.score, num_comments: thread.num_comments, score_growth: thread.score_growth ?? null,
      })),
    }));
}

function asMetrics(value: any): Metric[] {
  return Array.isArray(value) ? value.filter((row) => row && typeof row.key === 'string') : [];
}

function asDeltas(value: any): DeltaRow[] {
  return Array.isArray(value) ? value.filter((row) => row && typeof row.key === 'string' && row.current && row.delta) : [];
}

function overlapScore(left: string, right: string): number {
  const a = new Set(tokens(left));
  const b = new Set(tokens(right));
  const intersection = [...a].filter((word) => b.has(word)).length;
  return intersection / Math.max(1, Math.min(a.size, b.size));
}

function stageZero(items: any[]): { aggregates: any; threads: CommunityThread[] } {
  const latest = items.at(-1);
  const threads = uniqueThreads(items);
  const gsc = latest?.gsc?.['28d'];
  const queries = asMetrics(gsc?.current?.query);
  const pages = asMetrics(gsc?.current?.page);
  const queryDeltas = asDeltas(gsc?.deltas?.query);
  const pageDeltas = asDeltas(gsc?.deltas?.page);
  const pageDeltaMap = new Map(pageDeltas.map((row) => [row.key, row]));
  const totalImpressions = Number(gsc?.totals?.current?.impressions ?? pages.reduce((sum, row) => sum + row.impressions, 0));

  const zeroClickScore = (row: Metric) => row.impressions * Math.max(1, 21 - row.position);
  const zeroClickQueries = queries.filter((row) => row.clicks === 0 && row.impressions > 0 && row.position <= 20)
    .map((row) => ({ ...row, opportunityScore: zeroClickScore(row) })).sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 30);
  const strict = (row: Metric) => row.position >= 5 && row.position <= 20 && row.impressions > 0 && row.clicks === 0;
  const strikingDistanceQueries = queries.filter(strict).map((row) => ({ ...row, opportunityScore: zeroClickScore(row) })).sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 30);
  const strikingDistancePages = pages.filter(strict).map((row) => ({
    ...row, opportunityScore: zeroClickScore(row), impressionShare: totalImpressions ? row.impressions / totalImpressions : 0,
  })).sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 20);
  const worstCtrPages = pages.filter((row) => row.impressions > 0 && row.position <= 30).map((row) => ({
    ...row,
    impressionShare: totalImpressions ? row.impressions / totalImpressions : 0,
    ctrOpportunityScore: row.impressions * Math.max(0, Math.min(0.25, 1 / Math.max(2, row.position)) - row.ctr),
  })).sort((a, b) => b.ctrOpportunityScore - a.ctrOpportunityScore).slice(0, 15);
  const queryPageJoins = zeroClickQueries.slice(0, 20).map((query) => {
    const matches = pages.map((page) => ({ page, score: overlapScore(query.key, page.key) })).sort((a, b) => b.score - a.score);
    const match = matches[0];
    return {
      query,
      matchedPage: match && match.score >= 0.34 ? match.page : null,
      tokenOverlap: match?.score ?? 0,
      queryDelta: queryDeltas.find((row) => row.key === query.key)?.delta ?? null,
      pageDelta: match && match.score >= 0.34 ? pageDeltaMap.get(match.page.key)?.delta ?? null : null,
    };
  });
  const risingPages = pageDeltas.filter((row) => row.delta.impressions > 0).sort((a, b) => b.delta.impressions - a.delta.impressions).slice(0, 15);
  const decayingPages = pageDeltas.filter((row) => row.delta.impressions < 0).sort((a, b) => a.delta.impressions - b.delta.impressions).slice(0, 15);

  return {
    threads,
    aggregates: {
      observationDates: items.map((item) => item.date),
      uniqueThreadCount: threads.length,
      recordsWithEngagement: threads.filter((thread) => thread.hasEngagement).length,
      sourceWeights: SOURCE_WEIGHTS,
      sourceRecordCounts: Object.fromEntries((Object.keys(SOURCE_WEIGHTS) as CommunitySource[]).map((source) => [source, threads.filter((thread) => thread.source === source).length])),
      deterministicTermFrequency: latest?.termFrequency ?? null,
      topThreads: threads.slice(0, 40).map((thread) => ({
        id: thread.id, title: thread.title, source: thread.source, sourceName: thread.sourceName, subreddit: thread.subreddit, permalink: thread.permalink,
        score: thread.score, num_comments: thread.num_comments, upvote_ratio: thread.upvote_ratio,
        flair: thread.flair, score_growth: thread.score_growth ?? null, engagement: engagement(thread), weightedDemand: Number(demandWeight(thread).toFixed(4)),
      })),
      communityClusters: clustersFor(threads),
      communityBuckets: latest?.community?.buckets ? {
        questionCount: latest.community.buckets.questions?.length ?? 0,
        problemCount: latest.community.buckets.problems?.length ?? 0,
        byFlair: latest.community.buckets.byFlair ?? [],
        bySource: latest.community.buckets.bySource ?? [],
        questionEvidence: (latest.community.buckets.questions ?? []).slice(0, 10).map((thread: CommunityThread) => ({ id: thread.id, title: thread.title, source: thread.source, sourceName: thread.sourceName, subreddit: thread.subreddit, permalink: thread.permalink })),
        problemEvidence: (latest.community.buckets.problems ?? []).slice(0, 10).map((thread: CommunityThread) => ({ id: thread.id, title: thread.title, source: thread.source, sourceName: thread.sourceName, subreddit: thread.subreddit, permalink: thread.permalink })),
      } : null,
      gscPeriod: { startDate: gsc?.startDate, endDate: gsc?.endDate, totals: gsc?.totals },
      zeroClickQueries,
      strikingDistanceQueries,
      strikingDistancePages,
      worstCtrPages,
      risingPages,
      decayingPages,
      queryPageJoins,
    },
  };
}

function readLabelCache(): Record<string, ThreadLabel> {
  if (!existsSync(LABEL_CACHE)) return {};
  try { return (JSON.parse(readFileSync(LABEL_CACHE, 'utf8')) as { labels?: Record<string, ThreadLabel> }).labels ?? {}; } catch { return {}; }
}

function labelsAreValid(value: unknown, ids: Set<string>): value is ThreadLabel[] {
  return Array.isArray(value) && value.length === ids.size && value.every((label: any) =>
    ids.has(label?.id) && isString(label.topic) && ['question', 'showcase', 'problem', 'buying-advice'].includes(label.intent)
    && Array.isArray(label.entities) && label.entities.every(isString) && (label.existingPostSlug === null || typeof label.existingPostSlug === 'string'));
}

async function stageOne(threads: CommunityThread[], content: InventoryItem[]): Promise<{ labels: ThreadLabel[]; calls: number; requests: number; cacheHits: number; predictSeconds: number; estimatedCostUsd: number }> {
  const cache = readLabelCache();
  const selected = threads.slice(0, MAX_THREADS_TO_LABEL);
  const cached = selected.filter((thread) => cache[thread.id]);
  const pending = selected.filter((thread) => !cache[thread.id]);
  const before = getLlmRunStats();
  console.log(`🏷️ Stage 1 — LIGHT labels: ${selected.length} selected; ${cached.length} cache hits; ${pending.length} uncached`);
  for (let offset = 0; offset < pending.length; offset += LABEL_BATCH_SIZE) {
    const batch = pending.slice(offset, offset + LABEL_BATCH_SIZE);
    const ids = new Set(batch.map((thread) => thread.id));
    console.log(`   Batch ${Math.floor(offset / LABEL_BATCH_SIZE) + 1}: ${batch.length} threads`);
    const labels = await callModel<ThreadLabel[]>({
      tier: 'light', json: true, maxTokens: 6000, temperature: 0,
      schema: {
        type: 'array', minItems: batch.length, maxItems: batch.length,
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', enum: batch.map((thread) => thread.id) },
            topic: { type: 'string' },
            intent: { type: 'string', enum: ['question', 'showcase', 'problem', 'buying-advice'] },
            entities: { type: 'array', items: { type: 'string' } },
            existingPostSlug: { type: ['string', 'null'] },
          },
          required: ['id', 'topic', 'intent', 'entities', 'existingPostSlug'],
        },
      },
      validate: (value): value is ThreadLabel[] => labelsAreValid(value, ids),
      system: `You label community and demand records about ${nicheConfig.nicheNoun} mechanically. ${nicheConfig.nicheContext} Do not synthesize trends. Return one JSON array item per input ID and no other text.`,
      prompt: `For every record, return {id, topic (short normalized phrase), intent (exactly question|showcase|problem|buying-advice), entities (notable niche-specific entities; [] when absent), existingPostSlug (one supplied slug or null)}.\n\nRECORDS:\n${JSON.stringify(batch.map((thread) => ({ id: thread.id, source: thread.source, sourceName: thread.sourceName, title: thread.title, selftext: thread.selftext.slice(0, 1200), subreddit: thread.subreddit, flair: thread.flair })))}\n\nEXISTING POSTS:\n${JSON.stringify(content.map((item) => ({ slug: item.slug, title: item.title, category: item.category })))}`,
    });
    for (const label of labels) cache[label.id] = label;
    writeFileSync(LABEL_CACHE, `${JSON.stringify({ updatedAt: new Date().toISOString(), labels: cache }, null, 2)}\n`);
  }
  const after = getLlmRunStats();
  const calls = after.logicalCalls - before.logicalCalls;
  const requests = after.requests - before.requests;
  const stagePredictSeconds = after.predictSeconds - before.predictSeconds;
  const stageCost = after.estimatedCostUsd - before.estimatedCostUsd;
  console.log(`   ✅ Stage 1 complete: ${calls} LIGHT calls, ${requests} HTTP requests, ${cached.length} cache hits, ${stagePredictSeconds.toFixed(2)}s predict time, estimated $${stageCost.toFixed(4)}`);
  return {
    labels: selected.map((thread) => cache[thread.id]).filter(Boolean), calls, requests, cacheHits: cached.length,
    predictSeconds: stagePredictSeconds, estimatedCostUsd: stageCost,
  };
}

function trendMarkdown(trend: WeeklyTrend): string {
  return `# Weekly trend brief — ${trend.week}\n\nGenerated ${trend.generatedAt}.\n\n## Community discussion\n\n${trend.communityTopics.map((topic) => `- **${topic.topic}:** ${topic.reasoning}\n  ${topic.evidence.map((item) => `[${item.title}](${item.permalink})`).join('; ')}`).join('\n')}\n\n## Movement\n\n### Rising pages\n\n${trend.pages.rising.map((page) => `- ${page.url} — ${page.evidence} Likely reason: ${page.likelyReason}`).join('\n') || '- None with sufficient evidence.'}\n\n### Decaying pages\n\n${trend.pages.decaying.map((page) => `- ${page.url} — ${page.evidence} Likely reason: ${page.likelyReason}`).join('\n') || '- None with sufficient evidence.'}\n\n## Highest-value content gaps\n\n${trend.contentGaps.map((gap) => `${gap.rank}. **${gap.title}** (${gap.targetKeyword}, ${gap.category}) — ${gap.demandEvidence} ${gap.whyWeCanWin}`).join('\n')}\n\n## Interactive tool\n\n**${trend.interactiveTool.name}** at \`${trend.interactiveTool.slug}\`: ${trend.interactiveTool.problemSolved}\n\n${trend.interactiveTool.evidence} ${trend.interactiveTool.reasoning}\n\n## CTR rewrites\n\n${trend.ctrRewrites.map((item) => `### ${item.url}\n\n- Proposed title: ${item.proposedTitle}\n- Proposed description: ${item.proposedDescription}\n- Rationale: ${item.rationale}`).join('\n\n')}\n`;
}

export async function analyze(): Promise<void> {
  console.log('\n🧠 WEEKLY ANALYSIS — Three-stage demand, rankings, gaps, tools, CTR\n');
  await assertLlmReady();
  const recent = observations();
  if (!recent.length) throw new Error('No daily observations found. Run npm run observe first.');
  const week = isoWeek();
  const content = inventory();

  console.log(`🧮 Stage 0 — deterministic aggregation across ${recent.length} observation day(s); 0 model calls`);
  const stage0 = stageZero(recent);
  console.log(`   ✅ ${stage0.threads.length} unique community/demand records; ${stage0.aggregates.strikingDistanceQueries.length} strict striking-distance queries; ${stage0.aggregates.strikingDistancePages.length} strict striking-distance pages`);
  const topZeroQuery = stage0.aggregates.zeroClickQueries[0];
  const topCtrPage = stage0.aggregates.worstCtrPages[0];
  if (topZeroQuery) console.log(`   Top zero-click query: "${topZeroQuery.key}" — ${topZeroQuery.impressions} impressions, position ${topZeroQuery.position}`);
  if (topCtrPage) console.log(`   Top CTR page: ${topCtrPage.key} — ${topCtrPage.impressions} impressions, ${(topCtrPage.ctr * 100).toFixed(2)}% CTR, position ${topCtrPage.position}, ${(topCtrPage.impressionShare * 100).toFixed(1)}% impression share`);

  const stage1 = await stageOne(stage0.threads, content);
  const beforeHeavy = getLlmRunStats();
  console.log('🧠 Stage 2 — HEAVY weekly synthesis: exactly one logical model call');
  const schemaDescription = `Return one JSON object with: communityTopics[{topic,evidence[{title,permalink,subreddit}],reasoning}], patterns[{pattern,direction(rising|steady|falling),evidence}], pages{rising[{url,evidence,likelyReason}],decaying[...]}, exactly 3 contentGaps[{rank,title,suggestedSlug,targetKeyword,category,demandEvidence,whyWeCanWin,outline[]}], interactiveTool{name,slug,problemSolved,evidence,reasoning}, and exactly 5 ctrRewrites[{url,currentTitle,proposedTitle,proposedDescription,impressions,ctr,position,rationale}].`;
  // Stage 2 sends four JSON blobs. Log the size: a local model silently
  // truncates anything past its num_ctx, which surfaces as the model ignoring
  // the schema and writing prose instead of an error.
  const promptChars = JSON.stringify(stage0.aggregates).length + JSON.stringify(stage1.labels).length
    + JSON.stringify(content).length + JSON.stringify(priorTrends(week)).length;
  console.log(`   📏 Stage 2 prompt payload ≈ ${(promptChars / 1024).toFixed(0)}KB (~${Math.round(promptChars / 3.7).toLocaleString('en-US')} tokens)`);

  const str = { type: 'string' };
  const pageMove = { type: 'array', items: { type: 'object', properties: { url: str, evidence: str, likelyReason: str }, required: ['url', 'evidence', 'likelyReason'] } };
  const trendSchema = {
    type: 'object',
    properties: {
      communityTopics: { type: 'array', items: { type: 'object', properties: {
        topic: str, reasoning: str,
        evidence: { type: 'array', items: { type: 'object', properties: { title: str, permalink: str, subreddit: str }, required: ['title', 'permalink', 'subreddit'] } },
      }, required: ['topic', 'evidence', 'reasoning'] } },
      patterns: { type: 'array', items: { type: 'object', properties: {
        pattern: str, direction: { type: 'string', enum: ['rising', 'steady', 'falling'] }, evidence: str,
      }, required: ['pattern', 'direction', 'evidence'] } },
      pages: { type: 'object', properties: { rising: pageMove, decaying: pageMove }, required: ['rising', 'decaying'] },
      contentGaps: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'object', properties: {
        rank: { type: 'number' }, title: str, suggestedSlug: str, targetKeyword: str,
        category: { type: 'string', enum: getSiloIds() },
        demandEvidence: str, whyWeCanWin: str, outline: { type: 'array', items: str },
      }, required: ['rank', 'title', 'suggestedSlug', 'targetKeyword', 'category', 'demandEvidence', 'whyWeCanWin', 'outline'] } },
      interactiveTool: { type: 'object', properties: { name: str, slug: str, problemSolved: str, evidence: str, reasoning: str },
        required: ['name', 'slug', 'problemSolved', 'evidence', 'reasoning'] },
      ctrRewrites: { type: 'array', minItems: 5, maxItems: 5, items: { type: 'object', properties: {
        url: str, currentTitle: str, proposedTitle: str, proposedDescription: str,
        impressions: { type: 'number' }, ctr: { type: 'number' }, position: { type: 'number' }, rationale: str,
      }, required: ['url', 'currentTitle', 'proposedTitle', 'proposedDescription', 'impressions', 'ctr', 'position', 'rationale'] } },
    },
    required: ['communityTopics', 'patterns', 'pages', 'contentGaps', 'interactiveTool', 'ctrRewrites'],
  };

  const result = await callModel<Omit<WeeklyTrend, 'generatedAt' | 'week' | 'analysis'>>({
    tier: 'heavy', json: true, validate: isTrend, maxTokens: 32000, temperature: 0.2, schema: trendSchema,
    system: `You are the weekly SEO and editorial analyst for ${nicheConfig.siteName}. Use only supplied aggregates and labels; explicitly say when evidence is weak. Source weights are deterministic demand priors, not audience-size estimates. Reddit OAuth records may include measured engagement; Reddit RSS, YouTube RSS, forum RSS, and autocomplete do not, so never treat their missing engagement as zero popularity. Never invent a statistic, percentage, study, DOI, citation, or source. Never claim a topic was "most discussed" without citing record count, source mix, weighted demand, and measured engagement where available. Categories must be one of: ${getSiloIds().join(', ')}. ${schemaDescription}`,
    prompt: `Produce the weekly synthesis from Stage 0 arithmetic and Stage 1 labels. Explain what demand signals were strongest with record-count and source evidence; compare emerging patterns with previous weeks; explain rising and decaying pages without overstating causality; rank three content gaps; propose one concrete interactive tool; and rewrite title/description for the five worst high-impression CTR pages. Every proposed title must be ${Math.min(25, MAX_BRANDED_TITLE_LENGTH)}-${MAX_BRANDED_TITLE_LENGTH} characters: the site appends "${TITLE_SUFFIX}" (${TITLE_SUFFIX.length} characters) only when the result stays within 60. Every proposed description must be 120-155 characters, ideally 140-155 -- exceeding 155 gets truncated in search results, which is the failure that matters. Prioritize zero-click pages and queries even when they already rank on page one. Do not invent statistics or ask for or infer from the raw corpus: it is intentionally excluded.\n\nSTAGE 0 AGGREGATES:\n${JSON.stringify(stage0.aggregates)}\n\nSTAGE 1 LABELS:\n${JSON.stringify(stage1.labels)}\n\nCONTENT INVENTORY:\n${JSON.stringify(content)}\n\nPRIOR WEEKLY SUMMARIES:\n${JSON.stringify(priorTrends(week))}`,
  });
  const trimNotes = trimRewrites(result.ctrRewrites);
  for (const note of trimNotes) console.log(`   ✂️  ${note}`);

  const dupeNotes = flagDuplicateGaps(result.contentGaps, content);
  for (const note of dupeNotes) console.warn(`   ⚠️  ${note}`);

  // Hand the model's own weak spots to a stronger reviewer rather than either
  // acting on them or throwing them away. Both signals below are measured
  // failure modes of the local model, not hypotheticals.
  const queued = escalate([
    ...result.contentGaps
      .filter((gap) => gap.demandEvidence.startsWith('⚠ DUPLICATE RISK'))
      .map((gap) => ({
        id: `duplicate-gap:${gap.suggestedSlug}`,
        kind: 'duplicate-gap' as const,
        subject: `${gap.title} (${gap.suggestedSlug})`,
        reason: 'Proposed a new page that duplicates an existing one. Decide whether to improve the existing page, genuinely differentiate the intents, or drop the suggestion.',
        context: { suggestedSlug: gap.suggestedSlug, targetKeyword: gap.targetKeyword, evidence: gap.demandEvidence, existingSlugs: content.map((item) => item.slug) },
        sourceJob: 'analyze',
      })),
    ...(trimNotes.some((note) => note.startsWith('⚠'))
      ? [{
          id: `constraint-violation:${week}`,
          kind: 'constraint-violation' as const,
          subject: `${trimNotes.filter((note) => note.startsWith('⚠')).length} title/description(s) outside SERP limits in ${week}`,
          reason: 'Lengths were repaired automatically where possible, but some fell below the floor, which trimming cannot fix. Needs rewriting with the constraint respected.',
          context: { notes: trimNotes, rewrites: result.ctrRewrites.map((item) => ({ url: item.url, title: item.proposedTitle, description: item.proposedDescription })) },
          sourceJob: 'analyze',
        }]
      : []),
  ]);
  if (queued) console.log(`   ⤴️  ${queued} item(s) queued for heavier-model review (data/escalation-queue.json)`);

  const afterHeavy = getLlmRunStats();
  const stage2Calls = afterHeavy.logicalCalls - beforeHeavy.logicalCalls;
  if (stage2Calls !== 1) throw new Error(`Stage 2 violated its one-call contract: measured ${stage2Calls} logical calls.`);
  const stage2Requests = afterHeavy.requests - beforeHeavy.requests;
  const stage2PredictSeconds = afterHeavy.predictSeconds - beforeHeavy.predictSeconds;
  const stage2Cost = afterHeavy.estimatedCostUsd - beforeHeavy.estimatedCostUsd;
  console.log(`   ✅ Stage 2 complete: ${stage2Calls} HEAVY call, ${stage2Requests} HTTP request(s), ${stage2PredictSeconds.toFixed(2)}s predict time, estimated $${stage2Cost.toFixed(4)}`);

  const trend: WeeklyTrend = {
    ...result,
    generatedAt: new Date().toISOString(),
    week,
    analysis: {
      observationDays: recent.length,
      uniqueThreads: stage0.threads.length,
      stage0Calls: 0,
      stage1Calls: stage1.calls,
      stage1Requests: stage1.requests,
      stage1CacheHits: stage1.cacheHits,
      stage1PredictSeconds: stage1.predictSeconds,
      stage1EstimatedCostUsd: stage1.estimatedCostUsd,
      stage2Calls: 1,
      stage2Requests,
      stage2PredictSeconds,
      stage2EstimatedCostUsd: stage2Cost,
      totalLogicalCalls: afterHeavy.logicalCalls,
      totalRequests: afterHeavy.requests,
      predictSeconds: afterHeavy.predictSeconds,
      estimatedCostUsd: afterHeavy.estimatedCostUsd,
    },
  };
  mkdirSync(TREND_DIR, { recursive: true });
  mkdirSync(join(process.cwd(), 'docs/trends'), { recursive: true });
  const output = join(TREND_DIR, `${week}.json`);
  writeFileSync(output, `${JSON.stringify(trend, null, 2)}\n`);
  writeFileSync(LATEST_MD, trendMarkdown(trend));
  recordSuggestions(trend);
  resolveImplementations();
  writeWeeklyReview(trend);
  console.log(`✅ Trend analysis written: ${output}`);
  console.log(`✅ Human brief written: ${LATEST_MD}`);
  console.log(`✅ Suggestion ledger and weekly review refreshed`);
  logLlmRunSummary('Weekly analysis');
}

async function main(): Promise<void> {
  try { await analyze(); } catch (error) { printLlmError(error); process.exitCode = 1; }
}
if (process.argv[1]?.endsWith('analyze.ts')) main();
