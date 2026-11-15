import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import nicheConfig from '../../niche.config';

export type RedditSort = 'new' | 'hot' | 'top';
export type CommunitySource = 'reddit-oauth' | 'reddit-rss' | 'youtube' | 'forum-rss' | 'google-autocomplete';

export interface CommunityRecord {
  id: string;
  source: CommunitySource;
  sourceName: string;
  title: string;
  selftext: string;
  permalink: string;
  created_utc: number;
  hasEngagement: boolean;
  score: number | null;
  num_comments: number | null;
  upvote_ratio: number | null;
  subreddit: string;
  flair: string | null;
  sorts: RedditSort[];
  score_growth?: number | null;
}

export interface RedditThread extends CommunityRecord {
  source: 'reddit-oauth' | 'reddit-rss';
}

export interface CollectionAttempt {
  target: string;
  source: CommunitySource;
  state: 'success' | 'failure' | 'skipped';
  status: number | null;
  recordCount: number;
  cached?: boolean;
  sort?: RedditSort;
  error?: string;
}

export interface RedditCollection {
  status: 'ok' | 'partial' | 'blocked';
  authMode: 'oauth' | 'rss-fallback';
  summary: string;
  threads: RedditThread[];
  recordsWithEngagement: number;
  attempts: CollectionAttempt[];
  perSubreddit: Array<{
    subreddit: string;
    state: 'success' | 'partial' | 'failure' | 'skipped';
    statusCodes: Array<number | null>;
    recordCount: number;
    attempts: CollectionAttempt[];
  }>;
  failures: CollectionAttempt[];
  collection: {
    subreddits: string[];
    sorts: RedditSort[];
    capPerSort: number;
    lookbackHours: number;
    oauthRateLimitPerMinute: 100;
    oauthMinimumIntervalMs: number;
    rssMinimumIntervalMs: number;
    configurationWarning?: string;
  };
}

export interface OpenSourceCollection {
  status: 'ok' | 'partial' | 'blocked' | 'disabled';
  records: CommunityRecord[];
  attempts: CollectionAttempt[];
  configuredTargets: string[];
}

export interface TermMetric {
  term: string;
  documentFrequency: number;
  weightedEngagement: number;
  weightedDemand: number;
  sources: Array<{ source: CommunitySource; documentFrequency: number }>;
}

export interface TermFrequencyResult {
  minimumDocumentFrequency: number;
  domainStopwords: string[];
  sourceWeights: Record<CommunitySource, number>;
  recordCount: number;
  recordsWithEngagement: number;
  recordsBySource: Array<{ source: CommunitySource; recordCount: number; recordsWithEngagement: number }>;
  unigrams: TermMetric[];
  bigrams: TermMetric[];
  trigrams: TermMetric[];
}

const AGENT_NAME = nicheConfig.siteName.replace(/[^a-z0-9]+/gi, '') || 'NicheSite';
const USER_AGENT = process.env.COMMUNITY_USER_AGENT
  || `${AGENT_NAME}CommunityObserver/1.1 (+${nicheConfig.url.replace(/\/$/, '')}/contact/; daily community trend research)`;
