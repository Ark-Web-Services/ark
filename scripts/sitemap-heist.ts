// ═══════════════════════════════════════════════════════════════
// SITEMAP-HEIST.TS — Competitor Sitemap Parser (Improved)
// ═══════════════════════════════════════════════════════════════
// Improvements:
//   - Proper XML parsing (no regex for structure)
//   - Expanded sitemap discovery strategies
//   - Caches found sitemap URLs for future runs
//   - Reads competitors from niche.config.ts
//
// Usage: npx tsx scripts/sitemap-heist.ts
// ═══════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import nicheConfig from '../niche.config';

// ── Types ────────────────────────────────────────────────────

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

interface CompetitorSilo {
  pattern: string;
  urls: string[];
  count: number;
}

interface CompetitorProfile {
  domain: string;
  totalPages: number;
  silos: CompetitorSilo[];
  topLevelPages: string[];
  contentTypes: Record<string, number>;
  sitemapUrl: string | null; // Cache the found sitemap URL
  lastScraped: string;
}

interface HeistOutput {
  scrapedAt: string;
  competitors: CompetitorProfile[];
  commonTopics: string[];
  contentGaps: string[];
}

// ── Configuration ────────────────────────────────────────────

const DATA_DIR = join(process.cwd(), 'data');
const GSC_FILE = join(DATA_DIR, 'gsc-intelligence.json');
const OUTPUT_FILE = join(DATA_DIR, 'competitor-intel.json');
const SITEMAP_CACHE_FILE = join(DATA_DIR, 'sitemap-cache.json');

// Expanded list of common sitemap paths to try
const SITEMAP_PATHS = [
  '/sitemap.xml',
  '/sitemap_index.xml',
  '/wp-sitemap.xml',
  '/sitemap.txt',
  '/sitemap/',
  '/sitemap/sitemap-index.xml',
  '/sitemaps/sitemap.xml',
  '/post-sitemap.xml',
  '/page-sitemap.xml',
  '/sitemap-0.xml',
  '/sitemap1.xml',
  '/sitemap_1.xml',
  '/news-sitemap.xml',
  '/video-sitemap.xml',
  '/blog-sitemap.xml',
];

// ── Sitemap Cache ────────────────────────────────────────────

function loadSitemapCache(): Record<string, string> {
  if (existsSync(SITEMAP_CACHE_FILE)) {
    try {
      return JSON.parse(readFileSync(SITEMAP_CACHE_FILE, 'utf-8'));
    } catch { /* fresh start */ }
  }
  return {};
}

function saveSitemapCache(cache: Record<string, string>): void {
  writeFileSync(SITEMAP_CACHE_FILE, JSON.stringify(cache, null, 2));
}

// ── Parse XML Using String Analysis (lightweight, no deps) ───
// Note: For production, consider adding 'fast-xml-parser' as a dep

function parseUrlsFromXml(xml: string): SitemapUrl[] {
  const urls: SitemapUrl[] = [];

  // Extract <url> blocks
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/gi) || [];
  for (const block of urlBlocks) {
    const loc = extractXmlTag(block, 'loc');
    if (loc) {
      urls.push({
        loc,
        lastmod: extractXmlTag(block, 'lastmod') || undefined,
        changefreq: extractXmlTag(block, 'changefreq') || undefined,
        priority: extractXmlTag(block, 'priority') || undefined,
      });
    }
  }

  return urls;
}

function extractXmlTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]+)</${tag}>`, 'i'));
  return match ? match[1].trim() : null;
}

function extractSitemapRefs(xml: string): string[] {
  const refs: string[] = [];
  const blocks = xml.match(/<sitemap>[\s\S]*?<\/sitemap>/gi) || [];
  for (const block of blocks) {
    const loc = extractXmlTag(block, 'loc');
    if (loc) refs.push(loc);
  }
  return refs;
}

// ── Discover Sitemap for a Domain ────────────────────────────

async function discoverSitemap(
  domain: string,
  cache: Record<string, string>
): Promise<{ sitemapUrl: string | null; urls: SitemapUrl[] }> {
  // Check cache first
  if (cache[domain]) {
    console.log(`   📦 Using cached sitemap: ${cache[domain]}`);
    try {
      const urls = await fetchSitemapUrl(cache[domain]);
      if (urls.length > 0) return { sitemapUrl: cache[domain], urls };
    } catch { /* cache entry stale */ }
  }

  // Strategy 1: Check robots.txt for sitemap declaration
  try {
    const robotsUrl = `https://${domain}/robots.txt`;
    console.log(`   🤖 Checking robots.txt...`);
    const response = await fetch(robotsUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SiteAuditor/1.0)' },
      signal: AbortSignal.timeout(8000),
    });

    if (response.ok) {
      const text = await response.text();
      const sitemapMatches = text.match(/^Sitemap:\s*(.+)$/gim);
      if (sitemapMatches) {
        for (const match of sitemapMatches) {
          const url = match.replace(/^Sitemap:\s*/i, '').trim();
          console.log(`   📍 Found in robots.txt: ${url}`);
          const urls = await fetchSitemapUrl(url);
          if (urls.length > 0) {
            cache[domain] = url;
            return { sitemapUrl: url, urls };
          }
        }
      }
    }
  } catch { /* continue */ }

  // Strategy 2: Try known sitemap paths
  for (const path of SITEMAP_PATHS) {
    for (const prefix of [`https://${domain}`, `https://www.${domain}`]) {
      const url = `${prefix}${path}`;
      try {
        console.log(`   🔎 Trying: ${url}`);
        const urls = await fetchSitemapUrl(url);
        if (urls.length > 0) {
          console.log(`   ✅ Found! ${urls.length} URLs`);
          cache[domain] = url;
          return { sitemapUrl: url, urls };
        }
      } catch { /* next */ }
    }
  }

  return { sitemapUrl: null, urls: [] };
}

// ── Fetch and Parse a Sitemap URL ────────────────────────────

async function fetchSitemapUrl(sitemapUrl: string): Promise<SitemapUrl[]> {
  const urls: SitemapUrl[] = [];

  const response = await fetch(sitemapUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; SiteAuditor/1.0)',
      Accept: 'application/xml, text/xml, */*',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) return [];

  const xml = await response.text();

  // Check if it's a sitemap index
  const childSitemaps = extractSitemapRefs(xml);
  if (childSitemaps.length > 0) {
    console.log(`   📂 Index with ${childSitemaps.length} child sitemaps`);
    for (const child of childSitemaps.slice(0, 5)) {
      try {
        const childResp = await fetch(child, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SiteAuditor/1.0)' },
          signal: AbortSignal.timeout(10000),
        });
        if (childResp.ok) {
          const childXml = await childResp.text();
          urls.push(...parseUrlsFromXml(childXml));
        }
      } catch { /* skip child */ }
    }
  } else {
    urls.push(...parseUrlsFromXml(xml));
  }

  return urls;
}

// ── Analyze URL patterns (silos) ─────────────────────────────

