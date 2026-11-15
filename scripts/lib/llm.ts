// ═══════════════════════════════════════════════════════════════
// LLM.TS — Shared model client and request budget (self-hosted first)
// ═══════════════════════════════════════════════════════════════

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type LlmProvider = 'ollama' | 'claude-cli' | 'codex-cli' | 'replicate' | 'gemini' | 'anthropic';

/**
 * Subscription-backed agents, driven through their official CLIs
 * (`claude -p`, `codex exec`) — locally or over SSH on another machine.
 *
 * They are NOT paid per-token APIs, so they sit outside the LLM_ALLOW_PAID gate
 * and may run unattended. They exist for resilience: the self-hosted Ollama box
 * was unreachable at the nightly run for 8 of 14 nights in Sep/Oct and every
 * night from 2026-10-18 to 11-03, which left the weekly analysis stalled for
 * over two weeks with nothing to fall back to.
 *
 * They do draw on subscription usage limits, which are finite (the account hit
 * 98% of its weekly limit on 2026-10-02), so they come AFTER Ollama in the
 * order, never before it.
 */
const SUBSCRIPTION_PROVIDERS = new Set<LlmProvider>(['claude-cli', 'codex-cli']);
const ALL_PROVIDERS: LlmProvider[] = ['ollama', 'claude-cli', 'codex-cli', 'replicate', 'gemini', 'anthropic'];
/** Allowed without LLM_ALLOW_PAID: no per-call charge. */
function isUnmetered(provider: LlmProvider): boolean {
  return provider === 'ollama' || SUBSCRIPTION_PROVIDERS.has(provider);
}
export type LlmTier = 'light' | 'heavy';
export type LlmTask = 'write' | 'analyze' | 'fact-check' | 'review';

export interface CallModelOptions<T = string> {
  provider?: LlmProvider;
  tier?: LlmTier;
  task?: LlmTask;
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
  /**
   * JSON Schema for the expected output. Providers that support constrained
   * decoding (Ollama's `format`) generate only output matching it, which makes
   * malformed JSON impossible rather than merely repairable. Others ignore it
   * and rely on the prompt plus `validate`.
   */
  schema?: Record<string, unknown>;
  validate?: (value: unknown) => value is T;
}

export interface ReplicatePrediction<T = unknown> {
  id?: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: T;
  error?: string | null;
  metrics?: { predict_time?: number };
  urls?: { get?: string; cancel?: string };
}

export interface LlmRunStats {
  requests: number;
  maxRequests: number;
  logicalCalls: number;
  predictSeconds: number;
  estimatedCostUsd: number;
  byTier: Record<LlmTier, number>;
  byProvider: Record<LlmProvider, number>;
}

export class LlmConfigurationError extends Error {
  override name = 'LlmConfigurationError';
}

export class LlmBudgetError extends Error {
  override name = 'LlmBudgetError';
}

// Unattended runs stay local even when Ollama is down. Paid providers require
// an explicit per-run provider choice after review of the escalation queue.
const DEFAULT_PROVIDER_ORDER: LlmProvider[] = ['ollama'];
// 500/502 added: Replicate intermittently 500s on cold model routing, and a
// 429 seen in Drone confirmed the account's 6 req/min, burst 1 limit is real.
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504, 529]);
const POLL_TIMEOUT_MS = Math.max(60_000, Number(process.env.LLM_POLL_TIMEOUT_MS || 600_000));
// The 10s floor exists for Replicate's 6 req/min, burst 1 account limit. A
// self-hosted box has no such limit, and applying the floor there wasted 10s
// between every batched Stage 1 call for no reason.
const MIN_INTERVAL_MS = Math.max(10_000, Number(process.env.LLM_MIN_INTERVAL_MS || 10_000));
const LOCAL_MIN_INTERVAL_MS = Math.max(0, Number(process.env.OLLAMA_MIN_INTERVAL_MS || 0));
function minIntervalFor(provider: LlmProvider): number {
  return isUnmetered(provider) ? LOCAL_MIN_INTERVAL_MS : MIN_INTERVAL_MS;
}
const MAX_REQUESTS = Math.max(1, Number(process.env.LLM_MAX_CALLS_PER_RUN || 12));
const MAX_ATTEMPTS = Math.max(5, Number(process.env.LLM_MAX_RETRY_ATTEMPTS || 8));
const runStartedAt = Date.now();

let requestQueue: Promise<void> = Promise.resolve();
let lastRequestStartedAt = 0;
let requestCount = 0;
let logicalCallCount = 0;
let predictSeconds = 0;
let estimatedCostUsd = 0;
const byTier: Record<LlmTier, number> = { light: 0, heavy: 0 };
const byProvider: Record<LlmProvider, number> = { ollama: 0, 'claude-cli': 0, 'codex-cli': 0, replicate: 0, gemini: 0, anthropic: 0 };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanJson(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
}

