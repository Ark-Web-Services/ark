// ═══════════════════════════════════════════════════════════════
// NICHE-CUSTOMIZER.TS — Turn a niche brief into a launch-ready repo
// ═══════════════════════════════════════════════════════════════

import 'dotenv/config';

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import ts from 'typescript';

import type {
  AuthorConfig,
  ExternalLink,
  NavItem,
  NicheConfig,
  ProductConfig,
  SiloConfig,
  ToolConfig,
} from '../niche.config';
import { assertLlmReady, callModel, logLlmRunSummary, printLlmError } from '../scripts/lib/llm';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_PATH = join(PROJECT_ROOT, 'niche.config.ts');
const SEED_KEYWORDS_PATH = join(PROJECT_ROOT, 'data', 'seed-keywords.json');
const STARTER_PAGE_PATHS = {
  about: join(PROJECT_ROOT, 'src', 'content', 'pages', 'about.md'),
  contact: join(PROJECT_ROOT, 'src', 'content', 'pages', 'contact.md'),
  privacy: join(PROJECT_ROOT, 'src', 'content', 'pages', 'privacy.md'),
} as const;

const REQUIRED_FOOTER_URLS = ['/about/', '/contact/', '/privacy/'];
const FORBIDDEN_TEMPLATE_PATTERN = /TEMPLATE|\{\{?\s*niche\s*\}?\}/i;
const AFFILIATE_PLACEHOLDER_HOST = 'replace-with-your-affiliate-link.invalid';

interface ProductDraft {
  id: string;
  name: string;
  shortName: string;
  badge?: string;
  pros: string[];
  cons: string[];
}

interface StaticPageCopy {
  aboutMission: string;
  researchMethod: string;
  contactTopics: string[];
  privacyNicheNote: string;
}

interface NicheDraft {
  siteName: string;
  tagline: string;
  description: string;
  nicheNoun: string;
  author: AuthorConfig;
  silos: SiloConfig[];
  primaryNav: NavItem[];
  footerNav: { title: string; url: string }[];
  seedKeywords: string[];
  competitors: string[];
  nicheContext: string;
  contentGuidelines: string;
  defaultProducts: ProductDraft[];
  pageProductMap: Record<string, { heading: string; products: string[] }>;
  redditSubreddits: string[];
  communityForums: string[];
  communityLinks: ExternalLink[];
  trustedSources: ExternalLink[];
  tools: ToolConfig[];
  staticPageCopy: StaticPageCopy;
}

export interface CustomizerOptions {
  niche: string;
  domain: string;
  positioning?: string;
  dryRun: boolean;
  force: boolean;
}

interface ParsedArguments extends Partial<CustomizerOptions> {
  help: boolean;
}

function usage(): string {
  return `Usage:
  npm run init-niche -- --niche "espresso machines" --domain espresso.example --positioning "For home baristas"

Options:
  --niche <text>        Required niche noun phrase
  --domain <domain>     Required target domain (scheme is optional)
  --positioning <text>  Optional audience or positioning note
  --brief <text>        Alias for --positioning
  --dry-run             Generate, validate, and print without writing
  --force               Allow replacing an already-customized repo
  --help                 Show this help`;
}

function parseArguments(args: string[]): ParsedArguments {
  const parsed: ParsedArguments = { dryRun: false, force: false, help: false };
  const positional: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--dry-run') parsed.dryRun = true;
    else if (arg === '--force') parsed.force = true;
    else if (arg === '--help' || arg === '-h') parsed.help = true;
    else if (arg === '--niche' || arg === '--domain' || arg === '--positioning' || arg === '--brief') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value.\n\n${usage()}`);
      index += 1;
      if (arg === '--niche') parsed.niche = value.trim();
      else if (arg === '--domain') parsed.domain = value.trim();
      else parsed.positioning = value.trim();
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}\n\n${usage()}`);
    } else {
      positional.push(arg);
    }
  }
  if (!parsed.niche && positional.length > 0) parsed.niche = positional.join(' ').trim();
  return parsed;
}

async function completeArguments(parsed: ParsedArguments): Promise<CustomizerOptions> {
  let niche = parsed.niche?.trim() ?? '';
  let domain = parsed.domain?.trim() ?? '';
  let positioning = parsed.positioning?.trim() ?? '';
  if ((!niche || !domain) && stdin.isTTY && stdout.isTTY) {
    const prompts = createInterface({ input: stdin, output: stdout });
    try {
      if (!niche) niche = (await prompts.question('🎯 Niche: ')).trim();
      if (!domain) domain = (await prompts.question('🌐 Target domain: ')).trim();
      if (!positioning) positioning = (await prompts.question('👥 Positioning / audience (optional): ')).trim();
    } finally {
      prompts.close();
    }
  }
  if (!niche || !domain) throw new Error(`Both --niche and --domain are required in non-interactive mode.\n\n${usage()}`);
  return {
    niche,
    domain,
    positioning: positioning || undefined,
    dryRun: parsed.dryRun ?? false,
    force: parsed.force ?? false,
  };
}

