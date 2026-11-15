import test from 'node:test';
import assert from 'node:assert/strict';
import { businessTools, getBusinessTool } from '../src/lib/business-tools';

const input = (overrides: Record<string, string>) => overrides;
const run = (id: string, values: Record<string, string>) => {
  const tool = getBusinessTool(id);
  assert.ok(tool, `tool ${id} should exist`);
  return tool.calculate(input(values));
};
const redirectDefaults = { redirectType: '301 permanent', migrationScope: 'path changes', notes: '' };

test('exports six uniquely identified complete tools with verified service routes', () => {
  assert.equal(businessTools.length, 6);
  assert.equal(new Set(businessTools.map((tool) => tool.id)).size, 6);
  assert.deepEqual(businessTools.map((tool) => tool.title), [
    'WordPress Repair Helper', 'Repair or Redesign Decision Guide', 'Website Redirect Map Planner',
    'WordPress Backup Readiness Checker', 'Service Page Planner', 'Custom Website Feature Brief Builder',
  ]);
  for (const tool of businessTools) {
    assert.ok(tool.fields.length >= 4 && tool.fields.length <= 9);
    assert.ok(tool.method.length > 0 && tool.example.length > 20);
    assert.ok(tool.faqs.length >= 2 && tool.faqs.length <= 3);
    assert.ok(tool.sources.length > 0);
    assert.ok(tool.related.length >= 1 && tool.related.length <= 2);
    assert.equal(tool.ctaHref, '/contact/');
  }
  assert.equal(getBusinessTool('missing'), undefined);
  assert.ok(businessTools.flatMap((tool) => tool.related).every((route) => route.url.startsWith('/services/')));
});

test('WordPress helper branches on symptom, recent changes, backup, and access', () => {
  const security = run('wordpress-repair-helper', { symptom: 'security concern', affected: 'Admin login', recentChanges: 'yes, recently', backupStatus: 'not sure', access: 'neither', urgency: 'critical business impact' });
  const securityText = security.sections.flatMap((s) => s.items).join('\n');
  assert.match(securityText, /suspect unauthorized access/i);
  assert.match(securityText, /recent update, edit/i);
  assert.match(securityText, /Do not overwrite the live site/i);
  assert.match(securityText, /Do not share passwords/i);
  assert.match(security.summary, /has not accessed or scanned/i);

  const form = run('wordpress-repair-helper', { symptom: 'form or feature not working', affected: 'Quote form', recentChanges: 'no known change', backupStatus: 'current backup reported', access: 'wordpress admin', urgency: 'limited impact' });
  const formText = form.sections.flatMap((s) => s.items).join('\n');
  assert.match(formText, /steps that reproduce the issue/i);
  assert.match(formText, /does not rule out/i);
  assert.match(formText, /self-reported/i);
});

test('WordPress helper validates direct calls and refuses oversize free text', () => {
  const badChoice = run('wordpress-repair-helper', { symptom: 'drop table', recentChanges: 'yes, recently', backupStatus: 'not sure', access: 'neither', urgency: 'unsure' });
  assert.match(badChoice.summary, /Choose a listed option/i);
  const tooLong = run('wordpress-repair-helper', { symptom: 'slow site', affected: 'a'.repeat(601), recentChanges: 'not sure', backupStatus: 'not sure', access: 'not sure', urgency: 'unsure' });
  assert.match(tooLong.summary, /600 characters/i);
});

test('repair versus redesign explains conflicting constraints and clear repair signals', () => {
  const review = run('repair-or-redesign', { functions: 'broken', mobile: 'not assessed', content: 'usable', editing: 'easy enough', integrations: 'need changes', constraints: 'Legacy booking system', priority: 'Protect booking flow' });
  assert.match(review.title, /Needs a review/);
  assert.match(review.sections[0].items.join(' '), /unknowns or constraints/i);
  assert.match(review.sections[1].items.join(' '), /Legacy booking system/);

  const narrow = run('repair-or-redesign', { functions: 'works', mobile: 'works', content: 'usable', editing: 'easy enough', integrations: 'work as needed', constraints: '', priority: '' });
  assert.match(narrow.title, /focused repair/i);
  assert.match(narrow.sections[0].items.join(' '), /Reported issue areas: 0/);
});