// Models sometimes wrap JSON in prose, or emit a trailing sentence after the
// closing brace. Scan for the outermost balanced object/array, ignoring braces
// that appear inside string literals.
function extractJsonBlock(text: string): string | null {
  const cleaned = cleanJson(text);
  const start = cleaned.search(/[{[]/);
  if (start < 0) return null;
  const opener = cleaned[start];
  const closer = opener === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === opener) depth += 1;
    else if (ch === closer) {
      depth -= 1;
      if (depth === 0) return cleaned.slice(start, i + 1);
    }
  }
  return null;
}

function parseJsonLoosely(text: string): unknown {
  const candidates = [cleanJson(text), extractJsonBlock(text)].filter(Boolean) as string[];
  let lastError: Error | null = null;
  for (const candidate of candidates) {
    try { return JSON.parse(candidate); } catch (error) { lastError = error as Error; }
    // Trailing commas are the single most common model JSON defect.
    try { return JSON.parse(candidate.replace(/,\s*([}\]])/g, '$1')); } catch (error) { lastError = error as Error; }
  }
  throw lastError ?? new Error('no JSON candidate found');
}

function tierFor(options: CallModelOptions<unknown>): LlmTier {
  return options.tier ?? (options.task === 'write' || options.task === 'analyze' ? 'heavy' : 'light');
}

function modelFor(tier: LlmTier): string {
  return tier === 'heavy'
    ? (process.env.LLM_MODEL_HEAVY || 'anthropic/claude-4.5-sonnet')
    : (process.env.LLM_MODEL_LIGHT || 'anthropic/claude-4.5-haiku');
}

/**
 * Provider order, optionally per tier.
 *
 * Tier-specific order exists because the two tiers have genuinely different
 * requirements. Stage 1 labelling is mechanical: a local model does it in 26s
 * for nothing. Stage 2 synthesis is analytical, and a measured comparison had
 * the local 35B produce 3 community topics against Sonnet's 6 and a third the
 * evidence detail. Running light locally and heavy hosted is a sensible
 * middle, and needs this to be expressible:
 *
 *   LLM_PROVIDER_ORDER_LIGHT=ollama
 *   LLM_PROVIDER_ORDER_HEAVY=replicate,ollama
 */
