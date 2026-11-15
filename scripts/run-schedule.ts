// ═══════════════════════════════════════════════════════════════
// RUN-SCHEDULE.TS — Scheduler-neutral job dispatcher
// ═══════════════════════════════════════════════════════════════

import { analyze } from './analyze';
import { backlinks } from './backlinks';
import { observe } from './observe';
import { seoAudit } from './seo-audit';
import { writeWeekly } from './write-weekly';
import { staleJobs, withRunLog } from './lib/runlog';

type Job = 'observe' | 'analyze' | 'write-weekly' | 'audit-seo' | 'backlinks' | 'weekly-all';
const intervals = { observe: 86_400_000, analyze: 7 * 86_400_000, 'write-weekly': 7 * 86_400_000, 'audit-seo': 7 * 86_400_000, backlinks: 7 * 86_400_000 };

async function run(job: Exclude<Job, 'weekly-all'>): Promise<void> {
  const jobs: Record<Exclude<Job, 'weekly-all'>, () => Promise<void>> = { observe, analyze, 'write-weekly': writeWeekly, 'audit-seo': seoAudit, backlinks };
  await withRunLog(job, jobs[job]);
}

async function main(): Promise<void> {
  const job = process.argv[2] as Job | undefined;
  if (!job || !['observe', 'analyze', 'write-weekly', 'audit-seo', 'backlinks', 'weekly-all'].includes(job)) {
    throw new Error('Usage: run-schedule.ts observe|analyze|write-weekly|audit-seo|backlinks|weekly-all');
  }
  const stale = staleJobs(intervals);
  if (stale.length) console.warn(`⚠️ Stale scheduled jobs: ${stale.map((item) => item.job).join(', ')}`);
  if (job === 'weekly-all') {
    await withRunLog('weekly-all', async () => { await run('analyze'); await run('write-weekly'); });
  } else await run(job);
}

main().catch((error) => { console.error(`❌ Scheduled job failed: ${(error as Error).message}`); process.exitCode = 1; });
