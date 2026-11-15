// ═══════════════════════════════════════════════════════════════
// BACKLINKS.TS — Human-only prospect queue generator
// ═══════════════════════════════════════════════════════════════

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import nicheConfig from '../niche.config';

type Status = 'queued' | 'researching' | 'contacted' | 'won' | 'declined' | 'do-not-contact';
interface Prospect { url: string; sourceType: string; whyRelevant: string; pageToLink: string; personalisedAngle: string; status: Status; discoveredAt: string }
interface ConfiguredSource { label: string; url: string; note?: string; sourceType: 'community-forum' | 'community-link' | 'trusted-source' }
const DATA_DIR = join(process.cwd(), 'data/backlinks');
const OUTPUT = join(DATA_DIR, 'prospects.json');
const DOC = join(process.cwd(), 'docs/backlinks/queue.md');
const POSTS_DIR = join(process.cwd(), 'src/content/posts');

function postInventory(): Array<{ url: string; title: string; text: string }> {
  return readdirSync(POSTS_DIR).filter((file) => /\.mdx?$/.test(file)).map((file) => {
    const raw = readFileSync(join(POSTS_DIR, file), 'utf8');
    return { url: `${nicheConfig.url}/posts/${file.replace(/\.mdx?$/, '')}/`, title: /^title:\s*["']?(.+?)["']?\s*$/mi.exec(raw)?.[1] ?? file, text: raw.toLowerCase() };
  });
}

function bestPage(context: string, posts: ReturnType<typeof postInventory>): string {
  const text = context.toLowerCase();
  const terms = new Set(text.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((word) => word.length > 4));
  const candidates = [
    ...nicheConfig.tools.map((tool) => ({
      url: `${nicheConfig.url.replace(/\/$/, '')}/tools/${tool.id}/`,
      text: `${tool.id} ${tool.title} ${tool.description}`.toLowerCase(),
    })),
    ...posts,
  ];
  const ranked = candidates.map((candidate) => ({
    ...candidate,
    score: [...terms].filter((term) => candidate.text.includes(term)).length,
  })).sort((a, b) => b.score - a.score);
  return ranked[0]?.url ?? `${nicheConfig.url.replace(/\/$/, '')}${nicheConfig.silos[0]?.pillar ?? '/'}`;
}

function observationProspects(posts: ReturnType<typeof postInventory>): Prospect[] {
  const dir = join(process.cwd(), 'data/observations');
  if (!existsSync(dir)) return [];
  const threads: any[] = [];
  for (const file of readdirSync(dir).filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name)).sort().slice(-30)) {
    try {
      const item = JSON.parse(readFileSync(join(dir, file), 'utf8'));
      if (item.community?.reddit?.status === 'ok') threads.push(...item.community.reddit.threads);
    } catch { /* skip one invalid observation */ }
  }
  return threads.filter((thread) => /\?|help|advice|recommend|identify|how|what|why|best|issue|problem|guide/i.test(thread.title)).map((thread) => {
    const page = bestPage(thread.title, posts);
    return {
      url: thread.permalink, sourceType: 'reddit-thread',
      whyRelevant: `A specific question in r/${thread.subreddit}: “${thread.title}”.`, pageToLink: page,
      personalisedAngle: `Answer the question directly with useful guidance first. Mention ${new URL(page).pathname} only if it genuinely saves the poster work; never drop a context-free link.`,
      status: 'queued' as const, discoveredAt: new Date().toISOString(),
    };
  });
}

function competitorProspects(posts: ReturnType<typeof postInventory>): Prospect[] {
  const file = join(process.cwd(), 'data/competitor-intel.json');
  if (!existsSync(file)) return [];
  try {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    const urls: string[] = (data.competitors ?? []).flatMap((competitor: any) => [
      ...(competitor.topLevelPages ?? []),
      ...(competitor.silos ?? []).flatMap((silo: any) => silo.urls ?? []),
    ]);
    return [...new Set(urls)].filter((url) => /resource|reference|research|links|tools|calculator|directory|recommended|guide/i.test(new URL(url).pathname)).slice(0, 30).map((url) => {
      const page = bestPage(url, posts);
      return { url, sourceType: 'competitor-resource-page', whyRelevant: `Resource/link page discovered in sitemap-heist competitor data and topically aligned with ${nicheConfig.nicheNoun}.`, pageToLink: page, personalisedAngle: `Point out the concrete utility of ${new URL(page).pathname} and suggest it only as a free reader resource that complements the page.`, status: 'queued' as const, discoveredAt: new Date().toISOString() };
    });
  } catch { return []; }
}