function parseOrder(raw: string | undefined): LlmProvider[] {
  const configured = (raw || '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
  const valid = configured.filter((value): value is LlmProvider => ALL_PROVIDERS.includes(value as LlmProvider));
  return [...new Set(valid)];
}

function providerOrder(tier?: LlmTier): LlmProvider[] {
  const perTier = tier === 'heavy' ? process.env.LLM_PROVIDER_ORDER_HEAVY
    : tier === 'light' ? process.env.LLM_PROVIDER_ORDER_LIGHT
    : undefined;
  const scoped = parseOrder(perTier);
  const global = parseOrder(process.env.LLM_PROVIDER_ORDER);
  const order = scoped.length ? scoped : global.length ? global : DEFAULT_PROVIDER_ORDER;
  // Paid APIs still need an explicit, reviewed LLM_ALLOW_PAID=1 (2026-10-03
  // policy). Ollama and the subscription CLIs do not.
  if (process.env.LLM_ALLOW_PAID === '1') return order;
  const unmetered = order.filter(isUnmetered);
  return unmetered.length ? unmetered : ['ollama'];
}

/** Providers that will actually be tried for a tier — exported for preflights. */
export function configuredProviders(tier?: LlmTier): LlmProvider[] {
  return providerOrder(tier);
}

function credentialFor(provider: LlmProvider): { value?: string; name: string } {
  // Ollama needs no real key. Treat the base URL as the credential, so an
  // unset OLLAMA_BASE_URL cleanly skips the provider instead of hammering a
  // host that is not there.
  if (provider === 'ollama') return { value: process.env.OLLAMA_BASE_URL, name: 'OLLAMA_BASE_URL' };
  // CLIs authenticate from the machine they run on; listing them in the order
  // is the opt-in. A missing CLI or unreachable host fails fast at call time.
  if (SUBSCRIPTION_PROVIDERS.has(provider)) return { value: 'cli', name: `${provider} (listed in LLM_PROVIDER_ORDER)` };
  if (provider === 'replicate') return { value: process.env.REPLICATE_API_TOKEN, name: 'REPLICATE_API_TOKEN' };
  if (provider === 'gemini') return { value: process.env.GEMINI_API_KEY, name: 'GEMINI_API_KEY' };
  if (process.env.ANTHROPIC_API_KEY) return { value: process.env.ANTHROPIC_API_KEY, name: 'ANTHROPIC_API_KEY' };
  return { value: process.env.CLAUDE_API_KEY, name: 'CLAUDE_API_KEY' };
}

/**
 * Some network errors are not worth retrying. A refused connection or an
 * unresolvable host means nothing is listening — that will not change in the
 * 2 minutes eight exponential backoffs take, and every attempt still burns a
 * slot from the per-run request budget. Fail fast so the next provider in the
 * chain gets a turn.
 *
 * Observed: a self-hosted Ollama process exited, and the run spent ~2 minutes
 * and 8 of 40 budget slots retrying ECONNREFUSED before moving on.
 */
// UND_ERR_CONNECT_TIMEOUT is what undici reports when the host is up but the
// port is filtered or the service is gone — the nightly batch hit exactly that
// for three nights and spent ~3 minutes per step retrying it.
const FATAL_NETWORK_CODES = new Set(['ECONNREFUSED', 'ENOTFOUND', 'EHOSTUNREACH', 'ENETUNREACH', 'EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT', 'EHOSTDOWN', 'UND_ERR_SOCKET']);
function fatalNetworkCode(error: unknown): string | null {
  const cause = (error as { cause?: { code?: string } })?.cause;
  const code = cause?.code;
  return code && FATAL_NETWORK_CODES.has(code) ? code : null;
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : null;
}

async function inRequestQueue<T>(label: string, provider: LlmProvider, tier: LlmTier, fn: () => Promise<T>): Promise<T> {
  let release!: () => void;
  const previous = requestQueue;
  requestQueue = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try {
    if (requestCount >= MAX_REQUESTS) {
      throw new LlmBudgetError(`LLM request budget exhausted (${requestCount}/${MAX_REQUESTS}). Refusing ${label}; raise LLM_MAX_CALLS_PER_RUN deliberately if this run needs more.`);
    }
    const waitMs = Math.max(0, minIntervalFor(provider) - (Date.now() - lastRequestStartedAt));
    if (waitMs > 0) console.log(`   ⏳ Rate limiter: waiting ${(waitMs / 1000).toFixed(1)}s before ${label}`);
    if (waitMs > 0) await sleep(waitMs);
    requestCount += 1;
    byProvider[provider] += 1;
    lastRequestStartedAt = Date.now();
    console.log(`   🤖 Model request ${requestCount}/${MAX_REQUESTS}: ${label}`);
    return await fn();
  } finally {
    release();
  }
}

async function retryingFetch(url: string, init: RequestInit, label: string, provider: LlmProvider, tier: LlmTier): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await inRequestQueue(`${label} (attempt ${attempt}/${MAX_ATTEMPTS})`, provider, tier, () => fetch(url, init));
      if (!RETRYABLE.has(response.status) || attempt === MAX_ATTEMPTS) return response;
      const retryAfter = parseRetryAfter(response.headers.get('retry-after'));
      await response.body?.cancel();
      const backoff = retryAfter ?? (1_000 * 2 ** (attempt - 1) + Math.floor(Math.random() * 750));
      console.warn(`   ⚠️ ${provider} returned HTTP ${response.status}; retrying in ${(backoff / 1000).toFixed(1)}s`);
      await sleep(backoff);
    } catch (error) {
      if (error instanceof LlmBudgetError) throw error;
      lastError = error as Error;
      const fatal = fatalNetworkCode(error);
      if (fatal) {
        console.warn(`   ⚠️ ${provider} unreachable (${fatal}) — not retrying; moving to the next provider.`);
        throw new Error(`${provider} unreachable (${fatal}): nothing is listening at ${new URL(url).origin}`);
      }
      if (attempt === MAX_ATTEMPTS) break;
      const backoff = 1_000 * 2 ** (attempt - 1) + Math.floor(Math.random() * 750);
      console.warn(`   ⚠️ ${provider} network error; retrying in ${(backoff / 1000).toFixed(1)}s: ${lastError.message}`);
      await sleep(backoff);
    }
  }
  throw new Error(`${provider} request failed after ${MAX_ATTEMPTS} attempts: ${lastError?.message ?? 'unknown network error'}`);
}

function estimatePredictionCost(model: string, seconds: number): number {
  const configured = Number(process.env.REPLICATE_ESTIMATED_USD_PER_PREDICT_SECOND || '0.0014');
  const perSecond = Number.isFinite(configured) && configured >= 0 ? configured : 0.0014;
  const multiplier = model.includes('flux') ? 10 : 1;
  return seconds * perSecond * multiplier;
}

function recordPrediction(model: string, prediction: ReplicatePrediction): void {
  const seconds = Number(prediction.metrics?.predict_time ?? 0);
  if (!Number.isFinite(seconds) || seconds < 0) return;
  const cost = estimatePredictionCost(model, seconds);
  predictSeconds += seconds;
  estimatedCostUsd += cost;
  console.log(`   💵 ${model}: ${seconds.toFixed(2)}s predict time; estimated $${cost.toFixed(4)} (run $${estimatedCostUsd.toFixed(4)})`);
}

