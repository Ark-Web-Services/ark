import { rmSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import business from '../business.config';
if (business.enabled && !business.contentEnabled) {
  for (const path of ['articles', 'search', 'posts', 'tools', 'go']) rmSync(`dist/${path}`, { recursive: true, force: true });
  console.log('Service-business build: unused guide routes omitted.');
}

if (business.enabled) {
  const headers = readFileSync('dist/_headers', 'utf8').replace(/^.*X-Content-License:.*\n/gm, '');
  writeFileSync('dist/_headers', headers);
}

if (business.enabled) {
  writeFileSync('dist/site.webmanifest', JSON.stringify({ name: business.name, short_name: business.name, start_url: '/', display: 'browser', background_color: business.brand.background, theme_color: business.brand.accent }, null, 2));
  writeFileSync('dist/humans.txt', `Site: ${business.name}\nContact: ${business.email}\n`);
  mkdirSync('dist/.well-known', { recursive: true });
  const expiry = new Date(Date.now() + 180 * 86_400_000).toISOString();
  writeFileSync('dist/.well-known/security.txt', `Contact: mailto:${business.email}\nExpires: ${expiry}\nPreferred-Languages: en\n`);
}
