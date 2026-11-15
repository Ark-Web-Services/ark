import test from "node:test";
import assert from "node:assert/strict";
import {
  createLead, escapeHtml, isAuthorized, processOutbox, retryDelaySeconds, sameOrigin,
  validateLead, type LeadEnv,
} from "../src/lib/leads";
import { htmlResult } from "../src/pages/api/inquiries";

const valid: Record<string, unknown> = {
  name: "Avery Jones", email: "avery@example.com", service: "Wedding", message: "Please send availability.", consent: true,
  eventDate: "2099-06-01", guestCount: "80",
};

test("validates normalized fields, consent encodings, service other, and field limits", () => {
  const value = validateLead({ ...valid, name: " Avery Jones ", email: "AVERY@example.com", consent: "yes", message: "  Please send availability.  " });
  assert.equal(value.name, "Avery Jones");
  assert.equal(value.email, "avery@example.com");
  assert.equal(value.guestCount, 80);
  assert.equal(validateLead({ ...valid, service: "other", consent: "on" }).service, "other");
  assert.throws(() => validateLead({ ...valid, consent: false }));
  assert.throws(() => validateLead({ ...valid, email: "bad" }));
  assert.throws(() => validateLead({ ...valid, eventDate: "2000-01-01" }));
  assert.throws(() => validateLead({ ...valid, message: "x".repeat(4001) }));
  assert.throws(() => validateLead({ ...valid, name: "x".repeat(121) }));
  assert.throws(() => validateLead(null));
  assert.throws(() => validateLead([]));
});

test("admin authorization requires exact bearer token and origin is exact", () => {
  assert.equal(isAuthorized(new Request("https://site.test", { headers: { authorization: "Bearer secret" } }), "secret"), true);
  assert.equal(isAuthorized(new Request("https://site.test", { headers: { authorization: "Bearer secretx" } }), "secret"), false);
  assert.equal(sameOrigin(new Request("https://site.test/api", { headers: { origin: "https://site.test" } })), true);
  assert.equal(sameOrigin(new Request("https://site.test/api", { headers: { origin: "https://attacker.test" } })), false);
  assert.equal(sameOrigin(new Request("https://site.test/api")), false);
});

test("email markup escapes user controlled values", () => {
  assert.equal(escapeHtml(`<script a='"'>&`), "&lt;script a=&#39;&quot;&#39;&gt;&amp;");
  const response = htmlResult("<script>bad()</script>", "a\" onload=\"bad@example.com", 200);
  return response.text().then((html) => {
    assert.match(html, /&lt;script&gt;bad\(\)&lt;\/script&gt;/);
    assert.doesNotMatch(html, /onload/);
    assert.match(html, /href="\/contact\/"/);
  });
});

test("D1 uniqueness binds a key to its original request fingerprint", async () => {
  const unique = new Map<string, { id: string; fingerprint: string }>();
  const db: any = {
    prepare(sql: string) {
      let args: any[] = [];
      const statement: any = {
        sql,
        bind(...values: any[]) { args = values; statement.args = values; return statement; },
        async first() { return unique.get(args[0]) ?? null; },
      };
      return statement;
    },
    async batch(statements: any[]) {
      const [insert] = statements;
      if (unique.has(insert.args[1])) return [{ meta: { changes: 0 } }];
      unique.set(insert.args[1], { id: insert.args[0], fingerprint: insert.args[2] });
      return [{ meta: { changes: 1 } }];
    },
  };
  // Fingerprint is derived from normalized input; mock the lead lookup row as D1 does.
  const originalPrepare = db.prepare.bind(db);
  db.prepare = (sql: string) => {
    const statement = originalPrepare(sql);
    const bind = statement.bind.bind(statement);
    statement.bind = (...args: any[]) => {
      bind(...args);
      if (sql.startsWith("SELECT id,request_fingerprint")) {
        const lead = unique.get(args[0]);
        statement.first = async () => lead ? { id: lead.id, request_fingerprint: lead.fingerprint } : null;
      }
      return statement;
    };
    return statement;
  };
  const env = { DB: db } as unknown as LeadEnv;
  const input = validateLead(valid);
  const opts = { id: "generated-id", createdAt: "2026-01-01T00:00:00.000Z", idempotencyKey: "stable-form-key", siteName: "Test" };
  const first = await createLead(env, input, opts);
  const second = await createLead(env, input, { ...opts, id: "retry-id" });
  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(second.id, "generated-id");
  await assert.rejects(() => createLead(env, validateLead({ ...valid, message: "Different request payload" }), opts), /different inquiry/);
});

function outboxDb(row: Record<string, any>, claimChanges = 1) {
  const statements: Array<{ sql: string; args: any[] }> = [];
  const db: any = {
    statements,
    prepare(sql: string) {
      const statement: any = { sql, args: [], bind(...args: any[]) { statement.args = args; return statement; } };
      statement.run = async () => {
        statements.push({ sql, args: statement.args });
        if (sql.includes("SET status='processing'")) return { meta: { changes: claimChanges } };
        return { meta: { changes: 1 } };
      };
      statement.all = async () => ({ results: [row] });
      return statement;
    },
  };
  return db;
}

