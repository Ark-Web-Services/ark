// ═══════════════════════════════════════════════════════════════
// GSC-INTEL.TS — Search Console intelligence via shared client
// ═══════════════════════════════════════════════════════════════

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gsc } from './lib/gsc';

const DATA_DIR = join(process.cwd(), 'data');
const OUTPUT_FILE = join(DATA_DIR, 'gsc-intelligence.json');
function dateOnly(date: Date): string { return date.toISOString().slice(0, 10); }

async function main(): Promise<void> {
  console.log('\n🔍 GODFATHER GSC INTELLIGENCE — Shared Search Console client\n');
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 3);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 27);
  const startDate = dateOnly(start);
  const endDate = dateOnly(end);
  console.log(`📊 Property ${gsc.property} (${startDate} to ${endDate})`);
  const [queryRows, pageRows] = await Promise.all([
    gsc.searchAnalytics({ startDate, endDate, dimensions: ['query', 'page'], rowLimit: 1000 }),
    gsc.searchAnalytics({ startDate, endDate, dimensions: ['page'], rowLimit: 500 }),
  ]);
  const queries = queryRows.map((row) => ({ query: row.keys?.[0] ?? '', url: row.keys?.[1] ?? null, clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position }));
  const topPages = pageRows.map((row) => ({ page: row.keys?.[0] ?? '', clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position }));
  const totalClicks = pageRows.reduce((sum, row) => sum + row.clicks, 0);
  const totalImpressions = pageRows.reduce((sum, row) => sum + row.impressions, 0);
  const avgPosition = totalImpressions ? pageRows.reduce((sum, row) => sum + row.position * row.impressions, 0) / totalImpressions : 0;
  const output = {
    fetchedAt: new Date().toISOString(), siteUrl: gsc.siteUrl, property: gsc.property, dateRange: { start: startDate, end: endDate },
    queries: queries.sort((a, b) => b.impressions - a.impressions), topPages: topPages.sort((a, b) => b.impressions - a.impressions),
    summary: { totalClicks, totalImpressions, avgCtr: totalImpressions ? totalClicks / totalImpressions : 0, avgPosition, totalKeywords: queries.length },
  };
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`✅ GSC intelligence written: ${OUTPUT_FILE}`);
  console.log(`   ${totalImpressions} impressions, ${totalClicks} clicks, ${(output.summary.avgCtr * 100).toFixed(2)}% CTR, position ${avgPosition.toFixed(1)}`);
}

main().catch((error) => { console.error(`❌ GSC intelligence failed: ${(error as Error).message}`); process.exitCode = 1; });
