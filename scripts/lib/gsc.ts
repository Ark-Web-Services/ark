// ═══════════════════════════════════════════════════════════════
// GSC.TS — Shared Google Search Console client
// ═══════════════════════════════════════════════════════════════

import { createSign } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import nicheConfig, { getSiteDomain } from '../../niche.config';

export interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri: string;
}

export interface SearchAnalyticsFilter {
  dimension: 'query' | 'page' | 'country' | 'device' | 'searchAppearance';
  operator?: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'includingRegex' | 'excludingRegex';
  expression: string;
}

export interface SearchAnalyticsOptions {
  startDate: string;
  endDate: string;
  dimensions: string[];
  rowLimit?: number;
  filters?: SearchAnalyticsFilter[];
}

export interface GscRow {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export class GscCredentialsError extends Error {
  override name = 'GscCredentialsError';
}

const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const DEFAULT_KEY_FILE = join(process.cwd(), 'secrets/google-key.json');
let tokenCache: { token: string; expiresAt: number; scope: string } | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function validKey(value: unknown): value is ServiceAccountKey {
  if (!value || typeof value !== 'object') return false;
  const key = value as Record<string, unknown>;
  return typeof key.client_email === 'string' &&
    typeof key.private_key === 'string' &&
    typeof key.token_uri === 'string';
}

export function loadServiceAccount(): ServiceAccountKey {
  const envValue = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim();
  if (envValue) {
    try {
      const parsed: unknown = JSON.parse(envValue);
      if (validKey(parsed)) return parsed;
    } catch {
      // The local .env is known to be malformed. Fall through to the key file.
    }
  }

  if (existsSync(DEFAULT_KEY_FILE)) {
    try {
      const parsed: unknown = JSON.parse(readFileSync(DEFAULT_KEY_FILE, 'utf8'));
      if (validKey(parsed)) return parsed;
    } catch (error) {
      throw new GscCredentialsError(
        `Google service-account fallback is unreadable at ${DEFAULT_KEY_FILE}: ${(error as Error).message}`,
      );
    }
  }

  throw new GscCredentialsError(
    `No valid Google service-account credentials. Set GOOGLE_SERVICE_ACCOUNT_KEY to the full JSON key or place it at ${DEFAULT_KEY_FILE}.`,
  );
}

export async function getGoogleAccessToken(scope = 'https://www.googleapis.com/auth/webmasters'): Promise<string> {
  if (tokenCache && tokenCache.scope === scope && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }

  const key = loadServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: key.client_email,
    scope,
    aud: key.token_uri,
    iat: now,
    exp: now + 3600,
  }));
  const signInput = `${header}.${payload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signInput);
  const jwt = `${signInput}.${signer.sign(key.private_key, 'base64url')}`;

  const response = await fetchWithRetry(key.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!response.ok) {
    throw new GscCredentialsError(`Google token exchange failed (${response.status}): ${(await response.text()).slice(0, 500)}`);
  }
  const data = await response.json() as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new GscCredentialsError('Google token exchange returned no access token.');
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    scope,
  };
  return data.access_token;
}

async function fetchWithRetry(url: string, init: RequestInit, attempts = 4): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(url, init);
      if (!RETRYABLE.has(response.status) || attempt === attempts - 1) return response;
      await response.body?.cancel();
      await sleep(500 * 2 ** attempt + Math.floor(Math.random() * 200));
    } catch (error) {
      lastError = error as Error;
      if (attempt === attempts - 1) {
        const cause = (error as Error & { cause?: Error }).cause?.message ?? (error as Error).message;
        throw new Error(`Network request to ${new URL(url).hostname} failed: ${cause}`);
      }
      await sleep(500 * 2 ** attempt);
    }
  }
  throw lastError ?? new Error(`Request failed: ${url}`);
}

export class GscClient {
  readonly siteUrl: string;
  readonly bareDomain: string;
  readonly property: string;

  constructor(siteUrl = process.env.SITE_URL || nicheConfig.url) {
    this.siteUrl = siteUrl.replace(/\/$/, '');
    try { this.bareDomain = new URL(this.siteUrl).hostname.replace(/^www\./, ''); }
    catch { this.bareDomain = getSiteDomain(); }
    this.property = process.env.GSC_PROPERTY || `sc-domain:${this.bareDomain}`;
  }

  private async request(url: string, init: RequestInit = {}): Promise<Response> {
    const token = await getGoogleAccessToken();
    const response = await fetchWithRetry(url, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
    });
    if (!response.ok) {
      const body = (await response.text()).slice(0, 1000);
      throw new Error(`GSC API request failed (${response.status}) for ${this.property}: ${body}`);
    }
    return response;
  }

  async searchAnalytics(options: SearchAnalyticsOptions): Promise<GscRow[]> {
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(this.property)}/searchAnalytics/query`;
    const body: Record<string, unknown> = {
      startDate: options.startDate,
      endDate: options.endDate,
      dimensions: options.dimensions,
      rowLimit: options.rowLimit ?? 25000,
      dataState: 'all',
    };
    if (options.filters?.length) {
      body.dimensionFilterGroups = [{ groupType: 'and', filters: options.filters }];
    }
    const response = await this.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json() as { rows?: GscRow[] };
    return data.rows ?? [];
  }

  async listSitemaps(): Promise<unknown[]> {
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(this.property)}/sitemaps`;
    const response = await this.request(url);
    const data = await response.json() as { sitemap?: unknown[] };
    return data.sitemap ?? [];
  }

  async submitSitemap(sitemapUrl = `${this.siteUrl}/sitemap-index.xml`): Promise<void> {
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(this.property)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
    await this.request(url, { method: 'PUT' });
  }

  async inspectUrl(inspectionUrl: string): Promise<unknown> {
    const response = await this.request('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspectionUrl, siteUrl: this.property, languageCode: 'en-US' }),
    });
    return response.json();
  }
}

export const gsc = new GscClient();