export async function callReplicatePrediction<T = unknown>(model: string, input: Record<string, unknown>, tier: LlmTier = 'heavy'): Promise<ReplicatePrediction<T>> {
  const key = credentialFor('replicate');
  if (!key.value) throw new LlmConfigurationError(`No ${key.name} value is configured.`);
  const slash = model.indexOf('/');
  if (slash <= 0 || slash === model.length - 1) throw new Error(`Replicate model must be owner/name, received: ${model}`);
  logicalCallCount += 1;
  byTier[tier] += 1;
  const response = await retryingFetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key.value}`,
      'Content-Type': 'application/json',
      Prefer: 'wait',
    },
    body: JSON.stringify({ input }),
  }, `replicate ${model}`, 'replicate', tier);
  const detail = await response.text();
  if (!response.ok) throw new Error(`Replicate API failed (${response.status}): ${detail.replace(/\s+/g, ' ').slice(0, 500)}`);
  let prediction = JSON.parse(detail) as ReplicatePrediction<T>;

  // `Prefer: wait` only holds the connection for ~60s. A long synthesis call
  // comes back as `starting`/`processing` with a polling URL, so treating a
  // non-succeeded status as fatal killed the weekly Stage 2 call outright.
  if (prediction.status === 'starting' || prediction.status === 'processing') {
    prediction = await pollReplicatePrediction<T>(prediction, key.value, model);
  }

  recordPrediction(model, prediction);
  if (prediction.status !== 'succeeded') throw new Error(`Replicate prediction ${prediction.status}: ${prediction.error || 'no error detail'}`);
  return prediction;
}

async function pollReplicatePrediction<T>(initial: ReplicatePrediction<T>, token: string, model: string): Promise<ReplicatePrediction<T>> {
  const pollUrl = initial.urls?.get || (initial.id ? `https://api.replicate.com/v1/predictions/${initial.id}` : '');
  if (!pollUrl) throw new Error(`Replicate prediction ${initial.status} with no polling URL for ${model}`);
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let waited = 0;
  let delay = 1_000;
  let current = initial;
  while (Date.now() < deadline) {
    await sleep(delay);
    waited += delay;
    delay = Math.min(delay * 1.5, 10_000);
    let response: Response;
    try {
      response = await fetch(pollUrl, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) {
      console.warn(`   ⚠️ replicate poll network error; continuing: ${(error as Error).message}`);
      continue;
    }
    if (response.status === 429 || response.status >= 500) {
      const retryAfter = parseRetryAfter(response.headers.get('retry-after'));
      await response.body?.cancel();
      console.warn(`   ⚠️ replicate poll returned HTTP ${response.status}; backing off`);
      await sleep(retryAfter ?? delay);
      continue;
    }
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Replicate poll failed (${response.status}): ${body.replace(/\s+/g, ' ').slice(0, 300)}`);
    }
    current = JSON.parse(await response.text()) as ReplicatePrediction<T>;
    if (current.status === 'succeeded' || current.status === 'failed' || current.status === 'canceled') {
      console.log(`   ⏱️ replicate ${model}: settled as ${current.status} after ${(waited / 1000).toFixed(0)}s of polling`);
      return current;
    }
  }
  throw new Error(`Replicate prediction for ${model} did not finish within ${POLL_TIMEOUT_MS / 1000}s (last status: ${current.status})`);
}

async function replicateText(options: CallModelOptions<unknown>, tier: LlmTier): Promise<string> {
  const model = modelFor(tier);
  const prediction = await callReplicatePrediction<string[] | string>(model, {
    prompt: options.prompt,
    max_tokens: Math.max(1024, options.maxTokens ?? (tier === 'heavy' ? 8192 : 4096)),
    system_prompt: [options.system, options.json ? 'Return only valid JSON with no Markdown fence or commentary.' : ''].filter(Boolean).join('\n\n') || undefined,
  }, tier);
  return Array.isArray(prediction.output) ? prediction.output.join('') : String(prediction.output ?? '');
}

async function geminiText(options: CallModelOptions<unknown>, tier: LlmTier): Promise<string> {
  const key = credentialFor('gemini');
  if (!key.value) throw new LlmConfigurationError(`No ${key.name} value is configured.`);
  logicalCallCount += 1;
  byTier[tier] += 1;
  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const response = await retryingFetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key.value)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: options.system ? { parts: [{ text: options.system }] } : undefined,
        contents: [{ role: 'user', parts: [{ text: options.prompt }] }],
        generationConfig: {
          temperature: options.temperature ?? 0.1,
          maxOutputTokens: options.maxTokens ?? 4096,
          responseMimeType: options.json ? 'application/json' : 'text/plain',
        },
      }),
    },
    `gemini ${model}`,
    'gemini',
    tier,
  );
  const detail = await response.text();
  if (!response.ok) throw new Error(`Gemini API failed (${response.status}): ${detail.replace(/\s+/g, ' ').slice(0, 500)}`);
  const data = JSON.parse(detail) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
}

async function anthropicText(options: CallModelOptions<unknown>, tier: LlmTier): Promise<string> {
  const key = credentialFor('anthropic');
  if (!key.value) throw new LlmConfigurationError(`No ${key.name} value is configured.`);
  logicalCallCount += 1;
  byTier[tier] += 1;
  const model = tier === 'heavy'
    ? (process.env.ANTHROPIC_MODEL_HEAVY || 'claude-sonnet-4-5')
    : (process.env.ANTHROPIC_MODEL_LIGHT || 'claude-haiku-4-5');
  const response = await retryingFetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key.value, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens ?? 8192,
      temperature: options.temperature ?? 0.2,
      system: [options.system, options.json ? 'Return only valid JSON with no Markdown fence or commentary.' : ''].filter(Boolean).join('\n\n') || undefined,
      messages: [{ role: 'user', content: options.prompt }],
    }),
  }, `anthropic ${model}`, 'anthropic', tier);
  const detail = await response.text();
  if (!response.ok) throw new Error(`Anthropic API failed (${response.status}): ${detail.replace(/\s+/g, ' ').slice(0, 500)}`);
  const data = JSON.parse(detail) as { content?: Array<{ type: string; text?: string }> };
  return data.content?.filter((part) => part.type === 'text').map((part) => part.text ?? '').join('') ?? '';
}

/**
 * Self-hosted Ollama over its NATIVE /api/chat surface.
 *
 * Not the OpenAI-compatible endpoint, for two measured reasons:
 *
 *  1. qwen3.6 is a reasoning model and the OpenAI surface gives no way to turn
 *     thinking off. `chat_template_kwargs: {enable_thinking:false}` is ignored
 *     there. Asking for a 3-element array spent all 300 allowed tokens on
 *     hidden reasoning and returned EMPTY content with finish_reason=length.
 *     The same request to /api/chat with `think:false` answered correctly in
 *     15 tokens. For mechanical work like labelling, reasoning is pure cost.
 *  2. Only the native surface accepts `options.num_ctx`. Ollama auto-sizes
 *     context on recent builds, but a too-small num_ctx truncates SILENTLY,
 *     so being able to pin it matters.
 *
 * JSON is requested in the system prompt rather than via a format constraint:
 * Ollama's JSON mode forces a top-level object, which turned a 22-record
 * labelling batch into a single object. The loose parser already handles
 * fences and trailing commas, and this matches the Anthropic path here.
 *
 * No cost is recorded because there is none; wall time is still tracked so the
 * run summary stays comparable with a hosted run.
 */
async function ollamaText(options: CallModelOptions<unknown>, tier: LlmTier): Promise<string> {
  const configured = (process.env.OLLAMA_BASE_URL || '').replace(/\/+$/, '');
  if (!configured) throw new LlmConfigurationError('No OLLAMA_BASE_URL value is configured.');
  // Accept either the OpenAI base (…/v1) or the native root.
  const root = configured.replace(/\/v1$/, '');
  const model = tier === 'heavy'
    ? (process.env.OLLAMA_MODEL_HEAVY || process.env.OLLAMA_MODEL || 'qwen3.6:35b-a3b-q4_K_M')
    : (process.env.OLLAMA_MODEL_LIGHT || process.env.OLLAMA_MODEL || 'qwen3.6:35b-a3b-q4_K_M');

  logicalCallCount += 1;
  byTier[tier] += 1;

  const system = [
    options.system,
    options.json ? 'Return only valid JSON with no Markdown fence or commentary. If the instructions ask for an array, the top-level value must be a JSON array.' : '',
  ].filter(Boolean).join('\n\n');

  // Thinking off by default. Opt in per tier when reasoning is worth the
  // tokens — OLLAMA_THINK_HEAVY=true is the one worth experimenting with,
  // since the weekly synthesis is genuinely analytical.
  const thinkEnv = tier === 'heavy' ? process.env.OLLAMA_THINK_HEAVY : process.env.OLLAMA_THINK_LIGHT;
  const think = /^(1|true|yes)$/i.test(thinkEnv ?? process.env.OLLAMA_THINK ?? '');

  // Context window, sized per request.
  //
  // num_ctx is prompt AND answer together. It was a fixed 49152, and as the
  // weekly prompt grew with each day of data it reached 46,555 tokens — leaving
  // 2,597 for the answer, which was cut off mid-JSON. That surfaced on
  // 2026-09-27 as "malformed JSON at position 8817" and on 2026-10-01 as a
  // length stop, and the old message blamed maxTokens. A fixed number will be
  // outgrown again, so size it from the actual prompt, up to a ceiling the box
  // has been probed to survive (65536 verified 2026-10-01).
  //
  // The answer budget is capped for local runs: the hosted path asks for up to
  // 32000 tokens, but this model's weekly synthesis has never exceeded ~4.2k,
  // and reserving 32k would push every request past the ceiling.
  const ceiling = Number(process.env.OLLAMA_NUM_CTX_MAX || process.env.OLLAMA_NUM_CTX || 65536);
  const maxOutput = Number(process.env.OLLAMA_MAX_OUTPUT || 8192);
  const numPredict = Math.max(1024, Math.min(maxOutput, options.maxTokens ?? (tier === 'heavy' ? 8192 : 4096)));
  // ~3 characters per token is what this model measured on JSON-heavy prompts
  // (46,555 tokens for a ~141KB payload); round up so the estimate errs large.
  const promptEstimate = Math.ceil(((system?.length ?? 0) + options.prompt.length) / 3);
  const needed = promptEstimate + numPredict + 1024;
  const numCtx = Math.min(ceiling, Math.max(8192, Math.ceil(needed / 4096) * 4096));
  if (needed > ceiling) {
    console.warn(`   ⚠️  prompt needs ~${needed.toLocaleString('en-US')} tokens of context but the ceiling is ${ceiling.toLocaleString('en-US')}; the answer may be cut off. Raise OLLAMA_NUM_CTX_MAX (probe the box first) or trim the prompt.`);
  }
  const modelOptions: Record<string, unknown> = {
    temperature: options.temperature ?? 0.2,
    num_predict: numPredict,
    num_ctx: numCtx,
  };

  const started = Date.now();
  const response = await retryingFetch(`${root}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        { role: 'user', content: options.prompt },
      ],
      think,
      stream: false,
      options: modelOptions,
      // Grammar-constrained decoding. The local model repeatedly emitted
      // structurally broken JSON on long outputs — on 2026-10-01 it closed the
      // last content-gap object and never closed the array around it. With a
      // schema it cannot produce output that does not match.
      ...(options.schema ? { format: options.schema } : {}),
    }),
  }, `ollama ${model}`, 'ollama', tier);

  const detail = await response.text();
  if (!response.ok) throw new Error(`Ollama request failed (${response.status}): ${detail.replace(/\s+/g, ' ').slice(0, 500)}`);
  const data = JSON.parse(detail) as {
    message?: { content?: string; thinking?: string };
    done_reason?: string;
    prompt_eval_count?: number;
    eval_count?: number;
  };
  const seconds = (Date.now() - started) / 1000;
  predictSeconds += seconds;
  console.log(`   🖥️  ${model}: ${seconds.toFixed(1)}s local (${data.prompt_eval_count ?? '?'} in / ${data.eval_count ?? '?'} out${think ? ', thinking on' : ''}, $0.00)`);

  // done_reason 'length' means num_predict cut the answer off. Name that
  // rather than letting it surface downstream as a JSON parse error.
  if (data.done_reason === 'length') {
    // Two different limits produce the same stop reason. Name the right one.
    const used = (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0);
    if (used >= numCtx - 64) {
      throw new Error(`Ollama ran out of CONTEXT WINDOW: ${data.prompt_eval_count} prompt + ${data.eval_count} answer tokens filled num_ctx=${numCtx}. Raise OLLAMA_NUM_CTX_MAX (probe the box first) or trim the prompt — raising maxTokens will not help.`);
    }
    throw new Error(`Ollama hit the output limit (done_reason=length) at num_predict=${numPredict}. Raise maxTokens or OLLAMA_MAX_OUTPUT for this call${think ? '; thinking is on and consumes this budget' : ''}.`);
  }
  return data.message?.content ?? '';
}