test("outbox leases jobs and records failed delivery for bounded retry", async () => {
  const db = outboxDb({ id: "job-1", lead_id: "lead-1", kind: "owner", to_email: "owner@example.com", payload: JSON.stringify({ siteName: "Test", lead: { name: "Avery", service: "Wedding" } }), attempts: 0, lead_status: "new" });
  const env = { DB: db, EMAIL_API_KEY: "test-key", EMAIL_FROM: "Test <test@example.com>" } as unknown as LeadEnv;
  const fakeFetch: typeof fetch = async () => new Response("provider down", { status: 503 });
  const result = await processOutbox(env, "2026-01-01T00:00:00.000Z", 20, fakeFetch);
  assert.deepEqual(result, { processed: 1, claimed: 1, sent: 0, failed: 1, cancelled: 0 });
  assert.ok(db.statements.some((entry: any) => entry.sql.includes("SET status='processing'")));
  const retry = db.statements.find((entry: any) => entry.sql.includes("SET status=?,attempts=?"));
  assert.equal(retry.args[0], "failed");
  assert.equal(retry.args[1], 1);
  assert.equal(retry.args[4], "job-1");
  assert.equal(retryDelaySeconds(20), 86_400);
});

test("outbox acknowledges deliveries and cancels only an advanced lead reminder", async () => {
  const ackDb = outboxDb({ id: "ack-1", lead_id: "lead-1", kind: "ack", to_email: "avery@example.com", payload: JSON.stringify({ siteName: "Test", name: "Avery" }), attempts: 0, lead_status: "new" });
  const env = { DB: ackDb, EMAIL_API_KEY: "test-key", EMAIL_FROM: "Test <test@example.com>" } as unknown as LeadEnv;
  const fetcher: typeof fetch = async (_input, init) => {
    assert.equal(new Headers(init?.headers).get("idempotency-key"), "ack-1");
    return new Response("{}", { status: 200 });
  };
  assert.deepEqual(await processOutbox(env, "2026-01-01T00:00:00.000Z", 20, fetcher), { processed: 1, claimed: 1, sent: 1, failed: 0, cancelled: 0 });

  const reminderDb = outboxDb({ id: "reminder-1", lead_id: "lead-1", kind: "reminder", to_email: "owner@example.com", payload: "{}", attempts: 0, lead_status: "contacted" });
  const reminderResult = await processOutbox({ DB: reminderDb } as unknown as LeadEnv, "2026-01-01T00:00:00.000Z");
  assert.deepEqual(reminderResult, { processed: 1, claimed: 0, sent: 0, failed: 0, cancelled: 1 });
  assert.ok(reminderDb.statements.some((entry: any) => entry.sql.includes("SET status='cancelled'")));

  const ownerDb = outboxDb({ id: "owner-1", lead_id: "lead-1", kind: "owner", to_email: "owner@example.com", payload: JSON.stringify({ siteName: "Test", lead: { name: "Avery", service: "Wedding" } }), attempts: 0, lead_status: "contacted" });
  const ownerFetch: typeof fetch = async () => new Response("{}", { status: 200 });
  const ownerResult = await processOutbox({ DB: ownerDb, EMAIL_API_KEY: "test-key", EMAIL_FROM: "Test <test@example.com>" } as unknown as LeadEnv, "2026-01-01T00:00:00.000Z", 20, ownerFetch);
  assert.equal(ownerResult.sent, 1, "the immediate owner notification remains deliverable after the lead advances");
});

test("outbox missing configuration retries then moves exhausted jobs to dead", async () => {
  let calls = 0;
  const noConfigDb = outboxDb({ id: "job-2", lead_id: "lead-1", kind: "owner", to_email: "owner@example.com", payload: JSON.stringify({ siteName: "Test", lead: { name: "Avery", service: "Wedding" } }), attempts: 0, lead_status: "new" });
  const noConfig = await processOutbox({ DB: noConfigDb } as unknown as LeadEnv, "2026-01-01T00:00:00.000Z", 20, async () => { calls++; return new Response(null, { status: 200 }); });
  assert.equal(noConfig.failed, 1);
  assert.equal(calls, 0);

  const exhaustedDb = outboxDb({ id: "job-dead", lead_id: "lead-1", kind: "owner", to_email: "owner@example.com", payload: JSON.stringify({ siteName: "Test", lead: { name: "Avery", service: "Wedding" } }), attempts: 7, lead_status: "new" });
  const exhausted = await processOutbox({ DB: exhaustedDb } as unknown as LeadEnv, "2026-01-01T00:00:00.000Z", 20, async () => new Response(null, { status: 500 }));
  assert.equal(exhausted.failed, 1);
  const dead = exhaustedDb.statements.find((entry: any) => entry.sql.includes("SET status=?,attempts=?"));
  assert.equal(dead.args[0], "dead");
  assert.equal(dead.args[1], 8);
});

test("webhook delivery carries an HMAC signature and stable idempotency", async () => {
  const db = outboxDb({ id: "hook-1", lead_id: "lead-1", kind: "webhook", to_email: "https://hooks.example.test/leads", payload: "{\"event\":\"lead.created\"}", attempts: 0, lead_status: "new" });
  const env = { DB: db, LEAD_WEBHOOK_SECRET: "secret" } as unknown as LeadEnv;
  const fetcher: typeof fetch = async (_input, init) => {
    const headers = new Headers(init?.headers);
    assert.match(headers.get("x-lead-signature") || "", /^sha256=[a-f0-9]{64}$/);
    assert.equal(headers.get("idempotency-key"), "hook-1");
    return new Response("{}", { status: 202 });
  };
  assert.deepEqual(await processOutbox(env, "2026-01-01T00:00:00.000Z", 20, fetcher), { processed: 1, claimed: 1, sent: 1, failed: 0, cancelled: 0 });
});
