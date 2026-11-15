import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import nicheConfig from '../niche.config';

const PLANS_DIR = join(process.cwd(), 'data/plans');
const OUTPUT_FILE = join(process.cwd(), 'public/visuals.xml');
const BASE_URL = nicheConfig.url.replace(/\/$/, '');
const IMAGE_BASE_URL = `${BASE_URL}/assets/visuals`;

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return c;
    }
  });
}

function generateRss() {
  console.log('📡 Generating Pinterest RSS Feed...');

  const planFiles = readdirSync(PLANS_DIR).filter(f => f.endsWith('.json'));

  let itemsXml = '';

  for (const file of planFiles) {
    try {
      const plan = JSON.parse(readFileSync(join(PLANS_DIR, file), 'utf-8'));

      // Skip the example plan
      if (plan.plan_id.includes('example')) continue;

      const title = escapeXml(plan.asset_package.title);
      const description = escapeXml(plan.asset_package.summary);
      const link = plan.asset_package.canonical_source_url;

      // Get filename from path
      const imagePath = plan.asset_package.primary_image.source;
      const filename = imagePath.split('/').pop();
      const imageUrl = `${IMAGE_BASE_URL}/${filename}`;

      itemsXml += `
    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${description}</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <guid isPermaLink="false">${plan.plan_id}</guid>
      <media:content url="${imageUrl}" medium="image" />
    </item>`;
    } catch (err) {
      console.warn(`⚠️  Skipping ${file}: ${err}`);
    }
  }

  const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(nicheConfig.siteName)} - Visual Guides</title>
    <link>${BASE_URL}</link>
    <description>${escapeXml(`Visual guides about ${nicheConfig.nicheNoun} from ${nicheConfig.siteName}.`)}</description>
    <language>${escapeXml(nicheConfig.lang)}</language>
    ${itemsXml}
  </channel>
</rss>`;

  writeFileSync(OUTPUT_FILE, rssXml.trim());
  console.log(`\n✅ RSS Feed generated at: ${OUTPUT_FILE}`);
  console.log(`🔗 URL will be: ${BASE_URL}/visuals.xml`);
}

generateRss();