test('redirect planner parses quoted CSV, detects duplicate sources, missing targets, chains, cycles and conflicts', () => {
  const result = run('redirect-map-planner', { ...redirectDefaults, mappings: 'old_url,new_url\n"/old,guide/","/middle/"\n/middle/,/final/\n/final/,/middle/\n/duplicate/,/one/\n/duplicate/,/two/\n/no-target/,' });
  assert.equal(result.download?.mime, 'text/csv;charset=utf-8');
  assert.match(result.download?.content ?? '', /"old_url","new_url","suggested_redirect_type","review_note"/);
  const report = result.sections.flatMap((s) => s.items).join('\n');
  assert.match(report, /Duplicate source rows: 1 \(1 with conflicting destinations\)/);
  assert.match(report, /Sources with missing destinations: 1/);
  assert.match(report, /Detected cycles: 1/);
  assert.match(report, /Detected cycles: 1; detected chains: 0/);
  assert.match(result.download?.content ?? '', /"\/old,guide\/","\/middle\/"/);
  assert.match(result.summary, /does not open URLs/i);
});

test('redirect planner normalizes equivalent URLs and flags duplicate targets and self-loops', () => {
  const result = run('redirect-map-planner', { ...redirectDefaults, mappings: 'https://example.com/old/,/dest/\nhttps://example.com/old,/dest/\n/self/,/self/\n/a/,/dest/' });
  const report = result.sections[0].items.join('\n');
  assert.match(report, /Duplicate source rows: 1/);
  assert.match(report, /Multiple sources sharing a destination: 1/);
  assert.match(report, /Self-loops: 1/);
});

test('two-row redirect cycles count the two affected rows once and never as chains', () => {
  const result = run('redirect-map-planner', { ...redirectDefaults, mappings: '/a/,/b/\n/b/,/a/' });
  assert.equal(result.metrics?.[0].value, '2');
  assert.equal(result.metrics?.[1].value, '2');
  assert.match(result.sections[0].items.join('\n'), /Detected cycles: 1; detected chains: 0/);
  assert.match(result.download?.content ?? '', /redirect cycle/);
});

test('acyclic redirect chains are counted once and mark their unique rows', () => {
  const result = run('redirect-map-planner', { ...redirectDefaults, mappings: '/a/,/b/\n/b/,/c/' });
  assert.equal(result.metrics?.[0].value, '2');
  assert.equal(result.metrics?.[1].value, '2');
  assert.match(result.sections[0].items.join('\n'), /Detected cycles: 0; detected chains: 1/);
  assert.match(result.download?.content ?? '', /redirect chain/);
});

test('redirect planner rejects header-only maps and extra columns instead of silently dropping data', () => {
  const headerOnly = run('redirect-map-planner', { ...redirectDefaults, mappings: 'old_url,new_url' });
  assert.equal(headerOnly.error, true);
  assert.match(headerOnly.summary, /header row has no mappings/i);
  const extraColumn = run('redirect-map-planner', { ...redirectDefaults, mappings: '/old/,/new/,unexpected' });
  assert.equal(extraColumn.error, true);
  assert.match(extraColumn.summary, /exactly two columns/i);
});

