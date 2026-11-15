// Submit the site's sitemap to Search Console after deploy.
// The Indexing API is only eligible for JobPosting and livestream
// BroadcastEvent pages; this generic engine handles ordinary site pages.

import nicheConfig from "../niche.config";
import { gsc } from "./lib/gsc";

const SITE_URL = (process.env.SITE_URL || nicheConfig.url).replace(/\/$/, "");
const SITEMAP_URL = `${SITE_URL}/sitemap-index.xml`;

async function main() {
  console.log(`[gsc-sync] Submitting sitemap: ${SITEMAP_URL}`);
  try {
    await gsc.submitSitemap(SITEMAP_URL);
    console.log("[gsc-sync] Sitemap submitted successfully.");
  } catch (error) {
    // A Search Console outage should not roll back a successful site deploy.
    console.warn(`[gsc-sync] Sitemap submission failed: ${(error as Error).message}`);
  }
}

main().catch((error) => {
  console.error(`[gsc-sync] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
