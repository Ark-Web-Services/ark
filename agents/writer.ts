// ═══════════════════════════════════════════════════════════════
// WRITER.TS — The Editorial AI Agent (Improved)
// ═══════════════════════════════════════════════════════════════
// Multi-phase pipeline:
//   1. SERP Research — Fetches top-ranking content for competitive intel
//   2. Content Generation — Claude writes with SERP context
//   3. Fact-Check Pass — Gemini Flash verifies claims
//   4. Quality Review — Reviewer framework validates output
//   5. Content Refresh — Can UPDATE existing content, not just create
//   6. Image Placeholder — Marks where images should be generated
//
// Solves:
//   - Writer no longer writes blind (SERP data fed in)
//   - Fact-checking step added
//   - Content quality validation via reviewer
//   - Dynamic internal links from content collection
//   - Content refresh capability (updateContent)
//
// Usage: npx tsx agents/writer.ts
// ═══════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import nicheConfig, { getSiteDomain } from '../niche.config';
import { REVIEW_TEMPLATES, runWithReview } from './reviewer';
import { assertLlmReady, callModel, printLlmError } from '../scripts/lib/llm';

// ── Types ────────────────────────────────────────────────────

interface ContentTopic {
  title: string;
  silo: string;
  targetKeyword: string;
  priority: number;
  outline: string[];
  estimatedVolume?: string;
}

interface ContentRefresh {
  keyword: string;
  url: string;
  currentPosition: number;
  contentAge?: number;
  freshness?: string;
  suggestions: string[];
}

interface ExecutionPlan {
  generatedAt: string;
  niche: string;
  entityGaps: { topic: string; suggestedSilo: string; suggestedTitle: string; priority: number }[];
  contentRefreshes: ContentRefresh[];
  newContentTopics: ContentTopic[];
}

// ── Configuration ────────────────────────────────────────────

const DATA_DIR = join(process.cwd(), 'data');
const PLAN_FILE = join(DATA_DIR, 'execution-plan.json');
const CONTENT_DIR = join(process.cwd(), 'src/content/posts');

// ── Call Claude ──────────────────────────────────────────────

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  return callModel<string>({ tier: 'heavy', task: 'write', system: systemPrompt, prompt: userPrompt, maxTokens: 8192, temperature: 0.6 });
}

// ── Call Gemini Flash (for fact-checking) ────────────────────

async function callGeminiFlash(prompt: string): Promise<string> {
  return callModel<string>({ tier: 'light', task: 'fact-check', prompt, maxTokens: 4096, temperature: 0.1 });
}

// ── Phase 1: SERP Research ───────────────────────────────────
// Uses GSC data + competitor intel to build competitive context

function gatherSerpContext(keyword: string): string {
  const context: string[] = [];

  // Read GSC data for this keyword
  const gscFile = join(DATA_DIR, 'gsc-intelligence.json');
  if (existsSync(gscFile)) {
    try {
      const gsc = JSON.parse(readFileSync(gscFile, 'utf-8'));
      const match = gsc.queries?.find(
        (q: any) => q.query.toLowerCase().includes(keyword.toLowerCase())
      );
      if (match) {
        context.push(`## GSC Data for "${keyword}"`);
        context.push(`- Current position: ${match.position.toFixed(1)}`);
        context.push(`- Impressions: ${match.impressions}`);
        context.push(`- CTR: ${(match.ctr * 100).toFixed(1)}%`);
        context.push('');
      }
    } catch { /* skip */ }
  }

  // Read competitor content topics
  const compFile = join(DATA_DIR, 'competitor-intel.json');
  if (existsSync(compFile)) {
    try {
      const comp = JSON.parse(readFileSync(compFile, 'utf-8'));
      const relevantTopics = comp.commonTopics?.filter(
        (t: string) => t.toLowerCase().includes(keyword.split(' ')[0].toLowerCase())
      );
      if (relevantTopics?.length > 0) {
        context.push('## Competitor Topics:');
        context.push(relevantTopics.slice(0, 10).map((t: string) => `- ${t}`).join('\n'));
        context.push('');
      }
    } catch { /* skip */ }
  }

  return context.join('\n');
}

// ── Discover existing internal links dynamically ─────────────

