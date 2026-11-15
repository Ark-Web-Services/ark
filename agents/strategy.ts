// ═══════════════════════════════════════════════════════════════
// STRATEGY.TS — The Godfather AI Strategy Agent (Improved)
// ═══════════════════════════════════════════════════════════════
// Multi-phase pipeline:
//   1. GSC Data Enrichment (search volume, CTR, impressions)
//   2. Content Freshness Scoring (age decay detection)
//   3. SERP Feature Analysis (via GSC query data)
//   4. Strategic Planning (Gemini Pro)
//   5. Quality Review (reviewer framework)
//
// Solves critical issues:
//   - Now has search volume data (from GSC impressions as proxy)
//   - Content freshness scoring (file modification dates + decay)
//   - CTR estimation (from GSC click/impression data)
//   - SERP feature awareness (from GSC position + CTR anomalies)
//
// Usage: npx tsx agents/strategy.ts
// ═══════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import nicheConfig, { getSiteDomain } from '../niche.config';
import { REVIEW_TEMPLATES, runWithReview } from './reviewer';
import { assertLlmReady, callModel, printLlmError } from '../scripts/lib/llm';

// ── Types ────────────────────────────────────────────────────

interface KeywordIntel {
  keyword: string;
  position: number;
  clicks: number;
  impressions: number;
  ctr: number;
  estimatedVolume: string; // 'high' | 'medium' | 'low' based on impressions
  hasExistingContent: boolean;
  contentAge: number | null; // days since last modified
  freshness: 'fresh' | 'aging' | 'stale' | 'none';
}

interface ExecutionPlan {
  generatedAt: string;
  niche: string;
  phase: 'startup' | 'growth' | 'maintenance';
  strikingDistance: {
    keyword: string;
    currentPosition: number;
    impressions: number;
    url: string | null;
    action: string;
    priority: number;
  }[];
  entityGaps: {
    topic: string;
    competitors: string[];
    suggestedSilo: string;
    suggestedTitle: string;
    priority: number;
  }[];
  contentRefreshes: {
    keyword: string;
    url: string;
    currentPosition: number;
    contentAge: number;
    freshness: string;
    suggestions: string[];
  }[];
  newContentTopics: {
    title: string;
    silo: string;
    targetKeyword: string;
    priority: number;
    outline: string[];
    estimatedVolume: string;
  }[];
  technicalFixes: {
    issue: string;
    priority: number;
    fix: string;
  }[];
}

// ── Configuration ────────────────────────────────────────────

const DATA_DIR = join(process.cwd(), 'data');
const CONTENT_DIR = join(process.cwd(), 'src/content/posts');
const GSC_FILE = join(DATA_DIR, 'gsc-intelligence.json');
const COMPETITOR_FILE = join(DATA_DIR, 'competitor-intel.json');
const AUDIT_FILE = join(DATA_DIR, 'audit-report.json');
const PLAN_FILE = join(DATA_DIR, 'execution-plan.json');

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const D1_DATABASE_ID = process.env.D1_DATABASE_ID;

// ── D1 HTTP API Helper ───────────────────────────────────────

