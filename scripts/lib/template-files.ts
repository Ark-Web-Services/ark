import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, lstatSync } from 'node:fs';
import { join, relative } from 'node:path';

export const ENGINE_VERSION = '4.0.0';
const excluded = new Set(['.git', 'node_modules', 'dist', '.astro', '.wrangler', '.DS_Store', 'secrets', '.engine-origin.json', '.impeccable']);
export function allowedPath(path: string): boolean {
  const parts = path.split(/[\\/]/);
  return !parts.some(part => excluded.has(part) || part === '..' || part === '.env' || part.startsWith('.env.') && part !== '.env.example')
    && !/service-account|\.pem$|\.key$|\.log$/.test(path);
}
export function protectedPath(path: string): boolean {
  return ['business.config.ts', 'niche.config.ts', 'wrangler.toml', 'PRODUCT.md', 'DESIGN.md', 'public/_redirects', 'public/site.webmanifest'].includes(path)
    || /^(src\/content\/|data\/|public\/assets\/client\/|client\/)/.test(path);
}
export function fileHash(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}
export function templateFiles(root: string, managedOnly = false): string[] {
  const paths: string[] = [];
  function walk(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = join(directory, entry.name);
      const path = relative(root, absolute).split('\\').join('/');
      if (!allowedPath(path) || lstatSync(absolute).isSymbolicLink()) continue;
      if (entry.isDirectory()) walk(absolute);
      else if (!managedOnly || !protectedPath(path)) paths.push(path);
    }
  }
  walk(root);
  return paths.sort();
}