export function discoverInternalLinks(): { slug: string; title: string; category: string }[] {
  const links: { slug: string; title: string; category: string }[] = [];

  if (!existsSync(CONTENT_DIR)) return links;

  const files = readdirSync(CONTENT_DIR).filter(
    (f) => f.endsWith('.mdx') || f.endsWith('.md')
  );

  for (const file of files) {
    try {
      const content = readFileSync(join(CONTENT_DIR, file), 'utf-8');
      if (/^status:\s*["']?draft["']?\s*$/mi.test(content)) continue;
      const titleMatch = content.match(/^title:\s*"?([^"\n]+)"?/m);
      const catMatch = content.match(/^category:\s*"?([^"\n]+)"?/m);

      const slug = file.replace(/\.(mdx?|md)$/, '');
      links.push({
        slug,
        title: titleMatch?.[1]?.trim() || slug,
        category: catMatch?.[1]?.trim() || 'uncategorized',
      });
    } catch { /* skip */ }
  }

  return links;
}

// ── Phase 2: Fact-Check Pass ─────────────────────────────────

async function factCheck(content: string, keyword: string): Promise<string> {
  console.log('   🔍 Running fact-check pass (Gemini Flash)...');

  const prompt = `You are a fact-checker for expert content about "${keyword}" in the ${nicheConfig.id} niche.

Review the following content for factual accuracy. Flag any:
1. Incorrect numbers, statistics, or measurements
2. Outdated information
3. Misleading claims
4. Unsupported assertions

Content to review:
---
${content.substring(0, 6000)}
---

If everything is accurate, respond: "PASS: No factual issues found."
If issues found, respond with: "ISSUES FOUND:" followed by a numbered list of specific corrections.`;

  return await callGeminiFlash(prompt);
}

// ── Slugify ──────────────────────────────────────────────────

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 80);
}

// ── Build System Prompt ──────────────────────────────────────

export function buildSystemPrompt(internalLinks: { slug: string; title: string; category: string }[]): string {
  const linkList = internalLinks
    .slice(0, 15)
    .map((l) => `- [${l.title}](/posts/${l.slug}/) (${l.category})`)
    .join('\n');

  return `You are an expert content writer for "${nicheConfig.siteName}" (${getSiteDomain()}) — ${nicheConfig.nicheContext}

${nicheConfig.contentGuidelines}

STRUCTURE:
- Start with BLUF (Bottom Line Up Front) — 40-60 word summary answering the main question
- Use H2/H3 headings for clear hierarchy
- Include an FAQ section at the end (3-5 questions for Schema.org)
- Insert <ProductBox id="product-id" /> where product recommendations make sense
- Mark image placement with <!-- IMAGE: description of needed image -->

INTERNAL LINKS (use at least 3):
${linkList || '(No existing content yet — this will be the first article)'}

VOICE:
- Expert, direct, zero fluff
- Concrete numbers, specific parameters, real-world examples
- Every paragraph must provide Information Gain
- Write for someone who has read 10 articles on this topic already

EXTERNAL SOURCES:
- Cite at least 2 authoritative external sources with real URLs
- Include at least 1 original data point or unique insight

OUTPUT: Raw MDX only. No frontmatter. Start with BLUF.
TARGET: 1,800-2,200 words.`;
}

// ── Generate Frontmatter ─────────────────────────────────────

function generateFrontmatter(title: string, keyword: string, silo: string, slug: string): string {
  const today = new Date().toISOString().split('T')[0];

  return `---
title: "${title.replace(/"/g, '\\"')}"
description: "Complete expert guide to ${keyword}. Evidence-based advice, specific parameters, and real-world tips."
date: ${today}
author: "${nicheConfig.author.name}"
category: "${silo}"
tags:
  - "${keyword}"
image: "/assets/images/posts/${slug}.webp"
imageAlt: "${title}"
sidebarType: "default"
toc: true
comments: true
affiliateProducts: true
keyTakeaways: []
faq: []
atomicAnswer: ""
popularity: 0
featured: false
relatedSlugs: []
---

`;
}

// ── Write New Content ────────────────────────────────────────

