// ═══════════════════════════════════════════════════════════════
// OBSERVE.TS — Daily GSC, indexation, health, and community snapshot
// ═══════════════════════════════════════════════════════════════

import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import nicheConfig from '../niche.config';
import { gsc } from './lib/gsc';
import type { GscRow } from './lib/gsc';
import {
  collectForumFeeds,
  collectGoogleAutocomplete,
  collectReddit as collectRedditSignals,
  collectYouTube,
  deterministicBuckets as bucketCommunityRecords,
  mergeCommunityRecords,
  termFrequency as communityTermFrequency,
} from './lib/community';
import type {
  CommunityRecord,
  CommunitySource,
  OpenSourceCollection,
  RedditThread as CollectedRedditThread,
} from './lib/community';

type Dimension = 'query' | 'page' | 'country';
interface MetricRow { key: string; clicks: number; impressions: number; ctr: number; position: number }
interface PeriodData {
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
  current: Record<Dimension, MetricRow[]>;
  previous: Record<Dimension, MetricRow[]>;
  deltas: Record<Dimension, Array<{ key: string; current: Metrics; previous: Metrics; delta: Metrics }>>;
  totals: { current: Metrics; previous: Metrics; delta: Metrics };
}
interface Metrics { clicks: number; impressions: number; ctr: number; position: number }

const SITE = nicheConfig.url.replace(/\/$/, '');
const OBSERVATION_DIR = join(process.cwd(), 'data/observations');
const INDEX_FILE = join(OBSERVATION_DIR, 'index.json');
const COMMUNITY_INDEX_FILE = join(OBSERVATION_DIR, 'community-index.json');
const AGENT_NAME = nicheConfig.siteName.replace(/[^a-z0-9]+/gi, '') || 'NicheSite';
const USER_AGENT = process.env.OBSERVATION_USER_AGENT
  || `${AGENT_NAME}Bot/1.0 (+${SITE}/contact/; daily community trend research)`;

function dateOnly(date: Date): string { return date.toISOString().slice(0, 10); }
function localToday(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: process.env.TZ || 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}
function shift(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}
function round(value: number): number { return Number(value.toFixed(6)); }

function rowsToMetrics(rows: GscRow[]): MetricRow[] {
  return rows.map((row) => ({
    key: row.keys?.[0] ?? '(unknown)',
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  })).sort((a, b) => b.impressions - a.impressions);
}

function totals(rows: MetricRow[]): Metrics {
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const weightedPosition = rows.reduce((sum, row) => sum + row.position * row.impressions, 0);
  return {
    clicks,
    impressions,
    ctr: impressions ? clicks / impressions : 0,
    position: impressions ? weightedPosition / impressions : 0,
  };
}

function metricDelta(current: Metrics, previous: Metrics): Metrics {
  return {
    clicks: current.clicks - previous.clicks,
    impressions: current.impressions - previous.impressions,
    ctr: round(current.ctr - previous.ctr),
    position: round(current.position - previous.position),
  };
}

