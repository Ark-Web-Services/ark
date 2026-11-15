// ═══════════════════════════════════════════════════════════════
// CONTENT-MAP.TS — Pre-launch research and content plan
// ═══════════════════════════════════════════════════════════════
// For a site that has no Search Console data yet. Collects demand evidence,
// then asks the model for a content map in which every planned page cites
// the evidence behind it.
//
//   1. Community: the configured subreddits (OAuth, or the public RSS
//      fallback), forum feeds, and Google autocomplete for every seed keyword
//      and silo pillar. Same collectors as observe.ts.
//   2. Competitors: their sitemaps (scripts/sitemap-heist.ts), reduced to
//      page-title slugs, so the map covers what already ranks.
//   3. One heavy model call: pillar, planned articles, planned tools, and
//      entity lists per silo. Evidence IDs the model invents are dropped,
//      and so is any page left without evidence.
//
// Writes data/research/evidence.json, data/content-map.json and
// docs/content-map/BOARD.md (a checklist for the owner to approve).
// Nothing is published; the board is a proposal.
//
// Usage: npm run content-map [-- --skip-harvest]
// Uses the configured LLM_PROVIDER_ORDER. Locally, with no Ollama:
//   LLM_PROVIDER_ORDER=claude-cli npm run content-map
// ═══════════════════════════════════════════════════════════════

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import nicheConfig, { getSiloIds } from '../niche.config';
import { callModel, logLlmRunSummary } from './lib/llm';

// Research wants a wider window than the daily observer's defaults.
// community.ts reads these when it is first imported, so set them first.
process.env.REDDIT_LOOKBACK_HOURS ??= String(24 * 30);
process.env.COMMUNITY_FEED_LOOKBACK_DAYS ??= '120';
// Without OAuth, Reddit answers 429 to a second feed request within ~20s, and
// the collector stops at the first 429. A research run can afford to wait.
process.env.REDDIT_RSS_MIN_INTERVAL_MS ??= '30000';
process.env.GOOGLE_AUTOCOMPLETE_SEEDS ??= [
  ...nicheConfig.seedKeywords,
  ...nicheConfig.silos.map((silo) => silo.label.toLowerCase()),
].map((seed) => seed.replace(/,/g, ' ')).join(',');

const ROOT = process.cwd();
const RESEARCH_DIR = join(ROOT, 'data', 'research');
const EVIDENCE_FILE = join(RESEARCH_DIR, 'evidence.json');
const MAP_FILE = join(ROOT, 'data', 'content-map.json');
const BOARD_DIR = join(ROOT, 'docs', 'content-map');
const BOARD_FILE = join(BOARD_DIR, 'BOARD.md');
const MAX_COMMUNITY = 320;
const MAX_COMPETITOR_PAGES_EACH = 160;

interface Evidence {
  id: string;
  kind: 'community' | 'autocomplete' | 'competitor';
  source: string;
  text: string;
  url?: string;
  engagement?: number;
}

interface EvidenceFile {
  collectedAt: string;
  summary: Record<string, unknown>;
  items: Evidence[];
}

type Intent = 'informational' | 'commercial' | 'transactional';
interface PlannedPage {
  title: string;
  slug: string;
  targetQuery: string;
  intent: Intent;
  format: string;
  priority: 1 | 2 | 3;
  why: string;
  evidence: string[];
}
interface PlannedTool {
  name: string;
  slug: string;
  silo: string;
  description: string;
  inputs: string[];
  why: string;
  evidence: string[];
}
interface ContentMap {
  silos: Array<{ id: string; pillar: PlannedPage; articles: PlannedPage[]; entities: { kind: string; names: string[] } | null }>;
  tools: PlannedTool[];
  gaps: string[];
}

const FORMATS = ['pillar', 'guide', 'how-to', 'comparison', 'review', 'troubleshooting', 'reference', 'entry', 'checklist', 'explainer'];

// ── 1. Evidence ────────────────────────────────────────────────

function humanSlug(url: string): string | null {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    const last = parts.at(-1);
    if (!last || /^(page|tag|category|author|feed|amp)$/i.test(last) || /^\d+$/.test(last)) return null;
    const words = decodeURIComponent(last).replace(/\.(html?|php|aspx?)$/i, '').replace(/[-_]+/g, ' ').replace(/\b\d{4,}\b/g, '').trim();
    return words.split(/\s+/).length >= 2 ? words : null;
  } catch {
    return null;
  }
}

