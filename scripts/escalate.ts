// ═══════════════════════════════════════════════════════════════
// ESCALATE.TS — review the local model's weak output with a stronger one
//
// Uses the Claude Code CLI in headless mode (`claude -p`), which authenticates
// with the user's SUBSCRIPTION. No API key, no per-token billing.
//
// Why a CLI and not an endpoint: a Claude or ChatGPT subscription is licensed
// for its own clients, not as a general-purpose API, and Ollama cannot expose
// either of them — it serves local GGUF weights and nothing else. Driving the
// official CLI non-interactively is the sanctioned way to spend a subscription
// programmatically.
//
// Consequence for scheduling: this must run on a machine where `claude` is
// logged in. The Kubernetes Drone runner has no such credentials, so
// escalation is an intentional workstation action, separate from CI.
//
//   npm run escalate -- --dry        preview the queue without spending
//   npm run escalate -- --id=<id>    review one selected item
// ═══════════════════════════════════════════════════════════════

import { execFileSync } from 'node:child_process';
import nicheConfig from '../niche.config';
import { openEscalations, resolveEscalation, escalationSummary } from './lib/escalation';

const REVIEWER = process.env.ESCALATION_CLI || 'claude';
const DRY = process.argv.includes('--dry');
const selectedId = process.argv.find((arg) => arg.startsWith('--id='))?.slice(5);

function buildPrompt(item: ReturnType<typeof openEscalations>[number]): string {
  return [
    `You are reviewing output from a weaker local model that runs an SEO content engine for ${nicheConfig.url}, covering ${nicheConfig.nicheNoun}.`,
    nicheConfig.nicheContext,
    '',
    `ISSUE TYPE: ${item.kind}`,
    `SUBJECT: ${item.subject}`,
    `WHY IT WAS ESCALATED: ${item.reason}`,
    '',
    'CONTEXT (JSON):',
    JSON.stringify(item.context, null, 2).slice(0, 12_000),
    '',
    'Rules that constrain any answer:',
    '- Titles must be 25-41 characters; descriptions 120-155 characters.',
    '- Never propose a new page that duplicates an existing slug. Prefer improving the existing page.',
    `- Apply these configured editorial rules: ${nicheConfig.contentGuidelines}`,
    '- Treat niche-specific technical figures and safety claims as load-bearing; flag anything you cannot verify.',
    '- No invented experience, statistics or citations. The byline is an organization.',
    '',
    'Answer in under 200 words, as a decision not an essay. State: the verdict (act / modify / drop),',
    'the concrete change to make, and any figure you are not confident about.',
  ].join('\n');
}

function review(prompt: string): string {
  // 4 minutes: a review is one turn, but a cold CLI start plus a long context
  // can be slow, and killing it early wastes the whole item.
  return execFileSync(REVIEWER, ['-p', prompt], {
    encoding: 'utf8',
    timeout: 240_000,
    maxBuffer: 8 * 1024 * 1024,
  }).trim();
}

const open = openEscalations();
if (!DRY && !selectedId) {
  console.error('Select one reviewer-approved escalation with --id=<id>; no subscription call was made.');
  process.exit(2);
}
const selected = selectedId ? open.filter((item) => item.id === selectedId) : open;
if (selectedId && !selected.length) {
  console.error(`No open escalation has id ${selectedId}; no subscription call was made.`);
  process.exit(2);
}
console.log(`\n⤴️  ESCALATION REVIEW — ${open.length} open item(s); selected ${selected.length}\n`);
if (!open.length) {
  console.log('   Nothing to review.');
  process.exit(0);
}

let reviewed = 0;
let failed = 0;
for (const item of selected) {
  const prompt = buildPrompt(item);
  console.log(`── [${item.kind}] ${item.subject}`);
  if (DRY) {
    console.log(prompt.slice(0, 600));
    console.log('   … (dry run; nothing spent)\n');
    continue;
  }
  try {
    const verdict = review(prompt);
    resolveEscalation(item.id, verdict, `${REVIEWER} (subscription)`);
    console.log(`   ✅ reviewed\n${verdict.split('\n').map((line) => `      ${line}`).join('\n')}\n`);
    reviewed += 1;
  } catch (error) {
    // Leave it open: an unreviewed item is recoverable, a wrongly-resolved one
    // silently loses the finding.
    const message = (error as Error).message.split('\n')[0];
    console.warn(`   ⚠️  review failed, leaving open: ${message}\n`);
    failed += 1;
  }
}

console.log(`Reviewed ${reviewed}, failed ${failed}. Queue now: ${JSON.stringify(escalationSummary())}`);
