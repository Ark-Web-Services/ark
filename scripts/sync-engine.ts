import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, lstatSync } from 'node:fs';
import { dirname, resolve, join, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allowedPath, protectedPath, templateFiles, fileHash, ENGINE_VERSION } from './lib/template-files';

const target = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const position = process.argv.indexOf('--from');
if (position < 0 || !process.argv[position + 1]) throw new Error('Usage: npm run engine:sync -- --from /path/to/engine [--apply]');
const source = resolve(process.argv[position + 1]);
if (source === target) throw new Error('Source must be a different engine folder.');
const manifestPath = join(target, '.engine-origin.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { version: string; source: string; createdAt: string; files: Record<string, string> };
const incoming = new Set(templateFiles(source, true));
const paths = new Set([...Object.keys(manifest.files), ...incoming]);
const conflicts: string[] = [];
const changes: { path: string; remove: boolean }[] = [];
for (const path of paths) {
  if (!allowedPath(path) || isAbsolute(path) || protectedPath(path)) continue;
  const local = join(target, path);
  let unsafe = false;
  for (let parent = local; parent !== target; parent = dirname(parent)) {
    if (existsSync(parent) && lstatSync(parent).isSymbolicLink()) unsafe = true;
  }
  if (unsafe) { conflicts.push(path + ' (symbolic link)'); continue; }
  const localHash = existsSync(local) ? fileHash(local) : undefined;
  const nextHash = incoming.has(path) ? fileHash(join(source, path)) : undefined;
  if (localHash === nextHash) continue;
  if (localHash !== manifest.files[path]) { conflicts.push(path); continue; }
  changes.push({ path, remove: !incoming.has(path) });
}
console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'apply' : 'check', changes, conflicts }, null, 2));
if (conflicts.length) { console.error('No files changed. Review local edits before applying an engine update.'); process.exitCode = 1; }
else if (process.argv.includes('--apply')) {
  for (const { path, remove } of changes) {
    if (remove) rmSync(join(target, path));
    else { mkdirSync(dirname(join(target, path)), { recursive: true }); copyFileSync(join(source, path), join(target, path)); }
  }
  manifest.files = Object.fromEntries([...incoming].map(path => [path, fileHash(join(source, path))]));
  manifest.version = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8')).version || ENGINE_VERSION;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}