/**
 * Run `claude -p` or `codex exec` with the prompt on stdin, either locally or
 * over SSH on another machine (CLAUDE_CLI_HOST / CODEX_CLI_HOST, or
 * AGENT_CLI_HOST for both — e.g. the Latitude).
 *
 * The prompt goes on STDIN, never as an argument: the weekly synthesis prompt
 * is ~145KB, and Windows caps a command line at 32,767 characters.
 *
 * Both CLIs run in a no-tools posture for this — `claude -p` in print mode
 * denies tools that need approval, and codex runs in its read-only sandbox —
 * because the job here is text in, JSON out.
 */
function runProcess(cmd: string, args: string[], stdin: string, timeoutMs: number): Promise<{ code: number | null; stdout: string; stderr: string; timedOut: boolean }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); }, timeoutMs);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('close', (code) => { clearTimeout(timer); resolve({ code, stdout, stderr, timedOut }); });
    child.stdin.on('error', () => { /* child exited before reading stdin; reported via close */ });
    child.stdin.end(stdin);
  });
}

async function cliText(provider: 'claude-cli' | 'codex-cli', options: CallModelOptions<unknown>, tier: LlmTier): Promise<string> {
  const host = (provider === 'claude-cli' ? process.env.CLAUDE_CLI_HOST : process.env.CODEX_CLI_HOST) || process.env.AGENT_CLI_HOST || '';
  const model = provider === 'claude-cli' ? process.env.CLAUDE_CLI_MODEL : process.env.CODEX_CLI_MODEL;
  const argv = provider === 'claude-cli'
    ? [process.env.CLAUDE_CLI_BIN || 'claude', '-p', '--output-format', 'text', '--no-session-persistence', ...(model ? ['--model', model] : [])]
    : [process.env.CODEX_CLI_BIN || 'codex', 'exec', '--skip-git-repo-check', '--ephemeral', '-s', 'read-only', ...(model ? ['-m', model] : [])];
  // On a Windows host, set CLAUDE_CLI_BIN=claude.cmd / CODEX_CLI_BIN=codex.cmd:
  // the remote shell is PowerShell, whose execution policy blocks the npm
  // .ps1 launchers that a bare `claude` resolves to, while the .cmd launchers
  // npm installs alongside them are not subject to it.

  // These CLIs have no structured-output parameter here, so the schema rides
  // in the prompt and validate()/parseJsonLoosely do the enforcing.
  const prompt = [
    options.system,
    options.json ? 'Return only valid JSON with no Markdown fence or commentary. If the instructions ask for an array, the top-level value must be a JSON array. Do not use any tools.' : '',
    options.schema ? `The JSON must conform to this JSON Schema:\n${JSON.stringify(options.schema)}` : '',
    options.prompt,
  ].filter(Boolean).join('\n\n');

  const keyFile = process.env.AGENT_CLI_SSH_KEY_FILE;
  const [cmd, args] = host
    ? ['ssh', [
        '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', '-o', 'StrictHostKeyChecking=accept-new',
        ...(keyFile ? ['-i', keyFile] : []), host, argv.join(' '),
      ]]
    : [argv[0], argv.slice(1)];
  const where = host ? `${host} via SSH` : 'locally';
  const timeoutMs = Math.max(60_000, Number(process.env.AGENT_CLI_TIMEOUT_MS || (tier === 'heavy' ? 20 * 60_000 : 8 * 60_000)));

  logicalCallCount += 1;
  byTier[tier] += 1;
  const started = Date.now();
  let result: Awaited<ReturnType<typeof runProcess>>;
  try {
    result = await inRequestQueue(`${provider} ${where}`, provider, tier, () => runProcess(cmd, args as string[], prompt, timeoutMs));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new Error(`${cmd} is not installed on this machine`);
    throw error;
  }
  const seconds = (Date.now() - started) / 1000;
  predictSeconds += seconds;
  // ssh exits 255 for its own failures (refused, timeout, auth) — nothing ran
  // remotely, so say so plainly and let the chain move on.
  if (host && result.code === 255) {
    throw new Error(`${provider}: could not reach ${host} over SSH — ${result.stderr.trim().split('\n').pop()?.slice(0, 200)}`);
  }
  if (result.timedOut) throw new Error(`${provider} ${where} exceeded ${Math.round(timeoutMs / 60_000)} minutes and was stopped`);
  if (result.code !== 0) {
    throw new Error(`${provider} ${where} exited ${result.code}: ${(result.stderr || result.stdout).trim().slice(-300)}`);
  }
  console.log(`   🧑‍💻 ${provider} ${where}: ${seconds.toFixed(1)}s (${prompt.length.toLocaleString('en-US')} chars in, ${result.stdout.length.toLocaleString('en-US')} out, subscription)`);
  return result.stdout;
}

