// ═══════════════════════════════════════════════════════════════
// AUDIT.TS — Technical SEO Health Runner (Improved)
// ═══════════════════════════════════════════════════════════════
// Improvements:
//   - Runs against DEPLOYED URL (not file://)
//   - Broken link detection
//   - Canonical validation
//   - Reads site URL from niche.config.ts
//
// Usage: npx tsx scripts/audit.ts
// ═══════════════════════════════════════════════════════════════

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import nicheConfig from '../niche.config';

// ── Types ────────────────────────────────────────────────────

interface LighthouseScore {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

interface AuditIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  url?: string;
}

interface AuditReport {
  generatedAt: string;
  summary: {
    pagesAudited: number;
    avgPerformance: number;
    avgAccessibility: number;
    avgSeo: number;
    totalIssues: number;
    criticalIssues: number;
    brokenLinks: number;
    canonicalIssues: number;
  };
  pages: {
    url: string;
    lighthouse: LighthouseScore | null;
    issues: AuditIssue[];
    brokenLinks: string[];
    canonicalStatus: string;
  }[];
  internalLinkAudit: {
    totalPosts: number;
    orphanPages: string[];
    underLinkedPages: { slug: string; linkCount: number }[];
  };
}

// ── Configuration ────────────────────────────────────────────

const DATA_DIR = join(process.cwd(), 'data');
const CONTENT_DIR = join(process.cwd(), 'src/content/posts');
const OUTPUT_FILE = join(DATA_DIR, 'audit-report.json');

// Use deployed URL, fallback to localhost for dev
const SITE_URL = process.env.AUDIT_URL || nicheConfig.url;

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const D1_DATABASE_ID = process.env.D1_DATABASE_ID;

// ── D1 Helper ────────────────────────────────────────────────