const DEFAULT_SUBREDDITS = nicheConfig.redditSubreddits.map((value) => value.replace(/^r\//i, ''));
const SUBREDDITS = csv(process.env.REDDIT_SUBREDDITS || DEFAULT_SUBREDDITS.join(','));
const REDDIT_SORTS: RedditSort[] = ['new', 'hot', 'top'];
const REDDIT_CAP = integerEnv('REDDIT_MAX_THREADS_PER_SORT', 100, 25, 1000);
const REDDIT_LOOKBACK_HOURS = integerEnv('REDDIT_LOOKBACK_HOURS', 192, 24, 24 * 30);
const SELFTEXT_LIMIT = integerEnv('REDDIT_SELFTEXT_MAX_CHARS', 2000, 200, 10_000);
const REDDIT_OAUTH_INTERVAL_MS = integerEnv('REDDIT_OAUTH_MIN_INTERVAL_MS', 650, 650, 60_000);
const REDDIT_RSS_INTERVAL_MS = integerEnv('REDDIT_RSS_MIN_INTERVAL_MS', 4000, 3000, 60_000);
const REDDIT_LOW_REMAINING = integerEnv('REDDIT_RATE_LIMIT_LOW_WATERMARK', 5, 1, 25);
const FEED_INTERVAL_MS = integerEnv('COMMUNITY_FEED_MIN_INTERVAL_MS', 1000, 750, 60_000);
const AUTOCOMPLETE_INTERVAL_MS = integerEnv('GOOGLE_AUTOCOMPLETE_MIN_INTERVAL_MS', 1500, 1000, 60_000);
const FEED_LOOKBACK_DAYS = integerEnv('COMMUNITY_FEED_LOOKBACK_DAYS', 30, 7, 365);
const AUTOCOMPLETE_CACHE_HOURS = integerEnv('GOOGLE_AUTOCOMPLETE_CACHE_HOURS', 72, 12, 24 * 30);
const AUTOCOMPLETE_CACHE_FILE = join(process.cwd(), 'data/observations/autocomplete-cache.json');

// YouTube's feeds/videos.xml endpoint may return HTTP 404 for valid channel
// IDs. Leave this empty by default; setting YOUTUBE_CHANNELS re-enables the
// collector for installations where the endpoint is available.
const DEFAULT_YOUTUBE_CHANNELS: string[] = [];
const DEFAULT_FORUM_FEEDS = [
  ...nicheConfig.communityForums,
  ...nicheConfig.communityLinks
    .filter((link) => /(?:rss|atom|feed|\.xml)(?:\/|$|\?)/i.test(link.url))
    .map((link) => `${link.label}|${link.url}`),
];
const DEFAULT_AUTOCOMPLETE_SEEDS = nicheConfig.seedKeywords.length
  ? nicheConfig.seedKeywords.slice(0, 5)
  : [nicheConfig.nicheNoun];

export const SOURCE_WEIGHTS: Record<CommunitySource, number> = {
  'reddit-oauth': 1,
  'reddit-rss': 0.55,
  youtube: 0.8,
  'forum-rss': 0.9,
  'google-autocomplete': 1.2,
};

function csv(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function integerEnv(name: string, fallback: number, minimum: number, maximum: number): number {
  const parsed = Number(process.env[name] ?? fallback);
  return Number.isFinite(parsed) ? Math.max(minimum, Math.min(maximum, Math.floor(parsed))) : fallback;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

class SerialLimiter {
  private queue: Promise<void> = Promise.resolve();
  private lastStartedAt = 0;
  private blockedUntil = 0;

  constructor(private readonly minimumIntervalMs: number, private readonly label: string) {}

  defer(milliseconds: number): void {
    this.blockedUntil = Math.max(this.blockedUntil, Date.now() + Math.max(0, milliseconds));
  }

  async run<T>(target: string, operation: () => Promise<T>): Promise<T> {
    let release!: () => void;
    const previous = this.queue;
    this.queue = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      const intervalWait = this.minimumIntervalMs - (Date.now() - this.lastStartedAt);
      const waitMs = Math.max(0, intervalWait, this.blockedUntil - Date.now());
      if (waitMs > 0) {
        console.log(`   ⏳ ${this.label}: waiting ${(waitMs / 1000).toFixed(1)}s before ${target}`);
        await sleep(waitMs);
      }
      this.lastStartedAt = Date.now();
      return await operation();
    } finally {
      release();
    }
  }
}

class HttpCollectionError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'HttpCollectionError';
  }
}

function errorStatus(error: unknown): number {
  return error instanceof HttpCollectionError ? error.status : 0;
}

const redditOauthLimiter = new SerialLimiter(REDDIT_OAUTH_INTERVAL_MS, 'Reddit OAuth limiter');
const redditRssLimiter = new SerialLimiter(REDDIT_RSS_INTERVAL_MS, 'Reddit RSS limiter');
const feedLimiter = new SerialLimiter(FEED_INTERVAL_MS, 'Community feed limiter');
const autocompleteLimiter = new SerialLimiter(AUTOCOMPLETE_INTERVAL_MS, 'Autocomplete limiter');

let redditTokenCache: { accessToken: string; expiresAt: number; credentialsKey: string } | null = null;

function redditCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.REDDIT_CLIENT_ID?.trim() ?? '';
  const clientSecret = process.env.REDDIT_CLIENT_SECRET?.trim() ?? '';
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

async function redditAccessToken(credentials: { clientId: string; clientSecret: string }): Promise<string> {
  const credentialsKey = createHash('sha256').update(`${credentials.clientId}\0${credentials.clientSecret}`).digest('hex');
  if (redditTokenCache && redditTokenCache.credentialsKey === credentialsKey && redditTokenCache.expiresAt > Date.now()) {
    return redditTokenCache.accessToken;
  }
  const response = await redditOauthLimiter.run('access token', () => fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
    signal: AbortSignal.timeout(20_000),
  }));
  const body = await response.text();
  if (!response.ok) {
    throw new HttpCollectionError(`OAuth token HTTP ${response.status}: ${body.replace(/\s+/g, ' ').slice(0, 240) || '(empty body)'}`, response.status);
  }
  let payload: { access_token?: unknown; expires_in?: unknown };
  try { payload = JSON.parse(body) as typeof payload; } catch {
    throw new HttpCollectionError('OAuth token HTTP 200 returned invalid JSON', 200);
  }
  const accessToken = typeof payload.access_token === 'string' ? payload.access_token : '';
  const expiresIn = Number(payload.expires_in);
  if (!accessToken || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new HttpCollectionError('OAuth token response omitted access_token or expires_in', 200);
  }
  const refreshBufferSeconds = Math.min(60, Math.max(5, Math.floor(expiresIn * 0.1)));
  redditTokenCache = {
    accessToken,
    credentialsKey,
    expiresAt: Date.now() + Math.max(1, expiresIn - refreshBufferSeconds) * 1000,
  };
  return accessToken;
}

