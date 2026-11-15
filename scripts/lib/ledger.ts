import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import nicheConfig from '../../niche.config';
import type { WeeklyTrend } from '../analyze';

export type SuggestionType = 'content-gap' | 'interactive-tool' | 'ctr-rewrite';
export type SuggestionStatus = 'proposed' | 'implemented' | 'superseded';

export interface LedgerEntry {
  id: string;
  week: string;
  weeks: string[];
  type: SuggestionType;
  title: string;
  target: string;
  proposedAt: string;
  lastProposedAt: string;
  status: SuggestionStatus;
  implementedAt: string | null;
  evidence: string;
  detail: Record<string, unknown>;
}

const LEDGER_FILE = join(process.cwd(), 'data/engine-ledger.json');
const POSTS_DIR = join(process.cwd(), 'src/content/posts');
const TOOLS_DIR = join(process.cwd(), 'src/pages/tools');
const AUDIT_DIR = join(process.cwd(), 'data/audits');
const REVIEW_DIR = join(process.cwd(), 'docs/reviews');

function isoDate(value = new Date()): string { return value.toISOString().slice(0, 10); }

function normalizedTarget(type: SuggestionType, target: string): string {
  if (type === 'ctr-rewrite') {
    try {
      const url = new URL(target);
      return `${url.hostname.toLowerCase()}${url.pathname.replace(/\/+$/, '') || '/'}`;
    } catch { /* Fall through to the generic normalizer. */ }
  }
  return target.toLowerCase().trim().replace(/^\/+|\/+$/g, '').replace(/[^a-z0-9/_-]+/g, '-');
}

function suggestionId(type: SuggestionType, target: string): string {
  const digest = createHash('sha256').update(`${type}:${normalizedTarget(type, target)}`).digest('hex').slice(0, 12);
  return `${type}:${digest}`;
}

function singleLine(value: string): string { return value.replace(/\s+/g, ' ').trim(); }

function proposedEntry(
  trend: WeeklyTrend,
  type: SuggestionType,
  title: string,
  target: string,
  evidence: string,
  detail: Record<string, unknown>,
): LedgerEntry {
  const proposedAt = isoDate(new Date(trend.generatedAt));
  return {
    id: suggestionId(type, target), week: trend.week, weeks: [trend.week], type, title, target,
    proposedAt, lastProposedAt: proposedAt, status: 'proposed', implementedAt: null,
    evidence: singleLine(evidence), detail,
  };
}

function writeLedger(entries: LedgerEntry[]): void {
  mkdirSync(join(process.cwd(), 'data'), { recursive: true });
  writeFileSync(LEDGER_FILE, `${JSON.stringify(entries, null, 2)}\n`);
}

export function readLedger(): LedgerEntry[] {
  if (!existsSync(LEDGER_FILE)) return [];
  const value = JSON.parse(readFileSync(LEDGER_FILE, 'utf8')) as unknown;
  if (Array.isArray(value)) return value as LedgerEntry[];
  if (value && typeof value === 'object' && Array.isArray((value as { entries?: unknown }).entries)) {
    return (value as { entries: LedgerEntry[] }).entries;
  }
  throw new Error(`Suggestion ledger has an invalid shape: ${LEDGER_FILE}`);
}

export function recordSuggestions(trend: WeeklyTrend): LedgerEntry[] {
  const candidates: LedgerEntry[] = [
    ...trend.contentGaps.map((gap) => proposedEntry(
      trend, 'content-gap', gap.title, gap.suggestedSlug, gap.demandEvidence,
      {
        rank: gap.rank, targetKeyword: gap.targetKeyword, category: gap.category,
        whyWeCanWin: gap.whyWeCanWin, outline: gap.outline,
      },
    )),
    proposedEntry(
      trend, 'interactive-tool', trend.interactiveTool.name, trend.interactiveTool.slug,
      trend.interactiveTool.evidence,
      { problemSolved: trend.interactiveTool.problemSolved, reasoning: trend.interactiveTool.reasoning },
    ),
    ...trend.ctrRewrites.map((rewrite) => proposedEntry(
      trend, 'ctr-rewrite', rewrite.proposedTitle, rewrite.url, rewrite.rationale,
      {
        currentTitle: rewrite.currentTitle, proposedTitle: rewrite.proposedTitle,
        proposedDescription: rewrite.proposedDescription, impressions: rewrite.impressions,
        ctr: rewrite.ctr, position: rewrite.position, rationale: rewrite.rationale,
      },
    )),
  ];
  const entries = readLedger();
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  for (const candidate of candidates) {
    const existing = byId.get(candidate.id);
    if (!existing) {
      entries.push(candidate);
      byId.set(candidate.id, candidate);
      continue;
    }
    existing.weeks = [...new Set([...(existing.weeks ?? [existing.week]), trend.week])];
    existing.lastProposedAt = candidate.lastProposedAt;
    existing.title = candidate.title;
    existing.evidence = candidate.evidence;
    existing.detail = existing.type === 'ctr-rewrite'
      ? { ...candidate.detail, currentTitle: existing.detail.currentTitle ?? candidate.detail.currentTitle }
      : candidate.detail;
  }
  writeLedger(entries);
  return entries;
}