function normalizeDomain(input: string): string {
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(input) ? input : `https://${input}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(`Invalid target domain: ${input}`);
  }
  const domain = url.hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
  if (!domain || !domain.includes('.') || domain === 'localhost') {
    throw new Error(`Target domain must be a public hostname, received: ${input}`);
  }
  return domain;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function deploymentSlug(domain: string): string {
  const slug = slugify(domain);
  if (!slug) throw new Error(`Could not derive a deployment name from domain: ${domain}`);
  return slug.slice(0, 58).replace(/-+$/, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown, minLength = 1): value is string {
  return typeof value === 'string' && value.trim().length >= minLength;
}

function isStringArray(value: unknown, min = 0, max = Number.POSITIVE_INFINITY): value is string[] {
  return Array.isArray(value)
    && value.length >= min
    && value.length <= max
    && value.every((item) => isNonEmptyString(item));
}

function isHttpsUrl(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    const normalized = value.toLowerCase();
    if (seen.has(normalized)) duplicates.add(value);
    seen.add(normalized);
  }
  return [...duplicates];
}

function validateExternalLinks(value: unknown, path: string, min: number, max: number, issues: string[]): value is ExternalLink[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    issues.push(`${path} must contain ${min}-${max} links.`);
    return false;
  }
  value.forEach((link, index) => {
    if (!isRecord(link)) {
      issues.push(`${path}[${index}] must be an object.`);
      return;
    }
    if (!isNonEmptyString(link.label)) issues.push(`${path}[${index}].label is required.`);
    if (!isHttpsUrl(link.url)) issues.push(`${path}[${index}].url must be an absolute https URL.`);
    if (link.note !== undefined && !isNonEmptyString(link.note)) issues.push(`${path}[${index}].note must be non-empty when present.`);
  });
  return true;
}

// NOTE: a type predicate (`value is NicheDraft`) is only legal as a function
// return type, never as a property inside an object type — so this returns a
// plain boolean and the caller narrows with an assertion once `valid` is true.
function validateDraft(value: unknown): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!isRecord(value)) return { valid: false, issues: ['The response must be one JSON object.'] };

  for (const field of ['siteName', 'tagline', 'description', 'nicheNoun', 'nicheContext', 'contentGuidelines'] as const) {
    if (!isNonEmptyString(value[field], field === 'siteName' ? 3 : 12)) issues.push(`${field} is missing or too short.`);
  }

  if (!isRecord(value.author)) issues.push('author must be an object.');
  else {
    if (!isNonEmptyString(value.author.name)) issues.push('author.name is required.');
    if (!isNonEmptyString(value.author.bio, 30)) issues.push('author.bio must be substantive.');
    if (!isNonEmptyString(value.author.credentials, 20)) issues.push('author.credentials must explain the pre-launch verification requirement.');
    if (!isNonEmptyString(value.author.avatar) || !value.author.avatar.startsWith('/')) issues.push('author.avatar must be a root-relative path.');
    if (!Array.isArray(value.author.social)) issues.push('author.social must be an array (use [] until real profiles exist).');
  }

  if (!Array.isArray(value.silos) || value.silos.length < 4 || value.silos.length > 6) {
    issues.push('silos must contain 4-6 entries.');
  } else {
    const ids: string[] = [];
    value.silos.forEach((silo, index) => {
      const path = `silos[${index}]`;
      if (!isRecord(silo)) {
        issues.push(`${path} must be an object.`);
        return;
      }
      if (!isNonEmptyString(silo.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(silo.id)) issues.push(`${path}.id must be a slug.`);
      else ids.push(silo.id);
      if (!isNonEmptyString(silo.pillar) || !/^\/[a-z0-9-]+\/$/.test(silo.pillar)) issues.push(`${path}.pillar must look like /slug/.`);
      if (isNonEmptyString(silo.id) && silo.pillar !== `/${silo.id}/`) issues.push(`${path}.pillar must equal /${silo.id}/.`);
      for (const field of ['label', 'description', 'seoTitle', 'seoDescription'] as const) {
        if (!isNonEmptyString(silo[field], field.startsWith('seo') ? 15 : 5)) issues.push(`${path}.${field} is missing or too short.`);
      }
      if (!isNonEmptyString(silo.color) || !/^#[0-9a-f]{6}$/i.test(silo.color)) issues.push(`${path}.color must be a six-digit hex color.`);
      if (!isStringArray(silo.intro, 2, 3)) issues.push(`${path}.intro must contain 2-3 paragraphs.`);
      if (!Array.isArray(silo.faq) || silo.faq.length < 2 || silo.faq.length > 5) issues.push(`${path}.faq must contain 2-5 question/answer entries.`);
      else silo.faq.forEach((faq, faqIndex) => {
        if (!isRecord(faq) || !isNonEmptyString(faq.question, 8) || !isNonEmptyString(faq.answer, 20)) {
          issues.push(`${path}.faq[${faqIndex}] needs a substantive question and answer.`);
        }
      });
      if (!Array.isArray(silo.startHere) || silo.startHere.length < 2 || silo.startHere.length > 4) issues.push(`${path}.startHere must contain 2-4 entries.`);
      else silo.startHere.forEach((entry, entryIndex) => {
        if (!isRecord(entry) || !isNonEmptyString(entry.label) || !isNonEmptyString(entry.note) || !isNonEmptyString(entry.href) || !entry.href.startsWith('/')) {
          issues.push(`${path}.startHere[${entryIndex}] requires label, root-relative href, and note.`);
        }
      });
    });
    if (duplicateValues(ids).length) issues.push(`Silo IDs must be unique: ${duplicateValues(ids).join(', ')}.`);
  }

  for (const field of ['primaryNav', 'footerNav'] as const) {
    if (!Array.isArray(value[field]) || value[field].length < 4) issues.push(`${field} must contain at least four entries.`);
    else value[field].forEach((item, index) => {
      if (!isRecord(item) || !isNonEmptyString(item.title) || !isNonEmptyString(item.url) || !item.url.startsWith('/')) {
        issues.push(`${field}[${index}] requires title and a root-relative url.`);
      }
    });
  }
  if (Array.isArray(value.silos) && Array.isArray(value.primaryNav)) {
    const primaryUrls = new Set(value.primaryNav.filter(isRecord).map((item) => item.url));
    for (const silo of value.silos.filter(isRecord)) {
      if (isNonEmptyString(silo.pillar) && !primaryUrls.has(silo.pillar)) issues.push(`primaryNav is missing the ${silo.pillar} silo.`);
    }
  }
  if (Array.isArray(value.silos) && Array.isArray(value.footerNav)) {
    const footerUrls = new Set(value.footerNav.filter(isRecord).map((item) => item.url));
    for (const silo of value.silos.filter(isRecord)) {
      if (isNonEmptyString(silo.pillar) && !footerUrls.has(silo.pillar)) issues.push(`footerNav is missing the ${silo.pillar} silo.`);
    }
    for (const required of REQUIRED_FOOTER_URLS) {
      if (!footerUrls.has(required)) issues.push(`footerNav is missing ${required}.`);
    }
  }

  if (!isStringArray(value.seedKeywords, 12, 40)) issues.push('seedKeywords must contain 12-40 phrases.');
  else if (duplicateValues(value.seedKeywords).length) issues.push('seedKeywords must be unique.');
  if (!isStringArray(value.competitors, 2, 10)) issues.push('competitors must contain 2-10 domain names.');
  else value.competitors.forEach((competitor, index) => {
    if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(competitor)) issues.push(`competitors[${index}] must be a bare domain name.`);
  });

  const productIds: string[] = [];
  if (!Array.isArray(value.defaultProducts) || value.defaultProducts.length < 3 || value.defaultProducts.length > 6) {
    issues.push('defaultProducts must contain 3-6 product scaffolds.');
  } else value.defaultProducts.forEach((product, index) => {
    if (!isRecord(product)) {
      issues.push(`defaultProducts[${index}] must be an object.`);
      return;
    }
    if (!isNonEmptyString(product.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.id)) issues.push(`defaultProducts[${index}].id must be a slug.`);
    else productIds.push(product.id);
    if (!isNonEmptyString(product.name) || !isNonEmptyString(product.shortName)) issues.push(`defaultProducts[${index}] needs name and shortName.`);
    if (!isStringArray(product.pros, 2, 5) || !isStringArray(product.cons, 1, 4)) issues.push(`defaultProducts[${index}] needs 2-5 pros and 1-4 cons.`);
  });
  if (duplicateValues(productIds).length) issues.push('defaultProducts IDs must be unique.');

  if (!isRecord(value.pageProductMap) || Object.keys(value.pageProductMap).length < 1) issues.push('pageProductMap must contain at least one page mapping.');
  else Object.entries(value.pageProductMap).forEach(([slug, mapping]) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) issues.push(`pageProductMap key "${slug}" must be a slug.`);
    if (!isRecord(mapping) || !isNonEmptyString(mapping.heading) || !isStringArray(mapping.products, 1, 4)) issues.push(`pageProductMap.${slug} needs a heading and 1-4 product IDs.`);
    else for (const productId of mapping.products) {
      if (!productIds.includes(productId)) issues.push(`pageProductMap.${slug} references unknown product ${productId}.`);
    }
  });

  if (!isStringArray(value.redditSubreddits, 1, 8)) issues.push('redditSubreddits must contain 1-8 entries.');
  else value.redditSubreddits.forEach((subreddit, index) => {
    if (!/^r\/[A-Za-z0-9_]+$/.test(subreddit)) issues.push(`redditSubreddits[${index}] must look like r/community.`);
  });
  if (!isStringArray(value.communityForums, 1, 8) || !value.communityForums.every(isHttpsUrl)) issues.push('communityForums must contain 1-8 absolute https URLs.');
  validateExternalLinks(value.communityLinks, 'communityLinks', 2, 8, issues);
  validateExternalLinks(value.trustedSources, 'trustedSources', 3, 10, issues);

  if (!Array.isArray(value.tools) || value.tools.length < 2 || value.tools.length > 3) issues.push('tools must contain 2-3 proposals.');
  else value.tools.forEach((tool, index) => {
    if (!isRecord(tool) || !isNonEmptyString(tool.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tool.id)
      || !isNonEmptyString(tool.title) || !isNonEmptyString(tool.icon) || !isNonEmptyString(tool.description, 20)) {
      issues.push(`tools[${index}] requires a slug id, title, icon, and substantive description.`);
    }
  });

  if (!isRecord(value.staticPageCopy)) issues.push('staticPageCopy must be an object.');
  else {
    for (const field of ['aboutMission', 'researchMethod', 'privacyNicheNote'] as const) {
      if (!isNonEmptyString(value.staticPageCopy[field], 30)) issues.push(`staticPageCopy.${field} must be substantive.`);
    }
    if (!isStringArray(value.staticPageCopy.contactTopics, 3, 6)) issues.push('staticPageCopy.contactTopics must contain 3-6 topics.');
  }

  if (FORBIDDEN_TEMPLATE_PATTERN.test(JSON.stringify(value))) issues.push('Response contains a TEMPLATE or {niche} placeholder.');
  return { valid: issues.length === 0, issues };
}

function promptFor(options: CustomizerOptions, domain: string, priorIssues: string[]): string {
  const repair = priorIssues.length
    ? `\nYOUR PREVIOUS RESPONSE FAILED VALIDATION. Correct every issue:\n${priorIssues.map((issue) => `- ${issue}`).join('\n')}\n`
    : '';
  return `Create the editorial and SEO configuration for a niche authority site.

NICHE: ${options.niche}
TARGET DOMAIN: ${domain}
POSITIONING / AUDIENCE: ${options.positioning ?? 'Choose a practical, trustworthy audience position suited to the niche.'}
${repair}
Return one JSON object with exactly these fields:
{
  "siteName": string,
  "tagline": string,
  "description": string,
  "nicheNoun": string,
  "author": {"name": string, "bio": string, "credentials": string, "avatar": string, "social": []},
  "silos": [{"id": slug, "pillar": "/<id>/", "label": string, "color": "#RRGGBB", "description": string, "seoTitle": string, "seoDescription": string, "intro": [2-3 paragraphs], "faq": [{"question": string, "answer": string}], "startHere": [{"label": string, "href": "/posts/<slug>/", "note": string}]}],
  "primaryNav": [{"title": string, "url": string, "icon": string, "description": string, "children": [{"title": string, "url": string}]}],
  "footerNav": [{"title": string, "url": string}],
  "seedKeywords": [string],
  "competitors": [bare domain names],
  "nicheContext": string,
  "contentGuidelines": string,
  "defaultProducts": [{"id": slug, "name": string, "shortName": string, "badge": optional string, "pros": [string], "cons": [string]}],
  "pageProductMap": {"page-slug": {"heading": string, "products": [product IDs]}},
  "redditSubreddits": ["r/name"],
  "communityForums": [absolute https URLs],
  "communityLinks": [{"label": string, "url": absolute https URL, "note": string}],
  "trustedSources": [{"label": string, "url": absolute https URL, "note": string}],
  "tools": [{"id": slug, "title": string, "icon": one emoji, "description": string}],
  "staticPageCopy": {"aboutMission": string, "researchMethod": string, "contactTopics": [string], "privacyNicheNote": string}
}

Hard constraints:
- Produce 4-6 genuinely distinct search-intent silos. Every silo needs 2-3 intro paragraphs, 2-5 factual FAQs, and 2-4 startHere entries.
- primaryNav and footerNav must each link every silo pillar. footerNav must also include /about/, /contact/, and /privacy/.
- Produce 12-40 specific seed keywords, 2-10 known competitor domains, 3-6 product scaffolds, 2-3 tools, and the required community/source lists.
- Product recommendations are editorial scaffolds, not claims of testing. Do not include prices, ratings, images, or affiliate URLs; the program adds safe placeholders.
- Do not invent a person's identity, qualifications, years of experience, hands-on testing, social profiles, certifications, statistics, or studies. Use "${domain} Editorial Team" as the author name, an honest process-based bio, "Add a real author and verified credentials before launch" as credentials, "/assets/images/author-avatar.webp" as avatar, and [] for social.
- Use only communities, competitors, forums, and authoritative sources you are confident actually exist. Never fabricate a URL.
- FAQs must avoid medical, legal, safety, or performance certainty not supported by supplied evidence.
- Do not emit TEMPLATE, {niche}, {{tokens}}, TODO, Markdown fences, or commentary.`;
}

async function generateDraft(options: CustomizerOptions, domain: string): Promise<NicheDraft> {
  await assertLlmReady();
  let priorIssues: string[] = [];
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    if (attempt > 1) console.warn('⚠️ Model output failed validation; requesting one constrained repair.');
    const value = await callModel<unknown>({
      tier: 'heavy',
      task: 'analyze',
      system: 'You are a conservative niche-site information architect. Return valid JSON only. Treat every requested count, URL rule, and anti-fabrication instruction as mandatory.',
      prompt: promptFor(options, domain, priorIssues),
      temperature: attempt === 1 ? 0.2 : 0,
      maxTokens: 24_000,
      json: true,
    });
    const validation = validateDraft(value);
    if (validation.valid) return value as NicheDraft;
    priorIssues = validation.issues;
    console.warn(`   Validation found ${priorIssues.length} issue(s): ${priorIssues.slice(0, 8).join(' | ')}${priorIssues.length > 8 ? ' | …' : ''}`);
  }
  throw new Error(`The LLM returned invalid niche data twice. Last validation issues: ${priorIssues.join(' | ')}`);
}

function buildConfig(draft: NicheDraft, options: CustomizerOptions, domain: string): NicheConfig {
  const deployName = deploymentSlug(domain);
  const nicheId = slugify(options.niche);
  if (!nicheId) throw new Error(`Could not derive a niche ID from: ${options.niche}`);
  const products: ProductConfig[] = draft.defaultProducts.map((product) => ({
    ...product,
    price: 'Check current price',
    rating: 0,
    ratingCount: 0,
    affiliateUrl: `https://${AFFILIATE_PLACEHOLDER_HOST}/${product.id}`,
    image: `/assets/images/products/${product.id}.webp`,
  }));
  return {
    id: nicheId,
    siteName: draft.siteName.trim(),
    tagline: draft.tagline.trim(),
    url: `https://${domain}`,
    description: draft.description.trim(),
    locale: 'en_US',
    lang: 'en',
    ga4Id: '',
    contactEmail: `hello@${domain}`,
    nicheNoun: draft.nicheNoun.trim(),
    author: draft.author,
    silos: draft.silos,
    primaryNav: draft.primaryNav,
    footerNav: draft.footerNav,
    seedKeywords: draft.seedKeywords,
    competitors: draft.competitors.map((competitor) => competitor.toLowerCase()),
    nicheContext: draft.nicheContext.trim(),
    contentGuidelines: draft.contentGuidelines.trim(),
    defaultProducts: products,
    pageProductMap: draft.pageProductMap,
    affiliateDisclaimer: 'This site contains affiliate links. We may earn a commission at no extra cost to you if you purchase through our links. Recommendations are editorially independent; verify current product details with the seller.',
    cloudflareProjectName: deployName,
    d1DatabaseName: `${deployName.slice(0, 55).replace(/-+$/, '')}-db`,
    scheduling: { maxContentPerRun: 3, maxReviewIterations: 3 },
    tools: draft.tools,
    redditSubreddits: draft.redditSubreddits,
    communityForums: draft.communityForums,
    communityLinks: draft.communityLinks,
    trustedSources: draft.trustedSources,
    visualDistribution: {
      pinterest: { enabled: false, defaultBoardId: '', defaultBoardName: '', sectionId: null },
      imgur: { enabled: false, defaultAlbumId: null, createAlbumIfMissing: true, defaultAlbumTitle: `${draft.siteName} Visual Guides`, privacy: 'public' },
      tumblr: { enabled: false, blogName: '', preferredFormat: 'npf', defaultPostState: 'published' },
      interlinking: { useImgurUrlForPinterest: true, useImgurUrlForTumblr: true, crossReferenceInDescriptions: false },
    },
  };
}

