// Audit every URL in the live sitemap with Google's URL Inspection API.
// This reports Google's indexed version; it does not request indexing.

import 'dotenv/config';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gsc } from './lib/gsc';

const SITEMAP_URL = `${gsc.siteUrl}/sitemap-index.xml`;
const OUTPUT_FILE = join(process.cwd(), 'data', 'gsc-url-inspection.json');
interface IndexStatusResult { verdict?: string; coverageState?: string; robotsTxtState?: string; indexingState?: string; lastCrawlTime?: string; pageFetchState?: string; googleCanonical?: string; userCanonical?: string; crawledAs?: string; sitemap?: string[]; referringUrls?: string[] }

async function fetchSitemapUrls(): Promise<string[]> {
  const indexResponse = await fetch(SITEMAP_URL);
  if (!indexResponse.ok) throw new Error(`Could not fetch ${SITEMAP_URL} (HTTP ${indexResponse.status})`);
  const children = [...(await indexResponse.text()).matchAll(/<sitemap>\s*<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const urls: string[] = [];
  for (const child of children) {
    const response = await fetch(child);
    if (!response.ok) { console.warn(`[gsc-inspect] Skipping ${child} (HTTP ${response.status})`); continue; }
    urls.push(...[...(await response.text()).matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
  }
  return [...new Set(urls)];
}

async function main(): Promise<void> {
  const urls = await fetchSitemapUrls();
  const results: Array<{ url: string; indexStatus: IndexStatusResult; error?: string }> = [];
  console.log(`[gsc-inspect] Inspecting ${urls.length} sitemap URLs for ${gsc.property}`);
  for (const [index, url] of urls.entries()) {
    try {
      const response = await gsc.inspectUrl(url) as { inspectionResult?: { indexStatusResult?: IndexStatusResult } };
      const indexStatus = response.inspectionResult?.indexStatusResult ?? {};
      results.push({ url, indexStatus });
      console.log(`[${index + 1}/${urls.length}] ${indexStatus.coverageState ?? 'Unknown'}: ${url}`);
    } catch (error) {
      const message = (error as Error).message;
      results.push({ url, indexStatus: {}, error: message });
      console.warn(`[${index + 1}/${urls.length}] ERROR: ${url}: ${message}`);
    }
  }
  const summary = results.reduce<Record<string, number>>((counts, result) => {
    const key = result.error ? 'API error' : result.indexStatus.coverageState || 'Unknown to Google';
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const outputDir = join(process.cwd(), 'data');
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  writeFileSync(OUTPUT_FILE, `${JSON.stringify({ generatedAt: new Date().toISOString(), siteUrl: gsc.siteUrl, property: gsc.property, sitemapUrl: SITEMAP_URL, summary, results }, null, 2)}\n`);
  console.table(summary);
  console.log(`[gsc-inspect] Report written to ${OUTPUT_FILE}`);
}

main().catch((error) => { console.error(`[gsc-inspect] ${(error as Error).message}`); process.exitCode = 1; });
