// ═══════════════════════════════════════════════════════════════
// SEO-AUDIT.TS — Static build + live HTTP SEO regression audit
// ═══════════════════════════════════════════════════════════════

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { relative, join, sep } from 'node:path';
import nicheConfig from '../niche.config';
import { resolveImplementations } from './lib/ledger';

interface Issue { id: string; severity: 'P0' | 'P1' | 'P2'; page?: string; message: string }
interface PageAudit {
  url: string; file: string; title: string; description: string; h1s: string[]; canonical: string;
  wordCount: number; missingAlt: number; jsonLdTypes: string[]; jsonLdErrors: string[]; links: string[];
  noindex: boolean;
}
interface AuditReport {
  generatedAt: string; site: string; pagesAudited: number; issues: Issue[]; summary: Record<string, number>;
  brokenLinks: Array<{ source: string; target: string; status: number }>;
  orphans: string[]; sitemap: { live: string[]; local: string[]; missingFromSitemap: string[]; missingFromBuild: string[] };
  indexationRegressions: string[]; newP0Regressions: string[];
}

const SITE = nicheConfig.url.replace(/\/$/, '');
const DIST = join(process.cwd(), 'dist');
const AUDIT_DIR = join(process.cwd(), 'data/audits');
const DOC_FILE = join(process.cwd(), 'docs/audits/latest.md');
const AGENT_NAME = nicheConfig.siteName.replace(/[^a-z0-9]+/gi, '') || 'NicheSite';
const UA = process.env.SEO_AUDIT_USER_AGENT || `${AGENT_NAME}Audit/1.0 (+${SITE}/contact/)`;

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}
function stripHtml(value: string): string { return value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&\w+;/g, ' ').replace(/\s+/g, ' ').trim(); }
function attr(tag: string, name: string): string { return new RegExp(`${name}=["']([^"']*)`, 'i').exec(tag)?.[1] ?? ''; }
function routeFor(file: string): string {
  const rel = relative(DIST, file).split(sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -10)}`;
  return `/${rel}`;
}
function normalizeInternal(href: string): string {
  try {
    const url = new URL(href, SITE);
    let path = url.pathname;
    if (!path.includes('.') && !path.endsWith('/')) path += '/';
    return path;
  } catch { return href; }
}

function auditPage(file: string): PageAudit {
  const html = readFileSync(file, 'utf8');
  const title = stripHtml(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '');
  const metaDescription = (html.match(/<meta\s+[^>]*name=["']description["'][^>]*>/i) ?? html.match(/<meta\s+[^>]*content=["'][^"']*["'][^>]*name=["']description["'][^>]*>/i))?.[0] ?? '';
  const canonicalTag = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*>/i)?.[0] ?? '';
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => stripHtml(match[1]));
  const images = [...html.matchAll(/<img\s+[^>]*>/gi)].map((match) => match[0]);
  // Extract links from markup only. Parsing the whole document also picked up
  // href="${node.link[0]}" out of client-side tool code and reported it as a
  // broken internal link.
  const markupOnly = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const links = [...markupOnly.matchAll(/<a\s+[^>]*href=["']([^"']+)["']/gi)].map((match) => match[1]);
  const jsonLdTypes: string[] = [];
  const jsonLdErrors: string[] = [];
  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1]);
      const values = Array.isArray(parsed) ? parsed : parsed['@graph'] ?? [parsed];
      for (const value of values) {
        if (!value?.['@type']) continue;
        const type = String(value['@type']);
        jsonLdTypes.push(type);
        const required: Record<string, string[]> = {
          Article: ['headline', 'datePublished', 'author'], BlogPosting: ['headline', 'datePublished', 'author'],
          WebSite: ['name', 'url'], Organization: ['name', 'url'], BreadcrumbList: ['itemListElement'], FAQPage: ['mainEntity'],
        };
        for (const field of required[type] ?? []) if (value[field] === undefined || value[field] === '') jsonLdErrors.push(`${type}.${field} is required`);
      }
    } catch { jsonLdTypes.push('INVALID_JSON'); }
  }
  return {
    url: routeFor(file), file: relative(process.cwd(), file), title,
    noindex: /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html),
    description: attr(metaDescription, 'content'), h1s, canonical: attr(canonicalTag, 'href'),
    wordCount: stripHtml(html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html).split(/\s+/).filter(Boolean).length,
    // alt="" is the correct markup for a decorative image, not a defect --
    // ArticleCard renders its thumbnail inside an aria-hidden, tabindex="-1"
    // wrapper because the card's text link already names the destination.
    // Only a genuinely absent alt attribute is a problem.
    missingAlt: images.filter((image) => !/\salt\s*=/i.test(image)).length,
    jsonLdTypes, jsonLdErrors, links,
  };
}

// Large retailers bot-wall anything that does not look like a browser, which
// made many large-retailer links read as broken. Identify ourselves first;
// only fall back to a browser UA when we are refused, so a 403 that survives
// both attempts is a real problem rather than a doorman.
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

async function statusFor(url: string): Promise<{ status: number; error?: string }> {
  const attempt = (method: string, ua: string) =>
    fetch(url, { method, redirect: 'follow', headers: { 'User-Agent': ua }, signal: AbortSignal.timeout(10_000) });

  let lastError: string | undefined;
  for (const ua of [UA, BROWSER_UA]) {
    try {
      let response = await attempt('HEAD', ua);
      if ([403, 405].includes(response.status)) {
        await response.body?.cancel();
        response = await attempt('GET', ua);
      }
      await response.body?.cancel();
      if (response.status !== 403 || ua === BROWSER_UA) return { status: response.status };
    } catch (error) {
      lastError = (error as Error & { cause?: Error }).cause?.message ?? (error as Error).message;
    }
  }
  return { status: 0, error: lastError ?? 'blocked' };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) { const index = cursor++; results[index] = await fn(items[index]); }
  }));
  return results;
}

function xmlLocs(xml: string): string[] { return [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => match[1].replace(/&amp;/g, '&')); }
let liveSitemapFailure = '';
async function liveSitemap(): Promise<string[]> {
  try {
    const response = await fetch(`${SITE}/sitemap-index.xml`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15_000) });
    if (!response.ok) { liveSitemapFailure = `HTTP ${response.status}`; return []; }
    const children = xmlLocs(await response.text());
    const urls: string[] = [];
    const childFailures: string[] = [];
    for (const child of children) {
      // A swallowed child-sitemap failure used to leave liveSitemapFailure empty
      // with zero URLs collected, which the diff then reported as all 71 URLs
      // "disappearing" -- 71 false P0s from one flaky fetch. Retry, and record
      // the failure so the diff can be suppressed instead.
      let loaded = false;
      for (let attempt = 1; attempt <= 3 && !loaded; attempt++) {
        try {
          const item = await fetch(child, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20_000) });
          if (item.ok) { urls.push(...xmlLocs(await item.text())); loaded = true; }
          else if (attempt === 3) childFailures.push(`${child}: HTTP ${item.status}`);
        } catch (error) {
          if (attempt === 3) childFailures.push(`${child}: ${(error as Error).message}`);
          else await new Promise((resolve) => setTimeout(resolve, 1_000 * attempt));
        }
      }
    }
    if (childFailures.length) liveSitemapFailure = `child sitemap fetch failed: ${childFailures.join('; ')}`;
    return [...new Set(urls)];
  } catch (error) {
    liveSitemapFailure = (error as Error & { cause?: Error }).cause?.message ?? (error as Error).message;
    return [];
  }
}

function priorAudit(today: string): AuditReport | null {
  if (!existsSync(AUDIT_DIR)) return null;
  const files = readdirSync(AUDIT_DIR).filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file) && file < `${today}.json`).sort();
  if (!files.length) return null;
  try { return JSON.parse(readFileSync(join(AUDIT_DIR, files.at(-1)!), 'utf8')) as AuditReport; } catch { return null; }
}

function markdown(report: AuditReport): string {
  const bySeverity = (severity: string) => report.issues.filter((issue) => issue.severity === severity);
  return `# Weekly SEO audit — ${report.generatedAt.slice(0, 10)}\n\nAudited ${report.pagesAudited} built pages. ${report.newP0Regressions.length ? `**${report.newP0Regressions.length} new P0 regression(s).**` : '**No new P0 regressions.**'}\n\n## Summary\n\n- P0: ${bySeverity('P0').length}\n- P1: ${bySeverity('P1').length}\n- P2: ${bySeverity('P2').length}\n- Broken links: ${report.brokenLinks.length}\n- Orphan pages: ${report.orphans.length}\n- Sitemap missing from build: ${report.sitemap.missingFromBuild.length}\n- Build pages missing from sitemap: ${report.sitemap.missingFromSitemap.length}\n\n## Issues\n\n${report.issues.map((issue) => `- **${issue.severity}** ${issue.page ? `${issue.page}: ` : ''}${issue.message}`).join('\n') || '- None.'}\n\n## Indexation regressions\n\n${report.indexationRegressions.map((url) => `- ${url}`).join('\n') || '- None.'}\n`;
}

