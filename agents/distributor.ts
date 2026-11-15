// ═══════════════════════════════════════════════════════════════
// DISTRIBUTOR.TS — Multi-Channel Visual Distribution Agent
// ═══════════════════════════════════════════════════════════════
// Loads a Distribution Plan (or batch of plans) from
// data/plans/*.json and executes it across Pinterest, Imgur,
// and Tumblr in coordinated fashion.
//
// Plans conform to schemas/distribution-plan.schema.json.
//
// Pipeline:
//   1. Discover plan files in data/plans/ (or accept single file via CLI arg)
//   2. Validate each against schema
//   3. Execute via DistributionEngine (Imgur → Pinterest → Tumblr)
//   4. Persist DistributionReport to data/distribution-logs/
//   5. Append summary to data/distribution-summary.json
//
// Usage:
//   npx tsx agents/distributor.ts                  # Process all data/plans/*.json
//   npx tsx agents/distributor.ts <plan.json>      # Process single plan
//   npx tsx agents/distributor.ts --dry-run        # Force dry_run mode
// ═══════════════════════════════════════════════════════════════

import 'dotenv/config';
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
} from 'fs';
import { join } from 'path';
import { DistributionEngine } from '../src/lib/distribution/engine';
import type {
  DistributionPlan,
  DistributionReport,
} from '../src/lib/distribution/types';
import { validatePlan } from '../src/lib/distribution/validator';

const DATA_DIR = join(process.cwd(), 'data');
const PLANS_DIR = join(DATA_DIR, 'plans');
const PROCESSED_DIR = join(DATA_DIR, 'plans/processed');
const LOG_DIR = join(DATA_DIR, 'distribution-logs');
const SUMMARY_FILE = join(DATA_DIR, 'distribution-summary.json');

interface SummaryEntry {
  plan_id: string;
  asset_title: string;
  generated_at: string;
  successful: number;
  failed: number;
  live_urls: { platform: string; url: string }[];
}

async function processPlanFile(
  file: string,
  engine: DistributionEngine,
  dryRunOverride: boolean
): Promise<DistributionReport | null> {
  console.log(`\n📦 Processing plan: ${file}`);
  let plan: DistributionPlan;
  try {
    plan = JSON.parse(readFileSync(file, 'utf-8'));
  } catch (err) {
    console.error(`   ❌ Invalid JSON: ${err}`);
    return null;
  }

  const v = validatePlan(plan);
  if (!v.valid) {
    console.error(`   ❌ Schema validation failed:`);
    for (const e of v.errors) console.error(`      - ${e}`);
    return null;
  }
  for (const w of v.warnings) console.warn(`   ⚠️ ${w}`);

  if (dryRunOverride) plan.execution_mode = 'dry_run';

  console.log(`   🆔 plan_id:   ${plan.plan_id}`);
  console.log(`   🎯 mode:      ${plan.execution_mode}`);
  console.log(`   🖼️  asset:     ${plan.asset_package.title}`);

  const enabled = Object.entries(plan.platform_routes)
    .filter(([, v]: any) => v && v.enabled !== false)
    .map(([k]) => k);
  console.log(`   📡 channels:  ${enabled.join(', ')}`);

  try {
    const report = await engine.execute(plan);

    console.log(`\n   ✅ Distribution complete (${report.duration_ms}ms)`);
    console.log(`      Successful: ${report.successful}/${report.total_platforms}`);
    for (const r of report.results) {
      const icon = r.success ? '✅' : '❌';
      console.log(`      ${icon} ${r.platform.padEnd(10)} ${r.live_url || r.error}`);
    }
    return report;
  } catch (err: any) {
    console.error(`   ❌ Engine error: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('\n📡 GODFATHER DISTRIBUTOR — Multi-Channel Visual Engine\n');
  console.log('═'.repeat(60));

  const args = process.argv.slice(2);
  const dryRunOverride = args.includes('--dry-run');
  const listBoards = args.includes('--list-boards');
  const explicitFile = args.find((a) => !a.startsWith('--'));

  for (const dir of [DATA_DIR, PLANS_DIR, PROCESSED_DIR, LOG_DIR]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  // Discover plans
  let planFiles: string[] = [];
  if (explicitFile) {
    if (!existsSync(explicitFile)) {
      console.error(`❌ Plan file not found: ${explicitFile}`);
      process.exit(1);
    }
    planFiles = [explicitFile];
  } else {
    planFiles = readdirSync(PLANS_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => join(PLANS_DIR, f));
  }

  if (planFiles.length === 0) {
    console.log('ℹ️  No plans found in data/plans/. Drop a JSON plan there to begin.');
    console.log('   See schemas/distribution-plan.schema.json for the schema.');
    return;
  }

  console.log(`Found ${planFiles.length} plan file(s).\n`);

  const engine = new DistributionEngine({ log_dir: 'data/distribution-logs' });

  if (listBoards) {
    try {
      const { PinterestClient } = await import('../src/lib/distribution/pinterest-client');
      const client = PinterestClient.fromEnv();
      const boards = await client.listBoards();
      console.log('📌 Your Pinterest Boards:');
      console.log('═'.repeat(40));
      if (boards.length === 0) {
        console.log('  (No boards found on this account)');
      }
      for (const b of boards) {
        console.log(`  ID:   ${b.id.padEnd(20)} Name: ${b.name}`);
      }
      console.log('═'.repeat(40));
      console.log('\nCopy the ID for your target board and paste it into niche.config.ts\n');
      process.exit(0);
    } catch (err: any) {
      console.error(`❌ Could not list boards: ${err.message}`);
      process.exit(1);
    }
  }

  const summary: SummaryEntry[] = existsSync(SUMMARY_FILE)
    ? JSON.parse(readFileSync(SUMMARY_FILE, 'utf-8'))
    : [];

  for (const file of planFiles) {
    const report = await processPlanFile(file, engine, dryRunOverride);
    if (report) {
      summary.unshift({
        plan_id: report.plan_id,
        asset_title: report.asset_title,
        generated_at: report.generated_at,
        successful: report.successful,
        failed: report.failed,
        live_urls: report.results
          .filter((r) => r.success && r.live_url)
          .map((r) => ({ platform: r.platform, url: r.live_url! })),
      });

      // Move processed plan out of the queue (only when not from explicit arg)
      if (!explicitFile) {
        try {
          renameSync(file, join(PROCESSED_DIR, `${report.plan_id}.json`));
        } catch { /* best-effort */ }
      }
    }
  }

  writeFileSync(SUMMARY_FILE, JSON.stringify(summary.slice(0, 200), null, 2));
  console.log(`\n📄 Summary: ${SUMMARY_FILE}`);
  console.log('═'.repeat(60));
}

main().catch((err) => {
  console.error('\n💥 Distributor crashed:', err);
  process.exit(1);
});
