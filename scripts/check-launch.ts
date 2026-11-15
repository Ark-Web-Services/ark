import 'dotenv/config';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import business from '../business.config';
import niche from '../niche.config';

const problems: string[] = [];
const requireValue = (ok: unknown, message: string) => { if (!ok) problems.push(message); };
const placeholder = (value: string) => /your studio|your city|instructional|replace this|describe your|example process|template copy|TEMPLATE_|\{niche\}/i.test(value);
if (business.enabled) {
  let host = '';
  try { const url = new URL(business.website || ''); host = url.hostname; requireValue(url.protocol === 'https:', 'Use an HTTPS business website URL.'); }
  catch { problems.push('Set a valid business website URL.'); }
  requireValue(host && !/(?:\.example|\.invalid|example\.com)$/.test(host) && host !== 'localhost', 'Replace the reserved demo domain.');
  requireValue(niche.url.replace(/\/$/, '') === business.website?.replace(/\/$/, ''), 'Business and engine domain must match.');
  requireValue(!placeholder(business.name) && business.name.trim(), 'Set the real business name.');
  requireValue(!placeholder([business.description, business.about || '', business.hero.heading, business.hero.body].join(' ')), 'Replace instructional homepage/about copy with approved copy.');
  requireValue(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(business.email) && !/example\.(com|invalid)$/.test(business.email) && !business.email.endsWith('.example'), 'Set a working business email.');
  requireValue(business.location.trim() && !placeholder(business.location), 'Set the real service location.');
  requireValue(business.services.length > 0, 'Configure at least one service.');
  requireValue(new Set(business.services.map(service => service.id)).size === business.services.length, 'Service IDs must be unique.');
  for (const service of business.services) {
    requireValue(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(service.id), 'Service IDs must be URL-safe slugs.');
    requireValue(!placeholder(service.description), `Replace instructional copy for ${service.title}.`);
  }
  for (const social of business.socials) {
    try { requireValue(new URL(social.url).protocol === 'https:', `Use HTTPS for ${social.label}.`); }
    catch { problems.push(`Invalid social link for ${social.label}.`); }
  }
  const images = [
    ...(business.hero.image ? [{ src: business.hero.image, alt: business.hero.imageAlt }] : []),
    ...business.projects.map(project => ({ src: project.image, alt: project.imageAlt })),
  ];
  for (const image of images) {
    requireValue(image.alt?.trim(), 'Provide descriptive alt text for every portfolio/hero photo.');
    if (image.src.startsWith('/')) requireValue(existsSync(join(process.cwd(), 'public', image.src)), `Missing public image: ${image.src}`);
    else { try { requireValue(new URL(image.src).protocol === 'https:', 'Image URLs must use HTTPS.'); } catch { problems.push('Invalid image URL.'); } }
  }
  requireValue(!business.projects.some(project => project.demo), 'Remove illustrative portfolio entries before launch.');
  requireValue(business.inquiries.endpoint === '/api/inquiries', 'Use the built-in same-origin inquiry endpoint.');
  if (business.inquiries.enabled) {
    requireValue(business.inquiries.turnstileSiteKey, 'Set the public Turnstile site key.');
    if (!process.argv.includes('--public-only')) {
      for (const key of ['TURNSTILE_SECRET_KEY', 'ADMIN_API_TOKEN', 'EMAIL_API_KEY', 'EMAIL_FROM', 'LEAD_RATE_LIMIT_SALT']) requireValue(process.env[key], `Set ${key} in the deployment environment (or use --public-only for source checks).`);
      requireValue(!process.env.LEADS_ALLOW_UNVERIFIED_LOCAL, 'Remove the local verification bypass from production settings.');
    }
    const wrangler = readFileSync('wrangler.toml', 'utf8');
    requireValue(/^binding\s*=\s*"DB"/m.test(wrangler), 'Add a dedicated Cloudflare D1 binding named DB.');
  }
} else {
  requireValue(!placeholder(niche.siteName) && !placeholder(niche.url), 'Customize the guide configuration before launch.');
  requireValue(niche.silos.length > 0, 'Guide sites require at least one content silo.');
}
if (problems.length) { console.error(problems.map(problem => `• ${problem}`).join('\n')); process.exitCode = 1; }
else console.log('Source launch checks passed. Verify deployed D1 migrations, secret bindings, delivery scheduling, forms, and access controls before accepting inquiries.');