function validateFinalConfig(config: NicheConfig, domain: string): string[] {
  const issues: string[] = [];
  const draftIssues = validateDraft({
    siteName: config.siteName,
    tagline: config.tagline,
    description: config.description,
    nicheNoun: config.nicheNoun,
    author: config.author,
    silos: config.silos,
    primaryNav: config.primaryNav,
    footerNav: config.footerNav,
    seedKeywords: config.seedKeywords,
    competitors: config.competitors,
    nicheContext: config.nicheContext,
    contentGuidelines: config.contentGuidelines,
    defaultProducts: config.defaultProducts.map(({ id, name, shortName, badge, pros, cons }) => ({ id, name, shortName, badge, pros, cons })),
    pageProductMap: config.pageProductMap,
    redditSubreddits: config.redditSubreddits,
    communityForums: config.communityForums,
    communityLinks: config.communityLinks,
    trustedSources: config.trustedSources,
    tools: config.tools,
    staticPageCopy: {
      aboutMission: 'Validated separately as generated static-page content for this niche.',
      researchMethod: 'Validated separately as generated static-page content for this niche.',
      contactTopics: ['Corrections', 'Topic suggestions', 'Partnership disclosures'],
      privacyNicheNote: 'Validated separately as generated static-page content for this niche.',
    },
  });
  issues.push(...draftIssues.issues);
  const expectedDeploymentName = deploymentSlug(domain);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.id)) issues.push('id must be a lowercase slug.');
  if (config.url !== `https://${domain}`) issues.push(`url must normalize to https://${domain}.`);
  if (config.contactEmail !== `hello@${domain}`) issues.push(`contactEmail must be hello@${domain}.`);
  if (config.cloudflareProjectName !== expectedDeploymentName) issues.push(`cloudflareProjectName must be ${expectedDeploymentName}.`);
  if (config.d1DatabaseName !== `${expectedDeploymentName.slice(0, 55).replace(/-+$/, '')}-db`) issues.push('d1DatabaseName was not derived from the domain consistently.');
  for (const product of config.defaultProducts) {
    if (product.rating !== 0 || product.ratingCount !== 0) issues.push(`${product.id} must not claim an unverified rating.`);
    try {
      if (new URL(product.affiliateUrl).hostname !== AFFILIATE_PLACEHOLDER_HOST) issues.push(`${product.id} must use the clearly marked affiliate placeholder host.`);
    } catch {
      issues.push(`${product.id} affiliateUrl is malformed.`);
    }
  }
  if (FORBIDDEN_TEMPLATE_PATTERN.test(JSON.stringify(config))) issues.push('Final config contains a TEMPLATE or {niche} placeholder.');
  return issues;
}

