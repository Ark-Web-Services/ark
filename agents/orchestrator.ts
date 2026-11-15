// ═══════════════════════════════════════════════════════════════
// ORCHESTRATOR.TS — The Don: Upstream Pipeline Controller
// ═══════════════════════════════════════════════════════════════
// Analyzes the state of all agents and pipelines, reviews audit
// logs, determines what work needs to be done, and coordinates
// the proper pipelines on schedule.
//
// This agent sits ABOVE all other agents. It:
// 1. Reads audit logs, execution plans, content inventory
// 2. Determines if the site is in "startup" or "maintenance" mode
// 3. Kicks off the correct pipeline steps in the right order
// 4. Reviews outputs from sub-agents via the review framework
// 5. Generates a status report after each run
//
// Usage: npx tsx agents/orchestrator.ts
// ═══════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import nicheConfig from '../niche.config';

// ── Types ────────────────────────────────────────────────────

interface SiteState {
  phase: 'startup' | 'growth' | 'maintenance';
  contentCount: number;
  hasAboutPage: boolean;
  hasPillarPages: boolean;
  hasRssFeed: boolean;
  lastContentDate: string | null;
  lastAuditDate: string | null;
  lastStrategyDate: string | null;
  gscConnected: boolean;
  pendingReviews: number;
  healthScore: number; // 0-100
}

interface PipelineDecision {
  pipeline: string;
  reason: string;
  priority: number;
  steps: string[];
}

interface OrchestratorReport {
  generatedAt: string;
  siteState: SiteState;
  decisions: PipelineDecision[];
  alerts: string[];
  nextRunSuggestion: string;
}

// ── Configuration ────────────────────────────────────────────

const DATA_DIR = join(process.cwd(), 'data');
const CONTENT_DIR = join(process.cwd(), 'src/content/posts');
const PAGES_DIR = join(process.cwd(), 'src/pages');
const REPORT_FILE = join(DATA_DIR, 'orchestrator-report.json');

// ── Assess Current Site State ────────────────────────────────

function assessSiteState(): SiteState {
  // Count content
  let contentCount = 0;
  let lastContentDate: string | null = null;

  if (existsSync(CONTENT_DIR)) {
    const files = readdirSync(CONTENT_DIR).filter(
      (f) => f.endsWith('.mdx') || f.endsWith('.md')
    );
    contentCount = files.length;

    // Find most recent content date from frontmatter
    for (const file of files) {
      try {
        const content = readFileSync(join(CONTENT_DIR, file), 'utf-8');
        const dateMatch = content.match(/^date:\s*(.+)$/m);
        if (dateMatch) {
          const d = dateMatch[1].trim();
          if (!lastContentDate || d > lastContentDate) lastContentDate = d;
        }
      } catch { /* skip */ }
    }
  }

  // Check for essential pages
  const hasAboutPage = existsSync(join(PAGES_DIR, 'about.astro')) ||
    existsSync(join(PAGES_DIR, 'about/index.astro'));

  // Check for pillar pages (one per silo)
  const hasPillarPages = nicheConfig.silos.every((silo) => {
    const pillarPath = silo.pillar.replace(/^\/|\/$/g, '');
    return (
      existsSync(join(PAGES_DIR, `${pillarPath}.astro`)) ||
      existsSync(join(PAGES_DIR, pillarPath, 'index.astro'))
    );
  });

  // Check RSS
  const hasRssFeed = existsSync(join(PAGES_DIR, 'rss.xml.ts')) ||
    existsSync(join(PAGES_DIR, 'feed.xml.ts'));

  // Check audit logs
  let lastAuditDate: string | null = null;
  const auditFile = join(DATA_DIR, 'audit-report.json');
  if (existsSync(auditFile)) {
    try {
      const audit = JSON.parse(readFileSync(auditFile, 'utf-8'));
      lastAuditDate = audit.generatedAt || null;
    } catch { /* skip */ }
  }

  // Check strategy logs
  let lastStrategyDate: string | null = null;
  const planFile = join(DATA_DIR, 'execution-plan.json');
  if (existsSync(planFile)) {
    try {
      const plan = JSON.parse(readFileSync(planFile, 'utf-8'));
      lastStrategyDate = plan.generatedAt || null;
    } catch { /* skip */ }
  }

  // GSC connection check
  const gscConnected = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  // Pending reviews (check for flagged items)
  let pendingReviews = 0;
  const reviewLog = join(DATA_DIR, 'review-log.json');
  if (existsSync(reviewLog)) {
    try {
      const reviews = JSON.parse(readFileSync(reviewLog, 'utf-8'));
      pendingReviews = reviews.filter((r: any) => r.flaggedForHuman).length;
    } catch { /* skip */ }
  }

  // Determine phase
  let phase: 'startup' | 'growth' | 'maintenance';
  if (contentCount < 10 || !hasAboutPage || !hasPillarPages) {
    phase = 'startup';
  } else if (contentCount < 50) {
    phase = 'growth';
  } else {
    phase = 'maintenance';
  }

  // Health score
  let healthScore = 50;
  if (hasAboutPage) healthScore += 10;
  if (hasPillarPages) healthScore += 10;
  if (hasRssFeed) healthScore += 5;
  if (gscConnected) healthScore += 10;
  if (contentCount > 10) healthScore += 5;
  if (contentCount > 30) healthScore += 5;
  if (pendingReviews === 0) healthScore += 5;

  return {
    phase,
    contentCount,
    hasAboutPage,
    hasPillarPages,
    hasRssFeed,
    lastContentDate,
    lastAuditDate,
    lastStrategyDate,
    gscConnected,
    pendingReviews,
    healthScore: Math.min(100, healthScore),
  };
}

