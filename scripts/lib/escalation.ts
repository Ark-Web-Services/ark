// ═══════════════════════════════════════════════════════════════
// ESCALATION.TS — work the local model could not be trusted to finish
//
// The overnight batch runs on a self-hosted 35B. Measured against Sonnet on
// the same inputs it is grounded but weaker: a third of the evidence detail,
// half the topical coverage, 5 of 5 proposed titles outside their character
// limit, and in one run all three content gaps duplicated pages that already
// existed. Those are not reasons to stop using it — it is free and it does
// mechanical work well — they are reasons to record what it got wrong and
// hand that specific thing to a stronger model.
//
// Escalations are consumed by scripts/escalate.ts, which shells out to the
// Claude Code CLI under the user's SUBSCRIPTION (`claude -p`). That is why
// escalation runs on a workstation and not in the Kubernetes runner: the
// cluster has no subscription credentials, and there is no API key involved.
// ═══════════════════════════════════════════════════════════════

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type EscalationKind =
  | 'duplicate-gap'        // proposed a page that already exists
  | 'constraint-violation' // title/description outside SERP limits
  | 'thin-synthesis'       // evidence too shallow to act on
  | 'schema-retry'         // needed repair to validate
  | 'fact-check';          // domain facts worth a second opinion

export interface Escalation {
  id: string;
  kind: EscalationKind;
  /** What the weaker model produced, verbatim. */
  subject: string;
  /** Why it needs a stronger model, in concrete terms. */
  reason: string;
  /** Everything the reviewer needs; kept small enough to fit a prompt. */
  context: Record<string, unknown>;
  createdAt: string;
  sourceJob: string;
  status: 'open' | 'reviewed' | 'dismissed';
  review?: { at: string; by: string; verdict: string };
}

const QUEUE = join(process.cwd(), 'data', 'escalation-queue.json');

function load(): Escalation[] {
  if (!existsSync(QUEUE)) return [];
  try {
    const parsed = JSON.parse(readFileSync(QUEUE, 'utf8')) as unknown;
    return Array.isArray(parsed) ? (parsed as Escalation[]) : [];
  } catch {
    // A corrupt queue must not take an overnight run down with it.
    console.warn('[escalation] queue unreadable; starting a fresh one.');
    return [];
  }
}

function save(items: Escalation[]): void {
  mkdirSync(dirname(QUEUE), { recursive: true });
  writeFileSync(QUEUE, `${JSON.stringify(items, null, 2)}\n`);
}

/**
 * Add escalations, skipping any whose id is already open.
 *
 * Deduplicating by id matters because the overnight batch reruns nightly: the
 * same weak output would otherwise pile up the same review request seven times
 * a week and bury anything new.
 */
export function escalate(items: Array<Omit<Escalation, 'createdAt' | 'status'>>): number {
  if (!items.length) return 0;
  const existing = load();
  const openIds = new Set(existing.filter((item) => item.status === 'open').map((item) => item.id));
  const fresh = items
    .filter((item) => !openIds.has(item.id))
    .map((item) => ({ ...item, createdAt: new Date().toISOString(), status: 'open' as const }));
  if (!fresh.length) return 0;
  save([...existing, ...fresh]);
  return fresh.length;
}

export function openEscalations(): Escalation[] {
  return load().filter((item) => item.status === 'open');
}

export function resolveEscalation(id: string, verdict: string, by: string): void {
  const items = load();
  const target = items.find((item) => item.id === id);
  if (!target) return;
  target.status = 'reviewed';
  target.review = { at: new Date().toISOString(), by, verdict };
  save(items);
}

export function escalationSummary(): Record<string, number> {
  const items = load();
  const counts: Record<string, number> = { total: items.length, open: 0, reviewed: 0, dismissed: 0 };
  for (const item of items) counts[item.status] = (counts[item.status] ?? 0) + 1;
  return counts;
}