async function rawCall(options: CallModelOptions<unknown>): Promise<string> {
  const tier = tierFor(options);
  if (options.provider && !isUnmetered(options.provider) && process.env.LLM_ALLOW_PAID !== '1') {
    throw new LlmConfigurationError('Paid LLM calls require LLM_ALLOW_PAID=1 after reviewer approval.');
  }
  const providers = options.provider ? [options.provider] : providerOrder(tier);
  const failures: string[] = [];
  // A logical call is one question answered, however many providers it took.
  // Each provider increments the counters as it starts, so a failed attempt is
  // rolled back below — otherwise an Ollama-down failover reads as two calls
  // and trips analyze's one-call contract for Stage 2 (seen 2026-11-03).
  const logicalBefore = logicalCallCount;
  const tierBefore = byTier[tier];
  for (const provider of providers) {
    if (!credentialFor(provider).value) {
      failures.push(`${provider}: missing ${credentialFor(provider).name}`);
      continue;
    }
    try {
      if (provider === 'ollama') return await ollamaText(options, tier);
      if (provider === 'claude-cli' || provider === 'codex-cli') return await cliText(provider, options, tier);
      if (provider === 'replicate') return await replicateText(options, tier);
      if (provider === 'gemini') return await geminiText(options, tier);
      return await anthropicText(options, tier);
    } catch (error) {
      if (error instanceof LlmBudgetError) throw error;
      logicalCallCount = logicalBefore;
      byTier[tier] = tierBefore;
      failures.push(`${provider}: ${(error as Error).message}`);
      if (options.provider) throw error;
      console.warn(`   ⚠️ ${provider} failed; trying next configured provider.`);
    }
  }
  throw new LlmConfigurationError(`No LLM provider succeeded. ${failures.join(' | ')}`);
}