function postSlug(target: string): string | null {
  try {
    const pathname = new URL(target, nicheConfig.url).pathname;
    const match = /^\/posts\/([^/]+)\/?$/.exec(pathname);
    return match ? decodeURIComponent(match[1]) : null;
  } catch { return null; }
}

function frontmatterTitle(slug: string): string | null {
  for (const extension of ['md', 'mdx']) {
    const file = join(POSTS_DIR, `${slug}.${extension}`);
    if (!existsSync(file)) continue;
    const raw = readFileSync(file, 'utf8');
    const title = /^title:\s*(.+?)\s*$/mi.exec(raw)?.[1]?.trim();
    return title ? title.replace(/^['"]|['"]$/g, '') : null;
  }
  return null;
}

export function resolveImplementations(): LedgerEntry[] {
  const entries = readLedger();
  let changed = false;
  for (const entry of entries) {
    if (entry.status !== 'proposed') continue;
    let implemented = false;
    if (entry.type === 'content-gap') {
      implemented = ['md', 'mdx'].some((extension) => existsSync(join(POSTS_DIR, `${entry.target}.${extension}`)));
    } else if (entry.type === 'interactive-tool') {
      implemented = existsSync(join(TOOLS_DIR, `${entry.target}.astro`));
    } else {
      const slug = postSlug(entry.target);
      const currentTitle = slug ? frontmatterTitle(slug) : null;
      const proposedFrom = typeof entry.detail.currentTitle === 'string' ? entry.detail.currentTitle : null;
      implemented = Boolean(currentTitle && proposedFrom && currentTitle !== proposedFrom);
    }
    if (!implemented) continue;
    entry.status = 'implemented';
    entry.implementedAt = isoDate();
    changed = true;
  }
  if (changed) writeLedger(entries);
  return entries;
}

function newestAudit(): { generatedAt?: string; summary?: Record<string, number>; issues?: Array<{ severity: string; message: string }> } | null {
  if (!existsSync(AUDIT_DIR)) return null;
  const file = readdirSync(AUDIT_DIR).filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name)).sort().at(-1);
  if (!file) return null;
  try { return JSON.parse(readFileSync(join(AUDIT_DIR, file), 'utf8')); } catch { return null; }
}

function reviewMarkdown(trend: WeeklyTrend, entries: LedgerEntry[]): string {
  const open = entries.filter((entry) => entry.status === 'proposed').sort((a, b) => b.lastProposedAt.localeCompare(a.lastProposedAt));
  const implemented = entries.filter((entry) => entry.status === 'implemented' && entry.weeks.includes(trend.week));
  const audit = newestAudit();
  const summary = audit?.summary ?? {};
  const importantIssues = audit?.issues?.filter((issue) => issue.severity === 'P0' || issue.severity === 'P1') ?? [];
  const headline = trend.communityTopics[0];
  const label = (type: SuggestionType) => ({ 'content-gap': 'Content gap', 'interactive-tool': 'Interactive tool', 'ctr-rewrite': 'CTR rewrite' })[type];
  return `# Engine weekly review — ${trend.week}\n\nGenerated ${isoDate(new Date(trend.generatedAt))}.\n\n## Headline finding\n\n${headline ? `**${headline.topic}.** ${singleLine(headline.reasoning)}` : 'No headline finding was recorded.'}\n\n## Open suggestions\n\n${open.map((entry) => `- **${label(entry.type)} — ${entry.title}** (${entry.weeks.at(-1)}; target: \`${entry.target}\`)\n  ${entry.evidence}`).join('\n') || '- None.'}\n\n## Newly implemented\n\n${implemented.map((entry) => `- **${label(entry.type)} — ${entry.title}** — proposed ${entry.proposedAt}, implemented ${entry.implementedAt ?? 'date unavailable'} (target: \`${entry.target}\`)`).join('\n') || '- None.'}\n\n## Audit posture\n\n${audit ? `Latest audit ${audit.generatedAt?.slice(0, 10) ?? 'date unavailable'}: **P0 ${summary.P0 ?? 0} · P1 ${summary.P1 ?? 0} · P2 ${summary.P2 ?? 0}**.\n\n${importantIssues.map((issue) => `- **${issue.severity}:** ${singleLine(issue.message)}`).join('\n') || '- No P0 or P1 issues.'}` : 'No audit report is available.'}\n`;
}

export function writeWeeklyReview(trend: WeeklyTrend): void {
  const entries = readLedger();
  const markdown = reviewMarkdown(trend, entries);
  mkdirSync(REVIEW_DIR, { recursive: true });
  writeFileSync(join(REVIEW_DIR, `${trend.week}.md`), markdown);
  writeFileSync(join(REVIEW_DIR, 'latest.md'), markdown);
}