async function d1Query(sql: string, params: any[] = []): Promise<any> {
  if (!CF_TOKEN || !CF_ACCOUNT_ID || !D1_DATABASE_ID) return null;
  try {
    const response = await fetch(
      `${CF_API_BASE}/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql, params }),
      }
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// ── Phase 1: Content Freshness Scoring ───────────────────────

function scoreContentFreshness(): Map<string, { age: number; freshness: string }> {
  const freshness = new Map<string, { age: number; freshness: string }>();
  const now = Date.now();

  if (!existsSync(CONTENT_DIR)) return freshness;

  const files = readdirSync(CONTENT_DIR).filter(
    (f) => f.endsWith('.mdx') || f.endsWith('.md')
  );

  for (const file of files) {
    const filePath = join(CONTENT_DIR, file);
    const stat = statSync(filePath);
    const ageDays = Math.floor((now - stat.mtimeMs) / (1000 * 60 * 60 * 24));

    let status: string;
    if (ageDays <= 30) status = 'fresh';
    else if (ageDays <= 90) status = 'aging';
    else status = 'stale';

    const slug = file.replace(/\.(mdx?|md)$/, '');
    freshness.set(slug, { age: ageDays, freshness: status });
  }

  return freshness;
}

// ── Phase 2: Enrich Keywords with GSC + Freshness ────────────

function enrichKeywords(freshnessMap: Map<string, { age: number; freshness: string }>): KeywordIntel[] {
  const intel: KeywordIntel[] = [];

  if (existsSync(GSC_FILE)) {
    try {
      const gscData = JSON.parse(readFileSync(GSC_FILE, 'utf-8'));

      for (const row of gscData.queries || []) {
        // Estimate volume from impressions
        let estimatedVolume: string;
        if (row.impressions > 1000) estimatedVolume = 'high';
        else if (row.impressions > 100) estimatedVolume = 'medium';
        else estimatedVolume = 'low';

        // Check if we have content for this keyword
        const slug = row.url ? new URL(row.url, nicheConfig.url).pathname
          .replace(/^\/posts\//, '')
          .replace(/\/$/, '') : null;

        const fresh = slug ? freshnessMap.get(slug) : null;

        intel.push({
          keyword: row.query,
          position: row.position,
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          estimatedVolume,
          hasExistingContent: !!slug,
          contentAge: fresh?.age ?? null,
          freshness: (fresh?.freshness as any) ?? 'none',
        });
      }
    } catch (err) {
      console.warn('⚠️ Could not parse GSC data:', err);
    }
  }

  return intel;
}

// ── Phase 3: Gather All Intelligence ─────────────────────────

async function gatherIntelligence(keywordIntel: KeywordIntel[]): Promise<string> {
  const intel: string[] = [];
  const domain = getSiteDomain();
  const siloIds = nicheConfig.silos.map((s) => s.id).join(', ');

  // Site context
  intel.push(`## Site: ${nicheConfig.siteName}`);
  intel.push(`Domain: ${domain}`);
  intel.push(`Niche: ${nicheConfig.nicheContext}`);
  intel.push(`Silos: ${siloIds}`);
  intel.push('');

  // GSC keyword data with enrichment
  if (keywordIntel.length > 0) {
    intel.push('## GSC Keyword Intelligence (with search volume + freshness)\n');
    const sorted = [...keywordIntel].sort((a, b) => b.impressions - a.impressions);
    for (const kw of sorted.slice(0, 30)) {
      intel.push(
        `- "${kw.keyword}": Pos ${kw.position.toFixed(1)}, ` +
        `${kw.clicks} clicks, ${kw.impressions} impressions, ` +
        `CTR ${(kw.ctr * 100).toFixed(1)}%, ` +
        `Volume: ${kw.estimatedVolume}, ` +
        `Content: ${kw.hasExistingContent ? `exists (${kw.freshness}, ${kw.contentAge}d old)` : 'NONE'}`
      );
    }
    intel.push('');

    // Striking distance (position 11-20)
    const striking = keywordIntel.filter((k) => k.position >= 11 && k.position <= 20);
    if (striking.length > 0) {
      intel.push('## Striking Distance Keywords (Position 11-20)\n');
      for (const kw of striking.sort((a, b) => b.impressions - a.impressions)) {
        intel.push(`- "${kw.keyword}": Pos ${kw.position.toFixed(1)}, ${kw.impressions} impressions (${kw.estimatedVolume} volume)`);
      }
      intel.push('');
    }

    // Stale content needing refresh
    const stale = keywordIntel.filter((k) => k.freshness === 'stale');
    if (stale.length > 0) {
      intel.push('## Stale Content (>90 days old, needs refresh)\n');
      for (const kw of stale) {
        intel.push(`- "${kw.keyword}": ${kw.contentAge} days old, Pos ${kw.position.toFixed(1)}`);
      }
      intel.push('');
    }

    // CTR anomalies (low CTR for high position = SERP feature likely)
    const ctrAnomalies = keywordIntel.filter(
      (k) => k.position <= 5 && k.ctr < 0.03
    );
    if (ctrAnomalies.length > 0) {
      intel.push('## CTR Anomalies (good position, low CTR — likely SERP features present)\n');
      for (const kw of ctrAnomalies) {
        intel.push(`- "${kw.keyword}": Pos ${kw.position.toFixed(1)} but only ${(kw.ctr * 100).toFixed(1)}% CTR — optimize for featured snippet`);
      }
      intel.push('');
    }
  }

  // Competitor data
  if (existsSync(COMPETITOR_FILE)) {
    try {
      const compData = JSON.parse(readFileSync(COMPETITOR_FILE, 'utf-8'));
      intel.push('## Competitor Analysis\n');
      for (const comp of compData.competitors.slice(0, 5)) {
        intel.push(`- ${comp.domain}: ${comp.totalPages} pages, ${comp.silos.length} silos`);
      }
      if (compData.commonTopics?.length > 0) {
        intel.push('\n### Common Topics:');
        intel.push(compData.commonTopics.slice(0, 20).map((t: string) => `- ${t}`).join('\n'));
      }
      intel.push('');
    } catch { /* skip */ }
  }

  // Audit data
  if (existsSync(AUDIT_FILE)) {
    try {
      const auditData = JSON.parse(readFileSync(AUDIT_FILE, 'utf-8'));
      intel.push('## Technical Audit\n');
      intel.push(`- Avg Performance: ${auditData.summary.avgPerformance}/100`);
      intel.push(`- Avg SEO: ${auditData.summary.avgSeo}/100`);
      intel.push(`- Critical Issues: ${auditData.summary.criticalIssues}`);
      intel.push(`- Broken Links: ${auditData.summary.brokenLinks || 0}`);
      intel.push('');
    } catch { /* skip */ }
  }

  return intel.join('\n');
}

// ── Call Gemini ──────────────────────────────────────────────

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  console.log('🤖 Calling Gemini 2.5 Flash for strategic analysis...');
  return JSON.stringify(await callModel<unknown>({ tier: 'heavy', task: 'analyze', system: systemPrompt, prompt: userPrompt, temperature: 0.2, maxTokens: 8192, json: true }));
}

// ── System Prompt ────────────────────────────────────────────

function buildSystemPrompt(): string {
  const siloIds = nicheConfig.silos.map((s) => s.id).join('|');

  return `You are the Godfather of SEO — 20 years of experience, Topical Authority above all.

You are analyzing data for "${nicheConfig.siteName}" (${getSiteDomain()}) — ${nicheConfig.nicheContext}

INPUT DATA INCLUDES:
1. GSC keyword data with SEARCH VOLUME estimates, CTR, impressions, click data
2. Content freshness scores (fresh/aging/stale) with age in days
3. CTR anomalies suggesting SERP features (featured snippets, PAA)
4. Competitor content gaps from sitemap analysis
5. Technical audit scores

YOUR TASK: Produce a JSON execution plan.

CRITICAL: Use the volume/impressions data to PRIORITIZE by traffic potential.
CRITICAL: Flag stale content (>90 days) for refresh with specific improvements.
CRITICAL: For CTR anomalies, suggest featured snippet optimization.

OUTPUT JSON structure:
{
  "strikingDistance": [{ "keyword", "currentPosition", "impressions", "url", "action", "priority" }],
  "entityGaps": [{ "topic", "competitors", "suggestedSilo", "suggestedTitle" (≤70 chars), "priority" }],
  "contentRefreshes": [{ "keyword", "url", "currentPosition", "contentAge", "freshness", "suggestions" }],
  "newContentTopics": [{ "title" (≤70 chars), "silo": "${siloIds}", "targetKeyword", "priority", "outline": ["H2 section..."], "estimatedVolume" }],
  "technicalFixes": [{ "issue", "priority", "fix" }]
}

CONSTRAINTS:
- Prioritize HIGH volume keywords first
- Max ${nicheConfig.scheduling.maxContentPerRun} new content topics per run
- All content must fit silos: ${siloIds}
- Focus on Information Gain
- No "buy backlinks" or "keyword stuff" suggestions
- Flag any content older than 90 days for refresh
- Every suggestion must be actionable and specific`;
}

// ── Main Execution ───────────────────────────────────────────

async function main() {
  console.log('\n🧠 GODFATHER STRATEGY AGENT — Making the plan\n');
  console.log('═'.repeat(60));

  await assertLlmReady();

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  // Phase 1: Score content freshness
  console.log('\n📅 Phase 1: Scoring content freshness...');
  const freshnessMap = scoreContentFreshness();
  console.log(`   Scored ${freshnessMap.size} content files`);

  // Phase 2: Enrich with GSC data
  console.log('\n📊 Phase 2: Enriching keywords with GSC + freshness data...');
  const keywordIntel = enrichKeywords(freshnessMap);
  console.log(`   ${keywordIntel.length} keywords enriched`);

  // Phase 3: Gather all intelligence
  console.log('\n📋 Phase 3: Compiling intelligence briefing...');
  const intelligence = await gatherIntelligence(keywordIntel);

  // Phase 4: Strategic planning with review loop
  console.log('\n🎯 Phase 4: Strategic planning with quality review...');

  const { result: plan, review } = await runWithReview<ExecutionPlan>(
    REVIEW_TEMPLATES.strategy,
    async (feedback) => {
      const systemPrompt = buildSystemPrompt() +
        (feedback ? `\n\nPREVIOUS REVIEW FEEDBACK — address these issues:\n${feedback}` : '');

      const rawPlan = await callGemini(systemPrompt, intelligence);
      const parsed = JSON.parse(rawPlan);

      const plan: ExecutionPlan = {
        generatedAt: new Date().toISOString(),
        niche: nicheConfig.id,
        phase: 'growth',
        strikingDistance: parsed.strikingDistance || [],
        entityGaps: parsed.entityGaps || [],
        contentRefreshes: parsed.contentRefreshes || [],
        newContentTopics: parsed.newContentTopics || [],
        technicalFixes: parsed.technicalFixes || [],
      };

      return { output: plan, rawText: rawPlan };
    },
    intelligence
  );

  // Write plan
  writeFileSync(PLAN_FILE, JSON.stringify(plan, null, 2));
  console.log(`\n📄 Execution plan written: ${PLAN_FILE}`);
  console.log(`   Review: ${review.passed ? '✅ PASSED' : '❌ FLAGGED'} (${review.score}/10)`);

  // Sync to D1
  if (CF_TOKEN && CF_ACCOUNT_ID && D1_DATABASE_ID) {
    await d1Query(
      `INSERT INTO execution_plans (plan_type, plan_data, status) VALUES ('weekly-sprint', ?, 'pending')`,
      [JSON.stringify(plan)]
    );
    console.log('   ✅ Plan synced to D1');
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 STRATEGY SUMMARY');
  console.log('═'.repeat(60));
  console.log(`   Striking distance: ${plan.strikingDistance.length}`);
  console.log(`   Entity gaps:       ${plan.entityGaps.length}`);
  console.log(`   Content refreshes: ${plan.contentRefreshes.length}`);
  console.log(`   New topics:        ${plan.newContentTopics.length}`);
  console.log(`   Technical fixes:   ${plan.technicalFixes.length}`);
  console.log('═'.repeat(60));
}

main().catch((error) => { printLlmError(error); process.exitCode = 1; });