export async function callModel<T = string>(options: CallModelOptions<T>): Promise<T> {
  const text = await rawCall(options);
  if (!text.trim()) throw new Error('LLM returned an empty response.');
  if (!options.json) return text as T;
  let parsed: unknown;
  try {
    parsed = parseJsonLoosely(text);
  } catch (error) {
    // Dump the raw response so a parse failure is diagnosable instead of just
    // costing another full-price call to reproduce.
    const dump = join(process.cwd(), 'data', 'diagnostics', `llm-unparseable-${Date.now()}.txt`);
    try { mkdirSync(dirname(dump), { recursive: true }); writeFileSync(dump, text); console.warn(`   \u{1F4C4} Raw unparseable response saved to ${dump}`); } catch { /* diagnostics are best-effort */ }
    // An unterminated string or unexpected end means the model was cut off at
    // its token ceiling, not that it emitted bad JSON. Say so: the fix is
    // maxTokens or a smaller requested schema, and a plain "could not be
    // parsed" sent us hunting the prompt instead.
    const message = (error as Error).message;
    const truncated = /Unterminated string|Unexpected end of (JSON|input)|Unexpected non-whitespace/i.test(message);
    const hint = truncated
      ? ` The response appears TRUNCATED at ${text.length} characters (~${Math.round(text.length / 3.7)} tokens), which means it hit the output token ceiling. Raise maxTokens for this call or ask the schema for fewer items.`
      : '';
    throw new Error(`LLM JSON response could not be parsed: ${message}.${hint}`);
  }
  if (options.validate && !options.validate(parsed)) {
    // Dump the parsed object too -- "failed schema validation" with no payload
    // is undebuggable and each reproduction costs a full-price model call.
    const dump = join(process.cwd(), 'data', 'diagnostics', `llm-schema-fail-${Date.now()}.json`);
    try {
      mkdirSync(dirname(dump), { recursive: true });
      writeFileSync(dump, JSON.stringify(parsed, null, 2));
      console.warn(`   \u{1F4C4} Schema-failing response saved to ${dump}`);
    } catch { /* diagnostics are best-effort */ }
    const keys = parsed && typeof parsed === 'object' ? Object.keys(parsed as Record<string, unknown>).join(', ') : typeof parsed;
    throw new Error(`LLM JSON response failed schema validation. Top-level keys: ${keys}`);
  }
  return parsed as T;
}

