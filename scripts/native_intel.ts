import Hero from '@ulixee/hero';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import nicheConfig from '../niche.config';

/**
 * GODFATHER SEO ENGINE — Ulixee Hero Intelligence Agent
 *
 * Uses Ulixee Hero to natively bypass bot detection and scrape Google PAA.
 */

const TOPIC = process.argv[2] || nicheConfig.seedKeywords[0] || nicheConfig.nicheNoun;

async function runHeroIntelligence() {
  console.log(`\n🦸‍♂️ Launching Hero Intelligence for: "${TOPIC}"...`);

  const hero = new Hero();

  try {
    console.log(`🌐 Navigating to Google natively...`);
    await hero.goto(`https://www.google.com/search?q=${encodeURIComponent(TOPIC)}`);
    await hero.waitForPaintingStable();

    console.log(`📜 Scrolling to trigger lazy-loaded questions...`);
    // Scroll down using JS
    await hero.getJsValue('window.scrollBy(0, 1000)');
    await new Promise(r => setTimeout(r, 2000));
    await hero.getJsValue('window.scrollBy(0, 1000)');
    await new Promise(r => setTimeout(r, 2000));

    console.log(`🔍 Scouring the page for questions...`);

    // In Hero, we can query the DOM directly
    const questions: string[] = [];
    const elements = await hero.document.querySelectorAll('div[data-q], .wQiw9c, .related-question-pair, .iDjc9e');

    for (const el of elements) {
      const qText = await el.getAttribute('data-q') || await el.textContent;
      if (qText && qText.length > 10) {
        questions.push(qText);
      }
    }

    // Deduplicate
    const uniqueQuestions = [...new Set(questions)];

    if (uniqueQuestions.length === 0) {
      console.log('⚠️  No "People Also Ask" questions found. Google might have changed the layout or we are still blocked.');

      // Save debug screenshot
      const debugDir = join(process.cwd(), 'data/research/intelligence');
      if (!existsSync(debugDir)) mkdirSync(debugDir, { recursive: true });
      const screenshotPath = join(debugDir, 'hero_debug.jpeg');

      // Hero saves JPEGs natively
      const buffer = await hero.activeTab.takeScreenshot({ format: 'jpeg' });
      writeFileSync(screenshotPath, buffer);
      console.log(`📸 Saved debug screenshot to: ${screenshotPath}`);

      await hero.close();
      return;
    }

    console.log(`\n✅ FOUND NATIVELY VIA HERO: ${uniqueQuestions.length} questions:\n`);

    const reports = uniqueQuestions.map(q => {
      console.log(`📄 Question: "${q}"`);
      return { question: q, timestamp: new Date().toISOString() };
    });

    const filename = `hero_intel_${TOPIC.replace(/\s+/g, '_').toLowerCase()}.json`;
    const dir = join(process.cwd(), 'data/research/intelligence');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    writeFileSync(join(dir, filename), JSON.stringify(reports, null, 2));
    console.log(`\n💾 Saved to: data/research/intelligence/${filename}\n`);

  } catch (err) {
    console.error('❌ Hero scan failed:', err);
  } finally {
    await hero.close();
  }
}

runHeroIntelligence();
