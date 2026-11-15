import { mkdirSync, existsSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { templateFiles, fileHash, ENGINE_VERSION } from './lib/template-files';

function argument(name: string, fallback = '') {
  const position = process.argv.indexOf(`--${name}`);
  return position < 0 ? fallback : process.argv[position + 1] ?? '';
}
const source = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destination = resolve(argument('out', '../service-business-template'));
const name = argument('name', 'Your Studio');
const domain = argument('domain', 'studio.example').replace(/^https?:\/\//, '').replace(/\/$/, '');
const email = argument('email', 'hello@studio.example');
if (destination === source || !relative(source, destination).startsWith('..')) throw new Error('Choose a new folder outside the engine.');
if (existsSync(destination)) throw new Error(`Destination already exists: ${destination}`);
if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(domain) || domain.includes('..')) throw new Error('Provide a plain valid domain.');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Provide a valid contact email.');
if (!name.trim() || name.length > 100) throw new Error('Business name must be 1–100 characters.');
mkdirSync(destination, { recursive: true });
mkdirSync(join(destination, "src/content/posts"), { recursive: true });
for (const path of templateFiles(source)) {
  if (path.startsWith('src/content/posts/') || path.startsWith('data/') && !['data/work-queue.json', 'data/seed-keywords.json'].includes(path)) continue;
  mkdirSync(dirname(join(destination, path)), { recursive: true });
  copyFileSync(join(source, path), join(destination, path));
}
const design = join(source, '.impeccable/design.json');
if (existsSync(design)) { mkdirSync(join(destination, '.impeccable'), { recursive: true }); copyFileSync(design, join(destination, '.impeccable/design.json')); }
const quote = JSON.stringify;
const businessFile = join(destination, 'business.config.ts');
let business = readFileSync(businessFile, 'utf8');
// Append explicit overrides rather than matching an author's formatting.
business += `\nObject.assign(businessConfig, { enabled: true, name: ${quote(name)}, email: ${quote(email)}, website: ${quote(`https://${domain}`)} });\n`;
// The default export is named business by the engine's configuration contract.
business += '\nbusinessConfig.inquiries.enabled = false;\n';
writeFileSync(businessFile, business);
const nicheFile = join(destination, 'niche.config.ts');
let niche = readFileSync(nicheFile, 'utf8');
const project = domain.replace(/[^a-z0-9-]/gi, '-').toLowerCase().slice(0, 50);
niche += `\nObject.assign(config, { id: ${quote(project)}, siteName: ${quote(name)}, tagline: 'Thoughtfully planned. Beautifully yours.', url: ${quote(`https://${domain}`)}, description: 'Wedding planning, event design, and floral artistry.', contactEmail: ${quote(email)}, nicheNoun: 'weddings and events', ga4Id: '', silos: [], primaryNav: [], footerNav: [], tools: [], defaultProducts: [], pageProductMap: {}, affiliateDisclaimer: '', redditSubreddits: [], communityForums: [], communityLinks: [], trustedSources: [], seedKeywords: [], competitors: [], cloudflareProjectName: ${quote(project)}, d1DatabaseName: ${quote(`${project}-db`)} });\n`;
writeFileSync(nicheFile, niche);
writeFileSync(join(destination, 'wrangler.toml'), `name = ${quote(project)}\npages_build_output_dir = "dist"\ncompatibility_date = "2024-11-01"\ncompatibility_flags = ["nodejs_compat"]\n# Add a dedicated D1 binding named DB before enabling inquiries.\n# [[d1_databases]]\n# binding = "DB"\n# database_name = ${quote(`${project}-db`)}\n# database_id = "REPLACE_WITH_YOUR_DATABASE_ID"\n`);
writeFileSync(join(destination, 'public/_redirects'), '# Add client-specific relative redirects here. Configure canonical host redirects in Cloudflare.\n/sitemap.xml /sitemap-index.xml 301\n/sitemap_index.xml /sitemap-index.xml 301\n');
writeFileSync(join(destination, 'public/site.webmanifest'), JSON.stringify({ name, short_name: name, start_url: '/', display: 'browser' }, null, 2) + '\n');
const files = Object.fromEntries(templateFiles(source, true).map(path => [path, fileHash(join(source, path))]));
writeFileSync(join(destination, '.engine-origin.json'), JSON.stringify({ version: ENGINE_VERSION, source: 'godfather-seo-engine-v3', createdAt: new Date().toISOString(), files }, null, 2) + '\n');
console.log(`Created ${destination}\nNext: npm ci, edit business.config.ts, and follow docs/SERVICE_BUSINESS_SETUP.md. No infrastructure was provisioned.`);