function rateLimitDelay(response: Response): number {
  const numericHeader = (name: string): number | null => {
    const raw = response.headers.get(name);
    if (raw === null || raw.trim() === '') return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const retryAfter = numericHeader('retry-after');
  const reset = numericHeader('x-ratelimit-reset');
  if (response.status === 429) return Math.max(1000, (retryAfter ?? reset ?? 60) * 1000);
  const remaining = numericHeader('x-ratelimit-remaining');
  if (remaining !== null && remaining <= REDDIT_LOW_REMAINING && reset !== null) {
    return Math.max(1000, reset * 1000 + 250);
  }
  return 0;
}

async function redditOauthFetch(url: string, credentials: { clientId: string; clientSecret: string }): Promise<Response> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const token = await redditAccessToken(credentials);
    const response = await redditOauthLimiter.run(new URL(url).pathname, () => fetch(url, {
      headers: { Authorization: `bearer ${token}`, 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(20_000),
    }));
    const delay = rateLimitDelay(response);
    if (delay > 0) {
      redditOauthLimiter.defer(delay);
      console.warn(`   ⚠️ Reddit rate-limit budget is low; next request deferred ${(delay / 1000).toFixed(1)}s`);
    }
    if (response.status !== 401 || attempt === 2) return response;
    await response.body?.cancel();
    redditTokenCache = null;
  }
  throw new Error('unreachable Reddit OAuth retry state');
}

interface RedditListing { data?: { after?: string | null; children?: Array<{ data?: Record<string, unknown> }> } }

async function redditOauthListing(
  subreddit: string,
  sort: RedditSort,
  cutoffSeconds: number,
  credentials: { clientId: string; clientSecret: string },
): Promise<{ threads: RedditThread[]; status: number }> {
  const threads: RedditThread[] = [];
  let after: string | null = null;
  let status = 0;
  const maximumPages = Math.max(1, Math.ceil(REDDIT_CAP / 100));
  for (let page = 0; page < maximumPages && threads.length < REDDIT_CAP; page++) {
    const limit = Math.min(100, REDDIT_CAP - threads.length);
    const params = new URLSearchParams({ limit: String(limit), raw_json: '1' });
    if (sort === 'top') params.set('t', 'week');
    if (after) params.set('after', after);
    const url = `https://oauth.reddit.com/r/${encodeURIComponent(subreddit)}/${sort}?${params}`;
    const response = await redditOauthFetch(url, credentials);
    status = response.status;
    const body = await response.text();
    if (!response.ok) {
      throw new HttpCollectionError(`OAuth ${sort} HTTP ${response.status}: ${body.replace(/\s+/g, ' ').slice(0, 240) || '(empty body)'}`, response.status);
    }
    let payload: RedditListing;
    try { payload = JSON.parse(body) as RedditListing; } catch {
      throw new HttpCollectionError(`OAuth ${sort} HTTP ${response.status} returned invalid JSON`, response.status);
    }
    const children = payload.data?.children ?? [];
    for (const child of children) {
      const data = child.data;
      const created = Number(data?.created_utc ?? 0);
      const id = String(data?.id ?? '').trim();
      if (!data || !id || created < cutoffSeconds || typeof data.title !== 'string') continue;
      const score = typeof data.score === 'number' ? data.score : null;
      const comments = typeof data.num_comments === 'number' ? data.num_comments : null;
      threads.push({
        id,
        source: 'reddit-oauth',
        sourceName: `r/${String(data.subreddit ?? subreddit)}`,
        subreddit: String(data.subreddit ?? subreddit),
        title: data.title.trim(),
        selftext: typeof data.selftext === 'string' ? data.selftext.slice(0, SELFTEXT_LIMIT) : '',
        score,
        num_comments: comments,
        upvote_ratio: typeof data.upvote_ratio === 'number' ? data.upvote_ratio : null,
        flair: typeof data.link_flair_text === 'string' && data.link_flair_text.trim() ? data.link_flair_text.trim() : null,
        permalink: `https://www.reddit.com${String(data.permalink ?? '')}`,
        created_utc: created,
        sorts: [sort],
        hasEngagement: score !== null && comments !== null,
      });
    }
    after = payload.data?.after ?? null;
    if (!after || children.length < limit) break;
  }
  return { threads: threads.slice(0, REDDIT_CAP), status };
}