function configuredSource(value: string): { label: string; url: string } | null {
  const separator = value.indexOf('|');
  const label = separator >= 0 ? value.slice(0, separator).trim() : '';
  const url = (separator >= 0 ? value.slice(separator + 1) : value).trim();
  try {
    const parsed = new URL(url);
    return { label: label || parsed.hostname.replace(/^www\./, ''), url: parsed.toString() };
  } catch { return null; }
}

function ecosystemProspects(posts: ReturnType<typeof postInventory>): Prospect[] {
  const now = new Date().toISOString();
  const sources: ConfiguredSource[] = [
    ...nicheConfig.communityForums.flatMap((value) => {
      const parsed = configuredSource(value);
      return parsed ? [{ ...parsed, sourceType: 'community-forum' as const }] : [];
    }),
    ...nicheConfig.communityLinks.map((link) => ({ ...link, sourceType: 'community-link' as const })),
    ...nicheConfig.trustedSources.map((link) => ({ ...link, sourceType: 'trusted-source' as const })),
  ];
  const unique = new Map(sources.map((source) => [source.url.replace(/\/$/, ''), source]));
  return [...unique.values()].map((source) => {
    const page = bestPage(`${source.label} ${source.note ?? ''}`, posts);
    return {
      url: source.url,
      sourceType: source.sourceType,
      whyRelevant: source.note || `${source.label} is configured as a relevant ${source.sourceType.replace('-', ' ')} for ${nicheConfig.nicheNoun}.`,
      pageToLink: page,
      personalisedAngle: `Research contribution and resource-link policies first. Suggest ${new URL(page).pathname} only where it adds concrete value for this audience, with no commercial ask.`,
      status: source.sourceType === 'trusted-source' ? 'researching' : 'queued',
      discoveredAt: now,
    };
  });
}

function queueMarkdown(prospects: Prospect[]): string {
  const queued = prospects.filter((item) => item.status === 'queued' || item.status === 'researching');
  return `# Backlink prospect queue\n\nGenerated ${new Date().toISOString()}. **Human review required: nothing in this queue has been sent, posted, or emailed.**\n\n${queued.map((item, index) => `## ${index + 1}. ${item.sourceType}: ${item.url}\n\n- Status: **${item.status}**\n- Relevant because: ${item.whyRelevant}\n- Best page to link: ${item.pageToLink}\n- Personalised angle: ${item.personalisedAngle}`).join('\n\n') || 'No unworked prospects.'}\n`;
}

export async function backlinks(): Promise<void> {
  console.log('\n🔗 WEEKLY BACKLINK PROSPECTING — Human queue only\n');
  const posts = postInventory();
  const previous: Prospect[] = existsSync(OUTPUT) ? (JSON.parse(readFileSync(OUTPUT, 'utf8')).prospects ?? []) : [];
  const previousByUrl = new Map(previous.map((item) => [item.url.replace(/\/$/, ''), item]));
  const candidates = [...observationProspects(posts), ...competitorProspects(posts), ...ecosystemProspects(posts)];
  const merged = new Map<string, Prospect>();
  for (const item of [...previous, ...candidates]) {
    const key = item.url.replace(/\/$/, '');
    const historical = previousByUrl.get(key);
    merged.set(key, historical && ['contacted', 'won', 'declined', 'do-not-contact'].includes(historical.status) ? historical : { ...item, status: historical?.status ?? item.status });
  }
  const prospects = [...merged.values()].sort((a, b) => a.status.localeCompare(b.status) || a.url.localeCompare(b.url));
  mkdirSync(DATA_DIR, { recursive: true });
  mkdirSync(join(process.cwd(), 'docs/backlinks'), { recursive: true });
  writeFileSync(OUTPUT, `${JSON.stringify({ updatedAt: new Date().toISOString(), note: 'Human-operated queue. No outreach is automated.', prospects }, null, 2)}\n`);
  writeFileSync(DOC, queueMarkdown(prospects));
  console.log(`✅ ${prospects.length} deduplicated prospects written: ${OUTPUT}`);
  console.log('🛑 Nothing was sent, posted, or emailed.');
}

async function main(): Promise<void> { try { await backlinks(); } catch (error) { console.error(`❌ Backlink prospecting failed: ${(error as Error).message}`); process.exitCode = 1; } }
if (process.argv[1]?.endsWith('backlinks.ts')) main();