function quoteTsString(value: string): string {
  return `'${value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')}'`;
}

function tsKey(key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? key : quoteTsString(key);
}

function toTypeScriptLiteral(value: unknown, depth = 0): string {
  if (typeof value === 'string') return quoteTsString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.every((item) => ['string', 'number', 'boolean'].includes(typeof item))) {
      return `[${value.map((item) => toTypeScriptLiteral(item, depth + 1)).join(', ')}]`;
    }
    const indent = '  '.repeat(depth + 1);
    const closing = '  '.repeat(depth);
    return `[\n${value.map((item) => `${indent}${toTypeScriptLiteral(item, depth + 1)},`).join('\n')}\n${closing}]`;
  }
  if (isRecord(value)) {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);
    if (entries.length === 0) return '{}';
    const indent = '  '.repeat(depth + 1);
    const closing = '  '.repeat(depth);
    return `{\n${entries.map(([key, item]) => `${indent}${tsKey(key)}: ${toTypeScriptLiteral(item, depth + 1)},`).join('\n')}\n${closing}}`;
  }
  throw new Error(`Cannot serialize ${typeof value} to TypeScript.`);
}

function renderConfigSource(existing: string, config: NicheConfig): string {
  const start = existing.indexOf('const config: NicheConfig = {');
  const exportMarker = '\nexport default config;';
  const exportIndex = existing.indexOf(exportMarker, start);
  if (start < 0 || exportIndex < 0) throw new Error('Could not locate the config object/export markers in niche.config.ts.');
  const replacement = `const config: NicheConfig = ${toTypeScriptLiteral(config)};`;
  const source = `${existing.slice(0, start)}${replacement}${existing.slice(exportIndex)}`;
  if (FORBIDDEN_TEMPLATE_PATTERN.test(source)) throw new Error('Rendered niche.config.ts still contains a TEMPLATE or {niche} placeholder.');
  return source.endsWith('\n') ? source : `${source}\n`;
}