function decodeXml(text: string): string {
  return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(x?[0-9a-f]+);/gi, (_match, code: string) => {
      const value = code.toLowerCase().startsWith('x') ? Number.parseInt(code.slice(1), 16) : Number.parseInt(code, 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : '';
    })
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function tagValue(xml: string, names: string[]): string {
  for (const name of names) {
    const match = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i').exec(xml);
    if (match) return decodeXml(match[1]).trim();
  }
  return '';
}

function entryLink(entry: string): string {
  const alternate = /<link\b[^>]*\brel=["']alternate["'][^>]*\bhref=["']([^"']+)/i.exec(entry)?.[1]
    ?? /<link\b[^>]*\bhref=["']([^"']+)/i.exec(entry)?.[1];
  return decodeXml(alternate ?? tagValue(entry, ['link'])).trim();
}

function plainText(value: string): string {
  return decodeXml(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();
}

async function redditRssListing(subreddit: string, cutoffSeconds: number): Promise<{ threads: RedditThread[]; status: number }> {
  const response = await redditRssLimiter.run(`r/${subreddit}/new.rss`, () => fetch(`https://www.reddit.com/r/${encodeURIComponent(subreddit)}/new.rss`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/atom+xml,application/rss+xml' },
    signal: AbortSignal.timeout(15_000),
  }));
  const xml = await response.text();
  if (!response.ok) throw new HttpCollectionError(`RSS HTTP ${response.status}: ${xml.replace(/\s+/g, ' ').slice(0, 180) || '(empty body)'}`, response.status);
  const threads = (xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? []).flatMap((entry) => {
    const title = tagValue(entry, ['title']);
    const href = entryLink(entry);
    const atomId = tagValue(entry, ['id']);
    const created = Date.parse(tagValue(entry, ['published', 'updated'])) / 1000;
    const id = /comments\/([a-z0-9]+)/i.exec(href)?.[1] ?? atomId.replace(/^t3_/, '');
    if (!id || !title || !href || !Number.isFinite(created) || created < cutoffSeconds) return [];
    return [{
      id,
      source: 'reddit-rss' as const,
      sourceName: `r/${subreddit}`,
      subreddit,
      title,
      selftext: '',
      score: null,
      num_comments: null,
      upvote_ratio: null,
      flair: null,
      permalink: href,
      created_utc: created,
      sorts: ['new' as const],
      hasEngagement: false,
    }];
  });
  return { threads, status: response.status };
}

function mergeRedditThread(target: Map<string, RedditThread>, thread: RedditThread): void {
  const previous = target.get(thread.id);
  if (!previous) { target.set(thread.id, thread); return; }
  const oauth = thread.source === 'reddit-oauth' ? thread : previous.source === 'reddit-oauth' ? previous : null;
  target.set(thread.id, {
    ...previous,
    ...thread,
    ...(oauth ?? {}),
    selftext: thread.selftext || previous.selftext,
    score: thread.score ?? previous.score,
    num_comments: thread.num_comments ?? previous.num_comments,
    upvote_ratio: thread.upvote_ratio ?? previous.upvote_ratio,
    flair: thread.flair ?? previous.flair,
    sorts: [...new Set([...previous.sorts, ...thread.sorts])],
    hasEngagement: previous.hasEngagement || thread.hasEngagement,
  });
}

function redditPerSubreddit(attempts: CollectionAttempt[]): RedditCollection['perSubreddit'] {
  return SUBREDDITS.map((subreddit) => {
    const matching = attempts.filter((attempt) => attempt.target === subreddit);
    const hasSuccess = matching.some((attempt) => attempt.state === 'success');
    const hasFailure = matching.some((attempt) => attempt.state === 'failure');
    const allSkipped = matching.length > 0 && matching.every((attempt) => attempt.state === 'skipped');
    return {
      subreddit,
      state: hasSuccess && hasFailure ? 'partial' : hasSuccess ? 'success' : allSkipped ? 'skipped' : 'failure',
      statusCodes: matching.map((attempt) => attempt.status),
      recordCount: matching.reduce((sum, attempt) => sum + attempt.recordCount, 0),
      attempts: matching,
    };
  });
}

export async function collectReddit(): Promise<RedditCollection> {
  const cutoffSeconds = Date.now() / 1000 - REDDIT_LOOKBACK_HOURS * 60 * 60;
  const target = new Map<string, RedditThread>();
  const attempts: CollectionAttempt[] = [];
  const credentials = redditCredentials();
  const hasClientId = Boolean(process.env.REDDIT_CLIENT_ID?.trim());
  const hasClientSecret = Boolean(process.env.REDDIT_CLIENT_SECRET?.trim());
  const configurationWarning = hasClientId === hasClientSecret
    ? undefined
    : 'Only one Reddit OAuth credential is set; using RSS fallback until both REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET are present.';

  if (credentials) {
    try {
      await redditAccessToken(credentials);
    } catch (error) {
      for (const subreddit of SUBREDDITS) {
        for (const sort of REDDIT_SORTS) {
          attempts.push({
            target: subreddit, source: 'reddit-oauth', sort, state: 'failure', status: errorStatus(error), recordCount: 0,
            error: `token acquisition failed: ${(error as Error).message}`,
          });
        }
      }
    }
    if (!attempts.length) {
      for (const subreddit of SUBREDDITS) {
        for (const sort of REDDIT_SORTS) {
          try {
            const result = await redditOauthListing(subreddit, sort, cutoffSeconds, credentials);
            for (const thread of result.threads) mergeRedditThread(target, thread);
            attempts.push({ target: subreddit, source: 'reddit-oauth', sort, state: 'success', status: result.status, recordCount: result.threads.length });
          } catch (error) {
            attempts.push({
              target: subreddit, source: 'reddit-oauth', sort, state: 'failure', status: errorStatus(error), recordCount: 0,
              error: (error as Error).message,
            });
          }
        }
      }
    }
  } else {
    let stoppedAfter429 = false;
    for (const subreddit of SUBREDDITS) {
      if (stoppedAfter429) {
        attempts.push({
          target: subreddit, source: 'reddit-rss', sort: 'new', state: 'skipped', status: null, recordCount: 0,
          error: 'skipped because an earlier Reddit RSS request returned HTTP 429',
        });
        continue;
      }
      try {
        const result = await redditRssListing(subreddit, cutoffSeconds);
        for (const thread of result.threads) mergeRedditThread(target, thread);
        attempts.push({ target: subreddit, source: 'reddit-rss', sort: 'new', state: 'success', status: result.status, recordCount: result.threads.length });
      } catch (error) {
        const status = errorStatus(error);
        attempts.push({ target: subreddit, source: 'reddit-rss', sort: 'new', state: 'failure', status, recordCount: 0, error: (error as Error).message });
        if (status === 429) stoppedAfter429 = true;
      }
    }
  }

  const threads = [...target.values()].sort((a, b) => {
    const engagementDelta = (b.hasEngagement ? (b.score ?? 0) + (b.num_comments ?? 0) : -1)
      - (a.hasEngagement ? (a.score ?? 0) + (a.num_comments ?? 0) : -1);
    return engagementDelta || b.created_utc - a.created_utc || a.id.localeCompare(b.id);
  });
  const failures = attempts.filter((attempt) => attempt.state === 'failure');
  const successes = attempts.filter((attempt) => attempt.state === 'success');
  const authMode = credentials ? 'oauth' : 'rss-fallback';
  const status = successes.length === 0 ? 'blocked' : failures.length || attempts.some((attempt) => attempt.state === 'skipped') ? 'partial' : 'ok';
  const recordsWithEngagement = threads.filter((thread) => thread.hasEngagement).length;
  const summary = authMode === 'oauth'
    ? `OAuth ${status}: ${successes.length}/${attempts.length} listing requests succeeded; ${threads.length} unique records; ${recordsWithEngagement} with engagement data.`
    : `RSS fallback ${status}: OAuth credentials absent; ${successes.length}/${SUBREDDITS.length} subreddit feeds succeeded; ${threads.length} unique records; no engagement data.`;
  return {
    status,
    authMode,
    summary: configurationWarning ? `${summary} ${configurationWarning}` : summary,
    threads,
    recordsWithEngagement,
    attempts,
    perSubreddit: redditPerSubreddit(attempts),
    failures,
    collection: {
      subreddits: SUBREDDITS,
      sorts: credentials ? REDDIT_SORTS : ['new'],
      capPerSort: REDDIT_CAP,
      lookbackHours: REDDIT_LOOKBACK_HOURS,
      oauthRateLimitPerMinute: 100,
      oauthMinimumIntervalMs: REDDIT_OAUTH_INTERVAL_MS,
      rssMinimumIntervalMs: REDDIT_RSS_INTERVAL_MS,
      configurationWarning,
    },
  };
}

function namedTargets(configured: string | undefined, defaults: string[]): Array<{ name: string; value: string }> {
  return csv(configured ?? defaults.join(',')).map((item) => {
    const separator = item.indexOf('|');
    return separator < 0 ? { name: item, value: item } : { name: item.slice(0, separator).trim(), value: item.slice(separator + 1).trim() };
  }).filter((item) => item.name && item.value);
}

function feedEntries(xml: string): string[] {
  const atom = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  return atom.length ? atom : (xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? []);
}

function feedRecords(xml: string, source: 'youtube' | 'forum-rss', sourceName: string, cutoffSeconds: number): CommunityRecord[] {
  return feedEntries(xml).flatMap((entry) => {
    const title = plainText(tagValue(entry, ['title']));
    const permalink = entryLink(entry);
    const published = tagValue(entry, ['published', 'pubDate', 'updated', 'dc:date']);
    const created = Date.parse(published) / 1000;
    const rawId = tagValue(entry, source === 'youtube' ? ['yt:videoId', 'id', 'guid'] : ['guid', 'id']);
    if (!title || !permalink || !Number.isFinite(created) || created < cutoffSeconds) return [];
    const description = plainText(tagValue(entry, ['description', 'summary', 'content'])).slice(0, SELFTEXT_LIMIT);
    const id = `${source}:${createHash('sha256').update(rawId || permalink).digest('hex').slice(0, 24)}`;
    return [{
      id,
      source,
      sourceName,
      title,
      selftext: description,
      permalink,
      created_utc: created,
      hasEngagement: false,
      score: null,
      num_comments: null,
      upvote_ratio: null,
      subreddit: sourceName,
      flair: null,
      sorts: [],
    }];
  });
}

async function collectFeeds(
  source: 'youtube' | 'forum-rss',
  targets: Array<{ name: string; value: string }>,
): Promise<OpenSourceCollection> {
  if (!targets.length) return { status: 'disabled', records: [], attempts: [], configuredTargets: [] };
  const cutoffSeconds = Date.now() / 1000 - FEED_LOOKBACK_DAYS * 86_400;
  const records = new Map<string, CommunityRecord>();
  const attempts: CollectionAttempt[] = [];
  for (const target of targets) {
    const url = source === 'youtube'
      ? `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(target.value)}`
      : target.value;
    try {
      const response = await feedLimiter.run(target.name, () => fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/atom+xml,application/rss+xml,text/xml' },
        signal: AbortSignal.timeout(15_000),
      }));
      const xml = await response.text();
      if (!response.ok) throw new HttpCollectionError(`HTTP ${response.status}: ${xml.replace(/\s+/g, ' ').slice(0, 180) || '(empty body)'}`, response.status);
      const parsed = feedRecords(xml, source, target.name, cutoffSeconds);
      for (const record of parsed) records.set(record.id, record);
      attempts.push({ target: target.name, source, state: 'success', status: response.status, recordCount: parsed.length });
    } catch (error) {
      attempts.push({ target: target.name, source, state: 'failure', status: errorStatus(error), recordCount: 0, error: (error as Error).message });
    }
  }
  const failures = attempts.filter((attempt) => attempt.state === 'failure').length;
  return {
    status: failures === attempts.length ? 'blocked' : failures ? 'partial' : 'ok',
    records: [...records.values()].sort((a, b) => b.created_utc - a.created_utc || a.id.localeCompare(b.id)),
    attempts,
    configuredTargets: targets.map((target) => target.name),
  };
}

export function collectYouTube(): Promise<OpenSourceCollection> {
  return collectFeeds('youtube', namedTargets(process.env.YOUTUBE_CHANNELS, DEFAULT_YOUTUBE_CHANNELS));
}

export function collectForumFeeds(): Promise<OpenSourceCollection> {
  return collectFeeds('forum-rss', namedTargets(process.env.COMMUNITY_FORUM_RSS_FEEDS, DEFAULT_FORUM_FEEDS));
}

interface AutocompleteCacheEntry { fetchedAt: string; suggestions: string[] }
interface AutocompleteCache { seeds?: Record<string, AutocompleteCacheEntry> }

function readAutocompleteCache(): AutocompleteCache {
  if (!existsSync(AUTOCOMPLETE_CACHE_FILE)) return {};
  try { return JSON.parse(readFileSync(AUTOCOMPLETE_CACHE_FILE, 'utf8')) as AutocompleteCache; } catch { return {}; }
}

function autocompleteRecord(seed: string, suggestion: string, fetchedAt: string): CommunityRecord {
  const normalized = suggestion.trim().replace(/\s+/g, ' ');
  return {
    id: `google-autocomplete:${createHash('sha256').update(normalized.toLowerCase()).digest('hex').slice(0, 24)}`,
    source: 'google-autocomplete',
    sourceName: seed,
    title: normalized,
    selftext: '',
    permalink: `https://www.google.com/search?q=${encodeURIComponent(normalized)}`,
    created_utc: Date.parse(fetchedAt) / 1000,
    hasEngagement: false,
    score: null,
    num_comments: null,
    upvote_ratio: null,
    subreddit: seed,
    flair: null,
    sorts: [],
  };
}

export async function collectGoogleAutocomplete(): Promise<OpenSourceCollection> {
  const seeds = csv(process.env.GOOGLE_AUTOCOMPLETE_SEEDS || DEFAULT_AUTOCOMPLETE_SEEDS.join(','));
  if (!seeds.length) return { status: 'disabled', records: [], attempts: [], configuredTargets: [] };
  const cache = readAutocompleteCache();
  cache.seeds ??= {};
  const records = new Map<string, CommunityRecord>();
  const attempts: CollectionAttempt[] = [];
  let cacheChanged = false;
  const maximumAge = AUTOCOMPLETE_CACHE_HOURS * 3_600_000;
  for (const seed of seeds) {
    const cached = cache.seeds[seed];
    if (cached && Number.isFinite(Date.parse(cached.fetchedAt)) && Date.now() - Date.parse(cached.fetchedAt) < maximumAge) {
      for (const suggestion of cached.suggestions) {
        const record = autocompleteRecord(seed, suggestion, cached.fetchedAt);
        records.set(record.id, record);
      }
      attempts.push({ target: seed, source: 'google-autocomplete', state: 'success', status: 200, recordCount: cached.suggestions.length, cached: true });
      continue;
    }
    try {
      const url = new URL('https://suggestqueries.google.com/complete/search');
      url.search = new URLSearchParams({ client: 'firefox', hl: 'en', gl: 'us', q: seed }).toString();
      const response = await autocompleteLimiter.run(seed, () => fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(15_000),
      }));
      const body = await response.text();
      if (!response.ok) throw new HttpCollectionError(`HTTP ${response.status}: ${body.replace(/\s+/g, ' ').slice(0, 180) || '(empty body)'}`, response.status);
      let payload: unknown;
      try { payload = JSON.parse(body); } catch { throw new HttpCollectionError(`HTTP ${response.status} returned invalid JSON`, response.status); }
      const values = Array.isArray(payload) && Array.isArray(payload[1])
        ? [...new Set(payload[1].filter((value): value is string => typeof value === 'string').map((value) => value.trim()).filter(Boolean))]
        : [];
      const fetchedAt = new Date().toISOString();
      cache.seeds[seed] = { fetchedAt, suggestions: values };
      cacheChanged = true;
      for (const suggestion of values) {
        const record = autocompleteRecord(seed, suggestion, fetchedAt);
        records.set(record.id, record);
      }
      attempts.push({ target: seed, source: 'google-autocomplete', state: 'success', status: response.status, recordCount: values.length });
    } catch (error) {
      if (cached) {
        for (const suggestion of cached.suggestions) {
          const record = autocompleteRecord(seed, suggestion, cached.fetchedAt);
          records.set(record.id, record);
        }
      }
      attempts.push({
        target: seed,
        source: 'google-autocomplete',
        state: 'failure',
        status: errorStatus(error),
        recordCount: cached?.suggestions.length ?? 0,
        cached: Boolean(cached),
        error: `${(error as Error).message}${cached ? '; retained stale cached suggestions' : ''}`,
      });
    }
  }
  if (cacheChanged) {
    try {
      writeFileSync(AUTOCOMPLETE_CACHE_FILE, `${JSON.stringify({ updatedAt: new Date().toISOString(), seeds: cache.seeds }, null, 2)}\n`);
    } catch (error) {
      attempts.push({
        target: AUTOCOMPLETE_CACHE_FILE,
        source: 'google-autocomplete',
        state: 'failure',
        status: 0,
        recordCount: 0,
        error: `could not persist autocomplete cache: ${(error as Error).message}`,
      });
    }
  }
  const failures = attempts.filter((attempt) => attempt.state === 'failure').length;
  return {
    status: failures === attempts.length && records.size === 0 ? 'blocked' : failures ? 'partial' : 'ok',
    records: [...records.values()].sort((a, b) => b.created_utc - a.created_utc || a.id.localeCompare(b.id)),
    attempts,
    configuredTargets: seeds,
  };
}