function sample<T>(items: T[], limit: number): T[] {
  if (items.length <= limit) return items;
  const step = items.length / limit;
  return Array.from({ length: limit }, (_, index) => items[Math.floor(index * step)]);
}

async function harvest(): Promise<EvidenceFile> {
  const community = await import('./lib/community');
  console.log('💬 Collecting community and autocomplete signals...');
  const isolated = async <T>(label: string, run: () => Promise<T>, empty: T): Promise<T> => {
    try { return await run(); } catch (error) { console.warn(`   ⚠️ ${label} failed: ${(error as Error).message}`); return empty; }
  };
  const emptySource = { status: 'blocked', records: [], attempts: [], configuredTargets: [] } as unknown as Awaited<ReturnType<typeof community.collectForumFeeds>>;
  const [reddit, forums, autocomplete] = await Promise.all([
    isolated('Reddit', community.collectReddit, { threads: [], summary: 'failed', perSubreddit: [] } as unknown as Awaited<ReturnType<typeof community.collectReddit>>),
    isolated('Forum feeds', community.collectForumFeeds, emptySource),
    isolated('Autocomplete', community.collectGoogleAutocomplete, emptySource),
  ]);
  console.log(`   Reddit: ${reddit.summary}`);
  console.log(`   Forums: ${forums.records.length} records; Autocomplete: ${autocomplete.records.length} suggestions`);

  const discussion = community.mergeCommunityRecords([reddit.threads, forums.records])
    .map((record) => ({ record, engagement: Math.max(0, (record.score ?? 0) + (record.num_comments ?? 0)) }))
    // Questions and problems are the strongest content signal; engagement next.
    .sort((a, b) => Number(/\?|how|why|help|best|vs|should|which/i.test(b.record.title)) - Number(/\?|how|why|help|best|vs|should|which/i.test(a.record.title)) || b.engagement - a.engagement)
    .slice(0, MAX_COMMUNITY);

  console.log('🕵️  Reading competitor sitemaps...');
  const heist = spawnSync(process.execPath, ['--import', 'tsx', join('scripts', 'sitemap-heist.ts')], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', timeout: 15 * 60_000 });
  if (heist.status !== 0) console.warn(`   ⚠️ sitemap-heist exited ${heist.status}: ${(heist.stderr || '').slice(-300)}`);
  const intelFile = join(ROOT, 'data', 'competitor-intel.json');
  const intel = existsSync(intelFile) ? JSON.parse(readFileSync(intelFile, 'utf8')) as { competitors?: Array<{ domain: string; totalPages: number; silos: Array<{ urls: string[] }> }> } : {};
  const competitorPages: Evidence[] = [];
  const competitorSummary: Array<{ domain: string; pages: number; sampled: number }> = [];
  for (const competitor of intel.competitors ?? []) {
    const titles = new Map<string, string>();
    for (const silo of competitor.silos ?? []) for (const url of silo.urls ?? []) {
      const title = humanSlug(url);
      if (title && !titles.has(title.toLowerCase())) titles.set(title.toLowerCase(), url);
    }
    const picked = sample([...titles.entries()], MAX_COMPETITOR_PAGES_EACH);
    competitorSummary.push({ domain: competitor.domain, pages: competitor.totalPages, sampled: picked.length });
    for (const [title, url] of picked) competitorPages.push({ id: '', kind: 'competitor', source: competitor.domain, text: title, url });
  }
  console.log(`   ${competitorSummary.map((item) => `${item.domain}: ${item.pages} pages`).join('; ') || 'no competitor sitemaps found'}`);

  let n = 0;
  const items: Evidence[] = [
    ...discussion.map(({ record, engagement }) => ({ id: `C${++n}`, kind: 'community' as const, source: record.sourceName, text: record.title.slice(0, 160), url: record.permalink, ...(record.hasEngagement ? { engagement } : {}) })),
    ...autocomplete.records.map((record) => ({ id: `A${++n}`, kind: 'autocomplete' as const, source: `autocomplete: ${record.subreddit}`, text: record.title })),
    ...competitorPages.map((item) => ({ ...item, id: `K${++n}` })),
  ];
  return {
    collectedAt: new Date().toISOString(),
    summary: {
      reddit: reddit.summary,
      redditPerSubreddit: (reddit.perSubreddit ?? []).map((item) => ({ subreddit: item.subreddit, state: item.state, records: item.recordCount })),
      forums: forums.attempts.map((attempt) => ({ target: attempt.target, state: attempt.state, records: attempt.recordCount })),
      autocompleteSuggestions: autocomplete.records.length,
      competitors: competitorSummary,
      counts: { community: discussion.length, autocomplete: autocomplete.records.length, competitor: competitorPages.length },
    },
    items,
  };
}

// ── 2. Model ───────────────────────────────────────────────────

const pageSchema = {
  type: 'object',
  required: ['title', 'slug', 'targetQuery', 'intent', 'format', 'priority', 'why', 'evidence'],
  properties: {
    title: { type: 'string' }, slug: { type: 'string' }, targetQuery: { type: 'string' },
    intent: { enum: ['informational', 'commercial', 'transactional'] },
    format: { enum: FORMATS }, priority: { enum: [1, 2, 3] }, why: { type: 'string' },
    evidence: { type: 'array', items: { type: 'string' } },
  },
};
const schema = {
  type: 'object',
  required: ['silos', 'tools', 'gaps'],
  properties: {
    silos: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'pillar', 'articles', 'entities'],
        properties: {
          id: { enum: getSiloIds() },
          pillar: pageSchema,
          articles: { type: 'array', items: pageSchema },
          entities: { anyOf: [{ type: 'null' }, { type: 'object', required: ['kind', 'names'], properties: { kind: { type: 'string' }, names: { type: 'array', items: { type: 'string' } } } }] },
        },
      },
    },
    tools: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'slug', 'silo', 'description', 'inputs', 'why', 'evidence'],
        properties: {
          name: { type: 'string' }, slug: { type: 'string' }, silo: { enum: getSiloIds() }, description: { type: 'string' },
          inputs: { type: 'array', items: { type: 'string' } }, why: { type: 'string' }, evidence: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    gaps: { type: 'array', items: { type: 'string' } },
  },
};