async function d1Query(sql: string, params: any[] = []): Promise<any> {
  if (!CF_TOKEN || !CF_ACCOUNT_ID || !D1_DATABASE_ID) return null;
  try {
    const response = await fetch(
      `${CF_API_BASE}/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${CF_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, params }),
      }
    );
    if (!response.ok) return null;
    return await response.json();
  } catch { return null; }
}

// ── Lighthouse on deployed URL ───────────────────────────────

function runLighthouse(url: string): LighthouseScore | null {
  try {
    console.log(`   🔦 Lighthouse: ${url}`);
    const result = execSync(
      `npx lighthouse "${url}" --output=json --output-path=stdout --chrome-flags="--headless --no-sandbox --disable-gpu" --only-categories=performance,accessibility,best-practices,seo --quiet`,
      { encoding: 'utf-8', timeout: 90000, maxBuffer: 50 * 1024 * 1024 }
    );
    const report = JSON.parse(result);
    return {
      performance: Math.round((report.categories?.performance?.score ?? 0) * 100),
      accessibility: Math.round((report.categories?.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((report.categories?.['best-practices']?.score ?? 0) * 100),
      seo: Math.round((report.categories?.seo?.score ?? 0) * 100),
    };
  } catch {
    console.warn(`   ⚠️ Lighthouse failed for ${url}`);
    return null;
  }
}

// ── Broken Link Detection ────────────────────────────────────

async function checkForBrokenLinks(url: string): Promise<string[]> {
  const broken: string[] = [];
  try {
    console.log(`   🔗 Checking links on: ${url}`);
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) return broken;

    const html = await response.text();
    const linkMatches = html.match(/href="(https?:\/\/[^"]+)"/g) || [];
    const links = linkMatches
      .map((m) => m.replace(/^href="/, '').replace(/"$/, ''))
      .filter((l) => !l.includes('/go/')) // Skip affiliate redirects
      .slice(0, 20); // Cap at 20 per page

    for (const link of links) {
      try {
        const resp = await fetch(link, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
          redirect: 'follow',
        });
        if (resp.status >= 400) {
          broken.push(`${link} (${resp.status})`);
        }
      } catch {
        broken.push(`${link} (timeout/unreachable)`);
      }
    }
  } catch {
    console.warn(`   ⚠️ Could not check links for ${url}`);
  }
  return broken;
}

// ── Canonical Validation ─────────────────────────────────────

async function checkCanonical(url: string): Promise<string> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return `ERROR: ${response.status}`;

    const html = await response.text();
    const canonicalMatch = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/);
    if (!canonicalMatch) return 'MISSING';

    const canonical = canonicalMatch[1];
    if (canonical === url || canonical === url.replace(/\/$/, '')) return 'OK';
    return `MISMATCH: ${canonical}`;
  } catch {
    return 'ERROR: unreachable';
  }
}

// ── Internal Link Audit ──────────────────────────────────────

function auditInternalLinks(): {
  totalPosts: number;
  orphanPages: string[];
  underLinkedPages: { slug: string; linkCount: number }[];
} {
  console.log('\n🔗 Internal link audit...');
  const orphanPages: string[] = [];
  const underLinkedPages: { slug: string; linkCount: number }[] = [];

  if (!existsSync(CONTENT_DIR)) return { totalPosts: 0, orphanPages: [], underLinkedPages: [] };

  const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));

  for (const file of files) {
    const content = readFileSync(join(CONTENT_DIR, file), 'utf-8');
    const internalLinks = (content.match(/\[.*?\]\(\/.*?\)/g) || []).length;
    if (!/^category:/m.test(content)) orphanPages.push(file);
    if (internalLinks < 3) underLinkedPages.push({ slug: file, linkCount: internalLinks });
  }

  console.log(`   ${files.length} posts | ${orphanPages.length} orphans | ${underLinkedPages.length} under-linked`);
  return { totalPosts: files.length, orphanPages, underLinkedPages };
}

// ── Discover pages to audit ──────────────────────────────────

function discoverPages(): string[] {
  const pages: string[] = [SITE_URL];

  // Add silo pillar pages
  for (const silo of nicheConfig.silos) {
    pages.push(`${SITE_URL}${silo.pillar}`);
  }

  // Add known content pages
  if (existsSync(CONTENT_DIR)) {
    const files = readdirSync(CONTENT_DIR)
      .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
      .slice(0, 5);
    for (const f of files) {
      const slug = f.replace(/\.(mdx?|md)$/, '');
      pages.push(`${SITE_URL}/posts/${slug}/`);
    }
  }

  return [...new Set(pages)].slice(0, 10);
}

// ── Main Execution ───────────────────────────────────────────

async function main() {
  console.log('\n🏥 GODFATHER AUDIT — Technical SEO Health Check\n');
  console.log('═'.repeat(60));
  console.log(`   Auditing: ${SITE_URL}\n`);

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  const pages = discoverPages();
  console.log(`🔍 Auditing ${pages.length} pages...\n`);

  const pageAudits: AuditReport['pages'] = [];
  let totalBrokenLinks = 0;
  let totalCanonicalIssues = 0;

  for (const pageUrl of pages) {
    const lighthouse = runLighthouse(pageUrl);
    const brokenLinks = await checkForBrokenLinks(pageUrl);
    const canonicalStatus = await checkCanonical(pageUrl);

    totalBrokenLinks += brokenLinks.length;
    if (canonicalStatus !== 'OK') totalCanonicalIssues++;

    const issues: AuditIssue[] = [];
    if (lighthouse) {
      if (lighthouse.performance < 50) issues.push({ type: 'error', category: 'performance', message: `Performance ${lighthouse.performance}/100`, url: pageUrl });
      if (lighthouse.seo < 80) issues.push({ type: 'warning', category: 'seo', message: `SEO score ${lighthouse.seo}/100`, url: pageUrl });
      if (lighthouse.accessibility < 90) issues.push({ type: 'warning', category: 'accessibility', message: `A11y score ${lighthouse.accessibility}/100`, url: pageUrl });
    }
    if (brokenLinks.length > 0) issues.push({ type: 'error', category: 'links', message: `${brokenLinks.length} broken links found`, url: pageUrl });
    if (canonicalStatus !== 'OK') issues.push({ type: 'warning', category: 'canonical', message: `Canonical: ${canonicalStatus}`, url: pageUrl });

    pageAudits.push({ url: pageUrl, lighthouse, issues, brokenLinks, canonicalStatus });
  }

  const linkAudit = auditInternalLinks();

  const lhPages = pageAudits.filter((p) => p.lighthouse);
  const avg = (key: keyof LighthouseScore) =>
    lhPages.length > 0 ? Math.round(lhPages.reduce((s, p) => s + (p.lighthouse?.[key] ?? 0), 0) / lhPages.length) : 0;

  const allIssues = pageAudits.flatMap((p) => p.issues);
  const report: AuditReport = {
    generatedAt: new Date().toISOString(),
    summary: {
      pagesAudited: pageAudits.length,
      avgPerformance: avg('performance'),
      avgAccessibility: avg('accessibility'),
      avgSeo: avg('seo'),
      totalIssues: allIssues.length,
      criticalIssues: allIssues.filter((i) => i.type === 'error').length,
      brokenLinks: totalBrokenLinks,
      canonicalIssues: totalCanonicalIssues,
    },
    pages: pageAudits,
    internalLinkAudit: linkAudit,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report: ${OUTPUT_FILE}`);

  // Sync to D1
  if (CF_TOKEN && CF_ACCOUNT_ID && D1_DATABASE_ID) {
    await d1Query(
      `INSERT INTO audit_logs (audit_type, scores, issues) VALUES ('full-audit', ?, ?)`,
      [JSON.stringify(report.summary), JSON.stringify(allIssues.slice(0, 50))]
    );
    console.log('   ✅ Synced to D1');
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 AUDIT SUMMARY');
  console.log('═'.repeat(60));
  console.log(`   Pages:          ${report.summary.pagesAudited}`);
  console.log(`   Avg Performance: ${report.summary.avgPerformance}/100`);
  console.log(`   Avg SEO:         ${report.summary.avgSeo}/100`);
  console.log(`   Broken links:    ${report.summary.brokenLinks}`);
  console.log(`   Canonical issues: ${report.summary.canonicalIssues}`);
  console.log(`   Critical issues:  ${report.summary.criticalIssues}`);
  console.log('═'.repeat(60));

  if (report.summary.criticalIssues > 5) {
    console.error('\n❌ Too many critical issues.');
    process.exit(1);
  }
}

main().catch(console.error);