test('redirect planner rejects URL fragments because they are not part of HTTP requests', () => {
  const sourceFragment = run('redirect-map-planner', { ...redirectDefaults, mappings: '/a#old,/b/' });
  assert.equal(sourceFragment.error, true);
  assert.match(sourceFragment.summary, /fragment.*remove the #fragment/i);
  const destinationFragment = run('redirect-map-planner', { ...redirectDefaults, mappings: '/a/,/b#new/' });
  assert.equal(destinationFragment.error, true);
  const falseSelfLoop = run('redirect-map-planner', { ...redirectDefaults, mappings: '/a#old/,/a#new/' });
  assert.equal(falseSelfLoop.error, true);
  assert.match(falseSelfLoop.summary, /fragments/i);
});

test('redirect planner rejects malformed CSV quotes, formula-like URLs, and oversized maps', () => {
  const malformed = run('redirect-map-planner', { ...redirectDefaults, mappings: '"/old,/new' });
  assert.equal(malformed.error, true);
  assert.match(malformed.summary, /opening quote/i);
  const strayQuote = run('redirect-map-planner', { ...redirectDefaults, mappings: '/old"suffix,/new/' });
  assert.equal(strayQuote.error, true);
  assert.match(strayQuote.summary, /stray quote/i);
  const afterClose = run('redirect-map-planner', { ...redirectDefaults, mappings: '"/old/"oops,/new/' });
  assert.equal(afterClose.error, true);
  assert.match(afterClose.summary, /characters after a closing quote/i);
  const unsafe = run('redirect-map-planner', { ...redirectDefaults, mappings: '=HYPERLINK("https://bad.example"),/safe/' });
  assert.equal(unsafe.error, true);
  assert.equal(unsafe.download, undefined);
  assert.match(unsafe.summary, /invalid source|stray quote/i);
  const many = Array.from({ length: 201 }, (_, i) => `/old-${i},/new-${i}`).join('\n');
  const oversized = run('redirect-map-planner', { ...redirectDefaults, mappings: many });
  assert.equal(oversized.error, true);
  assert.match(oversized.summary, /200 mapping rows/i);
});

test('backup checker marks gaps and uncertainty without claiming a verified backup', () => {
  const result = run('backup-readiness-checker', { database: 'yes', media: 'no', themesPlugins: 'not sure', offsite: 'no', schedule: 'none known', restoreTest: 'never tested' });
  assert.match(result.title, /follow-up needed/i);
  const text = result.sections.flatMap((section) => section.items).join('\n');
  assert.match(text, /media/);
  assert.match(text, /never tested/);
  assert.match(result.summary, /has not verified/i);
  assert.match(text, /isolated staging or test environment/i);
  assert.match(text, /do not overwrite the production site as a test/i);
});

test('service planner avoids city-swapped pages without distinct verified details', () => {
  const generic = run('service-page-planner', { services: 'WordPress rescue, custom development', coverage: 'Charlotte, Raleigh', differences: '', customers: 'service businesses', proof: '', focus: 'serve multiple regions' });
  assert.equal(generic.sections[0].items.length, 2);
  assert.match(generic.sections[1].items.join('\n'), /does not recommend location-by-location page variants/i);
  assert.match(generic.sections[1].items.join('\n'), /does not research local demand or generate business facts/i);
  const distinct = run('service-page-planner', { services: 'Repairs', coverage: 'Charlotte', differences: 'On-site visits available in Charlotte', customers: '', proof: '', focus: 'explain services clearly' });
  assert.match(distinct.sections[1].items.join('\n'), /Only create a separate regional page/);
  assert.match(run('service-page-planner', { services: '', coverage: '', differences: '', customers: '', proof: '', focus: 'improve inquiries' }).summary, /List at least one service/i);
});

test('feature brief requires workflow essentials and includes implementation handoff concerns', () => {
  const result = run('custom-feature-brief', { project: 'Quote request flow', users: 'Homeowners request an estimate', workflow: 'Choose service, add details, submit', integrations: 'Email notification', data: 'Contact details, staff only', errors: 'Duplicate submission', acceptance: 'Confirmation appears and staff receive request' });
  const brief = result.sections[0].items[0];
  assert.match(brief, /Quote request flow/);
  assert.match(brief, /Duplicate submission/);
  assert.match(brief, /Who approves the completed feature/);
  assert.match(result.summary, /does not estimate price/i);
  assert.match(run('custom-feature-brief', { project: 'Feature', users: 'A user', workflow: '', acceptance: '' }).summary, /workflow/i);
});