function isContentMap(value: unknown): value is ContentMap {
  const map = value as ContentMap;
  return Boolean(map) && Array.isArray(map.silos) && Array.isArray(map.tools) && Array.isArray(map.gaps)
    && map.silos.every((silo) => typeof silo?.id === 'string' && silo.pillar && typeof silo.pillar.title === 'string' && Array.isArray(silo.articles));
}

function buildPrompt(evidence: EvidenceFile): string {
  const lines = (kind: Evidence['kind']) => evidence.items.filter((item) => item.kind === kind)
    .map((item) => `${item.id} [${item.source}${item.engagement ? `, ${item.engagement} engagement` : ''}] ${item.text}`).join('\n');
  return `You are planning the launch content map for ${nicheConfig.siteName} (${nicheConfig.tagline}).

## The site
${nicheConfig.nicheContext}

## Editorial rules
${nicheConfig.contentGuidelines}

## Sections (silos)
${nicheConfig.silos.map((silo) => `- ${silo.id}: ${silo.label}. ${silo.description}`).join('\n')}

## Tools that already exist
${nicheConfig.tools.map((tool) => `- ${tool.id}: ${tool.title}. ${tool.description}`).join('\n') || '(none)'}

## Seed keywords (editorial guesses, not measured)
${nicheConfig.seedKeywords.join('; ')}

## Evidence
Each line is an ID, its source, and a title. C = real community threads (what people ask and struggle with). A = Google autocomplete suggestions (what people type into search). K = page titles from competitors' sitemaps (what already exists and ranks).

### Community (C)
${lines('community') || '(none collected)'}

### Autocomplete (A)
${lines('autocomplete') || '(none collected)'}

### Competitor pages (K)
${lines('competitor') || '(none collected)'}

## Task
Plan the content map, grounded in the evidence:
- For every silo: one pillar page, then 10 to 18 articles. Prefer topics where people are asking (C, A) over topics that only competitors cover (K). Where only competitors cover a topic, plan it only if it is clearly needed and say how ours will be better.
- Merge near-duplicate questions into one page; do not plan two pages that would compete for the same query.
- evidence: 1 to 6 IDs from the lists above that justify the page. Use only IDs that appear above. A page you cannot support with evidence should not be planned.
- targetQuery: the main search query, written as a searcher would type it.
- priority: 1 = strong, repeated demand (several C/A items); 2 = clear demand; 3 = supporting or completeness.
- slug: lowercase, hyphenated, no silo prefix.
- why: one sentence on the demand and the angle.
- entities: if the silo suits encyclopedia-style entries (species, materials, machines, fibers, plugins, standards...), give the entry kind and the names worth an entry each, otherwise null.
- tools: 2 to 6 new interactive calculators, checkers or selectors that the evidence shows people need and that can run entirely in the browser. Do not repeat the existing tools.
- gaps: short notes on demand you saw that does not fit any silo, or evidence that was too thin to plan from.
Follow the editorial rules, especially any rule about claims, products and competitors.

Return JSON only, matching this schema:
${JSON.stringify(schema)}`;
}

