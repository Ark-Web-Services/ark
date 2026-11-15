import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync, mkdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { allowedPath, protectedPath } from '../scripts/lib/template-files';

test('clone excludes credentials and records provenance; updates preserve client facts and abort on conflicts', () => {
  const directory = mkdtempSync(join(tmpdir(), 'engine-inheritance-'));
  try {
    const destination = join(directory, 'client');
    const source = process.cwd();
    const tsx = resolve('node_modules/tsx/dist/loader.mjs');
    const run = (script: string, args: string[], cwd = source) => spawnSync(process.execPath, ['--import', tsx, script, ...args], { cwd, encoding: 'utf8' });
    const created = run(resolve('scripts/create-service-template.ts'), ['--out', destination]);
    assert.equal(created.status, 0, created.stderr);
    assert.ok(existsSync(join(destination, '.engine-origin.json')));
    assert.ok(!existsSync(join(destination, '.git')));
    assert.ok(!existsSync(join(destination, '.env')));
    assert.ok(!existsSync(join(destination, 'node_modules')));
    assert.match(readFileSync(join(destination, 'business.config.ts'), 'utf8'), /enabled: true/);
    assert.equal(run(resolve('scripts/create-service-template.ts'), ['--out', destination]).status, 1);
    const upstream = join(directory, 'upstream');
    mkdirSync(upstream);
    cpSync(source, upstream, { recursive: true, filter: path => !/(?:^|\/)(?:node_modules|\.git|dist|\.astro|\.wrangler)(?:\/|$)/.test(path) });
    const file = 'src/lib/site-mode.ts';
    writeFileSync(join(upstream, file), readFileSync(join(upstream, file), 'utf8') + '\n// Upstream update\n');
    const businessBefore = readFileSync(join(destination, 'business.config.ts'), 'utf8');
    const updated = run(join(destination, 'scripts/sync-engine.ts'), ['--from', upstream, '--apply'], destination);
    assert.equal(updated.status, 0, updated.stderr);
    assert.match(readFileSync(join(destination, file), 'utf8'), /Upstream update/);
    assert.equal(readFileSync(join(destination, 'business.config.ts'), 'utf8'), businessBefore);
    writeFileSync(join(destination, file), '// Client customization\n');
    writeFileSync(join(upstream, file), '// Second engine update\n');
    const conflict = run(join(destination, 'scripts/sync-engine.ts'), ['--from', upstream, '--apply'], destination);
    assert.equal(conflict.status, 1);
    assert.equal(readFileSync(join(destination, file), 'utf8'), '// Client customization\n');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('sensitive paths and client-owned content are excluded from automatic inheritance', () => {
  for (const path of ['.env', 'nested/.env.local', 'data/gsc-service-account.json', 'private.key', '../escape.ts']) assert.equal(allowedPath(path), false);
  assert.equal(allowedPath('.env.example'), true);
  for (const path of ['business.config.ts', 'niche.config.ts', 'wrangler.toml', 'src/content/pages/about.md', 'public/assets/client/wedding.webp', 'client/presence/queue.json']) assert.equal(protectedPath(path), true);
});
