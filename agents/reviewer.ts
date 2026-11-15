// ═══════════════════════════════════════════════════════════════
// REVIEWER.TS — Universal Quality Review Framework
// ═══════════════════════════════════════════════════════════════
// Every agent's output passes through this reviewer before being
// accepted. Uses a separate AI call to audit work against a
// review template. Has a max iteration cap to prevent loops.
//
// Usage: import { reviewWork } from './reviewer';
// ═══════════════════════════════════════════════════════════════

import nicheConfig from '../niche.config';
import { callModel } from '../scripts/lib/llm';

// ── Types ────────────────────────────────────────────────────

export interface ReviewTemplate {
  agentName: string;
  /** What the reviewer checks for */
  criteria: string[];
  /** How the output must be formatted */
  deliveryFormat: string;
  /** Pass threshold — minimum score (1-10) to accept */
  passThreshold: number;
}

export interface ReviewResult {
  passed: boolean;
  score: number;
  iteration: number;
  maxIterations: number;
  feedback: string;
  suggestions: string[];
  flaggedForHuman: boolean;
  reviewedAt: string;
}

// ── Pre-built Review Templates ───────────────────────────────

export const REVIEW_TEMPLATES: Record<string, ReviewTemplate> = {
  strategy: {
    agentName: 'Strategy Agent',
    criteria: [
      'Execution plan contains actionable items with clear priorities (1-10)',
      'Keyword suggestions include estimated search volume context',
      'Content refresh candidates include specific improvement suggestions',
      'Entity gaps reference real competitor data',
      'Technical fixes are specific and implementable',
      'All suggestions are within the defined silo structure',
      'No suggestions to buy backlinks or keyword-stuff',
      'Plan is realistic for a single weekly sprint (max 3-5 content pieces)',
    ],
    deliveryFormat: 'Valid JSON matching the ExecutionPlan interface with all required fields populated',
    passThreshold: 7,
  },

  writer: {
    agentName: 'Writer Agent',
    criteria: [
      'Content starts with BLUF (Bottom Line Up Front) — 40-60 word summary',
      'Every H2 section provides genuine Information Gain',
      'Contains at least 3 internal links to other site content',
      'Contains at least 2 external authoritative source citations',
      'No filler phrases ("In this article...", "Let\'s dive in...")',
      'Specific numbers, parameters, and real-world examples used',
      'FAQ section present with 3-5 questions',
      'Word count between 1,800-2,200 words',
      'Content is factually accurate and not hallucinated',
      'Voice is expert, direct, and zero-fluff',
    ],
    deliveryFormat: 'Raw MDX content without frontmatter. Starts with BLUF paragraph, ends with FAQ section.',
    passThreshold: 7,
  },

  outreach: {
    agentName: 'Outreach Agent',
    criteria: [
      'Targets are relevant to the niche',
      'Pitch templates are personalized and non-spammy',
      'No paid link schemes, PBNs, or link exchanges suggested',
      'Linkable asset ideas are genuinely valuable',
      'All suggestions comply with Google Link Spam policies',
      'Contact information is presented as suggestions, NOT auto-sent',
    ],
    deliveryFormat: 'JSON with targets[], pitchTemplates[], contentAssets[] — all marked as SUGGESTIONS for human review.',
    passThreshold: 6,
  },

  socialAuditor: {
    agentName: 'Social Auditor',
    criteria: [
      'Identified questions are genuinely answerable from our knowledgebase',
      'Suggested responses sound human and natural, not bot-like',
      'Responses include genuinely helpful information before any link',
      'Links are contextually relevant and add value',
      'No spam patterns, no repetitive formatting across suggestions',
      'Thread context is understood — response fits the conversation',
    ],
    deliveryFormat: 'JSON array of response suggestions with thread context, proposed text, and relevant article link.',
    passThreshold: 7,
  },
};

// ── Call the LIGHT tier for review ───────────────────────────

async function callGeminiReview(prompt: string): Promise<string> {
  const result = await callModel<unknown>({
    tier: 'light',
    task: 'review',
    prompt,
    temperature: 0.2,
    maxTokens: 4096,
    json: true,
  });
  return JSON.stringify(result);
}

// ── The Review Function ──────────────────────────────────────

/**
 * Reviews an agent's work output against a template.
 * Returns a ReviewResult with pass/fail, score, and feedback.
 *
 * @param template - The review template to use
 * @param workOutput - The raw output from the agent
 * @param context - Additional context (e.g., the original prompt, niche info)
 * @param iteration - Current iteration number (starts at 1)
 */