// ── 3. Clean and write ────────────────────────────────────────

function slugify(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function clean(map: ContentMap, evidence: EvidenceFile): { map: ContentMap; dropped: { pages: string[]; evidenceIds: number } } {
  const known = new Set(evidence.items.map((item) => item.id));
  const siloIds = new Set(getSiloIds());
  const seen = new Set<string>();
  const droppedPages: string[] = [];
  let droppedIds = 0;
  const keepEvidence = (ids: string[]) => {
    const valid = [...new Set((ids ?? []).filter((id) => known.has(id)))];
    droppedIds += (ids ?? []).length - valid.length;
    return valid;
  };
  const page = (input: PlannedPage, silo: string, pillar: boolean): PlannedPage | null => {
    const slug = slugify(input.slug || input.title);
    const evidenceIds = keepEvidence(input.evidence);
    if (!slug || seen.has(slug) || (!pillar && evidenceIds.length === 0)) { droppedPages.push(`${silo}/${slug || input.title}`); return null; }
    seen.add(slug);
    return { ...input, slug, evidence: evidenceIds, format: pillar ? 'pillar' : (FORMATS.includes(input.format) ? input.format : 'guide'), priority: ([1, 2, 3].includes(input.priority) ? input.priority : 3) as 1 | 2 | 3 };
  };
  const silos = map.silos.filter((silo) => siloIds.has(silo.id)).map((silo) => ({
    id: silo.id,
    pillar: page(silo.pillar, silo.id, true)!,
    articles: silo.articles.map((article) => page(article, silo.id, false)).filter((item): item is PlannedPage => Boolean(item))
      .sort((a, b) => a.priority - b.priority),
    entities: silo.entities && Array.isArray(silo.entities.names) && silo.entities.names.length ? { kind: silo.entities.kind, names: [...new Set(silo.entities.names)] } : null,
  })).filter((silo) => silo.pillar);
  const existingTools = new Set(nicheConfig.tools.map((tool) => tool.id));
  const tools = map.tools.map((tool) => ({ ...tool, slug: slugify(tool.slug || tool.name), evidence: keepEvidence(tool.evidence) }))
    .filter((tool) => tool.evidence.length && !existingTools.has(tool.slug) && siloIds.has(tool.silo));
  return { map: { silos, tools, gaps: map.gaps ?? [] }, dropped: { pages: droppedPages, evidenceIds: droppedIds } };
}

function board(map: ContentMap, evidence: EvidenceFile, generatedAt: string, provider: string): string {
  const byId = new Map(evidence.items.map((item) => [item.id, item]));
  const cite = (ids: string[]) => ids.map((id) => {
    const item = byId.get(id);
    if (!item) return id;
    const label = `${item.kind === 'competitor' ? item.source : item.kind === 'autocomplete' ? 'autocomplete' : item.source}: “${item.text.slice(0, 70)}”`;
    return item.url ? `[${label}](${item.url})` : label;
  }).join(' · ');
  const silo = (id: string) => nicheConfig.silos.find((item) => item.id === id);
  const total = map.silos.reduce((sum, item) => sum + item.articles.length + 1, 0);
  const counts = evidence.summary.counts as Record<string, number>;
  const out: string[] = [
    `# ${nicheConfig.siteName}: Content Map (proposed)`,
    '',
    `**Status: proposal, not approved.** Tick the pages to write, strike the ones to drop, then move approved items into \`data/work-queue.json\`.`,
    '',
    `Generated ${generatedAt.slice(0, 10)} by \`npm run content-map\` (${provider}). ${total} pages across ${map.silos.length} sections, plus ${map.tools.length} proposed tools.`,
    `Evidence: ${counts.community} community threads, ${counts.autocomplete} autocomplete suggestions, ${counts.competitor} competitor page titles (full list in \`data/research/evidence.json\`).`,
    '',
    '> No search-volume data: there is no keyword tool behind this. Priority reflects how often a topic appears in the evidence, not measured traffic. Check priority-1 queries in a keyword tool or Search Console after launch.',
    '',
    '## Proposed tools',
    '',
    ...(map.tools.length ? map.tools.flatMap((tool) => [
      `- [ ] **${tool.name}** · \`/tools/${tool.slug}/\` · ${silo(tool.silo)?.label ?? tool.silo}`,
      `  ${tool.description} Inputs: ${tool.inputs.join(', ')}.`,
      `  *Why:* ${tool.why}`,
      `  *Evidence:* ${cite(tool.evidence)}`,
    ]) : ['(none proposed)']),
    '',
  ];
  for (const section of map.silos) {
    const config = silo(section.id);
    out.push(`## ${config?.label ?? section.id}`, '');
    const line = (page: PlannedPage) => [
      `- [ ] **${page.title}** · \`/${section.id}/${page.slug}/\` · P${page.priority} · ${page.format} · ${page.intent}`,
      `  Target query: “${page.targetQuery}”. ${page.why}`,
      ...(page.evidence.length ? [`  *Evidence:* ${cite(page.evidence)}`] : []),
    ];
    out.push('**Pillar**', '', ...line(section.pillar), '', `**Articles** (${section.articles.length})`, '', ...section.articles.flatMap(line), '');
    if (section.entities) out.push(`**Entries (${section.entities.kind}, ${section.entities.names.length}):** ${section.entities.names.join(', ')}`, '');
  }
  if (map.gaps.length) out.push('## Gaps and notes', '', ...map.gaps.map((gap) => `- ${gap}`), '');
  return `${out.join('\n')}\n`;
}

async function main(): Promise<void> {
  mkdirSync(RESEARCH_DIR, { recursive: true });
  const skip = process.argv.includes('--skip-harvest') && existsSync(EVIDENCE_FILE);
  const evidence: EvidenceFile = skip ? JSON.parse(readFileSync(EVIDENCE_FILE, 'utf8')) : await harvest();
  if (!skip) writeFileSync(EVIDENCE_FILE, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`📚 Evidence: ${evidence.items.length} items (${JSON.stringify(evidence.summary.counts)})`);
  if (evidence.items.length < 40) throw new Error('Too little evidence to plan from. Check the subreddit, forum and competitor settings in niche.config.ts.');

  console.log('🧠 Planning the content map (one heavy model call)...');
  const raw = await callModel<ContentMap>({ tier: 'heavy', task: 'analyze', json: true, schema, validate: isContentMap, maxTokens: 32000, temperature: 0.3, prompt: buildPrompt(evidence) });
  const { map, dropped } = clean(raw, evidence);
  const generatedAt = new Date().toISOString();
  const provider = process.env.LLM_PROVIDER_ORDER || 'default provider order';
  writeFileSync(MAP_FILE, `${JSON.stringify({ generatedAt, status: 'proposed', evidenceCollectedAt: evidence.collectedAt, dropped, ...map }, null, 2)}\n`);
  mkdirSync(BOARD_DIR, { recursive: true });
  writeFileSync(BOARD_FILE, board(map, evidence, generatedAt, provider));
  const pages = map.silos.reduce((sum, item) => sum + item.articles.length + 1, 0);
  console.log(`✅ ${pages} pages, ${map.tools.length} tools. Dropped ${dropped.pages.length} unsupported or duplicate pages and ${dropped.evidenceIds} invented evidence IDs.`);
  console.log(`   ${BOARD_FILE}`);
  logLlmRunSummary('content-map');
}

if (process.argv[1]?.endsWith('content-map.ts')) {
  main().catch((error) => { console.error(`❌ content-map failed: ${(error as Error).message}`); process.exitCode = 1; });
}
