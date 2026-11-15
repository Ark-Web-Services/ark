// ═══════════════════════════════════════════════════════════════
// WRITE-WEEKLY.TS — One evidence-led article with hard publish gates
// ═══════════════════════════════════════════════════════════════

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import nicheConfig, { getSiloById, getSiloIds } from '../niche.config';
import businessConfig from '../business.config';
import { REVIEW_TEMPLATES, reviewWork } from '../agents/reviewer';
import { buildSystemPrompt, discoverInternalLinks, slugify } from '../agents/writer';
import type { WeeklyTrend } from './analyze';
import { generateHeroImage } from './lib/images';
import { resolveImplementations, writeWeeklyReview } from './lib/ledger';
import { assertLlmReady, callModel, printLlmError } from './lib/llm';
import { registerCandidate } from './lib/publish-promotion';

interface GeneratedArticle {
  title: string;
  description: string;
  category: string;
  keyTakeaways: string[];
  faq: Array<{ question: string; answer: string }>;
  relatedSlugs: string[];
  atomicAnswer: string;
  markdown: string;
}
interface FactCheck { passed: boolean; businessScopePassed: boolean; issues: string[]; correctedMarkdown: string }

const POSTS_DIR = join(process.cwd(), 'src/content/posts');
const TREND_DIR = join(process.cwd(), 'data/trends');
const BRIEF_DIR = join(process.cwd(), 'data/briefs');
const TITLE_SUFFIX = ` | ${nicheConfig.siteName}`;
const MAX_BRANDED_TITLE_LENGTH = Math.max(1, 60 - TITLE_SUFFIX.length);
const FALLBACK_IMAGES: Record<string, { image: string; imageAlt: string }> = Object.fromEntries(
  nicheConfig.silos.map((silo) => [silo.id, {
    image: businessConfig.enabled ? '' : `/assets/images/posts/${silo.id}.webp`,
    imageAlt: businessConfig.enabled ? '' : `${silo.label} guide to ${nicheConfig.nicheNoun}`.slice(0, 125),
  }]),
);

function currentTrend(): WeeklyTrend {
  if (!existsSync(TREND_DIR)) throw new Error('No trend data found. Run npm run analyze first.');
  const files = readdirSync(TREND_DIR).filter((file) => /^\d{4}-W\d{2}\.json$/.test(file)).sort();
  if (!files.length) throw new Error('No weekly trend file found. Run npm run analyze first.');
  return JSON.parse(readFileSync(join(TREND_DIR, files.at(-1)!), 'utf8')) as WeeklyTrend;
}