function formatDiagnostic(diagnostic: ts.Diagnostic): string {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  if (!diagnostic.file || diagnostic.start === undefined) return message;
  const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
  return `${diagnostic.file.fileName}:${position.line + 1}:${position.character + 1} ${message}`;
}

function verifyCandidateTypeScript(source: string): void {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'godfather-niche-check-'));
  const candidatePath = join(temporaryDirectory, 'niche.config.ts');
  try {
    writeFileSync(candidatePath, source);
    const program = ts.createProgram([candidatePath], {
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
    });
    const candidate = program.getSourceFile(candidatePath);
    if (!candidate) throw new Error('TypeScript could not load the generated candidate.');
    const diagnostics = [
      ...program.getSyntacticDiagnostics(candidate),
      ...program.getSemanticDiagnostics(candidate),
    ];
    if (diagnostics.length) throw new Error(`Generated niche.config.ts failed TypeScript validation:\n${diagnostics.map(formatDiagnostic).join('\n')}`);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

function renderStarterPages(draft: NicheDraft): Record<keyof typeof STARTER_PAGE_PATHS, string> {
  const updated = new Date().toISOString().slice(0, 10);
  const contactTopics = draft.staticPageCopy.contactTopics.map((topic) => `- ${topic}`).join('\n');
  return {
    about: `---
title: "About {{siteName}}"
description: "How {{siteName}} researches and publishes practical guidance about {{nicheNoun}}."
---

**{{siteName}}** is an independent reference site for {{nicheNoun}}. ${draft.staticPageCopy.aboutMission}

## Our editorial mission

${draft.nicheContext}

## How we research

${draft.staticPageCopy.researchMethod}

Our editorial team, led by {{authorName}}, compares claims across credible sources, marks uncertainty clearly, and revises articles when better evidence becomes available. Commercial relationships never determine our conclusions.

## Trusted sources

These are among the references and organizations used to check our work:

{{trustedSources}}

## Community resources

Communities can add practical context and surface questions worth investigating. They are independent of {{siteName}}:

{{communityLinks}}

## Corrections and feedback

Found an error or an outdated recommendation? [Contact us](/contact/) with the page URL and enough detail to verify the issue, or email [{{contactEmail}}](mailto:{{contactEmail}}).
`,
    contact: `---
title: "Contact {{siteName}}"
description: "Contact {{siteName}} about corrections, questions, and coverage of {{nicheNoun}}."
---

We welcome useful feedback from readers of {{siteName}}, especially when it helps make our coverage of {{nicheNoun}} more accurate and practical.

## What to contact us about

${contactTopics}

## Email

Email [{{contactEmail}}](mailto:{{contactEmail}}) with a clear subject line. When writing about an article, include its URL and the source or experience behind your note. Response time depends on the research needed.

## Corrections

Tell us exactly what appears incorrect and share a reliable source when possible. We review correction requests, document material changes, and update articles when the evidence supports a change.

## Partnerships and product reviews

Use the subject line **Partnership Inquiry** and disclose deadlines, compensation, samples, and affiliate terms. A commercial relationship never guarantees coverage or a favorable conclusion.

## Independent communities

For peer discussion about {{nicheNoun}}, these independent communities may also help:

{{communityLinks}}

Contact each community's operators directly about its accounts, rules, or moderation decisions.
`,
    privacy: `---
title: "Privacy Policy"
description: "How {{siteName}} handles analytics, cookies, affiliate links, contact data, and privacy requests."
updated: ${updated}
---

This Privacy Policy explains how **{{siteName}}** ("we," "us," or "our") handles information when you visit {{siteUrl}}, contact us, or use our services. ${draft.staticPageCopy.privacyNicheNote}

## Information we collect

- **Information you provide:** Your name, email address, message, and anything else you choose to send.
- **Usage and device information:** Pages viewed, referring pages, approximate location, browser and device type, operating system, timestamps, and similar technical data.
- **Cookies and local storage:** Identifiers and preferences stored by your browser where analytics or site features use them.

Please do not send sensitive personal information by email or through the site.

## How we use information

We use information to operate, secure, and improve the site; understand useful content; respond to messages; prevent abuse; comply with legal obligations; and measure site performance.

## Analytics, cookies, and affiliate links

We may use Google Analytics 4 and hosting-provider analytics. These services can process technical information and use cookies or similar identifiers. Browser settings and any consent controls shown on the site can limit this collection.

Some links may be affiliate links. If you follow one and complete a qualifying purchase, we may receive compensation at no extra cost to you. Merchants apply their own privacy policies, and compensation does not determine our editorial conclusions.

## Service providers and disclosure

Hosting, security, analytics, email, and other operational providers may process information for us under their applicable terms. We may also disclose information when required by law, to protect rights and safety, to investigate abuse, or during a business transfer.

We do not sell personal information for money. Some laws may define particular analytics or advertising activity as a "sale" or "sharing"; where applicable, you may request an opt-out.

## Retention and security

We retain personal information only as long as reasonably necessary for the purposes described here, including legal, accounting, security, and dispute-resolution needs. No internet transmission or storage system can be guaranteed completely secure.

## Third-party links and international processing

We do not control third-party sites linked from {{siteName}}. Their own policies govern their practices. Our providers may process information in countries with different data-protection laws and use recognized safeguards where required.

## Your privacy rights

Depending on where you live, you may have rights to access, correct, delete, restrict, or receive a copy of personal information, or to object to certain processing. Email [{{contactEmail}}](mailto:{{contactEmail}}) to make a request. We may need to verify your identity.

## Children's privacy

{{siteName}} is intended for a general audience and is not directed to children under 13. If you believe a child provided personal information, contact us so we can review and delete it as appropriate.

## Changes and contact

We may update this policy as the site, providers, or legal requirements change. The date above shows the latest revision. For privacy questions, email [{{contactEmail}}](mailto:{{contactEmail}}) and identify {{domain}} in your message.
`,
  };
}

function hasTemplatePlaceholders(source: string): boolean {
  return /TEMPLATE_NICHE_ID|cloudflareProjectName:\s*['"][^'"]*TEMPLATE|\{niche\}/i.test(source);
}

function backupName(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${CONFIG_PATH}.backup-${timestamp}`;
}

function atomicWrite(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.niche-customizer-${process.pid}.tmp`;
  writeFileSync(temporaryPath, content);
  renameSync(temporaryPath, path);
}

function assertSetupParserCompatibility(source: string, config: NicheConfig): void {
  const expected: Array<[string, string]> = [
    ['id', config.id],
    ['siteName', config.siteName],
    ['url', config.url],
    ['cloudflareProjectName', config.cloudflareProjectName],
    ['d1DatabaseName', config.d1DatabaseName],
  ];
  for (const [field, value] of expected) {
    const prefix = field === 'url' ? '^  url:' : `^  ${field}:`;
    const match = source.match(new RegExp(`${prefix}\\s*'([^']*)'`, 'm'));
    if (!match || match[1] !== value) throw new Error(`Generated source is not compatible with setup-niche.sh parsing for ${field}.`);
  }
  if (config.id === 'TEMPLATE_NICHE_ID' || config.cloudflareProjectName.includes('TEMPLATE')) {
    throw new Error('Generated deployment fields would be rejected by setup-niche.sh.');
  }
}

export async function customizeNiche(options: CustomizerOptions): Promise<void> {
  if (!existsSync(CONFIG_PATH)) throw new Error(`niche.config.ts not found at ${CONFIG_PATH}`);
  const domain = normalizeDomain(options.domain);
  const existingConfig = readFileSync(CONFIG_PATH, 'utf8');
  const templateState = hasTemplatePlaceholders(existingConfig);
  if (!templateState && !options.force && !options.dryRun) {
    throw new Error('This repo already looks customized (the template placeholders are gone). Re-run with --force only after reviewing the current niche.config.ts.');
  }
  if (!templateState && options.dryRun && !options.force) {
    console.warn('⚠️ Repo already looks customized. Dry-run is safe; a real replacement would require --force.');
  }

  console.log('\n🎩 Godfather SEO Engine — Niche Customizer\n');
  console.log(`🎯 Niche: ${options.niche}`);
  console.log(`🌐 Domain: ${domain}`);
  if (options.positioning) console.log(`👥 Positioning: ${options.positioning}`);
  console.log(options.dryRun ? '🧪 Mode: dry-run (no repo files will be written)\n' : '✍️ Mode: write\n');

  let draft: NicheDraft;
  if (options.dryRun) {
    const isolatedCwd = mkdtempSync(join(tmpdir(), 'godfather-niche-dry-run-'));
    const originalCwd = process.cwd();
    try {
      process.chdir(isolatedCwd);
      draft = await generateDraft(options, domain);
    } finally {
      process.chdir(originalCwd);
      rmSync(isolatedCwd, { recursive: true, force: true });
    }
  } else {
    draft = await generateDraft(options, domain);
  }

  const config = buildConfig(draft, options, domain);
  const configIssues = validateFinalConfig(config, domain);
  if (configIssues.length) throw new Error(`Final config validation failed:\n- ${configIssues.join('\n- ')}`);
  const configSource = renderConfigSource(existingConfig, config);
  assertSetupParserCompatibility(configSource, config);
  verifyCandidateTypeScript(configSource);
  const pages = renderStarterPages(draft);
  for (const [name, content] of Object.entries(pages)) {
    if (FORBIDDEN_TEMPLATE_PATTERN.test(content)) throw new Error(`Generated ${name}.md contains a forbidden niche placeholder.`);
  }

  console.log('✅ Structured niche data passed schema and invariant checks.');
  console.log('✅ Generated niche.config.ts passed parser and TypeScript checks.');

  if (options.dryRun) {
    console.log('\n── Proposed niche.config.ts ──────────────────────────\n');
    console.log(configSource);
    console.log('── Additional planned outputs ────────────────────────');
    console.log(`data/seed-keywords.json: ${config.seedKeywords.length} keywords`);
    for (const [name, path] of Object.entries(STARTER_PAGE_PATHS)) {
      console.log(existsSync(path) ? `src/content/pages/${name}.md: would rewrite` : `⏭️ src/content/pages/${name}.md not found; would skip`);
    }
    console.log('\n🧪 Dry run complete. No repo files were written.');
    logLlmRunSummary('Niche customizer dry run');
    return;
  }

  const backupPath = backupName();
  copyFileSync(CONFIG_PATH, backupPath);
  console.log(`🛟 Backed up existing config: ${backupPath}`);
  atomicWrite(SEED_KEYWORDS_PATH, `${JSON.stringify(config.seedKeywords, null, 2)}\n`);
  console.log(`✅ Seeded ${config.seedKeywords.length} keywords: ${SEED_KEYWORDS_PATH}`);
  for (const [name, path] of Object.entries(STARTER_PAGE_PATHS) as Array<[keyof typeof STARTER_PAGE_PATHS, string]>) {
    if (!existsSync(path)) {
      console.log(`⏭️ Starter page missing; skipped without failing: ${path}`);
      continue;
    }
    atomicWrite(path, pages[name]);
    console.log(`✅ Rewrote starter page: ${path}`);
  }
  atomicWrite(CONFIG_PATH, configSource);
  console.log(`✅ Wrote validated config: ${CONFIG_PATH}`);
  logLlmRunSummary('Niche customizer');
}

export async function runNicheCustomizer(args = process.argv.slice(2)): Promise<void> {
  const parsed = parseArguments(args);
  if (parsed.help) {
    console.log(usage());
    return;
  }
  await customizeNiche(await completeArguments(parsed));
}

async function main(): Promise<void> {
  try {
    await runNicheCustomizer();
  } catch (error) {
    printLlmError(error);
    console.error('💡 The shared LLM client already retries transient 408/429/5xx failures with backoff. Check OLLAMA_BASE_URL or hosted-provider credentials and retry; Gemini defaults to gemini-3.6-flash.');
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
