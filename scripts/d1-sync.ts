// ═══════════════════════════════════════════════════════════════
// D1-SYNC.TS — Data Pusher to Cloudflare D1
// Reads from niche.config.ts for domain matching
// ═══════════════════════════════════════════════════════════════

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import nicheConfig, { getSiteDomain } from '../niche.config';

// ── Configuration ────────────────────────────────────────────

const DATA_DIR = join(process.cwd(), 'data');
const GSC_FILE = join(DATA_DIR, 'gsc-intelligence.json');
const COMPETITOR_FILE = join(DATA_DIR, 'competitor-intel.json');

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const D1_DATABASE_ID = process.env.D1_DATABASE_ID!;

// ── D1 Helper ────────────────────────────────────────────────

async function d1Query(sql: string, params: any[] = []): Promise<any> {
  const response = await fetch(
    `${CF_API_BASE}/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    }
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`D1 query failed (${response.status}): ${text}`);
  }
  return await response.json();
}

// ── Sync GSC Keywords ────────────────────────────────────────

async function syncGSCData(): Promise<void> {
  if (!existsSync(GSC_FILE)) {
    console.warn('⚠️ No GSC data found');
    return;
  }

  console.log('\n📊 Syncing GSC data to D1...');
  const gscData = JSON.parse(readFileSync(GSC_FILE, 'utf-8'));

  for (const q of gscData.queries || []) {
    await d1Query(
      `INSERT INTO keywords (term, search_volume, last_checked)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(term) DO UPDATE SET
         search_volume = ?,
         last_checked = datetime('now')`,
      [q.query, q.impressions, q.impressions]
    );

    // Get keyword ID
    const result = await d1Query('SELECT id FROM keywords WHERE term = ?', [q.query]);
    const keywordId = result?.result?.[0]?.results?.[0]?.id;
    if (!keywordId) continue;

    // Insert rank log
    await d1Query(
      `INSERT INTO rank_logs (keyword_id, position, url, serp_data) VALUES (?, ?, ?, ?)`,
      [
        keywordId,
        Math.round(q.position),
        q.url,
        JSON.stringify({ clicks: q.clicks, impressions: q.impressions, ctr: q.ctr }),
      ]
    );

    // Update status
    let status = 'tracking';
    if (q.position >= 1 && q.position <= 10) status = 'ranked';
    else if (q.position >= 11 && q.position <= 20) status = 'striking-distance';

    await d1Query('UPDATE keywords SET status = ? WHERE id = ?', [status, keywordId]);
    console.log(`   ✅ "${q.query}" → #${Math.round(q.position)} (${status})`);
  }
}

// ── Sync Competitors ─────────────────────────────────────────

async function syncCompetitors(): Promise<void> {
  if (!existsSync(COMPETITOR_FILE)) {
    console.warn('⚠️ No competitor data found');
    return;
  }

  console.log('\n🕵️ Syncing competitor intel to D1...');
  const heistData = JSON.parse(readFileSync(COMPETITOR_FILE, 'utf-8'));

  for (const comp of heistData.competitors) {
    await d1Query(
      `INSERT INTO competitors (domain, silo_structure, top_keywords, content_count, last_scraped)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(domain) DO UPDATE SET
         silo_structure = ?, content_count = ?, last_scraped = datetime('now')`,
      [
        comp.domain,
        JSON.stringify(comp.silos),
        JSON.stringify(comp.topLevelPages),
        comp.totalPages,
        JSON.stringify(comp.silos),
        comp.totalPages,
      ]
    );
    console.log(`   ✅ ${comp.domain} → ${comp.totalPages} pages`);
  }

  // Content gaps
  for (const topic of (heistData.commonTopics || []).slice(0, 30)) {
    try {
      await d1Query(
        `INSERT OR IGNORE INTO content_gaps (topic, our_coverage, status) VALUES (?, 'none', 'identified')`,
        [topic]
      );
    } catch { /* skip duplicates */ }
  }
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  console.log('\n🔄 GODFATHER D1 SYNC — Pushing intelligence\n');
  console.log('═'.repeat(60));

  if (!CF_TOKEN || !CF_ACCOUNT_ID || !D1_DATABASE_ID) {
    console.error('❌ Missing Cloudflare env vars');
    process.exit(1);
  }

  await syncGSCData();
  await syncCompetitors();

  console.log('\n✅ D1 sync complete');
  console.log('═'.repeat(60));
}

main().catch(console.error);
