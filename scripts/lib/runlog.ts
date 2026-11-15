// ═══════════════════════════════════════════════════════════════
// RUNLOG.TS — Persistent scheduler health records
// ═══════════════════════════════════════════════════════════════

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface RunLog {
  job: string;
  lastStartedAt: string;
  lastSucceededAt: string | null;
  lastStatus: 'running' | 'succeeded' | 'failed';
  lastError: string | null;
  durationMs: number;
  consecutiveFailures: number;
}

const RUN_DIR = join(process.cwd(), 'data/runs');

function pathFor(job: string): string {
  return join(RUN_DIR, `${job.replace(/[^a-z0-9-]/gi, '-')}.json`);
}

function readRun(job: string): RunLog | null {
  const file = pathFor(job);
  if (!existsSync(file)) return null;
  try { return JSON.parse(readFileSync(file, 'utf8')) as RunLog; } catch { return null; }
}

function writeRun(log: RunLog): void {
  mkdirSync(RUN_DIR, { recursive: true });
  writeFileSync(pathFor(log.job), `${JSON.stringify(log, null, 2)}\n`);
}

export async function withRunLog<T>(job: string, fn: () => Promise<T>): Promise<T> {
  const previous = readRun(job);
  const started = Date.now();
  const log: RunLog = {
    job,
    lastStartedAt: new Date(started).toISOString(),
    lastSucceededAt: previous?.lastSucceededAt ?? null,
    lastStatus: 'running',
    lastError: null,
    durationMs: 0,
    consecutiveFailures: previous?.consecutiveFailures ?? 0,
  };
  writeRun(log);
  try {
    const result = await fn();
    writeRun({
      ...log,
      lastSucceededAt: new Date().toISOString(),
      lastStatus: 'succeeded',
      durationMs: Date.now() - started,
      consecutiveFailures: 0,
    });
    return result;
  } catch (error) {
    writeRun({
      ...log,
      lastStatus: 'failed',
      lastError: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - started,
      consecutiveFailures: (previous?.consecutiveFailures ?? 0) + 1,
    });
    throw error;
  }
}

export function staleJobs(maxAgeByJob: Record<string, number>): RunLog[] {
  if (!existsSync(RUN_DIR)) return [];
  const known = new Map<string, RunLog>();
  for (const file of readdirSync(RUN_DIR).filter((name) => name.endsWith('.json'))) {
    try {
      const run = JSON.parse(readFileSync(join(RUN_DIR, file), 'utf8')) as RunLog;
      known.set(run.job, run);
    } catch { /* Ignore corrupt historical records. */ }
  }
  const now = Date.now();
  return Object.entries(maxAgeByJob).flatMap(([job, intervalMs]) => {
    const run = known.get(job);
    const succeededAt = run?.lastSucceededAt ? Date.parse(run.lastSucceededAt) : 0;
    if (succeededAt && now - succeededAt <= intervalMs * 2) return [];
    return [run ?? {
      job,
      lastStartedAt: '',
      lastSucceededAt: null,
      lastStatus: 'failed' as const,
      lastError: 'Job has never succeeded.',
      durationMs: 0,
      consecutiveFailures: 0,
    }];
  });
}
