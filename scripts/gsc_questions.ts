// ═══════════════════════════════════════════════════════════════
// GSC Question Miner — shared Search Console client
// ═══════════════════════════════════════════════════════════════

import 'dotenv/config';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gsc } from './lib/gsc';

async function main(): Promise<void> {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 3);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 29);
  console.log(`🔑 Querying ${gsc.property} with shared GSC client...`);
  const rows = await gsc.searchAnalytics({ startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10), dimensions: ['query'], rowLimit: 5000 });
  const questions = rows.filter((row) => /^(how|why|what|can|should)\b|\?/i.test(row.keys?.[0] ?? '')).map((row) => ({
    query: row.keys?.[0] ?? '', impressions: row.impressions, clicks: row.clicks,
    position: Math.round(row.position * 10) / 10,
    opportunity_score: Math.round((row.impressions / (row.position || 1)) * 100) / 100,
  })).sort((a, b) => b.opportunity_score - a.opportunity_score);
  console.log(`✅ Found ${rows.length} queries and ${questions.length} question opportunities.`);
  console.table((questions.length ? questions : rows).slice(0, 20));
  const dir = join(process.cwd(), 'data/research/gsc');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'gsc_questions.json'), `${JSON.stringify(questions.length ? questions : rows, null, 2)}\n`);
}

main().catch((error) => { console.error(`❌ GSC question mining failed: ${(error as Error).message}`); process.exitCode = 1; });