function rowDeltas(current: MetricRow[], previous: MetricRow[]): Array<{ key: string; current: Metrics; previous: Metrics; delta: Metrics }> {
  const currentMap = new Map(current.map((row) => [row.key, row]));
  const previousMap = new Map(previous.map((row) => [row.key, row]));
  const empty: Metrics = { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  return [...new Set([...currentMap.keys(), ...previousMap.keys()])].map((key) => {
    const now = currentMap.get(key) ?? empty;
    const prior = previousMap.get(key) ?? empty;
    return { key, current: now, previous: prior, delta: metricDelta(now, prior) };
  }).sort((a, b) => Math.abs(b.delta.impressions) - Math.abs(a.delta.impressions));
}

async function collectPeriod(days: number, laggedEnd: Date): Promise<PeriodData> {
  const start = shift(laggedEnd, -(days - 1));
  const previousEnd = shift(start, -1);
  const previousStart = shift(previousEnd, -(days - 1));
  const dimensions: Dimension[] = ['query', 'page', 'country'];
  const current = {} as Record<Dimension, MetricRow[]>;
  const previous = {} as Record<Dimension, MetricRow[]>;

  await Promise.all(dimensions.map(async (dimension) => {
    const [nowRows, priorRows] = await Promise.all([
      gsc.searchAnalytics({ startDate: dateOnly(start), endDate: dateOnly(laggedEnd), dimensions: [dimension], rowLimit: 25000 }),
      gsc.searchAnalytics({ startDate: dateOnly(previousStart), endDate: dateOnly(previousEnd), dimensions: [dimension], rowLimit: 25000 }),
    ]);
    current[dimension] = rowsToMetrics(nowRows);
    previous[dimension] = rowsToMetrics(priorRows);
  }));

  const currentTotals = totals(current.page);
  const previousTotals = totals(previous.page);
  const deltas = Object.fromEntries(dimensions.map((dimension) => [dimension, rowDeltas(current[dimension], previous[dimension])])) as PeriodData['deltas'];
  return {
    startDate: dateOnly(start),
    endDate: dateOnly(laggedEnd),
    previousStartDate: dateOnly(previousStart),
    previousEndDate: dateOnly(previousEnd),
    current,
    previous,
    deltas,
    totals: { current: currentTotals, previous: previousTotals, delta: metricDelta(currentTotals, previousTotals) },
  };
}

function xmlValues(xml: string, tag: string): string[] {
  return [...xml.matchAll(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([^<\\]]+)(?:\\]\\]>)?</${tag}>`, 'gi'))]
    .map((match) => match[1].trim().replace(/&amp;/g, '&'));
}

async function fetchText(url: string): Promise<{ status: number; text: string }> {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/xml,text/xml,application/json,text/html,*/*' },
    signal: AbortSignal.timeout(15_000),
  });
  return { status: response.status, text: await response.text() };
}

async function sitemapUrls(): Promise<string[]> {
  const indexUrl = `${SITE}/sitemap-index.xml`;
  const index = await fetchText(indexUrl);
  if (index.status !== 200) throw new Error(`Live sitemap returned HTTP ${index.status}: ${indexUrl}`);
  const children = xmlValues(index.text, 'loc');
  const urls: string[] = [];
  for (const child of children) {
    const response = await fetchText(child);
    if (response.status === 200) urls.push(...xmlValues(response.text, 'loc'));
  }
  return [...new Set(urls.filter((url) => url.startsWith(SITE)))];
}

async function healthCheck(url: string): Promise<{ url: string; status: number; ttfbMs: number; error?: string }> {
  const started = performance.now();
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(20_000),
    });
    const ttfbMs = Math.round(performance.now() - started);
    await response.body?.cancel();
    return { url, status: response.status, ttfbMs };
  } catch (error) {
    return { url, status: 0, ttfbMs: Math.round(performance.now() - started), error: (error as Error).message };
  }
}

async function isolatedOpenSource(
  label: string,
  source: Exclude<CommunitySource, 'reddit-oauth' | 'reddit-rss'>,
  collect: () => Promise<OpenSourceCollection>,
): Promise<OpenSourceCollection> {
  try {
    return await collect();
  } catch (error) {
    return {
      status: 'blocked',
      records: [],
      configuredTargets: [],
      attempts: [{
        target: label,
        source,
        state: 'failure',
        status: 0,
        recordCount: 0,
        error: `isolated collector failure: ${(error as Error).message}`,
      }],
    };
  }
}

interface CommunityIndexEntry extends CollectedRedditThread {
  firstSeen: string;
  lastSeen: string;
  seenCount: number;
  scoreHistory: Array<{ date: string; score: number | null; num_comments: number | null }>;
}

export const collectReddit = collectRedditSignals;

function updateCommunityIndex(today: string, threads: CollectedRedditThread[]): CollectedRedditThread[] {
  let entries: Record<string, CommunityIndexEntry> = {};
  if (existsSync(COMMUNITY_INDEX_FILE)) {
    try { entries = (JSON.parse(readFileSync(COMMUNITY_INDEX_FILE, 'utf8')) as { threads?: Record<string, CommunityIndexEntry> }).threads ?? {}; } catch { entries = {}; }
  }
  const updated = threads.map((thread) => {
    const previous = entries[thread.id];
    const previousScore = previous?.scoreHistory.filter((item) => item.date !== today).slice().reverse().find((item) => item.score !== null)?.score ?? null;
    const scoreGrowth = thread.score !== null && previousScore !== null ? thread.score - previousScore : null;
    const history = [...(previous?.scoreHistory ?? []).filter((item) => item.date !== today), { date: today, score: thread.score, num_comments: thread.num_comments }].slice(-30);
    entries[thread.id] = {
      ...(previous ?? thread), ...thread, score_growth: scoreGrowth,
      firstSeen: previous?.firstSeen ?? today, lastSeen: today,
      seenCount: previous?.lastSeen === today ? previous.seenCount : (previous?.seenCount ?? 0) + 1,
      scoreHistory: history,
    };
    return { ...thread, score_growth: scoreGrowth };
  });
  const cutoff = shift(new Date(`${today}T00:00:00.000Z`), -90).toISOString().slice(0, 10);
  entries = Object.fromEntries(Object.entries(entries).filter(([, entry]) => entry.lastSeen >= cutoff));
  writeFileSync(COMMUNITY_INDEX_FILE, `${JSON.stringify({ updatedAt: new Date().toISOString(), threads: entries }, null, 2)}\n`);
  return updated;
}

function previousObservation(today: string): Record<string, unknown> | null {
  const files = readdirSync(OBSERVATION_DIR).filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file) && file < `${today}.json`).sort();
  if (!files.length) return null;
  try { return JSON.parse(readFileSync(join(OBSERVATION_DIR, files.at(-1)!), 'utf8')) as Record<string, unknown>; } catch { return null; }
}

function retainObservations(today: Date): void {
  const cutoff = shift(today, -90).getTime();
  const oldFiles = readdirSync(OBSERVATION_DIR).filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file) && Date.parse(file.slice(0, 10)) < cutoff);
  const monthlyDir = join(OBSERVATION_DIR, 'monthly');
  mkdirSync(monthlyDir, { recursive: true });
  const grouped = new Map<string, Array<Record<string, unknown>>>();
  for (const file of oldFiles) {
    try {
      const observation = JSON.parse(readFileSync(join(OBSERVATION_DIR, file), 'utf8')) as Record<string, unknown>;
      const month = file.slice(0, 7);
      grouped.set(month, [...(grouped.get(month) ?? []), observation]);
    } catch { /* Leave an unreadable file in place. */ }
  }
  for (const [month, observations] of grouped) {
    const rollupFile = join(monthlyDir, `${month}.json`);
    const previous = existsSync(rollupFile) ? JSON.parse(readFileSync(rollupFile, 'utf8')) as { observations?: unknown[] } : { observations: [] };
    const summaries = observations.map((item) => ({
      date: item.date,
      gscTotals: (item.gsc as Record<string, unknown> | undefined)?.['28d'] ? ((item.gsc as any)['28d'].totals.current) : null,
      sitemapUrlCount: (item.indexation as Record<string, unknown> | undefined)?.sitemapUrlCount ?? null,
      redditStatus: (item.community as Record<string, any> | undefined)?.reddit?.status ?? null,
      terms: item.termFrequency ?? null,
    }));
    const existing = Array.isArray(previous.observations) ? previous.observations as Array<Record<string, unknown>> : [];
    const merged = new Map([...existing, ...summaries].map((item) => [String(item.date), item]));
    writeFileSync(rollupFile, `${JSON.stringify({ month, observations: [...merged.values()].sort((a, b) => String(a.date).localeCompare(String(b.date))) }, null, 2)}\n`);
    for (const observation of observations) {
      const file = join(OBSERVATION_DIR, `${String(observation.date)}.json`);
      if (existsSync(file)) unlinkSync(file);
    }
  }
}

export async function observe(): Promise<void> {
  console.log('\n🔭 DAILY OBSERVATION — GSC, indexation, health, community\n');
  mkdirSync(OBSERVATION_DIR, { recursive: true });
  const now = new Date();
  const today = localToday();
  const laggedEnd = shift(new Date(`${today}T00:00:00.000Z`), -3);
  console.log(`📊 Fetching GSC through ${dateOnly(laggedEnd)} (3-day data lag)...`);
  const [sevenDay, twentyEightDay] = await Promise.all([collectPeriod(7, laggedEnd), collectPeriod(28, laggedEnd)]);
  if (!sevenDay.current.page.length || !twentyEightDay.current.page.length) {
    throw new Error('GSC returned no page rows for one or more required periods; observation was not written.');
  }
  console.log(`   ✅ 7d: ${sevenDay.totals.current.impressions} impressions; 28d: ${twentyEightDay.totals.current.impressions} impressions`);

  console.log('🗺️ Counting live sitemap URLs and coverage...');
  const liveUrls = await sitemapUrls();
  const impressionUrls = twentyEightDay.current.page.filter((row) => row.impressions > 0).map((row) => row.key);
  const previous = previousObservation(today) as any;
  const previousKnown: string[] = previous?.indexation?.urlsWithImpressions ?? [];
  const newUrls = impressionUrls.filter((url) => !previousKnown.includes(url));
  const goneUrls = previousKnown.filter((url) => !impressionUrls.includes(url));

  console.log('💓 Checking live site health...');
  const healthUrls = [...new Set([`${SITE}/`, `${SITE}/sitemap-index.xml`, `${SITE}/robots.txt`, ...twentyEightDay.current.page.slice(0, 10).map((row) => row.key)])];
  const health = await Promise.all(healthUrls.map(healthCheck));

  console.log('💬 Collecting deterministic community and demand signals (0 model calls)...');
  const [reddit, youtube, forums, autocomplete] = await Promise.all([
    collectReddit(),
    isolatedOpenSource('YouTube channel feeds', 'youtube', collectYouTube),
    isolatedOpenSource('community forum feeds', 'forum-rss', collectForumFeeds),
    isolatedOpenSource('Google autocomplete', 'google-autocomplete', collectGoogleAutocomplete),
  ]);
  reddit.threads = updateCommunityIndex(today, reddit.threads);
  const communityRecords = mergeCommunityRecords([reddit.threads, youtube.records, forums.records, autocomplete.records]);
  const terms = communityTermFrequency(communityRecords);
  const buckets = bucketCommunityRecords(communityRecords);
  const observation = {
    date: today,
    collectedAt: now.toISOString(),
    gscProperty: gsc.property,
    gsc: { '7d': sevenDay, '28d': twentyEightDay },
    indexation: {
      sitemapUrlCount: liveUrls.length,
      urlsWithImpressionsCount: impressionUrls.length,
      coverageDelta: liveUrls.length - impressionUrls.length,
      urlsWithImpressions: impressionUrls,
      newlyAppeared: newUrls,
      newlyGone: goneUrls,
    },
    siteHealth: { checks: health, non200: health.filter((check) => check.status !== 200) },
    community: { reddit, youtube, forums, autocomplete, records: communityRecords, buckets },
    termFrequency: terms,
  };

  const output = join(OBSERVATION_DIR, `${today}.json`);
  writeFileSync(output, `${JSON.stringify(observation, null, 2)}\n`);
  const priorIndex = existsSync(INDEX_FILE) ? JSON.parse(readFileSync(INDEX_FILE, 'utf8')) as { observations?: unknown[] } : {};
  const summary = {
    date: today,
    collectedAt: now.toISOString(),
    impressions7d: sevenDay.totals.current.impressions,
    impressions28d: twentyEightDay.totals.current.impressions,
    clicks28d: twentyEightDay.totals.current.clicks,
    ctr28d: twentyEightDay.totals.current.ctr,
    position28d: twentyEightDay.totals.current.position,
    indexedUrlCount: impressionUrls.length,
    sitemapUrlCount: liveUrls.length,
    communityThreads: reddit.threads.length,
    communityRecords: communityRecords.length,
    recordsWithEngagement: terms.recordsWithEngagement,
    redditStatus: reddit.status,
    topTerms: terms.unigrams.slice(0, 10),
  };
  const existing = Array.isArray(priorIndex.observations) ? priorIndex.observations as Array<Record<string, unknown>> : [];
  const merged = new Map([...existing, summary].map((item) => [String(item.date), item]));
  const rolling = [...merged.values()].sort((a, b) => String(a.date).localeCompare(String(b.date))).slice(-90);
  writeFileSync(INDEX_FILE, `${JSON.stringify({ updatedAt: now.toISOString(), observations: rolling }, null, 2)}\n`);
  retainObservations(now);
  console.log(`✅ Observation written: ${output}`);
  console.log(`   Sitemap URLs: ${liveUrls.length}; URLs with impressions: ${impressionUrls.length}; health failures: ${health.filter((item) => item.status !== 200).length}`);
  console.log(`   Reddit mode: ${reddit.authMode}; ${reddit.summary}`);
  for (const subreddit of reddit.perSubreddit) {
    const outcomes = subreddit.attempts.map((attempt) => `${attempt.sort}:${attempt.state}:HTTP ${attempt.status ?? 'not-requested'}`).join(', ');
    console.log(`     r/${subreddit.subreddit}: ${subreddit.state}; ${subreddit.recordCount} records; ${outcomes}`);
  }
  for (const [label, source] of [['YouTube', youtube], ['Forums', forums], ['Autocomplete', autocomplete]] as const) {
    const failures = source.attempts.filter((attempt) => attempt.state === 'failure').length;
    console.log(`   ${label}: ${source.status}; ${source.records.length} records; ${failures}/${source.attempts.length} targets failed`);
  }
  console.log(`   Combined: ${communityRecords.length} records; ${terms.recordsWithEngagement} with real engagement data; source mix ${terms.recordsBySource.map((item) => `${item.source}=${item.recordCount}`).join(', ') || '(none)'}`);
  console.log(`   Top weighted terms: ${terms.unigrams.slice(0, 10).map((item) => `${item.term}=${item.weightedDemand} demand (${item.documentFrequency} docs; ${item.weightedEngagement} engagement)`).join(', ') || '(insufficient document frequency)'}`);
}

async function main(): Promise<void> {
  try { await observe(); } catch (error) {
    console.error(`❌ Daily observation failed: ${(error as Error).message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1]?.endsWith('observe.ts')) main();
