import { execSync } from 'child_process';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import nicheConfig from '../niche.config';

/**
 * GODFATHER SEO ENGINE — Master Auto Pipeline
 *
 * Runs the entire Intelligence -> Index -> Prompt generation flow
 * with a single command.
 */

const TOPIC = process.argv[2];

if (!TOPIC) {
  console.error(`❌ Please provide a topic: npm run auto "${nicheConfig.seedKeywords[0] || nicheConfig.nicheNoun}"`);
  process.exit(1);
}

console.log(`\n======================================================`);
console.log(`🚀 STARTING AUTONOMOUS PIPELINE FOR: "${TOPIC}"`);
console.log(`======================================================\n`);

try {
  // Step 1: Run Native Intelligence (Ulixee Hero)
  console.log(`[1/3] 🕵️‍♂️ Running Native Scraper...`);
  execSync(`npx tsx scripts/native_intel.ts "${TOPIC}"`, { stdio: 'inherit' });

  // Determine the filename that was generated
  const filename = `hero_intel_${TOPIC.replace(/\s+/g, '_').toLowerCase()}.json`;
  const filePath = join(process.cwd(), 'data/research/intelligence', filename);

  if (!existsSync(filePath)) {
    console.error(`\n❌ Pipeline Halted: Could not find the generated data file. Hero may have been blocked.`);
    process.exit(1);
  }

  // Step 2: Index the questions
  console.log(`\n[2/3] 🗂️ Indexing Results...`);
  execSync(`npx tsx scripts/paa_strategist.ts index "${filePath}"`, { stdio: 'inherit' });

  // Step 3: Generate Prompts
  console.log(`\n[3/3] 🎯 Generating Prompts for all questions...`);
  const data = JSON.parse(readFileSync(filePath, 'utf8'));

  for (const item of data) {
    const q = item.question;
    execSync(`npx tsx scripts/paa_strategist.ts prompt "${q}"`, { stdio: 'inherit' });
  }

  console.log(`\n======================================================`);
  console.log(`✅ PIPELINE COMPLETE!`);
  console.log(`Your AI Prompts are waiting in: data/plans/prompts/`);
  console.log(`======================================================\n`);

} catch (err) {
  console.error(`\n❌ Pipeline crashed:`, err);
}
