// ═══════════════════════════════════════════════════════════════
// SOCIAL-AUDITOR.TS — Community Engagement Intelligence Agent
// ═══════════════════════════════════════════════════════════════
// Pipeline:
//   1. Discovers relevant subreddits for the niche
//   2. Reads recent posts/comments via Reddit JSON API
//   3. Finds questions that can be answered from our knowledgebase
//   4. Generates human-sounding response suggestions
//   5. ALL output is for HUMAN REVIEW — nothing is auto-posted
//
// This is designed to seed community presence and referential
// traffic by genuinely helping people with our expertise.
//
// NOTE: This could evolve into a separate microservice called
// via API for multi-niche management. For now, it's a pipeline
// step in the git repo.
//
// Usage: npx tsx agents/social-auditor.ts
// ═══════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import nicheConfig, { getSiteDomain } from '../niche.config';
import { assertLlmReady, callModel, printLlmError } from '../scripts/lib/llm';

// ── Types ────────────────────────────────────────────────────

interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  selftext: string;
  url: string;
  permalink: string;
  score: number;
  numComments: number;
  created: number;
}

interface ResponseSuggestion {
  threadId: string;
  subreddit: string;
  threadTitle: string;
  threadUrl: string;
  questionContext: string;
  suggestedResponse: string;
  relevantArticle: { title: string; url: string } | null;
  confidence: number; // 1-10 how well our knowledge answers this
  status: 'PENDING_HUMAN_REVIEW';
}

interface SocialAuditReport {
  generatedAt: string;
  status: 'PENDING_HUMAN_REVIEW';
  note: string;
  subredditsScanned: string[];
  postsAnalyzed: number;
  responseSuggestions: ResponseSuggestion[];
  subredditDiscovery: {
    subreddit: string;
    relevance: number;
    reason: string;
  }[];
}

// ── Configuration ────────────────────────────────────────────

const DATA_DIR = join(process.cwd(), 'data');
const CONTENT_DIR = join(process.cwd(), 'src/content/posts');
const OUTPUT_FILE = join(DATA_DIR, 'social-audit-suggestions.json');

// ── Reddit JSON API (no auth needed for public data) ─────────

async function fetchSubredditPosts(subreddit: string, limit: number = 25): Promise<RedditPost[]> {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}&raw_json=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NicheGuideBot/1.0 (educational research)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(`   ⚠️ Could not fetch r/${subreddit} (${response.status})`);
      return [];
    }

    const data = await response.json() as { data?: { children?: Array<{ data: any }> } };
    return (data.data?.children || []).map((child: any) => ({
      id: child.data.id,
      subreddit: child.data.subreddit,
      title: child.data.title,
      selftext: child.data.selftext || '',
      url: child.data.url,
      permalink: `https://reddit.com${child.data.permalink}`,
      score: child.data.score,
      numComments: child.data.num_comments,
      created: child.data.created_utc,
    }));
  } catch (err) {
    console.warn(`   ⚠️ Error fetching r/${subreddit}:`, err);
    return [];
  }
}

// ── Build Knowledgebase Context ──────────────────────────────

function buildKnowledgebase(): string {
  const articles: { slug: string; title: string; summary: string }[] = [];

  if (!existsSync(CONTENT_DIR)) return 'No articles available yet.';

  const files = readdirSync(CONTENT_DIR).filter(
    (f) => f.endsWith('.mdx') || f.endsWith('.md')
  );

  for (const file of files) {
    try {
      const content = readFileSync(join(CONTENT_DIR, file), 'utf-8');
      const titleMatch = content.match(/^title:\s*"?([^"\n]+)"?/m);
      const descMatch = content.match(/^description:\s*"?([^"\n]+)"?/m);
      const slug = file.replace(/\.(mdx?|md)$/, '');

      articles.push({
        slug,
        title: titleMatch?.[1]?.trim() || slug,
        summary: descMatch?.[1]?.trim() || '',
      });
    } catch { /* skip */ }
  }

  if (articles.length === 0) return 'No articles available yet.';

  return articles
    .map((a) => `- "${a.title}" (${nicheConfig.url}/posts/${a.slug}/): ${a.summary}`)
    .join('\n');
}

// ── Call Gemini ──────────────────────────────────────────────

async function callGemini(prompt: string): Promise<string> {
  return JSON.stringify(await callModel<unknown>({ tier: 'light', task: 'analyze', prompt, temperature: 0.4, maxTokens: 8192, json: true }));
}

// ── Analyze Posts and Generate Suggestions ───────────────────