export async function seoAudit(): Promise<void> {
  console.log('\n🏥 WEEKLY SEO AUDIT — Static and live checks\n');
  resolveImplementations();
  if (!existsSync(DIST)) {
    const build = spawnSync('npm', ['run', 'build'], { cwd: process.cwd(), stdio: 'inherit' });
    if (build.status !== 0) throw new Error('Cannot audit because npm run build failed.');
  }
  const buildFiles = walk(DIST);
  const pages = buildFiles.filter((file) => file.endsWith('.html')).map(auditPage)
    .filter((page) => !/\/(404|_admin|admin)\/?/.test(page.url));
  const routeSet = new Set(buildFiles.map(routeFor));
  const issues: Issue[] = [];
  const titleOwners = new Map<string, string[]>();
  const descriptionOwners = new Map<string, string[]>();
  const h1Owners = new Map<string, string[]>();
  const incoming = new Map<string, number>();
  const externalRefs: Array<{ source: string; target: string }> = [];
  const brokenLinks: Array<{ source: string; target: string; status: number }> = [];

  for (const page of pages) {
    if (!page.title || page.title.length > 60) issues.push({ id: `title:${page.url}`, severity: 'P1', page: page.url, message: `Title length is ${page.title.length}; expected 1-60.` });
    if (!page.description || page.description.length > 160) issues.push({ id: `description:${page.url}`, severity: 'P1', page: page.url, message: `Description length is ${page.description.length}; expected 1-160.` });
    if (page.h1s.length !== 1) issues.push({ id: `h1:${page.url}`, severity: page.h1s.length === 0 ? 'P0' : 'P1', page: page.url, message: `Expected exactly one H1; found ${page.h1s.length}.` });
    const expectedCanonical = `${SITE}${page.url}`;
    if (page.url !== '/404.html' && page.canonical !== expectedCanonical) issues.push({ id: `canonical:${page.url}`, severity: 'P0', page: page.url, message: `Canonical is "${page.canonical || '(missing)'}"; expected "${expectedCanonical}".` });
    if (page.wordCount < 250 && page.url.startsWith('/posts/')) issues.push({ id: `thin:${page.url}`, severity: 'P1', page: page.url, message: `Thin post: ${page.wordCount} rendered words.` });
    if (page.missingAlt) issues.push({ id: `alt:${page.url}`, severity: 'P1', page: page.url, message: `${page.missingAlt} image(s) have missing/empty alt text.` });
    if (!page.jsonLdTypes.length) issues.push({ id: `schema:${page.url}`, severity: 'P1', page: page.url, message: 'No JSON-LD found.' });
    if (page.jsonLdTypes.includes('INVALID_JSON')) issues.push({ id: `schema-json:${page.url}`, severity: 'P0', page: page.url, message: 'JSON-LD is invalid JSON.' });
    for (const error of page.jsonLdErrors) issues.push({ id: `schema-required:${page.url}:${error}`, severity: 'P1', page: page.url, message: `JSON-LD required-field error: ${error}.` });
    titleOwners.set(page.title, [...(titleOwners.get(page.title) ?? []), page.url]);
    if (page.description) descriptionOwners.set(page.description, [...(descriptionOwners.get(page.description) ?? []), page.url]);
    for (const h1 of page.h1s) if (h1) h1Owners.set(h1, [...(h1Owners.get(h1) ?? []), page.url]);
    for (const href of page.links) {
      if (/^(mailto:|tel:|javascript:|#)/i.test(href)) continue;
      let parsed: URL;
      try { parsed = new URL(href, SITE); } catch { continue; }
      if (parsed.hostname === new URL(SITE).hostname) {
        const target = normalizeInternal(href);
        incoming.set(target, (incoming.get(target) ?? 0) + 1);
        if (!routeSet.has(target) && !target.startsWith('/go/')) {
          brokenLinks.push({ source: page.url, target, status: 404 });
          issues.push({ id: `broken-internal:${page.url}:${target}`, severity: 'P0', page: page.url, message: `Broken internal link to ${target}.` });
        }
      } else if (parsed.protocol.startsWith('http')) externalRefs.push({ source: page.url, target: parsed.href });
    }
  }
  for (const [title, owners] of titleOwners) if (title && owners.length > 1) issues.push({ id: `duplicate-title:${title}`, severity: 'P1', message: `Duplicate title across ${owners.join(', ')}.` });
  for (const [description, owners] of descriptionOwners) if (owners.length > 1) issues.push({ id: `duplicate-description:${description.slice(0, 30)}`, severity: 'P1', message: `Duplicate description across ${owners.join(', ')}.` });
  for (const [h1, owners] of h1Owners) if (owners.length > 1) issues.push({ id: `duplicate-h1:${h1}`, severity: 'P1', message: `Duplicate H1 across ${owners.join(', ')}.` });
  const orphans = pages.map((page) => page.url).filter((url) => url.startsWith('/posts/') && !incoming.get(url));
  for (const url of orphans) issues.push({ id: `orphan:${url}`, severity: 'P1', page: url, message: 'Page has no incoming internal links.' });

  const uniqueExternal = [...new Map(externalRefs.map((item) => [item.target, item])).values()];
  console.log(`🔗 Checking ${uniqueExternal.length} unique external links...`);
  const externalStatuses = await mapLimit(uniqueExternal, 10, async (item) => ({ ...item, ...await statusFor(item.target) }));
  const allExternalNetworkFailed = externalStatuses.length > 0 && externalStatuses.every((entry) => entry.status === 0);
  if (allExternalNetworkFailed) issues.push({ id: 'external-link-check-unavailable', severity: 'P2', message: `External link checks could not reach the network: ${externalStatuses[0].error ?? 'unknown network error'}` });
  for (const item of externalStatuses.filter((entry) => !allExternalNetworkFailed && (entry.status === 0 || entry.status >= 400))) {
    brokenLinks.push(item);
    issues.push({ id: `broken-external:${item.source}:${item.target}`, severity: 'P2', page: item.source, message: `External link returned ${item.status || 'network error'}: ${item.target}` });
  }

  const live = await liveSitemap();
  if (liveSitemapFailure) issues.push({ id: 'live-sitemap-unavailable', severity: 'P2', message: `Live sitemap could not be fetched: ${liveSitemapFailure}` });
  const local = pages.map((page) => `${SITE}${page.url}`).filter((url) => !/\/(404|_admin|admin)\/?/.test(url));

  // lastmod per URL, parsed from the sitemap we just built.
  const localLastmod = new Map<string, string>();
  for (const file of ['sitemap-posts.xml', 'sitemap-pages.xml']) {
    const path = join(DIST, file);
    if (!existsSync(path)) continue;
    const xml = readFileSync(path, 'utf8');
    for (const match of xml.matchAll(/<url>([\s\S]*?)<\/url>/gi)) {
      const loc = /<loc>([^<]+)<\/loc>/i.exec(match[1])?.[1];
      const mod = /<lastmod>([^<]+)<\/lastmod>/i.exec(match[1])?.[1];
      if (loc && mod) localLastmod.set(loc.replace(/&amp;/g, '&'), mod.slice(0, 10));
    }
  }

  // Sitemap lastmod vs the file's real last-commit date. A stale lastmod gives
  // Google no reason to re-crawl, which is how 24 renamed URLs went twelve days
  // without a crawl and left the old URLs holding the canonical.
  try {
    const log = spawnSync('git', ['log', '--pretty=format:@%ad', '--date=short', '--name-only', '--diff-filter=AMR', '--', 'src/content/posts'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    const shallow = spawnSync('git', ['rev-parse', '--is-shallow-repository'], { encoding: 'utf8' }).stdout?.trim();
    if (shallow === 'true') {
      issues.push({ id: 'lastmod-shallow-clone', severity: 'P1', message: 'Shallow clone: sitemap lastmod cannot be derived from git history. Set clone depth 0.' });
    } else if (log.stdout) {
      const gitDate = new Map<string, string>();
      let when = '';
      for (const line of log.stdout.split('\n')) {
        if (line.startsWith('@')) { when = line.slice(1); continue; }
        const file = line.trim();
        if (file && when && !gitDate.has(file)) gitDate.set(file, when);
      }
      for (const [file, real] of gitDate) {
        const slug = file.replace(/^src\/content\/posts\//, '').replace(/\.mdx?$/, '');
        const entry = local.find((url) => url.endsWith(`/posts/${slug}/`));
        if (!entry) continue;
        const advertised = localLastmod.get(entry);
        if (advertised && advertised < real) {
          issues.push({
            id: `lastmod-stale:/posts/${slug}/`,
            severity: 'P1',
            page: `/posts/${slug}/`,
            message: `Sitemap lastmod ${advertised} is older than the file's last commit ${real}.`,
          });
        }
      }
    }
  } catch { /* git is best-effort; never fail the audit on it */ }

  // A noindex page SHOULD be absent from the sitemap -- /search/ is noindex,nofollow
  // by design, so flagging it as missing was a false positive.
  const indexable = new Set(pages.filter((page) => !page.noindex).map((page) => `${SITE}${page.url}`));
  const dateParts = new Intl.DateTimeFormat('en-US', { timeZone: process.env.TZ || 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const dateValue = Object.fromEntries(dateParts.map((part) => [part.type, part.value]));
  const today = `${dateValue.year}-${dateValue.month}-${dateValue.day}`;
  const prior = priorAudit(today);

  // Second safety net: even without a recorded error, an empty or drastically
  // shrunken live sitemap is far more likely to be a flaky fetch than a real
  // mass deindexing. Degrade to one P2 instead of a page of false P0s.
  const priorLiveCount = prior?.sitemap?.live?.length ?? 0;
  const implausible = live.length === 0 || (priorLiveCount > 0 && live.length < priorLiveCount * 0.7);
  if (!liveSitemapFailure && implausible) {
    liveSitemapFailure = `live sitemap returned ${live.length} URLs vs ${priorLiveCount} previously; treating as an unreliable fetch`;
    issues.push({ id: 'live-sitemap-implausible', severity: 'P2', message: liveSitemapFailure });
  }
  const missingFromBuild = liveSitemapFailure ? [] : live.filter((url) => !local.includes(url));
  const missingFromSitemap = liveSitemapFailure ? [] : local.filter((url) => !live.includes(url) && !/\.(xml|txt)$/.test(url) && indexable.has(url));
  for (const url of missingFromBuild) issues.push({ id: `sitemap-ghost:${url}`, severity: 'P0', message: `Sitemap URL is absent from the static build: ${url}` });
  for (const url of missingFromSitemap) issues.push({ id: `sitemap-missing:${url}`, severity: 'P1', message: `Built page is absent from the live sitemap: ${url}` });

  // A URL leaving the sitemap is only a regression if its traffic went nowhere.
  // A planned slug migration also drops the old URL, but redirects it to a live
  // page — that is a success, and flagging 38 of them as P0 buries real losses.
  const dropped = prior && !liveSitemapFailure ? prior.sitemap.live.filter((url) => !live.includes(url)) : [];
  // Serial-ish: these run after 142 external link checks, and hammering the
  // origin made healthy URLs time out and read as dead.
  const droppedStatus = await mapLimit(dropped, 3, async (url) => ({ url, ...(await statusFor(url)) }));
  for (const { url, status } of droppedStatus) {
    if (status >= 200 && status < 400) {
      issues.push({
        id: `indexation-migrated:${url}`,
        severity: 'P2',
        message: `URL left the live sitemap but still resolves (redirected): ${url}`,
      });
    } else if (status === 0) {
      // Could not reach it. That is not evidence of a regression — only a
      // confirmed 4xx/5xx is. Crying P0 on a flaky fetch trains us to ignore P0.
      issues.push({
        id: `indexation-uncheckable:${url}`,
        severity: 'P2',
        message: `URL left the live sitemap and could not be reached to confirm a redirect: ${url}`,
      });
    } else {
      issues.push({
        id: `indexation-regression:${url}`,
        severity: 'P0',
        message: `URL disappeared from live sitemap and returns ${status}: ${url}`,
      });
    }
  }
  const previousP0 = new Set(prior?.issues.filter((issue) => issue.severity === 'P0').map((issue) => issue.id) ?? issues.filter((issue) => issue.severity === 'P0').map((issue) => issue.id));
  const newP0Regressions = issues.filter((issue) => issue.severity === 'P0' && !previousP0.has(issue.id)).map((issue) => issue.id);
  const report: AuditReport = {
    generatedAt: new Date().toISOString(), site: SITE, pagesAudited: pages.length, issues,
    summary: { P0: issues.filter((item) => item.severity === 'P0').length, P1: issues.filter((item) => item.severity === 'P1').length, P2: issues.filter((item) => item.severity === 'P2').length },
    brokenLinks, orphans, sitemap: { live, local, missingFromSitemap, missingFromBuild },
    indexationRegressions: droppedStatus.filter((entry) => entry.status >= 400).map((entry) => entry.url),
    newP0Regressions,
  };
  mkdirSync(AUDIT_DIR, { recursive: true });
  mkdirSync(join(process.cwd(), 'docs/audits'), { recursive: true });
  const output = join(AUDIT_DIR, `${today}.json`);
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(DOC_FILE, markdown(report));
  console.log(`✅ Audit written: ${output}`);
  console.log(`   ${pages.length} pages; P0 ${report.summary.P0}, P1 ${report.summary.P1}, P2 ${report.summary.P2}; new P0 ${newP0Regressions.length}`);
  if (newP0Regressions.length) throw new Error(`New P0 SEO regressions: ${newP0Regressions.join(', ')}`);
}

async function main(): Promise<void> { try { await seoAudit(); } catch (error) { console.error(`❌ SEO audit failed: ${(error as Error).message}`); process.exitCode = 1; } }
if (process.argv[1]?.endsWith('seo-audit.ts')) main();
