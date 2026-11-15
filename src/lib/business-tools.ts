import type { BusinessTool, ToolField, ToolInput, ToolResult } from './tool-contract';

const contact = { ctaLabel: 'Get a free site review', ctaHref: '/contact/' };
const wordPressSource = { label: 'WordPress: Common WordPress errors', url: 'https://developer.wordpress.org/advanced-administration/wordpress/common-errors/' };
const wpBackupSource = { label: 'Learn WordPress: Troubleshooting basics and backups', url: 'https://learn.wordpress.org/lesson-plan/troubleshooting-basics/' };
const googleMigrationSource = { label: 'Google Search Central: Site moves with URL changes', url: 'https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes' };
const googleHelpfulSource = { label: 'Google Search Central: Creating helpful, reliable, people-first content', url: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content' };

const select = (id: string, label: string, options: string[], required = true): ToolField => ({
  id, label, type: 'select', required,
  options: options.map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) })),
});
const text = (id: string, label: string, hint: string, maxLength = 500): ToolField => ({ id, label, type: 'textarea', hint, maxLength });

function clean(value: unknown, max: number, label: string): string {
  if (typeof value !== 'string') throw new Error(`${label} must be text.`);
  if (value.length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
  return value.trim();
}
function choice(input: ToolInput, key: string, allowed: string[], label: string): string {
  const value = clean(input[key] ?? '', 80, label);
  if (!allowed.includes(value)) throw new Error(`Choose a listed option for ${label.toLowerCase()}.`);
  return value;
}
function list(value: string, maxItems: number, label: string): string[] {
  const items = value.split(/[\n,;]+/).map((part) => part.trim()).filter(Boolean);
  if (items.length > maxItems) throw new Error(`${label} can contain at most ${maxItems} items.`);
  return [...new Set(items.map((item) => item.replace(/\s+/g, ' ')))];
}
function resultOrError(title: string, run: () => ToolResult): ToolResult {
  try { return run(); }
  catch (error) {
    return { error: true, title: 'Check the information you entered', summary: error instanceof Error ? error.message : 'Some entries need attention.', sections: [] };
  }
}
function makeResult(title: string, summary: string, sections: ToolResult['sections'], metrics?: ToolResult['metrics'], download?: ToolResult['download']): ToolResult {
  return { title, summary, sections, ...(metrics ? { metrics } : {}), ...(download ? { download } : {}) };
}

const repairSymptoms = ['site unavailable', 'error or blank page', 'layout or styling problem', 'form or feature not working', 'security concern', 'slow site', 'something else'];
const changes = ['yes, recently', 'no known change', 'not sure'];
const backupOptions = ['current backup reported', 'older backup reported', 'no backup known', 'not sure'];
const accessOptions = ['wordpress admin', 'hosting account', 'both', 'neither', 'not sure'];

function repairChecklist(input: ToolInput): ToolResult {
  return resultOrError('WordPress first-response checklist', () => {
    const symptom = choice(input, 'symptom', repairSymptoms, 'Symptom');
    const recentChanges = choice(input, 'recentChanges', changes, 'Recent changes');
    const backupStatus = choice(input, 'backupStatus', backupOptions, 'Backup status');
    const access = choice(input, 'access', accessOptions, 'Access available');
    const affected = clean(input.affected ?? '', 600, 'Affected pages or features');
    const urgency = choice(input, 'urgency', ['critical business impact', 'limited impact', 'unsure'], 'Business impact');
    const steps = ['Record the exact message, affected page or feature, and when you first noticed it. Keep a screenshot if one is available.', 'Check whether the issue appears in another browser or device, and whether it affects one page or the whole site. This is an observation, not a diagnosis.'];
    if (symptom === 'security concern') steps.unshift('If you suspect unauthorized access, avoid logging in through links in unexpected messages. Contact your hosting provider or a qualified WordPress responder through a known channel and preserve any alerts or timestamps.');
    else if (symptom === 'site unavailable' || symptom === 'error or blank page') steps.push('Ask your hosting provider whether there is a current service incident and request the relevant error details. Avoid changing files or restoring a backup while the cause and recovery point are unknown.');
    else if (symptom === 'form or feature not working') steps.push('Write down the steps that reproduce the issue, the expected result, and what happens instead. Note whether other features still work.');
    else if (symptom === 'layout or styling problem') steps.push('Note the page, browser/device, and what changed visually. If the issue followed an update, capture the update name and approximate time.');
    else if (symptom === 'slow site') steps.push('Record which pages feel slow and when. Note recent changes or provider notices; this checklist does not measure site performance.');
    else steps.push('Describe what you expected and what happened instead, including the page and any visible message.');
    if (recentChanges === 'yes, recently') steps.push('List the recent update, edit, migration, or hosting change and its approximate time. A recent change can help narrow review, but does not prove it caused the issue.');
    else if (recentChanges === 'not sure') steps.push('If available, ask who last updated the site or hosting and when; leave this as unknown if you cannot confirm.');
    else steps.push('Record that you know of no recent change. This does not rule out an underlying service or compatibility issue.');
    if (backupStatus === 'no backup known' || backupStatus === 'not sure') steps.push('Ask the host or site maintainer whether a backup exists, what it includes, and when it was made. Do not overwrite the live site or attempt a restore based on an unverified backup.');
    else steps.push(`You report a ${backupStatus === 'current backup reported' ? 'current' : 'older'} backup. Confirm its date, scope, and restore process with the responsible provider before any recovery action; this tool has not verified it.`);
    if (access === 'neither') steps.push('Contact the person or provider who manages the site and request a secure path for an authorized review. Do not share passwords in this brief.');
    if (urgency === 'critical business impact') steps.unshift('Because you report a critical business impact, contact your hosting provider or WordPress support now and include this incident brief.');
    const brief = [
      'WordPress incident brief', `Symptom: ${symptom}`, `Affected pages/features: ${affected || 'Not provided'}`,
      `Recent changes: ${recentChanges}`, `Backup status (self-reported): ${backupStatus}`, `Access available: ${access}`,
      `Business impact: ${urgency}`, 'Observed message/details: Add only what you observed; do not include passwords or secret keys.',
    ].join('\n');
    return makeResult('Safe first steps for your WordPress issue', 'This is a symptom-based handoff checklist. It has not accessed or scanned your website and does not diagnose the cause.', [
      { title: 'What to do next', items: steps }, { title: 'Incident brief', items: [brief] },
    ], [{ label: 'Issue type', value: symptom }, { label: 'Impact', value: urgency }]);
  });
}

const statusChoices = ['works', 'partly works', 'broken', 'not assessed'];
function repairOrRedesign(input: ToolInput): ToolResult {
  return resultOrError('Repair or redesign recommendation', () => {
    const functions = choice(input, 'functions', statusChoices, 'Key functions');
    const mobile = choice(input, 'mobile', statusChoices, 'Mobile experience');
    const content = choice(input, 'content', ['usable', 'needs rework', 'outdated or missing', 'not assessed'], 'Content');
    const editing = choice(input, 'editing', ['easy enough', 'difficult', 'cannot edit what matters', 'not assessed'], 'Editing needs');
    const integrations = choice(input, 'integrations', ['work as needed', 'need changes', 'uncertain', 'none'], 'Integrations');
    const platform = clean(input.constraints ?? '', 500, 'Platform constraints');
    const goals = clean(input.priority ?? '', 300, 'Main business priority');
    const problems = Number(functions === 'broken') + Number(mobile === 'broken') + Number(content === 'outdated or missing') + Number(editing === 'cannot edit what matters') + Number(integrations === 'need changes');
    const unsure = [functions, mobile, content, editing, integrations].filter((v) => ['not assessed', 'uncertain'].includes(v)).length;
    let route = 'A focused repair or improvement may fit';
    let explanation = 'Most current foundations are reported as usable. List the specific issues and review their scope before deciding whether broader redesign work is justified.';
    if (problems >= 3 || (content === 'outdated or missing' && (mobile === 'broken' || editing === 'cannot edit what matters'))) {
      route = 'Consider a redesign review';
      explanation = 'Several core areas are reported as broken or no longer usable. A redesign review can assess shared structure and content alongside individual fixes.';
    } else if (unsure >= 2 || (problems > 0 && (integrations === 'need changes' || platform))) {
      route = 'Needs a review before choosing';
      explanation = 'The answers include unknowns or constraints that can change the amount of repair work. Verify requirements and dependencies before choosing a path.';
    }
    const inventory = [
      `Repair candidates: ${[functions === 'broken' && 'key functions', mobile === 'broken' && 'mobile experience', integrations === 'need changes' && 'integrations'].filter(Boolean).join(', ') || 'none identified from these answers'}.`,
      `Content and editing: content is “${content}”; editing is “${editing}”.`,
      `Constraints to review: ${platform || 'none provided'}.`, `Business priority: ${goals || 'not provided'}.`,
    ];
    return makeResult(route, explanation, [{ title: 'Why this path fits', items: [explanation, `Reported issue areas: ${problems}; answers needing clarification: ${unsure}. These counts are decision aids, not a technical assessment.`] }, { title: 'Keep / change inventory', items: inventory }], [{ label: 'Reported issue areas', value: String(problems) }, { label: 'Needs clarification', value: String(unsure) }]);
  });
}

type CsvRow = string[];
function parseDelimited(textValue: string): CsvRow[] {
  const rows: CsvRow[] = []; let row: string[] = []; let cell = ''; let quoted = false; let closedQuote = false;
  for (let i = 0; i < textValue.length; i++) {
    const ch = textValue[i];
    if (quoted) {
      if (ch === '"' && textValue[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') { quoted = false; closedQuote = true; }
      else cell += ch;
    } else if (closedQuote) {
      if (ch === ',' || ch === '\t') { row.push(cell.trim()); cell = ''; closedQuote = false; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && textValue[i + 1] === '\n') i++;
        row.push(cell.trim()); cell = ''; closedQuote = false;
        if (row.some(Boolean)) rows.push(row);
        row = [];
      } else if (!/\s/.test(ch)) throw new Error('The CSV has characters after a closing quote. Remove them or quote the entire cell.');
    } else if (ch === '"' && cell.length === 0) quoted = true;
    else if (ch === '"') throw new Error('The CSV has a stray quote inside an unquoted cell. Quote the entire cell and double any quotes inside it.');
    else if (ch === ',' || ch === '\t') { row.push(cell.trim()); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && textValue[i + 1] === '\n') i++;
      row.push(cell.trim()); cell = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (quoted) throw new Error('The CSV has an opening quote with no matching closing quote.');
  if (closedQuote || cell || row.length) { row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); }
  return rows;
}
function normalizeUrl(value: string): string | null {
  if (!value || /[\u0000-\u0020]/.test(value)) return null;
  if (value.startsWith('/') && !value.startsWith('//')) {
    try { const u = new URL(value, 'https://local.invalid'); if (u.hash) return null; return `${u.pathname.replace(/\/$/, '') || '/'}${u.search}`; } catch { return null; }
  }
  try {
    const u = new URL(value);
    if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) return null;
    if (u.hash) return null;
    return `${u.protocol}//${u.host}${u.pathname.replace(/\/$/, '') || '/'}${u.search}`;
  } catch { return null; }
}
function csvCell(value: string): string {
  const safe = /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
function redirectMap(input: ToolInput): ToolResult {
  return resultOrError('Redirect map review', () => {
    const raw = clean(input.mappings ?? '', 30000, 'Mapping rows');
    if (!raw) throw new Error('Paste at least one old and new URL row.');
    const parsed = parseDelimited(raw);
    const hasHeader = Boolean(parsed[0] && /^(old|source|from)(?:_url)?$/i.test(parsed[0][0]));
    if (hasHeader && parsed[0].length !== 2) throw new Error('The header must contain exactly two columns: old URL and new URL.');
    const rows = hasHeader ? parsed.slice(1) : parsed;
    if (hasHeader && !rows.length) throw new Error('The header row has no mappings. Add at least one old and new URL row.');
    if (rows.length > 200) throw new Error('Use 200 mapping rows or fewer per review.');
    if (rows.some((row) => row.length > 2)) throw new Error('Each mapping row must have exactly two columns: old URL and new URL. Quote any URL containing a comma.');
    const entries = rows.map((r, i) => {
      let source = r[0] ?? ''; let destination = r[1] ?? '';
      if (r.length === 1 && source.includes('=>')) [source, destination] = source.split(/\s*=>\s*/, 2);
      if (!source.trim()) throw new Error(`Row ${i + 1} needs a source URL or path.`);
      if (source.includes('#') || destination.includes('#')) throw new Error(`Row ${i + 1} contains a URL fragment. Remove the #fragment; browsers do not send fragments in HTTP requests.`);
      const src = normalizeUrl(source.trim()); if (!src) throw new Error(`Row ${i + 1} has an invalid source. Use a path starting with / or an http(s) URL.`);
      if (!destination.trim()) return { source: src, destination: '', sourceRaw: source.trim(), destinationRaw: '' };
      const dest = normalizeUrl(destination.trim()); if (!dest) throw new Error(`Row ${i + 1} has an invalid destination. Use a path starting with / or an http(s) URL.`);
      return { source: src, destination: dest, sourceRaw: source.trim(), destinationRaw: destination.trim() };
    });
    const bySource = new Map<string, { entry: typeof entries[number]; index: number }[]>();
    entries.forEach((entry, index) => bySource.set(entry.source, [...(bySource.get(entry.source) ?? []), { entry, index }]));
    const duplicateSources = [...bySource.entries()].filter(([, group]) => group.length > 1);
    const conflicts = duplicateSources.filter(([, group]) => new Set(group.map(({ entry }) => entry.destination)).size > 1);
    const duplicateSourceRows = new Set(duplicateSources.flatMap(([, group]) => group.map(({ index }) => index)));
    const targetRows = new Map<string, { source: string; index: number }[]>();
    entries.forEach((e, index) => { if (e.destination) targetRows.set(e.destination, [...(targetRows.get(e.destination) ?? []), { source: e.source, index }]); });
    const manyToOne = [...targetRows.entries()].filter(([, targets]) => new Set(targets.map(({ source }) => source)).size > 1);
    const manyToOneRows = new Set(manyToOne.flatMap(([, targets]) => targets.map(({ index }) => index)));
    const missingRows = new Set(entries.flatMap((e, index) => !e.destination ? [index] : []));
    const selfLoopRows = new Set(entries.flatMap((e, index) => e.source === e.destination ? [index] : []));
    const missing = [...missingRows]; const selfLoops = [...selfLoopRows];
    const graph = new Map<string, { target: string; index: number }>();
    entries.forEach((entry, index) => { if (entry.destination) graph.set(entry.source, { target: entry.destination, index }); });
    const incoming = new Map<string, number>();
    for (const { target } of graph.values()) if (graph.has(target)) incoming.set(target, (incoming.get(target) ?? 0) + 1);
    const cycles: string[][] = []; const cycleKeys = new Set<string>(); const cycleRows = new Set<number>(); const cycleEdgeRows = new Set<number>();
    const chained: string[][] = []; const chainKeys = new Set<string>(); const chainRows = new Set<number>();
    const walked = new Set<string>();
    const walk = (start: string) => {
      let at = start; const seen = new Map<string, number>(); const path: string[] = []; const pathRows: number[] = [];
      while (graph.has(at) && path.length <= 200) {
        if (seen.has(at)) {
          const cycleStart = seen.get(at)!;
          const cycle = path.slice(cycleStart);
          const rowIds = pathRows.slice(cycleStart);
          const key = [...cycle].sort().join('\u0000');
          if (!cycleKeys.has(key)) { cycles.push(cycle); cycleKeys.add(key); }
          pathRows.forEach((index) => cycleRows.add(index));
          rowIds.forEach((index) => cycleEdgeRows.add(index));
          return;
        }
        seen.set(at, path.length); path.push(at); walked.add(at);
        const edge = graph.get(at)!; pathRows.push(edge.index); at = edge.target;
      }
      if (pathRows.length > 1) {
        const key = pathRows.join(',');
        if (!chainKeys.has(key)) { chained.push(path); chainKeys.add(key); }
        pathRows.forEach((index) => chainRows.add(index));
      }
    };
    for (const start of graph.keys()) if ((incoming.get(start) ?? 0) === 0) walk(start);
    for (const start of graph.keys()) if (!walked.has(start)) walk(start);
    const warnings = [
      `Duplicate source rows: ${duplicateSources.length}${conflicts.length ? ` (${conflicts.length} with conflicting destinations)` : ''}.`,
      `Multiple sources sharing a destination: ${manyToOne.length}. Review that each destination is relevant to its source.`,
      `Sources with missing destinations: ${missing.length}.`, `Self-loops: ${selfLoops.length}.`,
      `Detected cycles: ${cycles.length}; detected chains: ${chained.length}. This checks only the pasted map.`,
      'No live URLs or HTTP redirect responses were checked. Review content relevance and test implemented redirects before launch.',
    ];
    const statuses = entries.map((e, index) => {
      const tags = [];
      if (duplicateSourceRows.has(index)) tags.push('duplicate source');
      if (!e.destination) tags.push('missing destination');
      if (e.source === e.destination) tags.push('self-loop');
      if (manyToOne.some(([dest]) => dest === e.destination)) tags.push('shared destination: review relevance');
      if (cycleEdgeRows.has(index)) tags.push('redirect cycle');
      else if (cycleRows.has(index)) tags.push('leads into redirect cycle');
      if (chainRows.has(index)) tags.push('redirect chain');
      if (!tags.length) tags.push('map row');
      return [e.sourceRaw, e.destinationRaw, tags.join('; ')];
    });
    const redirectType = choice(input, 'redirectType', ['301 permanent', '308 permanent', '302 temporary', 'not decided'], 'Redirect type');
    const migrationScope = choice(input, 'migrationScope', ['path changes', 'domain changes', 'hosting only, URLs unchanged', 'not sure'], 'Migration type');
    const extraNotes = clean(input.notes ?? '', 500, 'Migration notes');
    const csv = [['old_url', 'new_url', 'suggested_redirect_type', 'review_note'], ...statuses.map((r) => [r[0], r[1], redirectType, r[2]])].map((r) => r.map(csvCell).join(',')).join('\r\n');
    const items = [...warnings, `Migration type selected: ${migrationScope}. Redirect type for worksheet: ${redirectType}.`, ...(extraNotes ? [`Your note: ${extraNotes}`] : []), ...(conflicts.length ? [`Conflicting source examples: ${conflicts.slice(0, 5).map(([source]) => source).join(', ')}.`] : []), ...(cycles.length ? [`Cycle examples: ${cycles.slice(0, 3).map((c) => c.join(' → ')).join(' | ')}.`] : []), ...(chained.length ? [`Chain examples: ${chained.slice(0, 3).map((c) => c.join(' → ')).join(' | ')}.`] : [])];
    const rowsToReview = new Set([...duplicateSourceRows, ...manyToOneRows, ...missingRows, ...selfLoopRows, ...cycleRows, ...chainRows]);
    return makeResult('Review the supplied redirect map', 'The planner checks row syntax and relationships inside the text you pasted. It does not open URLs or verify server behavior.', [{ title: 'Map checks', items }, { title: 'Next steps', items: ['Resolve duplicate source rows and choose one intended destination for each source.', 'Use a direct mapping to the final destination where possible; test implemented redirects in the target environment.', 'Review any shared destination to ensure it represents the old page content.'] }], [{ label: 'Rows', value: String(entries.length) }, { label: 'Rows to review', value: String(rowsToReview.size) }], { filename: 'redirect-map-review.csv', content: csv, mime: 'text/csv;charset=utf-8' });
  });
}

const yesNoUnknown = ['yes', 'no', 'not sure'];
function backupReadiness(input: ToolInput): ToolResult {
  return resultOrError('Backup readiness self-check', () => {
    const components = ['database', 'media', 'themesPlugins'].map((id) => [id, choice(input, id, yesNoUnknown, id === 'themesPlugins' ? 'Themes and plugins' : id[0].toUpperCase() + id.slice(1))] as const);
    const offsite = choice(input, 'offsite', yesNoUnknown, 'Separate storage');
    const restoreTest = choice(input, 'restoreTest', ['tested recently', 'tested before', 'never tested', 'not sure'], 'Restore test');
    const schedule = choice(input, 'schedule', ['automatic schedule reported', 'manual or occasional', 'none known', 'not sure'], 'Backup schedule');
    const unknowns = [...components.map(([, v]) => v), offsite, restoreTest, schedule].filter((v) => v.includes('not sure')).length;
    const gaps = [...components.filter(([, v]) => v === 'no').map(([k]) => k), ...(offsite === 'no' ? ['separate storage'] : []), ...(restoreTest === 'never tested' ? ['restore test'] : []), ...(schedule === 'none known' ? ['repeatable schedule'] : [])];
    const findings = components.map(([name, value]) => `${name}: ${value} (self-reported)`);
    findings.push(`Separate storage: ${offsite} (self-reported)`, `Restore test: ${restoreTest}`, `Schedule: ${schedule}`);
    const actions = [
      'Ask the hosting provider or maintainer what the backup covers, where it is held, how long it is retained, and who can retrieve it.',
      'Document who is responsible for recovery and how to reach them. A backup file alone does not establish that a site can be restored.',
      'Arrange any restore test in an isolated staging or test environment with the responsible technical provider; do not overwrite the production site as a test.',
    ];
    if (gaps.length) actions.unshift(`Clarify reported gaps: ${gaps.join(', ')}.`);
    const grade = unknowns && gaps.length ? 'Some details are unknown; follow-up needed' : unknowns ? 'Some details are unknown' : gaps.length ? 'Follow-up needed' : 'Reported coverage looks more complete';
    return makeResult(grade, 'This is a self-reported readiness summary. The tool has not verified files, backup jobs, storage, or restore capability.', [{ title: 'Your answers', items: findings }, { title: 'Useful follow-up', items: actions }], [{ label: 'Unknown answers', value: String(unknowns) }, { label: 'Reported gaps', value: String(gaps.length) }]);
  });
}

function servicePagePlan(input: ToolInput): ToolResult {
  return resultOrError('Service page structure plan', () => {
    const services = list(clean(input.services ?? '', 1200, 'Services'), 12, 'Services');
    const coverage = list(clean(input.coverage ?? '', 600, 'Service coverage'), 12, 'Service coverage');
    const differences = clean(input.differences ?? '', 900, 'Verified regional differences');
    const customers = clean(input.customers ?? '', 500, 'Customer groups');
    const proof = clean(input.proof ?? '', 600, 'Evidence and proof');
    const goal = choice(input, 'focus', ['explain services clearly', 'serve multiple regions', 'improve inquiries'], 'Primary goal');
    if (!services.length) throw new Error('List at least one service you currently offer.');
    const pages = services.map((service) => `/${service.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '-')}/ — explain “${service}” as a distinct service. Confirm the URL and claims before publishing.`);
    const notes = [
      `Services reported: ${services.join('; ')}. Keep one primary page per genuinely distinct service unless the page would contain substantially the same information as another.`,
      `Coverage reported: ${coverage.length ? coverage.join('; ') : 'not provided'}. Mention locations as coverage information on relevant pages when no meaningful page-level difference exists.`,
      differences ? `Potential regional details to validate: ${differences}. Only create a separate regional page when it can provide useful, specific information for that place.` : 'No distinct regional service details were provided, so this plan does not recommend location-by-location page variants.',
      `Audience details: ${customers || 'not provided'}. Evidence to support claims: ${proof || 'not provided'}. Add only details the business can substantiate.`,
      `Planning focus: ${goal}. This tool does not research local demand or generate business facts.`,
    ];
    return makeResult('A service-first page map', 'Use the services and facts you supplied to plan useful page distinctions. Review every page for original, accurate content before publishing.', [{ title: 'Draft page map', items: pages }, { title: 'Coverage and quality checks', items: notes }], [{ label: 'Distinct services supplied', value: String(services.length) }, { label: 'Coverage areas supplied', value: String(coverage.length) }]);
  });
}

function featureBrief(input: ToolInput): ToolResult {
  return resultOrError('Custom feature project brief', () => {
    const project = clean(input.project ?? '', 120, 'Feature name');
    const users = clean(input.users ?? '', 400, 'Users and need');
    const workflow = clean(input.workflow ?? '', 800, 'Workflow');
    const integrations = clean(input.integrations ?? '', 500, 'Integrations');
    const data = clean(input.data ?? '', 500, 'Data and permissions');
    const errors = clean(input.errors ?? '', 500, 'Failure and edge cases');
    const acceptance = clean(input.acceptance ?? '', 700, 'Acceptance criteria');
    if (!project || !users || !workflow || !acceptance) throw new Error('Add a feature name, user need, workflow, and at least one acceptance criterion.');
    const brief = [
      `Custom feature brief: ${project}`, '', `Users and need\n${users}`, '', `Workflow\n${workflow}`, '',
      `Integrations\n${integrations || 'To be confirmed'}`, '', `Data and permissions\n${data || 'To be confirmed'}`, '',
      `Failure cases and recovery\n${errors || 'To be discussed during scoping'}`, '', `Acceptance criteria\n${acceptance}`,
      '', 'Open scope questions\n- Who approves the completed feature?\n- What must be documented for handoff?\n- Which environments and access arrangements are required?',
    ].join('\n');
    return makeResult('Brief ready for a technical review', 'This brief organizes requirements for scoping. It does not estimate price, schedule, feasibility, or implementation risk.', [{ title: 'Project brief', items: [brief] }, { title: 'Review before estimating', items: ['Confirm the workflow and who can perform each action.', 'Identify systems, data sensitivity, permissions, and integration owners.', 'Define observable acceptance criteria and representative failure cases.', 'Agree on access, test environment, approval, and handoff expectations.'] }], [{ label: 'Required sections complete', value: '4 of 4' }, { label: 'Integrations named', value: integrations ? 'Yes' : 'To confirm' }]);
  });
}

const repairTool: BusinessTool = {
  id: 'wordpress-repair-helper', title: 'WordPress Repair Helper',
  description: 'Organize what you observed, get a safe symptom-based checklist, and prepare a WordPress incident brief for a repair review.',
  intro: 'Choose the closest symptom and capture what changed. This browser-side helper does not scan your site or diagnose its cause.', submitLabel: 'Build my checklist',
  fields: [select('symptom', 'What is happening?', repairSymptoms), text('affected', 'Which page or feature is affected?', 'Describe the affected area; leave credentials and secret keys out.', 600), select('recentChanges', 'Were there recent site or hosting changes?', changes), select('backupStatus', 'What do you know about backups?', backupOptions), select('access', 'What access is available to the site owner?', accessOptions), select('urgency', 'How much is this affecting the business?', ['critical business impact', 'limited impact', 'unsure'])],
  method: ['The checklist branches on the reported symptom, recent changes, backup status, access, and business impact, then repeats your answers as self-reported observations and suggests safe information to gather. It never opens your URL, requests credentials, changes files, or recommends a production restore.'],
  example: 'For a broken contact form after a recent update, the helper asks you to note reproduction steps and the update time, then prepares a brief that labels the backup status as self-reported.',
  limitations: ['This is not a technical diagnosis or site scan.', 'Do not enter passwords, secret keys, or private customer information.', 'Recovery actions require a verified backup and a qualified review of the live site.'],
  faqs: [{ q: 'Does the helper scan my website?', a: 'No. It only uses the answers you enter in this page.' }, { q: 'Should I restore a backup if the site is broken?', a: 'Not based on this checklist. First confirm the backup date, scope, and recovery plan with the responsible provider.' }, { q: 'Can I send the brief to Ark?', a: 'Yes. Copy it into a free site review request at /contact/; do not include passwords.' }],
  sources: [wordPressSource, wpBackupSource], related: [{ label: 'WordPress rescue', url: '/services/wordpress-rescue/' }, { label: 'WordPress site review', url: '/services/wordpress-rescue/' }], ...contact, calculate: repairChecklist,
};

const decisionTool: BusinessTool = {
  id: 'repair-or-redesign', title: 'Repair or Redesign Decision Guide',
  description: 'Compare the condition of your website’s core functions, mobile experience, content, editing workflow, and integrations.',
  intro: 'Use your current website and business needs to make a first pass at what to keep, improve, or review.', submitLabel: 'Review my options',
  fields: [select('functions', 'Key functions', statusChoices), select('mobile', 'Mobile experience', statusChoices), select('content', 'Content condition', ['usable', 'needs rework', 'outdated or missing', 'not assessed']), select('editing', 'Can you edit what you need?', ['easy enough', 'difficult', 'cannot edit what matters', 'not assessed']), select('integrations', 'Forms and integrations', ['work as needed', 'need changes', 'uncertain', 'none']), text('constraints', 'Platform or technical constraints', 'List requirements, dependencies, or limits you know about.', 500), { id: 'priority', label: 'Main business priority', type: 'text', maxLength: 300, placeholder: 'For example, make service information clearer' }],
  method: ['The recommendation counts reported problem areas and answers needing clarification. Multiple broken or outdated foundations suggest a redesign review, while a narrow issue may fit focused repair; unknowns and constraints send the result to a review step before choosing. No cost or revenue forecast is produced.'],
  example: 'If forms and mobile layout work but one page needs an update, the result points toward focused improvements. If functions, mobile use, and core content all need major changes, it recommends reviewing a redesign.',
  limitations: ['This is a planning aid based on self-reported answers.', 'A technical review may change the recommendation after dependencies and content are inspected.', 'Project scope and price depend on the agreed work.'],
  faqs: [{ q: 'Does a redesign always mean rebuilding the website?', a: 'No. Redesign scope can preserve usable parts; implementation choices depend on the site and requirements.' }, { q: 'Can this tool compare project prices?', a: 'No. It does not estimate costs or predict outcomes.' }],
  sources: [wordPressSource, googleHelpfulSource], related: [{ label: 'Website redesign', url: '/services/website-redesign/' }, { label: 'Custom development', url: '/services/custom-website-development/' }], ...contact, calculate: repairOrRedesign,
};

const redirectTool: BusinessTool = {
  id: 'redirect-map-planner', title: 'Website Redirect Map Planner',
  description: 'Paste old and new URL pairs to check duplicate sources, blank targets, self-loops, redirect chains, and cycles in your proposed map.',
  intro: 'Review a migration map before implementation. Paste two-column CSV or tab-separated rows; paths and http(s) URLs are accepted.', submitLabel: 'Review redirect map',
  fields: [{ ...text('mappings', 'Old URL, new URL rows', 'One pair per line: /old-path,/new-path. Quoted CSV cells and a header row are accepted. Maximum 200 rows.', 30000), required: true }, select('redirectType', 'Redirect type to note in the worksheet', ['301 permanent', '308 permanent', '302 temporary', 'not decided']), select('migrationScope', 'What is changing?', ['path changes', 'domain changes', 'hosting only, URLs unchanged', 'not sure']), text('notes', 'Migration notes', 'Optional context for your review worksheet.', 500)],
  method: ['The tool parses quoted comma-separated or tab-separated rows and validates supplied paths and http(s) URLs, then compares normalized sources and targets to find duplicates, missing targets, shared destinations, self-loops, chains, and cycles. The selected redirect type is recorded in the CSV as a planning note, not applied; the export neutralizes formula-sensitive cells and makes no live HTTP requests.'],
  example: 'Rows `/old-service/,/services/repair/` and `/old-form/,/contact/` produce a downloadable review CSV; a row that points to another source in the map is flagged as a chain. Select a redirect type to record for the implementation plan.',
  limitations: ['Only the pasted mapping is checked. The tool does not confirm pages exist or redirects are active.', 'Review shared destinations for content relevance; broad irrelevant redirects may confuse visitors.', 'Test the implemented redirects in your own staging or production process.'],
  faqs: [{ q: 'Can I paste full URLs?', a: 'Yes. Use http(s) URLs or root-relative paths beginning with one slash.' }, { q: 'Does this check my live website?', a: 'No. It works only with the rows you paste and does not make network requests.' }, { q: 'Why are chains flagged?', a: 'A direct route to the final destination is easier to review and avoids extra redirect hops.' }],
  sources: [googleMigrationSource], related: [{ label: 'Website redesign', url: '/services/website-redesign/' }, { label: 'SEO foundations', url: '/services/seo-for-service-businesses/' }], ...contact, calculate: redirectMap,
};

const backupTool: BusinessTool = {
  id: 'backup-readiness-checker', title: 'WordPress Backup Readiness Checker',
  description: 'Review self-reported backup coverage, storage, schedule, and restore testing to organize useful questions for your site provider.',
  intro: 'Answer what you know about your backup arrangements. This check does not verify backups or test a restore.', submitLabel: 'Review backup readiness',
  fields: [select('database', 'Is the database included?', yesNoUnknown), select('media', 'Are uploads and media included?', yesNoUnknown), select('themesPlugins', 'Are themes and plugins included?', yesNoUnknown), select('offsite', 'Is a separate copy held outside the production site?', yesNoUnknown), select('schedule', 'What schedule is in place?', ['automatic schedule reported', 'manual or occasional', 'none known', 'not sure']), select('restoreTest', 'When was a restore tested?', ['tested recently', 'tested before', 'never tested', 'not sure'])],
  method: ['The result summarizes each answer as self-reported and turns unknown or negative answers into follow-up questions about scope, storage, schedule, and recovery responsibility. It advises arranging restore tests with the provider in an isolated environment and never overwrites production.'],
  example: 'If media is included but restore testing is unknown, the result identifies that uncertainty and suggests asking the provider how to test recovery safely.',
  limitations: ['The tool does not inspect backup files, storage, or jobs.', 'A reported backup is not a verified backup or proof of recoverability.', 'Recovery planning should be coordinated with the hosting provider or responsible site maintainer.'],
  faqs: [{ q: 'Does this confirm I have a working backup?', a: 'No. It only organizes your answers; ask your provider to confirm the backup scope and restore process.' }, { q: 'Should I test by restoring over the live site?', a: 'No. Ask the responsible provider to plan a test in an isolated environment.' }],
  sources: [wpBackupSource, { label: 'WordPress: Managing plugins and backup reminder', url: 'https://wordpress.org/documentation/article/manage-plugins/' }], related: [{ label: 'WordPress rescue', url: '/services/wordpress-rescue/' }, { label: 'Custom development', url: '/services/custom-website-development/' }], ...contact, calculate: backupReadiness,
};

const serviceTool: BusinessTool = {
  id: 'service-page-planner', title: 'Service Page Planner',
  description: 'Turn your real service list, coverage, and verified differences into a useful website page map.',
  intro: 'Plan around the services you actually provide. Add regional pages only when you can explain meaningful differences for each place.', submitLabel: 'Plan my service pages',
  fields: [{ ...text('services', 'Services currently offered', 'Separate services with commas or new lines.', 1200), required: true }, text('coverage', 'Locations you genuinely serve', 'List actual coverage areas, if relevant.', 600), text('differences', 'Verified differences by location', 'For example, different service availability or local process. Leave blank if none.', 900), text('customers', 'Who do these services help?', 'Name customer groups you actually serve.', 500), text('proof', 'Evidence or examples you can support', 'Examples, credentials, process details, or results you can substantiate.', 600), select('focus', 'What should the page plan help with?', ['explain services clearly', 'serve multiple regions', 'improve inquiries'])],
  method: ['Each distinct supplied service gets a draft page idea, while coverage is recorded as context and regional pages are not proposed without meaningful, verified differences. The planner uses only facts you enter and does not invent service details, local demand, or outcomes.'],
  example: 'For WordPress rescue and custom development across Charlotte and nationwide, the plan creates separate service concepts and keeps coverage areas as context unless unique regional details are supplied.',
  limitations: ['Draft URL paths require your review and may not match the existing site structure.', 'Do not publish pages that repeat the same service copy with a city name changed.', 'Claims and examples must be checked by the business before publication.'],
  faqs: [{ q: 'Should every service have its own page?', a: 'Only when it is a genuinely distinct service with useful information for visitors.' }, { q: 'Should I make one page for every city?', a: 'Not by default. A regional page should provide specific, accurate value for that area rather than repeat a city-swapped template.' }],
  sources: [googleHelpfulSource], related: [{ label: 'SEO foundations', url: '/services/seo-for-service-businesses/' }, { label: 'Website redesign', url: '/services/website-redesign/' }], ...contact, calculate: servicePagePlan,
};

const featureTool: BusinessTool = {
  id: 'custom-feature-brief', title: 'Custom Website Feature Brief Builder',
  description: 'Structure a custom feature request around users, workflow, integrations, permissions, failure cases, and acceptance criteria.',
  intro: 'Create a practical handoff brief for a custom website feature or small web application.', submitLabel: 'Build my feature brief',
  fields: [{ id: 'project', label: 'Feature or project name', type: 'text', required: true, maxLength: 120 }, { ...text('users', 'Who needs it and what do they need to do?', 'Describe the user need in plain language.', 400), required: true }, { ...text('workflow', 'What should happen, step by step?', 'Describe the main path through the feature.', 800), required: true }, text('integrations', 'Systems or integrations involved', 'Name known systems or say what needs investigation.', 500), text('data', 'Data and permissions', 'What information is used, and who can view or change it?', 500), text('errors', 'Failure cases and edge cases', 'What can go wrong, and what should the user see?', 500), { ...text('acceptance', 'How will you know it works?', 'List observable completion criteria.', 700), required: true }],
  method: ['The tool organizes answers into a project brief without adding assumptions, marks missing optional details for discussion, and provides a handoff checklist covering workflow, permissions, failure cases, acceptance, access, and documentation.'],
  example: 'A booking request feature brief can describe the user steps, calendar integration, protected customer details, duplicate submissions, and criteria for a successful confirmation.',
  limitations: ['The brief does not establish feasibility, price, delivery time, or security compliance.', 'A developer should review data handling, access, system dependencies, and test requirements before estimating.'],
  faqs: [{ q: 'Does this produce a development quote?', a: 'No. It prepares requirements for a scoping conversation; cost and schedule require review.' }, { q: 'What should I include in acceptance criteria?', a: 'Describe observable behavior, such as what a user can do and what confirmation or error appears.' }],
  sources: [googleHelpfulSource], related: [{ label: 'Custom development', url: '/services/custom-website-development/' }, { label: 'WordPress rescue', url: '/services/wordpress-rescue/' }], ...contact, calculate: featureBrief,
};

export const businessTools: BusinessTool[] = [repairTool, decisionTool, redirectTool, backupTool, serviceTool, featureTool];
export function getBusinessTool(id: string): BusinessTool | undefined {
  return businessTools.find((tool) => tool.id === id);
}