export async function assertLlmReady(providers?: LlmProvider[]): Promise<void> {
  const required = providers ?? providerOrder();
  if (providers) {
    const missing = required.filter((provider) => !credentialFor(provider).value);
    if (missing.length) throw new LlmConfigurationError(`Missing required LLM credentials: ${missing.map((provider) => credentialFor(provider).name).join(', ')}`);
    return;
  }
  if (!required.some((provider) => credentialFor(provider).value)) {
    throw new LlmConfigurationError(`No LLM credentials found. Provider order: ${required.join(' -> ')}.`);
  }
}

export function getLlmRunStats(): LlmRunStats {
  return {
    requests: requestCount,
    maxRequests: MAX_REQUESTS,
    logicalCalls: logicalCallCount,
    predictSeconds,
    estimatedCostUsd,
    byTier: { ...byTier },
    byProvider: { ...byProvider },
  };
}

export function logLlmRunSummary(label = 'LLM run'): void {
  const stats = getLlmRunStats();
  console.log(`📈 ${label}: ${stats.logicalCalls} logical calls, ${stats.requests}/${stats.maxRequests} HTTP requests, ${stats.predictSeconds.toFixed(2)}s predict time, estimated $${stats.estimatedCostUsd.toFixed(4)}, ${(Date.now() - runStartedAt) / 1000}s elapsed`);
}

export function printLlmError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`❌ ${message}`);
  logLlmRunSummary('Failed LLM run');
}
