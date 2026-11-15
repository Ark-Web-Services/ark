import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import nicheConfig from '../niche.config';

/**
 * GODFATHER SEO ENGINE — PAA Strategist
 *
 * 1. Indexes extracted questions to prevent duplicates.
 * 2. Generates LLM writing & image prompts for content creation.
 * 3. Suggests "Auxiliary" deep-dives.
 */

const args = process.argv.slice(2);
const command = args[0]; // 'index', 'prompt', 'auxiliary'
const target = args.slice(1).join(' ');

const INDEX_FILE = join(process.cwd(), 'data/research/paa_index.json');

function loadIndex() {
  if (existsSync(INDEX_FILE)) {
    return JSON.parse(readFileSync(INDEX_FILE, 'utf8'));
  }
  return {};
}

function saveIndex(index: any) {
  const dir = join(process.cwd(), 'data/research');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
}

function indexNewQuestions(filePath: string) {
  if (!existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return;
  }

  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const index = loadIndex();
  let added = 0;

  for (const item of data) {
    const q = item.question;
    if (!index[q]) {
      index[q] = {
        status: 'pending',
        discovered_at: new Date().toISOString(),
        source_file: filePath
      };
      added++;
    }
  }

  saveIndex(index);
  console.log(`✅ Added ${added} new questions to the Master PAA Index.`);
  console.log(`📁 Index located at: ${INDEX_FILE}`);
}

function generatePrompt(question: string) {
  const index = loadIndex();

  if (!index[question]) {
    console.log(`⚠️ Question not in index. Adding it now...`);
    index[question] = { status: 'pending', discovered_at: new Date().toISOString() };
  }

  const prompt = `
You are an expert SEO writer for ${nicheConfig.siteName}, an authority site about ${nicheConfig.nicheNoun}.
Site context: ${nicheConfig.nicheContext}
Editorial guidance: ${nicheConfig.contentGuidelines}
Your task is to write a highly authoritative, "Godfather" level article answering the following question:

QUESTION: "${question}"

REQUIREMENTS:
1. DIRECT ANSWER: Start with a clear, bolded 2-3 sentence summary that answers the question immediately (for Google AI Snippet capture).
2. DEEP DIVE: Explain the 'Why'. Provide evidence-based reasoning appropriate to ${nicheConfig.nicheNoun}.
3. ACTIONABLE ADVICE: Give the reader step-by-step instructions or a checklist.
4. FORMATTING: Use Markdown, H2/H3 tags, bullet points, and short paragraphs.

VISUAL ASSETS REQUIRED (Provide these at the bottom of the article):
Please generate 2 Image Prompts that I can feed into Midjourney/DALL-E to create visuals for this article.
- Image 1 (Blog Header): A photorealistic, high-quality editorial image relating to the topic.
- Image 2 (Pinterest Pin): A vertical graphic concept describing the layout of an infographic for this topic.
  `;

  const outDir = join(process.cwd(), 'data/plans/prompts');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const filename = `prompt_${question.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
  writeFileSync(join(outDir, filename), prompt.trim());

  index[question].status = 'prompt_generated';
  saveIndex(index);

  console.log(`\n🎯 PROMPT GENERATED:`);
  console.log(`Saved to: data/plans/prompts/${filename}`);
  console.log(`Status updated to 'prompt_generated' in the Master Index.`);
}

function showAuxiliary(question: string) {
  console.log(`\n🕵️‍♂️ AUXILIARY DEEP DIVE REQUIRED`);
  console.log(`To get deeper "Tier 2" questions branching off this topic, run the Native Scraper on the question itself:`);
  console.log(`\n👉 npm run intelligence "${question}"\n`);
}

if (!command) {
  console.log(`
Godfather PAA Strategist

Commands:
  npm run strategist index <path_to_json>   - Add scraped questions to Master Index
  npm run strategist prompt "<question>"    - Generate article/image prompt for AI
  npm run strategist aux "<question>"       - Get command for Tier 2 deep dive
  `);
} else if (command === 'index') {
  indexNewQuestions(target);
} else if (command === 'prompt') {
  generatePrompt(target);
} else if (command === 'aux') {
  showAuxiliary(target);
}