export async function reviewWork(
  template: ReviewTemplate,
  workOutput: string,
  context: string = '',
  iteration: number = 1
): Promise<ReviewResult> {
  const maxIterations = nicheConfig.scheduling.maxReviewIterations;

  const reviewPrompt = `You are a Senior Quality Reviewer for an AI agent pipeline. You are reviewing the output of the "${template.agentName}".

REVIEW CRITERIA (score each 1-10):
${template.criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

REQUIRED DELIVERY FORMAT:
${template.deliveryFormat}

NICHE CONTEXT:
- Site: ${nicheConfig.siteName}
- Niche: ${nicheConfig.nicheContext}

${context ? `ADDITIONAL CONTEXT:\n${context}\n` : ''}

AGENT OUTPUT TO REVIEW:
---
${workOutput.substring(0, 12000)}
---

OUTPUT a JSON object:
{
  "overallScore": number (1-10, weighted average of criteria scores),
  "criteriaScores": [{ "criterion": "string", "score": number, "note": "string" }],
  "passed": boolean (true if overallScore >= ${template.passThreshold}),
  "feedback": "string (2-3 sentence summary of quality)",
  "suggestions": ["specific improvement 1", "specific improvement 2"],
  "criticalIssues": ["any blocking issues that must be fixed"]
}`;

  try {
    const raw = await callGeminiReview(reviewPrompt);
    const parsed = JSON.parse(raw);

    const passed = parsed.overallScore >= template.passThreshold;
    const flaggedForHuman = iteration >= maxIterations && !passed;

    if (flaggedForHuman) {
      console.warn(
        `⚠️ ${template.agentName} hit max review iterations (${maxIterations}) without passing. ` +
        `Flagged for human review. Score: ${parsed.overallScore}/${template.passThreshold} required.`
      );
      console.warn(
        `💡 SUGGESTION: Improve the ${template.agentName}'s prompt or workflow to reduce review iterations.`
      );
    }

    return {
      passed,
      score: parsed.overallScore,
      iteration,
      maxIterations,
      feedback: parsed.feedback || 'No feedback provided',
      suggestions: parsed.suggestions || [],
      flaggedForHuman,
      reviewedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`❌ Review parsing failed for ${template.agentName}:`, err);
    // Review failure must never silently approve publication.
    return {
      passed: false,
      score: 0,
      iteration,
      maxIterations,
      feedback: 'Review system error — work passed by default. Manual review recommended.',
      suggestions: ['Review system encountered an error. Please manually verify this output.'],
      flaggedForHuman: true,
      reviewedAt: new Date().toISOString(),
    };
  }
}

/**
 * Helper: Run a work function with review loop.
 * Calls the work function, reviews it, and re-calls if needed up to maxIterations.
 */
export async function runWithReview<T>(
  template: ReviewTemplate,
  workFn: (feedback?: string) => Promise<{ output: T; rawText: string }>,
  context: string = ''
): Promise<{ result: T; review: ReviewResult }> {
  const maxIter = nicheConfig.scheduling.maxReviewIterations;
  let lastFeedback: string | undefined;
  let lastResult: { output: T; rawText: string } | null = null;
  let lastReview: ReviewResult | null = null;

  for (let i = 1; i <= maxIter; i++) {
    console.log(`\n🔄 ${template.agentName} — Iteration ${i}/${maxIter}`);

    const result = await workFn(lastFeedback);
    lastResult = result;

    const review = await reviewWork(template, result.rawText, context, i);
    lastReview = review;

    console.log(`   📊 Review score: ${review.score}/10 (need ${template.passThreshold})`);

    if (review.passed) {
      console.log(`   ✅ Passed on iteration ${i}`);
      return { result: result.output, review };
    }

    console.log(`   ❌ Did not pass. Feedback: ${review.feedback}`);
    lastFeedback = `PREVIOUS REVIEW FEEDBACK (iteration ${i}):\n` +
      `Score: ${review.score}/10\n` +
      `Feedback: ${review.feedback}\n` +
      `Suggestions:\n${review.suggestions.map(s => `- ${s}`).join('\n')}`;
  }

  console.warn(`⚠️ ${template.agentName} exhausted all ${maxIter} iterations. Flagging for human review.`);
  return { result: lastResult!.output, review: lastReview! };
}