async function writeNewContent(topic: ContentTopic, index: number): Promise<string | null> {
  const slug = slugify(topic.title);
  const outputPath = join(CONTENT_DIR, `${slug}.mdx`);

  if (existsSync(outputPath)) {
    console.log(`   ⏭️ Skipping "${topic.title}" — already exists`);
    return null;
  }

  console.log(`\n✍️ [${index}] Writing: "${topic.title}"`);

  // Phase 1: SERP research
  const serpContext = gatherSerpContext(topic.targetKeyword);
  const internalLinks = discoverInternalLinks();

  // Phase 2: Generate content with review loop
  const systemPrompt = buildSystemPrompt(internalLinks);

  const { result: content, review } = await runWithReview<string>(
    REVIEW_TEMPLATES.writer,
    async (feedback) => {
      const userPrompt = `Write a 2,000-word authoritative guide: "${topic.title}"

TARGET KEYWORD: "${topic.targetKeyword}"
ESTIMATED SEARCH VOLUME: ${topic.estimatedVolume || 'unknown'}

${topic.outline.length > 0 ? `OUTLINE:\n${topic.outline.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n` : ''}

COMPETITIVE INTELLIGENCE:
${serpContext || 'No SERP data available — write from expert knowledge.'}

${feedback ? `\nREVIEW FEEDBACK TO ADDRESS:\n${feedback}` : ''}`;

      const raw = await callClaude(systemPrompt, userPrompt);
      return { output: raw, rawText: raw };
    },
    `Keyword: ${topic.targetKeyword}, Silo: ${topic.silo}`
  );

  // Phase 3: Fact-check
  const factCheckResult = await factCheck(content, topic.targetKeyword);
  let finalContent = content;

  if (!factCheckResult.startsWith('PASS')) {
    console.log(`   ⚠️ Fact-check issues found. Requesting correction...`);
    // Re-generate with corrections
    finalContent = await callClaude(
      systemPrompt,
      `The following content has factual issues. Fix ONLY the issues listed, keep everything else:\n\nISSUES:\n${factCheckResult}\n\nORIGINAL CONTENT:\n${content}`
    );
  }

  // Write file
  const frontmatter = generateFrontmatter(topic.title, topic.targetKeyword, topic.silo, slug);
  writeFileSync(outputPath, frontmatter + finalContent);

  // Post-process (extract FAQ, atomicAnswer)
  postProcessContent(outputPath);

  console.log(`   ✅ Written: ${outputPath}`);
  console.log(`   📊 Review: ${review.passed ? 'PASSED' : 'FLAGGED'} (${review.score}/10)`);
  return slug;
}

// ── Refresh Existing Content ─────────────────────────────────

async function refreshContent(refresh: ContentRefresh): Promise<boolean> {
  // Find the content file
  const slug = refresh.url.replace(/^\/posts\//, '').replace(/\/$/, '');
  const filePath = join(CONTENT_DIR, `${slug}.mdx`);

  if (!existsSync(filePath)) {
    console.log(`   ⚠️ Cannot refresh — file not found: ${filePath}`);
    return false;
  }

  console.log(`\n🔄 Refreshing: "${slug}"`);
  console.log(`   Age: ${refresh.contentAge || 'unknown'} days | Freshness: ${refresh.freshness || 'unknown'}`);

  const existingContent = readFileSync(filePath, 'utf-8');

  // Split frontmatter from body
  const fmEnd = existingContent.indexOf('---', existingContent.indexOf('---') + 3) + 3;
  const frontmatter = existingContent.substring(0, fmEnd);
  const body = existingContent.substring(fmEnd).trim();

  const internalLinks = discoverInternalLinks();
  const systemPrompt = buildSystemPrompt(internalLinks);

  const refreshPrompt = `REFRESH this existing article. Keep what's good, improve what's weak.

KEYWORD: "${refresh.keyword}"
CURRENT POSITION: ${refresh.currentPosition}

SPECIFIC IMPROVEMENTS NEEDED:
${refresh.suggestions.map((s) => `- ${s}`).join('\n')}

EXISTING CONTENT:
---
${body.substring(0, 8000)}
---

RULES:
- Keep the same structure and headings where they're good
- Update any outdated information
- Add Information Gain — new insights not in the original
- Ensure BLUF is still at the top
- Ensure FAQ section exists
- Update lastModified date signal
- Keep word count 1,800-2,200`;

  const refreshed = await callClaude(systemPrompt, refreshPrompt);

  // Update the file with refreshed content + add lastModified
  const today = new Date().toISOString().split('T')[0];
  let updatedFrontmatter = frontmatter;
  if (!frontmatter.includes('lastModified:')) {
    updatedFrontmatter = frontmatter.replace('---\n\n', `lastModified: ${today}\n---\n\n`);
  } else {
    updatedFrontmatter = frontmatter.replace(/lastModified:.*/, `lastModified: ${today}`);
  }

  writeFileSync(filePath, updatedFrontmatter + '\n' + refreshed);
  console.log(`   ✅ Refreshed: ${filePath}`);
  return true;
}

// ── Post-process: Extract FAQ and atomicAnswer ───────────────

function postProcessContent(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');

  // Extract FAQ
  const faqRegex = /###?\s*(.*?\?)\s*\n\n([\s\S]*?)(?=\n###?\s|\n## |$)/g;
  const faqs: { question: string; answer: string }[] = [];
  const faqSection = content.match(/## Frequently Asked Questions[\s\S]*$/);
  if (faqSection) {
    let match;
    while ((match = faqRegex.exec(faqSection[0])) !== null) {
      const question = match[1].trim();
      const answer = match[2].trim().substring(0, 300);
      if (question.endsWith('?') && answer.length > 20) {
        faqs.push({ question, answer });
      }
    }
  }

  // Extract BLUF as atomicAnswer
  const bodyStart = content.indexOf('---', content.indexOf('---') + 3) + 3;
  const body = content.substring(bodyStart).trim();
  const firstParagraph = body.split('\n\n')[0]?.trim();
  const atomicAnswer = firstParagraph
    ? firstParagraph.substring(0, 280).replace(/"/g, '\\"')
    : '';

  let updated = content;
  if (atomicAnswer) {
    updated = updated.replace('atomicAnswer: ""', `atomicAnswer: "${atomicAnswer}"`);
  }
  if (faqs.length > 0) {
    const faqYaml = faqs
      .map(
        (faq) =>
          `  - question: "${faq.question.replace(/"/g, '\\"')}"\n    answer: "${faq.answer.replace(/"/g, '\\"')}"`
      )
      .join('\n');
    updated = updated.replace('faq: []', `faq:\n${faqYaml}`);
  }

  writeFileSync(filePath, updated);
}

// ── Main Execution ───────────────────────────────────────────

async function main() {
  console.log('\n✍️ GODFATHER EDITORIAL AGENT — Creating & refreshing content\n');
  console.log('═'.repeat(60));

  await assertLlmReady();

  if (!existsSync(PLAN_FILE)) {
    console.error('❌ No execution plan found. Run strategy agent first.');
    process.exit(1);
  }

  if (!existsSync(CONTENT_DIR)) mkdirSync(CONTENT_DIR, { recursive: true });

  const plan: ExecutionPlan = JSON.parse(readFileSync(PLAN_FILE, 'utf-8'));
  console.log(`📋 Plan loaded (${plan.generatedAt})`);

  // ── Content Refreshes First ────────────────────────────────
  const refreshes = plan.contentRefreshes || [];
  let refreshedCount = 0;
  if (refreshes.length > 0) {
    console.log(`\n🔄 Processing ${refreshes.length} content refreshes...\n`);
    for (const refresh of refreshes.slice(0, 2)) {
      const success = await refreshContent(refresh);
      if (success) refreshedCount++;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  // ── New Content ────────────────────────────────────────────
  const topics: ContentTopic[] = [
    ...plan.newContentTopics.sort((a, b) => b.priority - a.priority),
    ...plan.entityGaps
      .sort((a, b) => b.priority - a.priority)
      .map((g) => ({
        title: g.suggestedTitle,
        silo: g.suggestedSilo,
        targetKeyword: g.topic,
        priority: g.priority,
        outline: [],
      })),
  ];

  const maxPieces = Math.min(nicheConfig.scheduling.maxContentPerRun, topics.length);
  console.log(`\n✍️ Writing ${maxPieces} new content pieces...\n`);

  const written: string[] = [];
  for (let i = 0; i < maxPieces; i++) {
    const slug = await writeNewContent(topics[i], i + 1);
    if (slug) written.push(slug);
    if (i < maxPieces - 1) {
      console.log('   ⏳ Cooling down (5s)...');
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 EDITORIAL SUMMARY');
  console.log('═'.repeat(60));
  console.log(`   Content refreshed: ${refreshedCount}`);
  console.log(`   New pieces written: ${written.length}`);
  for (const slug of written) console.log(`     → src/content/posts/${slug}.mdx`);
  console.log('═'.repeat(60));
}

if (process.argv[1]?.endsWith('writer.ts')) {
  main().catch((error) => { printLlmError(error); process.exitCode = 1; });
}