async function analyzePostsForOpportunities(
  posts: RedditPost[],
  knowledgebase: string
): Promise<ResponseSuggestion[]> {
  // Filter for question-like posts
  const questionPosts = posts.filter((p) => {
    const text = (p.title + ' ' + p.selftext).toLowerCase();
    return (
      text.includes('?') ||
      text.includes('help') ||
      text.includes('advice') ||
      text.includes('recommend') ||
      text.includes('how do') ||
      text.includes('what is') ||
      text.includes('best way')
    );
  });

  if (questionPosts.length === 0) return [];

  const prompt = `You are analyzing Reddit posts to find questions that can be genuinely answered using knowledge from "${nicheConfig.siteName}".

CRITICAL RULES:
- Responses must sound HUMAN — like a helpful community member, NOT a bot
- NEVER start with "As an expert..." or "According to our site..."
- Lead with the helpful answer FIRST, then optionally mention a relevant link
- Links should feel natural: "I found a good breakdown on this at [url]" or "there's a detailed guide that covers this"
- Only suggest responses where we can GENUINELY help — skip if our knowledge doesn't match
- No spam patterns. Each response should be unique in style and approach.

OUR KNOWLEDGEBASE:
${knowledgebase}

REDDIT POSTS TO ANALYZE:
${questionPosts.slice(0, 15).map((p) => `[${p.id}] r/${p.subreddit}: "${p.title}"\n${p.selftext.substring(0, 200)}\nURL: ${p.permalink}`).join('\n\n')}

OUTPUT JSON array:
[{
  "threadId": "string",
  "questionContext": "what they're asking in plain terms",
  "suggestedResponse": "the full response text (human-sounding, helpful first, link optional)",
  "relevantArticleSlug": "slug of our article or null if no direct match",
  "confidence": number (1-10)
}]

Only include responses with confidence >= 6.`;

  try {
    const raw = await callGemini(prompt);
    const parsed = JSON.parse(raw);

    return parsed
      .filter((s: any) => s.confidence >= 6)
      .map((s: any) => {
        const post = questionPosts.find((p) => p.id === s.threadId);
        return {
          threadId: s.threadId,
          subreddit: post?.subreddit || 'unknown',
          threadTitle: post?.title || '',
          threadUrl: post?.permalink || '',
          questionContext: s.questionContext,
          suggestedResponse: s.suggestedResponse,
          relevantArticle: s.relevantArticleSlug
            ? {
                title: s.relevantArticleSlug,
                url: `${nicheConfig.url}/posts/${s.relevantArticleSlug}/`,
              }
            : null,
          confidence: s.confidence,
          status: 'PENDING_HUMAN_REVIEW' as const,
        };
      });
  } catch (err) {
    console.warn('   ⚠️ Failed to analyze posts:', err);
    return [];
  }
}

// ── Main Execution ───────────────────────────────────────────

async function main() {
  console.log('\n📱 GODFATHER SOCIAL AUDITOR — Community Intelligence\n');
  console.log('═'.repeat(60));

  await assertLlmReady();

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  // Get subreddits from config
  const subreddits = nicheConfig.redditSubreddits;
  if (subreddits.length === 0) {
    console.log('⚠️ No subreddits configured in niche.config.ts. Discovering...\n');

    // Auto-discover subreddits via Gemini
    const discoveryPrompt = `Suggest 5-10 Reddit subreddits relevant to: "${nicheConfig.nicheContext}"

OUTPUT JSON array: [{ "subreddit": "name_without_r/", "relevance": 1-10, "reason": "why" }]`;

    try {
      const raw = await callGemini(discoveryPrompt);
      const discovered = JSON.parse(raw);
      console.log('   Discovered subreddits:');
      for (const s of discovered) {
        console.log(`   - r/${s.subreddit} (relevance: ${s.relevance}) — ${s.reason}`);
      }
      console.log('\n   Add these to niche.config.ts redditSubreddits to enable scanning.');
    } catch {
      console.warn('   ⚠️ Discovery failed');
    }
    return;
  }

  // Build knowledgebase
  const knowledgebase = buildKnowledgebase();
  console.log('📚 Knowledgebase built\n');

  // Scan subreddits
  const allSuggestions: ResponseSuggestion[] = [];
  let totalPosts = 0;

  for (const sub of subreddits) {
    console.log(`📡 Scanning r/${sub}...`);
    const posts = await fetchSubredditPosts(sub);
    totalPosts += posts.length;
    console.log(`   Found ${posts.length} recent posts`);

    if (posts.length > 0) {
      const suggestions = await analyzePostsForOpportunities(posts, knowledgebase);
      allSuggestions.push(...suggestions);
      console.log(`   ${suggestions.length} response opportunities found`);
    }

    await new Promise((r) => setTimeout(r, 2000)); // Rate limit
  }

  // Write report
  const report: SocialAuditReport = {
    generatedAt: new Date().toISOString(),
    status: 'PENDING_HUMAN_REVIEW',
    note: '⚠️ ALL responses are SUGGESTIONS. Nothing has been posted. Review each response, personalize, and post manually.',
    subredditsScanned: subreddits,
    postsAnalyzed: totalPosts,
    responseSuggestions: allSuggestions,
    subredditDiscovery: [],
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
  console.log(`\n📄 Suggestions written: ${OUTPUT_FILE}`);
  console.log(`⚠️ ALL items require HUMAN REVIEW before posting.`);

  console.log('\n' + '═'.repeat(60));
  console.log(`   Subreddits scanned:     ${subreddits.length}`);
  console.log(`   Posts analyzed:         ${totalPosts}`);
  console.log(`   Response suggestions:   ${allSuggestions.length}`);
  console.log('═'.repeat(60));
}

main().catch((error) => { printLlmError(error); process.exitCode = 1; });
