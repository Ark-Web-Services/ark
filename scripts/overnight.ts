// ═══════════════════════════════════════════════════════════════
// OVERNIGHT.TS — workstation-side batch, local model, nobody waiting
//
// Runs from 22:00 on the machine that can reach the self-hosted LLM. Local
// inference is free and unmetered, so this trades latency for thoroughness:
// many small steps, each independently retryable, instead of one long call
// that loses everything when it fails.
//
// Ordering is deliberate: cheap deterministic work first, so that if the LLM
// steps fail the night still produced a fresh audit and work queue. The
// escalation findings are queued for a separate reviewed dispatch.
//
// Steps are independent by design — one failure does not abort the night.
// The run summary reports what succeeded, and a non-zero exit only means
// something needs looking at in the morning, never that nothing ran.
//
//   npm run overnight            everything
//   npm run overnight -- --only=audit,work-queue
//   npm run escalate -- --dry       inspect the paid-review queue
// ═══════════════════════════════════════════════════════════════

import { spawnSync } from 'node:child_process';
import { escalationSummary } from './lib/escalation';
import { configuredProviders } from './lib/llm';

interface Step {
  name: string;
  command: string;
  args: string[];
  /** Deterministic steps need no LLM and must run even if the model is down. */
  needsLlm: boolean;
  /** Minutes. A local 35B is slow; the synthesis alone takes ~3. */
  budgetMinutes: number;
  why: string;
}

const STEPS: Step[] = [
  {
    name: 'observe',
    command: 'npm', args: ['run', 'observe'],
    needsLlm: false, budgetMinutes: 15,
    why: 'Pull GSC, Reddit, forum and autocomplete signals for the day.',
  },
  {
    name: 'analyze',
    command: 'npm', args: ['run', 'analyze'],
    needsLlm: true, budgetMinutes: 30,
    why: 'Label demand records and synthesise the weekly trend, gaps and CTR rewrites.',
  },
  {
    name: 'audit',
    command: 'npm', args: ['run', 'audit:seo'],
    needsLlm: false, budgetMinutes: 25,
    why: 'Build, then check the live site for P0/P1 regressions, broken links and stale lastmod.',
  },
  {
    name: 'work-queue',
    command: 'npm', args: ['run', 'work-queue'],
    needsLlm: false, budgetMinutes: 2,
    why: 'Collapse audit, ledger, prospects and GSC into one ranked actionable list.',
  },
];

function arg(flag: string): string[] {
  const raw = process.argv.find((value) => value.startsWith(`--${flag}=`));
  return raw ? raw.split('=')[1].split(',').map((value) => value.trim()).filter(Boolean) : [];
}
const only = arg('only');
const skip = arg('skip');

const selected = STEPS.filter((step) => (only.length ? only.includes(step.name) : true) && !skip.includes(step.name));

console.log(`\n🌙 OVERNIGHT BATCH — ${new Date().toISOString()}`);
console.log(`   ${selected.length} step(s): ${selected.map((step) => step.name).join(' → ')}\n`);

const results: Array<{ step: string; ok: boolean; seconds: number; note: string }> = [];

/**
 * Probe the LLM once before the night starts. `needsLlm` existed on every step
 * but nothing read it, so on nights the box was down each LLM step discovered
 * that separately through a full retry cycle and then failed the build.
 * Skipping them up front is faster and makes the morning summary say plainly
 * that the box was down, rather than showing two opaque failures.
 */
async function llmReachable(): Promise<boolean> {
  const base = (process.env.OLLAMA_BASE_URL || '').replace(/\/+$/, '').replace(/\/v1$/, '');
  if (!base) return true; // not using the local box; let the provider chain decide
  try {
    const response = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(15_000) });
    return response.ok;
  } catch {
    return false;
  }
}
// Ollama being down only matters if nothing else is configured to take over.
// With subscription CLI fallbacks in the order, the provider chain moves to
// them on its own — skipping the LLM steps here would throw that resilience away.
const fallbacks = configuredProviders('heavy').filter((provider) => provider !== 'ollama');
const ollamaUp = selected.some((step) => step.needsLlm) ? await llmReachable() : true;
const llmUp = ollamaUp || fallbacks.length > 0;
if (!ollamaUp && fallbacks.length) console.log(`⚠️  Self-hosted LLM unreachable — LLM steps will fall back to: ${fallbacks.join(' → ')}\n`);
if (!llmUp) console.log('⚠️  Self-hosted LLM unreachable and no fallback configured — skipping LLM steps tonight; deterministic steps still run.\n');

for (const step of selected) {
  if (step.needsLlm && !llmUp) {
    results.push({ step: step.name, ok: false, seconds: 0, note: 'skipped: LLM box unreachable' });
    console.log(`⏭  ${step.name}: skipped (LLM box unreachable)`);
    continue;
  }
  const started = Date.now();
  console.log(`\n${'═'.repeat(60)}\n▶ ${step.name} — ${step.why}\n${'═'.repeat(60)}`);
  const run = spawnSync(step.command, step.args, {
    stdio: 'inherit',
    timeout: step.budgetMinutes * 60_000,
    env: process.env,
  });
  const seconds = (Date.now() - started) / 1000;
  const timedOut = run.error && /ETIMEDOUT|timed out/i.test(String((run.error as NodeJS.ErrnoException).code ?? run.error.message));
  const ok = !run.error && run.status === 0;
  const note = ok ? 'ok' : timedOut ? `exceeded ${step.budgetMinutes}m budget` : `exit ${run.status ?? '?'}`;
  results.push({ step: step.name, ok, seconds, note });
  console.log(`\n${ok ? '✅' : '⚠️ '} ${step.name}: ${note} in ${(seconds / 60).toFixed(1)}m`);
  // Deliberately no early exit. A failed analyze should not cost the night's
  // audit, and a failed audit should not cost the escalation review.
}

console.log(`\n${'═'.repeat(60)}\n🌅 OVERNIGHT SUMMARY\n${'═'.repeat(60)}`);
for (const result of results) {
  console.log(`   ${result.ok ? '✅' : '⚠️ '} ${result.step.padEnd(12)} ${(result.seconds / 60).toFixed(1).padStart(5)}m  ${result.note}`);
}
console.log(`   escalation queue: ${JSON.stringify(escalationSummary())}`);

const failures = results.filter((result) => !result.ok);
if (failures.length) {
  console.log(`\n   ${failures.length} step(s) need attention: ${failures.map((f) => f.step).join(', ')}`);
  process.exit(1);
}
console.log('\n   All steps completed.\n');