// ── Decide What Pipelines to Run ─────────────────────────────

function decidePipelines(state: SiteState): PipelineDecision[] {
  const decisions: PipelineDecision[] = [];

  // ── STARTUP PHASE ────────────────────────────────────────
  if (state.phase === 'startup') {
    if (!state.hasAboutPage) {
      decisions.push({
        pipeline: 'foundation',
        reason: 'Missing /about/ page — critical for E-E-A-T',
        priority: 10,
        steps: ['generate-about-page'],
      });
    }

    if (!state.hasPillarPages) {
      decisions.push({
        pipeline: 'foundation',
        reason: 'Missing pillar pages — content silo structure incomplete',
        priority: 9,
        steps: ['generate-pillar-pages'],
      });
    }

    if (!state.hasRssFeed) {
      decisions.push({
        pipeline: 'foundation',
        reason: 'Missing RSS feed — needed for syndication and crawl efficiency',
        priority: 7,
        steps: ['generate-rss-feed'],
      });
    }

    if (state.contentCount < 5) {
      decisions.push({
        pipeline: 'content-sprint',
        reason: `Only ${state.contentCount} articles. Need minimum 5 for initial indexing.`,
        priority: 8,
        steps: ['gsc-intel', 'sitemap-heist', 'strategy', 'writer'],
      });
    }
  }

  // NOTE: `pipeline` here is an INTERNAL plan label (it is persisted as
  // execution_plans.plan_type in D1), not a Drone cron name. The Drone crons
  // are nightly-gsc / daily-observe / weekly-content / weekly-audit /
  // weekly-backlinks / visual-distribution, defined in .drone.yml. Renaming
  // these labels would require a D1 migration, so the two vocabularies are
  // deliberately allowed to differ.
  // ── GROWTH/MAINTENANCE PHASE ─────────────────────────────
  if (state.phase === 'growth' || state.phase === 'maintenance') {
    // Always: intel + strategy + new content
    decisions.push({
      pipeline: 'weekly-sprint',
      reason: 'Regular content generation and optimization cycle',
      priority: 7,
      steps: ['gsc-intel', 'sitemap-heist', 'd1-sync', 'strategy', 'writer', 'audit', 'deploy'],
    });

    // Monthly: competitor analysis + outreach prep
    const dayOfMonth = new Date().getDate();
    if (dayOfMonth <= 7) {
      decisions.push({
        pipeline: 'monthly-review',
        reason: 'First week of month — run full competitor analysis',
        priority: 5,
        steps: ['sitemap-heist-deep', 'outreach-intel', 'social-audit'],
      });
    }
  }

  // ── ALWAYS CHECK ─────────────────────────────────────────
  if (state.pendingReviews > 0) {
    decisions.push({
      pipeline: 'human-review-needed',
      reason: `${state.pendingReviews} items flagged for human review`,
      priority: 10,
      steps: ['notify-human'],
    });
  }

  return decisions.sort((a, b) => b.priority - a.priority);
}

// ── Main Execution ───────────────────────────────────────────

async function main() {
  console.log('\n🎩 GODFATHER ORCHESTRATOR — The Don makes the call\n');
  console.log('═'.repeat(60));

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  // 1. Assess site state
  const state = assessSiteState();
  console.log(`\n📊 SITE STATE ASSESSMENT`);
  console.log(`   Phase:          ${state.phase.toUpperCase()}`);
  console.log(`   Content count:  ${state.contentCount}`);
  console.log(`   About page:     ${state.hasAboutPage ? '✅' : '❌'}`);
  console.log(`   Pillar pages:   ${state.hasPillarPages ? '✅' : '❌'}`);
  console.log(`   RSS feed:       ${state.hasRssFeed ? '✅' : '❌'}`);
  console.log(`   GSC connected:  ${state.gscConnected ? '✅' : '❌'}`);
  console.log(`   Health score:   ${state.healthScore}/100`);
  console.log(`   Pending reviews: ${state.pendingReviews}`);

  // 2. Decide pipelines
  const decisions = decidePipelines(state);
  console.log(`\n🎯 PIPELINE DECISIONS (${decisions.length}):`);
  for (const d of decisions) {
    console.log(`   [P${d.priority}] ${d.pipeline}: ${d.reason}`);
    console.log(`         Steps: ${d.steps.join(' → ')}`);
  }

  // 3. Generate alerts
  const alerts: string[] = [];
  if (!state.gscConnected) {
    alerts.push('⚠️ Google Search Console not connected. Set GOOGLE_SERVICE_ACCOUNT_KEY.');
  }
  if (state.contentCount === 0 && nicheConfig.seedKeywords.length === 0) {
    alerts.push('⚠️ No seed keywords defined in niche.config.ts. Strategy agent needs data to work with.');
  }
  if (nicheConfig.id === 'TEMPLATE_NICHE_ID') {
    alerts.push('🚨 niche.config.ts still has template values. Configure your niche before running pipelines.');
  }

  if (alerts.length > 0) {
    console.log(`\n⚠️ ALERTS:`);
    for (const a of alerts) console.log(`   ${a}`);
  }

  // 4. Write report
  const report: OrchestratorReport = {
    generatedAt: new Date().toISOString(),
    siteState: state,
    decisions,
    alerts,
    nextRunSuggestion: state.phase === 'startup'
      ? 'Run foundation pipeline first, then content sprint'
      : 'Continue weekly sprint cycle',
  };

  writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report written: ${REPORT_FILE}`);
  console.log('═'.repeat(60));
}

main().catch(console.error);