const ENGLISH_STOPWORDS = new Set(`a about above after again against all am an and any are aren't as at be because been before being below between both but by can can't cannot could couldn't did didn't do does doesn't doing don't down during each few for from further had hadn't has hasn't have haven't having he he'd he'll he's her here here's hers herself him himself his how how's i i'd i'll i'm i've if in into is isn't it it's its itself just let's me more most mustn't my myself no nor not of off on once only or other ought our ours ourselves out over own same shan't she she'd she'll she's should shouldn't so some such than that that's the their theirs them themselves then there there's these they they'd they'll they're they've this those through to too under until up very was wasn't we we'd we'll we're we've were weren't what what's when when's where where's which while who who's whom why why's will with won't would wouldn't you you'd you'll you're they've your yours yourself yourselves`.split(/\s+/));
const DEFAULT_DOMAIN_STOPWORDS = [
  ...nicheConfig.nicheNoun.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/),
  'help', 'question', 'anyone', 'please', 'new', 'need', 'looking', 'got', 'getting', 'know', 'video',
].filter(Boolean).join(',');
const DOMAIN_STOPWORDS = new Set(csv(process.env.COMMUNITY_DOMAIN_STOPWORDS || DEFAULT_DOMAIN_STOPWORDS).map((value) => value.toLowerCase()));
const MIN_DOCUMENT_FREQUENCY = integerEnv('COMMUNITY_MIN_DOCUMENT_FREQUENCY', 3, 2, 100);
const PROBLEM_WORDS = csv(process.env.COMMUNITY_PROBLEM_WORDS
  || 'issue,issues,problem,problems,failed,failing,failure,broken,damage,danger,risk,troubleshoot,error,errors');