function normalized(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
function existingKeywords(): Set<string> {
  const values = new Set<string>();
  for (const file of readdirSync(POSTS_DIR).filter((name) => /\.mdx?$/.test(name))) {
    const raw = readFileSync(join(POSTS_DIR, file), 'utf8');
    const target = /^targetKeyword:\s*["']?(.+?)["']?\s*$/mi.exec(raw)?.[1];
    const tags = /^tags:\s*\[([^\]]+)\]/mi.exec(raw)?.[1]?.split(',') ?? [];
    const title = /^title:\s*["']?(.+?)["']?\s*$/mi.exec(raw)?.[1];
    for (const value of [target, title, ...tags]) if (value) values.add(normalized(value.replace(/["']/g, '')));
  }
  return values;
}

function isArticle(value: unknown): value is GeneratedArticle {
  if (!value || typeof value !== 'object') return false;
  const item = value as any;
  return typeof item.title === 'string' && item.title.length > 0 && item.title.length <= 100
    && typeof item.description === 'string' && item.description.length > 0 && item.description.length <= 300
    && getSiloIds().includes(item.category)
    && Array.isArray(item.keyTakeaways) && item.keyTakeaways.length >= 3 && item.keyTakeaways.every((entry: unknown) => typeof entry === 'string' && entry.length > 0)
    && Array.isArray(item.faq) && item.faq.length >= 3 && item.faq.every((entry: any) => typeof entry.question === 'string' && typeof entry.answer === 'string')
    && Array.isArray(item.relatedSlugs) && item.relatedSlugs.length >= 3 && item.relatedSlugs.every((slug: unknown) => typeof slug === 'string' && slug.length > 0)
    && typeof item.atomicAnswer === 'string' && item.atomicAnswer.length > 0 && item.atomicAnswer.length <= 300
    && typeof item.markdown === 'string' && item.markdown.length > 1000;
}

function isFactCheck(value: unknown): value is FactCheck {
  if (!value || typeof value !== 'object') return false;
  const item = value as any;
  return typeof item.passed === 'boolean' && typeof item.businessScopePassed === 'boolean' && Array.isArray(item.issues) && item.issues.every((issue: unknown) => typeof issue === 'string') && typeof item.correctedMarkdown === 'string';
}

function yamlString(value: string): string { return JSON.stringify(value); }
function frontmatter(article: GeneratedArticle, keyword: string, image: string, imageAlt: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `---\nstatus: ${businessConfig.enabled ? "draft" : "published"}\ntitle: ${yamlString(article.title)}\ndescription: ${yamlString(article.description)}\ndate: ${today}\nauthor: ${yamlString(nicheConfig.author.name)}\ncategory: ${yamlString(article.category)}\ntargetKeyword: ${yamlString(keyword)}\ntags:\n  - ${yamlString(keyword)}\nimage: ${yamlString(image)}\nimageAlt: ${yamlString(imageAlt)}\nsidebarType: default\ntoc: true\ncomments: true\naffiliateProducts: ${!businessConfig.enabled && nicheConfig.defaultProducts.length > 0}\nkeyTakeaways:\n${article.keyTakeaways.map((item) => `  - ${yamlString(item)}`).join('\n')}\nfaq:\n${article.faq.map((item) => `  - question: ${yamlString(item.question)}\n    answer: ${yamlString(item.answer)}`).join('\n')}\natomicAnswer: ${yamlString(article.atomicAnswer)}\npopularity: 0\nfeatured: false\npillarSlug: ${yamlString(article.category)}\nrelatedSlugs:\n${article.relatedSlugs.map((slug) => `  - ${yamlString(slug)}`).join('\n')}\n---\n\n`;
}

function validateLinks(article: GeneratedArticle, links: ReturnType<typeof discoverInternalLinks>): void {
  const existing = new Set(links.map((link) => link.slug));
  const invalidRelated = article.relatedSlugs.filter((slug) => !existing.has(slug));
  if (invalidRelated.length) throw new Error(`Article relatedSlugs do not exist: ${invalidRelated.join(', ')}`);
  // Hard SEO gate. 59 titles and 56 descriptions were just rewritten to fit
  // snippet budgets; a generator that ignores them would undo that weekly.
  if (article.title.length > 60) throw new Error(`Article title is ${article.title.length} chars; must be <=60 (aim 25-41 so the brand suffix fits).`);
  if (article.description.length > 155 || article.description.length < 120) {
    throw new Error(`Article description is ${article.description.length} chars; must be 120-155.`);
  }
  const linkedSlugs = [...article.markdown.matchAll(/\]\(\/posts\/([^/)]+)\/?\)/g)].map((match) => match[1]);
  const validLinked = [...new Set(linkedSlugs.filter((slug) => existing.has(slug)))];
  if (validLinked.length < 3) throw new Error(`Article has only ${validLinked.length} verified internal post links; at least 3 are required.`);
  const hub = getSiloById(article.category)?.pillar;
  if (!hub) throw new Error(`Article category ${article.category} has no matching hub.`);
  if (!hasHubLink(article.markdown, hub)) throw new Error(`Article does not link to its relevant hub ${hub}.`);
}

// The hub link check used an exact `](/hub/)` match, so a model writing the
// same link without a trailing slash, or as an absolute URL, failed the gate
// and threw away a finished article. Accept every equivalent form.
export function hasHubLink(markdown: string, hub: string): boolean {
  const bare = hub.replace(/\/$/, '');
  const site = nicheConfig.url.replace(/\/$/, '');
  const forms = [bare, `${bare}/`, `${site}${bare}`, `${site}${bare}/`];
  return forms.some((form) => markdown.includes(`](${form})`));
}

// Deterministic repair: if the model simply forgot the hub link, append it
// rather than discarding a completed article. Structural failures (too few
// verified post links, bad slugs) still hard-fail.
// PostLayout already renders the frontmatter title as the page H1, so an H1 in
// the body produces two -- the same defect that affected 25 of the original
// posts. Demote any body-level H1 to H2 rather than failing the article.
export function stripBodyH1(markdown: string): string {
  return markdown.replace(/^#\s+(?!#)/gm, '## ');
}

export function ensureHubLink(markdown: string, hub: string, hubLabel: string): string {
  if (hasHubLink(markdown, hub)) return markdown;
  const trimmed = markdown.trimEnd();
  return `${trimmed}\n\n## Keep reading\n\nMore guides in this section: [${hubLabel}](${hub})\n`;
}

export async function writeWeekly(): Promise<void> {
  console.log('\n✍️ WEEKLY ARTICLE — Draft, fact-check, review, validate\n');
  await assertLlmReady();
  const trend = currentTrend();
  const existingTargets = existingKeywords();
  const gap = [...trend.contentGaps].sort((a, b) => a.rank - b.rank).find((candidate) => {
    const candidateSlug = slugify(candidate.suggestedSlug || candidate.title);
    return !existsSync(join(POSTS_DIR, `${candidateSlug}.md`))
      && !existsSync(join(POSTS_DIR, `${candidateSlug}.mdx`))
      && !existingTargets.has(normalized(candidate.targetKeyword));
  });
  if (!gap) throw new Error('Current trend file contains no content gap.');
  if (!getSiloIds().includes(gap.category)) throw new Error(`Trend selected invalid category: ${gap.category}`);
  const slug = slugify(gap.suggestedSlug || gap.title);
  const outputPath = join(POSTS_DIR, `${slug}.md`);
  if (existsSync(outputPath) || existsSync(join(POSTS_DIR, `${slug}.mdx`))) throw new Error(`Refusing to publish: slug already exists (${slug}).`);
  if (existingKeywords().has(normalized(gap.targetKeyword))) throw new Error(`Refusing to publish: target keyword duplicates existing content (${gap.targetKeyword}).`);

  const links = discoverInternalLinks();
  const categoryLinks = links.filter((link) => link.category === gap.category);
  const candidates = [...categoryLinks, ...links.filter((link) => link.category !== gap.category)].slice(0, 24);
  const system = buildSystemPrompt(candidates) + `\nReturn valid JSON only. Do not include frontmatter. The JSON fields are title, description, category, keyTakeaways (3-6 strings), faq (3-5 question/answer objects), relatedSlugs (3-6 existing slugs), atomicAnswer (<=300 chars), and markdown. Category must be ${gap.category}.\nSEO LIMITS -- these are hard requirements, not suggestions:\n- title: ${Math.min(25, MAX_BRANDED_TITLE_LENGTH)}-${MAX_BRANDED_TITLE_LENGTH} characters. The site appends \"${TITLE_SUFFIX}\" (${TITLE_SUFFIX.length} chars) and only does so when the result stays within 60, so a longer title loses the brand and gets truncated in search results. Lead with the searcher's own phrasing.\n- description: 140-155 characters. Write it as a click argument with concrete specifics, not a summary.\n- atomicAnswer: <=300 chars.\nSTRUCTURE: never emit a level-1 heading (# ) -- the page template renders the title as the H1. Start body sections at ## .\nEVIDENCE RULES: never invent a statistic, percentage, study, DOI, or citation. If you do not have a verified source for a number, state the range qualitatively instead. Precise-sounding unsupported figures are a serious defect.`;
  const article = await callModel<GeneratedArticle>({
    tier: 'heavy', task: 'write', system, json: true, validate: isArticle, maxTokens: 12000, temperature: 0.5,
    prompt: `Write the article selected from this editorial brief. Its priority is human/researcher-supplied unless the demand field explicitly describes measured Search Console or community data. Never present editorial priority as search volume or measured demand.\n\nTITLE: ${gap.title}\nTARGET KEYWORD: ${gap.targetKeyword}\nCATEGORY: ${gap.category}\nPRIORITY EVIDENCE: ${gap.demandEvidence}\nWHY THIS IS USEFUL: ${gap.whyWeCanWin}\nOUTLINE: ${gap.outline.join(' | ')}\nRELEVANT HUB: ${getSiloById(gap.category)?.pillar}\nRESEARCH SOURCES (cite only where relevant; do not imply endorsement):\n${gap.sources?.map((source) => `- ${source.label}: ${source.url} — ${source.use}`).join('\n') || 'Use the configured primary sources and cite the official documentation that supports the claim.'}\nEXISTING POSTS (only use these slugs):\n${candidates.map((item) => `- ${item.slug}: ${item.title}`).join('\n')}\n\nUse at least three verified /posts/<slug>/ links written exactly as [text](/posts/<slug>/) with a trailing slash, and link exactly once to the hub written exactly as [text](${getSiloById(gap.category)?.pillar}). Put the target keyword in the first tags position via metadata context, but do not keyword-stuff.`,
  });
  validateLinks(article, links);

  console.log('🔍 Running factual-claim pass on the LIGHT tier...');
  const factCheck = await callModel<FactCheck>({
    tier: 'light', task: 'fact-check', json: true, validate: isFactCheck, maxTokens: 10000, temperature: 0.1,
    system: `You are an independent conservative fact checker for ${nicheConfig.siteName}, covering ${nicheConfig.nicheNoun}. ${nicheConfig.nicheContext} Check numbers, units, timelines, named entities, technical claims, compatibility, and safety claims against the supplied primary sources. ${nicheConfig.contentGuidelines} Check company claims separately against the exact approved business facts and configured service scope. Preserve valid Markdown and links. Return JSON only.`,
    prompt: `Review this article and the supplied sources and business facts. Return {"passed":boolean,"businessScopePassed":boolean,"issues":["specific issue"],"correctedMarkdown":"full corrected article when issues exist, otherwise the unchanged full article"}. Set passed true only when factual claims are supported by supplied sources; set businessScopePassed true only when every company-specific claim matches approved facts and configured scope. Remove unsupported business promises. Never invent a citation.\n\nBUSINESS CONTEXT: ${businessConfig.name}; location ${businessConfig.location}; service areas ${businessConfig.serviceAreas.join(", ")}; email ${businessConfig.email}; phone ${businessConfig.phone ?? "not configured"}. Configured services: ${businessConfig.services.map((service) => `${service.title}: ${service.description}`).join("; ")}.\n\nRESEARCH SOURCES:\n${gap.sources?.map((source) => `- ${source.label}: ${source.url} — ${source.use}`).join("\n") || "No sources supplied."}\n\nARTICLE:\n${article.markdown}`,
  });
  if (!factCheck.passed || !factCheck.businessScopePassed) throw new Error(`Fact-check gate failed: ${factCheck.issues.join('; ') || 'factual or business-scope reviewer did not approve the claims'}`);
  const hubPath = getSiloById(article.category)?.pillar;
  const hubLabel = getSiloById(article.category)?.label ?? article.category;
  const factCheckedMarkdown = factCheck.correctedMarkdown || article.markdown;
  // The fact-check pass rewrites the body and can drop the hub link, so repair
  // after it rather than before.
  const checkedArticle = {
    ...article,
    markdown: stripBodyH1(hubPath ? ensureHubLink(factCheckedMarkdown, hubPath, hubLabel) : factCheckedMarkdown),
  };
  validateLinks(checkedArticle, links);

  console.log('🧑‍⚖️ Running reviewer publish gate...');
  const review = await reviewWork(REVIEW_TEMPLATES.writer, checkedArticle.markdown, `Keyword: ${gap.targetKeyword}; category: ${gap.category}`, 1);
  if (!review.passed) throw new Error(`Reviewer gate failed (${review.score}/10): ${review.feedback}`);

  let hero = FALLBACK_IMAGES[checkedArticle.category] ?? FALLBACK_IMAGES[nicheConfig.silos[0]?.id];
  if (!hero) throw new Error('No configured silo is available for the fallback hero image.');
  let generatedImageFile: string | null = null;
  if (!businessConfig.enabled) {
    console.log('🖼️ Generating article hero image...');
    try {
      const generated = await generateHeroImage(slug, checkedArticle.title, `${gap.targetKeyword}; ${gap.title}`);
      hero = { image: generated.image, imageAlt: generated.imageAlt };
      generatedImageFile = generated.file;
      console.log(`   ✅ Hero image written: ${generated.file}`);
    } catch (error) {
      console.warn(`   ⚠️ Hero generation failed; using category fallback ${hero.image}: ${(error as Error).message}`);
    }
  } else {
    console.log(`🖼️ Using the existing category image for this service-business article: ${hero.image}`);
  }

  const brief = {
    generatedAt: new Date().toISOString(), runId: process.env.CONTENT_RUN_ID, week: trend.week, slug, title: checkedArticle.title,
    targetKeyword: gap.targetKeyword, category: gap.category, demandEvidence: gap.demandEvidence, sources: gap.sources ?? [],
    whyWeCanWin: gap.whyWeCanWin, outline: gap.outline, internalLinkCandidates: checkedArticle.relatedSlugs,
    hub: getSiloById(gap.category)?.pillar, image: hero, factCheck: { passed: factCheck.passed, issues: factCheck.issues }, review,
  };
  mkdirSync(BRIEF_DIR, { recursive: true });
  writeFileSync(join(BRIEF_DIR, `${slug}.json`), `${JSON.stringify(brief, null, 2)}\n`);
  writeFileSync(outputPath, frontmatter(checkedArticle, gap.targetKeyword, hero.image, hero.imageAlt) + checkedArticle.markdown.trim() + '\n');

  console.log('🔎 Running TypeScript validation...');
  const typecheck = spawnSync('npx', ['tsc', '--noEmit'], { cwd: process.cwd(), encoding: 'utf8' });
  if (typecheck.status !== 0) {
    unlinkSync(outputPath);
    if (generatedImageFile && existsSync(generatedImageFile)) unlinkSync(generatedImageFile);
    throw new Error(`Generated post failed TypeScript validation and was deleted.\n${typecheck.stdout}\n${typecheck.stderr}`);
  }
  resolveImplementations();
  writeWeeklyReview(trend);
  const editorialQueuePath = join(process.cwd(), 'data/editorial/article-queue.json');
  if (existsSync(editorialQueuePath)) {
    const editorialQueue = JSON.parse(readFileSync(editorialQueuePath, 'utf8')) as { items?: Array<Record<string, any>> };
    const queuedBrief = editorialQueue.items?.find((item) => item.suggestedSlug === gap.suggestedSlug || item.targetKeyword === gap.targetKeyword);
    if (queuedBrief) {
      queuedBrief.status = 'drafted';
      queuedBrief.generatedAt = new Date().toISOString();
      queuedBrief.note = 'Automated fact-check and independent quality review passed; awaiting bounded preflight/build publication gates.';
      writeFileSync(editorialQueuePath, `${JSON.stringify(editorialQueue, null, 2)}\n`);
    }
  }
  registerCandidate({ runId: process.env.CONTENT_RUN_ID ?? '', kind: 'article', slug, queueId: slug, contentPath: `src/content/posts/${slug}.md`, evidencePath: `data/briefs/${slug}.json`, sourcePath: 'data/editorial/article-queue.json' });
  console.log(`✅ Article published to working tree: ${outputPath}`);
  console.log(`✅ Brief written: ${join(BRIEF_DIR, `${slug}.json`)}`);
  console.log(`✅ Suggestion marked implemented: ${slug}`);
}

async function main(): Promise<void> {
  try { await writeWeekly(); } catch (error) { printLlmError(error); process.exitCode = 1; }
}
if (process.argv[1]?.endsWith('write-weekly.ts')) main();