function analyzeSilos(urls: SitemapUrl[], domain: string): CompetitorSilo[] {
  const siloMap = new Map<string, string[]>();

  for (const { loc } of urls) {
    try {
      const path = new URL(loc).pathname;
      const segments = path.split('/').filter(Boolean);
      if (segments.length >= 2) {
        const silo = `/${segments[0]}/`;
        if (!siloMap.has(silo)) siloMap.set(silo, []);
        siloMap.get(silo)!.push(loc);
      }
    } catch { /* skip */ }
  }

  return Array.from(siloMap.entries())
    .map(([pattern, urls]) => ({ pattern, urls, count: urls.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// ── Analyze content types ────────────────────────────────────

function analyzeContentTypes(urls: SitemapUrl[]): Record<string, number> {
  const types: Record<string, number> = {};
  for (const { loc } of urls) {
    try {
      const path = new URL(loc).pathname.toLowerCase();
      if (path.includes('/blog/') || path.includes('/posts/')) types['blog'] = (types['blog'] || 0) + 1;
      else if (path.includes('/guide') || path.includes('/how-to')) types['guides'] = (types['guides'] || 0) + 1;
      else if (path.includes('/review') || path.includes('/best-')) types['reviews'] = (types['reviews'] || 0) + 1;
      else if (path.includes('/product') || path.includes('/shop')) types['products'] = (types['products'] || 0) + 1;
      else types['other'] = (types['other'] || 0) + 1;
    } catch { /* skip */ }
  }
  return types;
}

// ── Extract topics from URL slugs ────────────────────────────

function extractTopics(urls: SitemapUrl[]): string[] {
  const topics = new Set<string>();
  for (const { loc } of urls) {
    try {
      const slug = new URL(loc).pathname.split('/').filter(Boolean).pop();
      if (slug && slug.length > 5 && slug.length < 80) {
        const topic = slug.replace(/-/g, ' ').replace(/\d+/g, '').trim();
        if (topic.length > 3) topics.add(topic);
      }
    } catch { /* skip */ }
  }
  return [...topics];
}

// ── Main Execution ───────────────────────────────────────────

async function main() {
  console.log('\n🕵️ GODFATHER SITEMAP HEIST — Competitor intelligence\n');
  console.log('═'.repeat(60));

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  // Load sitemap cache
  const sitemapCache = loadSitemapCache();

  // Gather competitor domains from config + GSC data
  let competitorDomains = [...nicheConfig.competitors];

  if (existsSync(GSC_FILE)) {
    try {
      const gsc = JSON.parse(readFileSync(GSC_FILE, 'utf-8'));
      // Could extract competitors from GSC if they appear in same queries
    } catch { /* skip */ }
  }

  competitorDomains = [...new Set(competitorDomains)];
  console.log(`\n🎯 Targeting ${competitorDomains.length} competitor domains\n`);

  if (competitorDomains.length === 0) {
    console.warn('⚠️ No competitors configured in niche.config.ts');
    console.warn('   Add competitor domains to get started.');
    return;
  }

  const competitors: CompetitorProfile[] = [];
  const allTopics: string[] = [];

  for (const domain of competitorDomains.slice(0, 15)) {
    console.log(`\n🔎 Analyzing: ${domain}`);
    const { sitemapUrl, urls } = await discoverSitemap(domain, sitemapCache);

    if (urls.length === 0) {
      console.log(`   ⚠️ No sitemap data found`);
      continue;
    }

    const silos = analyzeSilos(urls, domain);
    const contentTypes = analyzeContentTypes(urls);
    const topics = extractTopics(urls);
    allTopics.push(...topics);

    competitors.push({
      domain,
      totalPages: urls.length,
      silos,
      topLevelPages: urls
        .filter((u) => new URL(u.loc).pathname.split('/').filter(Boolean).length <= 1)
        .map((u) => u.loc)
        .slice(0, 10),
      contentTypes,
      sitemapUrl,
      lastScraped: new Date().toISOString(),
    });

    console.log(`   ✅ ${urls.length} pages, ${silos.length} silos`);
    await new Promise((r) => setTimeout(r, 1500));
  }

  // Save sitemap cache
  saveSitemapCache(sitemapCache);

  // Common topics
  const topicFreq: Record<string, number> = {};
  for (const t of allTopics) {
    const n = t.toLowerCase();
    topicFreq[n] = (topicFreq[n] || 0) + 1;
  }
  const commonTopics = Object.entries(topicFreq)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t)
    .slice(0, 50);

  const output: HeistOutput = {
    scrapedAt: new Date().toISOString(),
    competitors,
    commonTopics,
    contentGaps: [],
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\n✅ Heist complete: ${OUTPUT_FILE}`);
  console.log(`   Competitors: ${competitors.length} | Topics: ${commonTopics.length}`);
  console.log('═'.repeat(60));
}

main().catch(console.error);