const QUESTION_START = /^(what|why|when|where|which|who|how|can|could|should|would|is|are|do|does|did|will)\b/i;

function wordsFor(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/)
    .map((word) => word.replace(/^-+|-+$/g, ''))
    .filter((word) => word.length > 2 && !ENGLISH_STOPWORDS.has(word) && !DOMAIN_STOPWORDS.has(word));
}

export function termFrequency(records: CommunityRecord[]): TermFrequencyResult {
  type Counter = { documents: number; engagement: number; demand: number; sources: Map<CommunitySource, number> };
  const maps = [new Map<string, Counter>(), new Map<string, Counter>(), new Map<string, Counter>()];
  for (const record of records) {
    const words = wordsFor(`${record.title} ${record.selftext}`);
    const engagement = record.hasEngagement
      ? Math.max(0, (record.score ?? 0) + Math.max(0, record.num_comments ?? 0))
      : 0;
    const demand = SOURCE_WEIGHTS[record.source] * (1 + (record.hasEngagement ? Math.log1p(engagement) : 0));
    for (let size = 1; size <= 3; size++) {
      const terms = new Set<string>();
      for (let index = 0; index <= words.length - size; index++) terms.add(words.slice(index, index + size).join(' '));
      for (const term of terms) {
        const previous = maps[size - 1].get(term) ?? { documents: 0, engagement: 0, demand: 0, sources: new Map<CommunitySource, number>() };
        previous.documents += 1;
        previous.engagement += engagement;
        previous.demand += demand;
        previous.sources.set(record.source, (previous.sources.get(record.source) ?? 0) + 1);
        maps[size - 1].set(term, previous);
      }
    }
  }
  const rank = (map: Map<string, Counter>): TermMetric[] => [...map]
    .filter(([, value]) => value.documents >= MIN_DOCUMENT_FREQUENCY)
    .map(([term, value]) => ({
      term,
      documentFrequency: value.documents,
      weightedEngagement: value.engagement,
      weightedDemand: Number(value.demand.toFixed(4)),
      sources: [...value.sources].map(([source, documentFrequency]) => ({ source, documentFrequency }))
        .sort((a, b) => b.documentFrequency - a.documentFrequency || a.source.localeCompare(b.source)),
    }))
    .sort((a, b) => b.weightedDemand - a.weightedDemand || b.documentFrequency - a.documentFrequency || a.term.localeCompare(b.term))
    .slice(0, 50);
  const recordsBySource = (Object.keys(SOURCE_WEIGHTS) as CommunitySource[]).map((source) => {
    const matching = records.filter((record) => record.source === source);
    return { source, recordCount: matching.length, recordsWithEngagement: matching.filter((record) => record.hasEngagement).length };
  }).filter((item) => item.recordCount > 0);
  return {
    minimumDocumentFrequency: MIN_DOCUMENT_FREQUENCY,
    domainStopwords: [...DOMAIN_STOPWORDS].sort(),
    sourceWeights: SOURCE_WEIGHTS,
    recordCount: records.length,
    recordsWithEngagement: records.filter((record) => record.hasEngagement).length,
    recordsBySource,
    unigrams: rank(maps[0]),
    bigrams: rank(maps[1]),
    trigrams: rank(maps[2]),
  };
}

