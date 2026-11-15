// ═══════════════════════════════════════════════════════════════
// OUTREACH.TS — PR & Link Building Intelligence (Human-Gated)
// ═══════════════════════════════════════════════════════════════
// This agent does NOT automatically reach out to anyone.
// It generates SUGGESTIONS for human review:
//   - Who to reach out to and why
//   - Draft pitch text (to be reviewed/edited by human)
//   - Linkable asset ideas
//
// All output is written to data/outreach-suggestions.json
// for human review via the admin dashboard or PR.
//
// Usage: npx tsx agents/outreach.ts
// ═══════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import nicheConfig, { getSiteDomain } from '../niche.config';
import { assertLlmReady, callModel, printLlmError } from '../scripts/lib/llm';

// ── Types ────────────────────────────────────────────────────

interface OutreachSuggestion {
  domain: string;
  type: 'resource-page' | 'blogger' | 'forum' | 'news' | 'directory' | 'podcast';
  relevanceScore: number;
  whyReachOut: string;
  suggestedPitchAngle: string;
  priority: number;
  status: 'suggestion'; // Always starts as suggestion — human decides
}

interface OutreachPlan {
  generatedAt: string;
  status: 'PENDING_HUMAN_REVIEW';
  note: string;
  targets: OutreachSuggestion[];
  draftPitchTemplates: {
    type: string;
    subject: string;
    body: string;
    note: string; // Human instruction
  }[];
  linkableAssetIdeas: {
    title: string;
    type: 'infographic' | 'study' | 'tool' | 'guide';
    description: string;
    whyItWorks: string;
  }[];
}

// ── Configuration ────────────────────────────────────────────

const DATA_DIR = join(process.cwd(), 'data');
const SERP_FILE = join(DATA_DIR, 'gsc-intelligence.json');
const COMPETITOR_FILE = join(DATA_DIR, 'competitor-intel.json');
const OUTPUT_FILE = join(DATA_DIR, 'outreach-suggestions.json');

// ── Call Gemini ──────────────────────────────────────────────

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  return JSON.stringify(await callModel<unknown>({ tier: 'light', task: 'analyze', system: systemPrompt, prompt: userPrompt, temperature: 0.4, maxTokens: 8192, json: true }));
}

// ── Build Context ────────────────────────────────────────────

function buildContext(): string {
  const context: string[] = [];
  const domain = getSiteDomain();

  context.push(`## Our Site: ${nicheConfig.siteName}`);
  context.push(`- Domain: ${domain}`);
  context.push(`- Niche: ${nicheConfig.nicheContext}`);
  context.push(`- USP: Comprehensive, evidence-based, the single source of truth`);
  context.push('');

  // Competitor data
  if (existsSync(COMPETITOR_FILE)) {
    try {
      const compData = JSON.parse(readFileSync(COMPETITOR_FILE, 'utf-8'));
      context.push('## Competitor Landscape:');
      for (const comp of compData.competitors.slice(0, 5)) {
        context.push(`- ${comp.domain}: ${comp.totalPages} pages`);
      }
      context.push('');
    } catch { /* skip */ }
  }

  return context.join('\n');
}

// ── System Prompt ────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a Digital PR strategist. You suggest outreach opportunities — you do NOT execute them.

CRITICAL: Everything you output is a SUGGESTION for human review. No automated outreach.

For the site "${nicheConfig.siteName}" (${getSiteDomain()}):

OUTPUT JSON:
{
  "targets": [{
    "domain": "string",
    "type": "resource-page|blogger|forum|news|directory|podcast",
    "relevanceScore": number (1-10),
    "whyReachOut": "specific reason this site would benefit from linking to us",
    "suggestedPitchAngle": "the specific value proposition for them",
    "priority": number (1-10)
  }],
  "draftPitchTemplates": [{
    "type": "string",
    "subject": "email subject line",
    "body": "draft email with {{placeholders}} — HUMAN MUST REVIEW AND PERSONALIZE",
    "note": "instruction for the human reviewer"
  }],
  "linkableAssetIdeas": [{
    "title": "string",
    "type": "infographic|study|tool|guide",
    "description": "what we'd create",
    "whyItWorks": "why other sites would link to this"
  }]
}

CONSTRAINTS:
- NO paid link schemes, PBNs, or link exchanges
- All targets must be genuinely relevant to the niche
- Pitch drafts are SUGGESTIONS — mark them clearly as drafts
- Suggest 3-5 linkable asset ideas
- Focus on genuine value creation`;

// ── Main Execution ───────────────────────────────────────────

async function main() {
  console.log('\n🤝 GODFATHER OUTREACH AGENT — Building suggestions (human-gated)\n');
  console.log('═'.repeat(60));

  await assertLlmReady();

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  const context = buildContext();
  console.log('📋 Context assembled\n');

  console.log('🤖 Generating outreach suggestions...\n');
  const raw = await callGemini(SYSTEM_PROMPT, context);

  let plan: OutreachPlan;
  try {
    const parsed = JSON.parse(raw);
    plan = {
      generatedAt: new Date().toISOString(),
      status: 'PENDING_HUMAN_REVIEW',
      note: '⚠️ ALL items below are SUGGESTIONS. Nothing has been sent. Review each item, personalize pitches, and decide whether to proceed.',
      targets: (parsed.targets || []).map((t: any) => ({ ...t, status: 'suggestion' })),
      draftPitchTemplates: (parsed.draftPitchTemplates || []).map((p: any) => ({
        ...p,
        note: p.note || 'REVIEW AND PERSONALIZE before sending',
      })),
      linkableAssetIdeas: parsed.linkableAssetIdeas || [],
    };
  } catch {
    console.error('❌ Failed to parse response');
    process.exit(1);
  }

  writeFileSync(OUTPUT_FILE, JSON.stringify(plan, null, 2));
  console.log(`📄 Suggestions written: ${OUTPUT_FILE}`);
  console.log(`\n⚠️ REMINDER: All outreach items require HUMAN REVIEW before action.`);

  console.log('\n' + '═'.repeat(60));
  console.log(`   Targets suggested:  ${plan.targets.length}`);
  console.log(`   Draft pitches:      ${plan.draftPitchTemplates.length}`);
  console.log(`   Asset ideas:        ${plan.linkableAssetIdeas.length}`);
  console.log('═'.repeat(60));
}

main().catch((error) => { printLlmError(error); process.exitCode = 1; });
