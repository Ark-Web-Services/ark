import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const tempDirs: string[] = [];
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const directory of tempDirs.splice(0)) rmSync(directory, { recursive: true, force: true });
});

async function withLlmEnv<T>(env: Record<string, string>, run: (llm: typeof import('../scripts/lib/llm.ts')) => Promise<T>): Promise<T> {
  const cwd = mkdtempSync(join(tmpdir(), 'llm-backport-'));
  tempDirs.push(cwd);
  const previousCwd = process.cwd();
  const previousEnv = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(env)) {
    previousEnv.set(key, process.env[key]);
    process.env[key] = value;
  }
  process.chdir(cwd);
  try {
    const llm = await import(`../scripts/lib/llm.ts?test=${Date.now()}-${Math.random()}`) as typeof import('../scripts/lib/llm.ts');
    return await run(llm);
  } finally {
    process.chdir(previousCwd);
    for (const [key, value] of previousEnv) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function mockOllama(reply: (body: Record<string, unknown>) => unknown): { url: string; requests: Record<string, unknown>[] } {
  const requests: Record<string, unknown>[] = [];
  const url = 'http://ollama.test';
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), `${url}/api/chat`);
    const parsed = JSON.parse(String(init?.body)) as Record<string, unknown>;
    requests.push(parsed);
    return new Response(JSON.stringify(reply(parsed)), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  return { url, requests };
}

const okResponse = (content: string, extra: Record<string, unknown> = {}) => ({
  message: { content }, done_reason: 'stop', prompt_eval_count: 20, eval_count: 10, ...extra,
});

describe('selective Ollama hardening backport', () => {
  it('forwards JSON Schema and bounds output/context settings', async () => {
    const schema = { type: 'object', properties: { ready: { type: 'boolean' } }, required: ['ready'] };
    const mock = mockOllama(() => okResponse('{"ready":true}'));
    await withLlmEnv({
      OLLAMA_BASE_URL: mock.url,
      OLLAMA_MIN_INTERVAL_MS: '0',
      OLLAMA_NUM_CTX_MAX: '16384',
      OLLAMA_MAX_OUTPUT: '2048',
      LLM_MAX_CALLS_PER_RUN: '2',
      REPLICATE_API_TOKEN: '', GEMINI_API_KEY: '', ANTHROPIC_API_KEY: '', CLAUDE_API_KEY: '',
    }, async ({ callModel }) => {
      const result = await callModel<{ ready: boolean }>({
        provider: 'ollama', tier: 'light', json: true, schema, prompt: 'context '.repeat(4500), maxTokens: 9000,
      });
      assert.deepEqual(result, { ready: true });
    });
    const body = mock.requests[0];
    assert.deepEqual(body.format, schema);
    const options = body.options as Record<string, number>;
    assert.equal(options.num_predict, 2048);
    assert.ok(options.num_ctx > 8192 && options.num_ctx <= 16384);
  });

  it('reports a context-window exhaustion distinctly from output truncation', async () => {
    const mock = mockOllama(() => okResponse('{"ready":', {
      done_reason: 'length', prompt_eval_count: 8100, eval_count: 100,
    }));
    await withLlmEnv({
      OLLAMA_BASE_URL: mock.url,
      OLLAMA_MIN_INTERVAL_MS: '0',
      OLLAMA_NUM_CTX_MAX: '8192',
      OLLAMA_MAX_OUTPUT: '1024',
      LLM_MAX_CALLS_PER_RUN: '2',
      REPLICATE_API_TOKEN: '', GEMINI_API_KEY: '', ANTHROPIC_API_KEY: '', CLAUDE_API_KEY: '',
    }, async ({ callModel }) => {
      await assert.rejects(
        callModel({ provider: 'ollama', tier: 'light', json: true, prompt: 'large '.repeat(8000) }),
        /ran out of CONTEXT WINDOW.*num_ctx=8192/,
      );
    });
    assert.equal((mock.requests[0].options as Record<string, number>).num_ctx, 8192);
  });

  it('reports an output token limit when context remains available', async () => {
    const mock = mockOllama(() => okResponse('partial', {
      done_reason: 'length', prompt_eval_count: 100, eval_count: 100,
    }));
    await withLlmEnv({
      OLLAMA_BASE_URL: mock.url,
      OLLAMA_MIN_INTERVAL_MS: '0',
      OLLAMA_NUM_CTX_MAX: '8192',
      OLLAMA_MAX_OUTPUT: '1024',
      LLM_MAX_CALLS_PER_RUN: '2',
      REPLICATE_API_TOKEN: '', GEMINI_API_KEY: '', ANTHROPIC_API_KEY: '', CLAUDE_API_KEY: '',
    }, async ({ callModel }) => {
      await assert.rejects(
        callModel({ provider: 'ollama', tier: 'light', prompt: 'short prompt' }),
        /hit the output limit.*num_predict=1024/,
      );
    });
  });

  it('fails fast on refused and timed-out local Ollama connections', async () => {
    for (const code of ['ECONNREFUSED', 'UND_ERR_CONNECT_TIMEOUT']) {
      let attempts = 0;
      globalThis.fetch = async () => {
        attempts++;
        throw new TypeError('fetch failed', { cause: { code } });
      };
      await withLlmEnv({
        OLLAMA_BASE_URL: 'http://ollama.test',
        OLLAMA_MIN_INTERVAL_MS: '0',
        LLM_MAX_CALLS_PER_RUN: '2',
        REPLICATE_API_TOKEN: '', GEMINI_API_KEY: '', ANTHROPIC_API_KEY: '', CLAUDE_API_KEY: '',
      }, async ({ callModel }) => {
        const started = Date.now();
        await assert.rejects(
          callModel({ provider: 'ollama', prompt: 'test' }),
          new RegExp(`ollama unreachable \\(${code}\\)`),
        );
        assert.ok(Date.now() - started < 1500, `${code} should fail without exponential retries`);
        assert.equal(attempts, 1);
      });
    }
  });
});