export function deterministicBuckets(records: CommunityRecord[]): {
  questions: CommunityRecord[];
  problems: CommunityRecord[];
  bySource: Array<{ source: CommunitySource; recordCount: number; recordsWithEngagement: number; weightedDemand: number }>;
  byFlair: Array<{ flair: string; recordCount: number; weightedEngagement: number }>;
} {
  const compact = (record: CommunityRecord): CommunityRecord => ({ ...record, selftext: record.selftext.slice(0, 500) });
  const questions = records.filter((record) => record.title.trim().endsWith('?') || QUESTION_START.test(record.title.trim())).map(compact);
  const problems = records.filter((record) => PROBLEM_WORDS.some((word) => `${record.title} ${record.selftext}`.toLowerCase().includes(word))).map(compact);
  const bySource = (Object.keys(SOURCE_WEIGHTS) as CommunitySource[]).map((source) => {
    const matching = records.filter((record) => record.source === source);
    return {
      source,
      recordCount: matching.length,
      recordsWithEngagement: matching.filter((record) => record.hasEngagement).length,
      weightedDemand: Number(matching.reduce((sum, record) => {
        const engagement = record.hasEngagement ? Math.max(0, (record.score ?? 0) + (record.num_comments ?? 0)) : 0;
        return sum + SOURCE_WEIGHTS[source] * (1 + (record.hasEngagement ? Math.log1p(engagement) : 0));
      }, 0).toFixed(4)),
    };
  }).filter((item) => item.recordCount > 0).sort((a, b) => b.weightedDemand - a.weightedDemand || b.recordCount - a.recordCount);
  const flairs = new Map<string, { count: number; engagement: number }>();
  for (const record of records.filter((item) => item.source.startsWith('reddit-'))) {
    const flair = record.flair || '(unflaired)';
    const previous = flairs.get(flair) ?? { count: 0, engagement: 0 };
    previous.count += 1;
    if (record.hasEngagement) previous.engagement += (record.score ?? 0) + Math.max(0, record.num_comments ?? 0);
    flairs.set(flair, previous);
  }
  const byFlair = [...flairs].map(([flair, value]) => ({ flair, recordCount: value.count, weightedEngagement: value.engagement }))
    .sort((a, b) => b.weightedEngagement - a.weightedEngagement || b.recordCount - a.recordCount);
  return { questions, problems, bySource, byFlair };
}

export function mergeCommunityRecords(collections: CommunityRecord[][]): CommunityRecord[] {
  const records = new Map<string, CommunityRecord>();
  for (const record of collections.flat()) {
    const key = `${record.source}:${record.id}`;
    const previous = records.get(key);
    records.set(key, previous ? {
      ...previous,
      ...record,
      selftext: record.selftext || previous.selftext,
      hasEngagement: previous.hasEngagement || record.hasEngagement,
    } : record);
  }
  return [...records.values()].sort((a, b) => {
    const demandA = SOURCE_WEIGHTS[a.source] * (1 + (a.hasEngagement ? Math.log1p(Math.max(0, (a.score ?? 0) + (a.num_comments ?? 0))) : 0));
    const demandB = SOURCE_WEIGHTS[b.source] * (1 + (b.hasEngagement ? Math.log1p(Math.max(0, (b.score ?? 0) + (b.num_comments ?? 0))) : 0));
    return demandB - demandA || b.created_utc - a.created_utc || a.id.localeCompare(b.id);
  });
}
