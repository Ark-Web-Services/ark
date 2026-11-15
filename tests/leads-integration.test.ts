import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import business from "../business.config";
import { POST as submitInquiry } from "../src/pages/api/inquiries";
import { GET as listLeads, PATCH as updateLead } from "../src/pages/api/admin/leads";
import { processOutbox, type LeadEnv } from "../src/lib/leads";

type BoundStatement = {
  sql: string;
  args: unknown[];
  bind(...values: unknown[]): BoundStatement;
  run(): Promise<{ meta: { changes: number; last_row_id?: number } }>;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
};

function makeD1() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(new URL("../db/migrations/0001_leads.sql", import.meta.url), "utf8"));
  const db = {
    prepare(sql: string): BoundStatement {
      let args: unknown[] = [];
      const result: BoundStatement = {
        sql,
        args,
        bind(...values: unknown[]) { args = values; result.args = values; return result; },
        async run() {
          const output = sqlite.prepare(sql).run(...args as any[]);
          return { meta: { changes: Number(output.changes), last_row_id: Number(output.lastInsertRowid) } };
        },
        async first<T>() { return (sqlite.prepare(sql).get(...args as any[]) as T | undefined) ?? null; },
        async all<T>() { return { results: sqlite.prepare(sql).all(...args as any[]) as T[] }; },
      };
      return result;
    },
    async batch(statements: BoundStatement[]) {
      sqlite.exec("BEGIN");
      try {
        const results = statements.map((item) => {
          const output = sqlite.prepare(item.sql).run(...item.args as any[]);
          return { meta: { changes: Number(output.changes), last_row_id: Number(output.lastInsertRowid) } };
        });
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
    close() { sqlite.close(); },
    raw: sqlite,
  };
  return db;
}

function apiContext(request: Request, env: LeadEnv) {
  return { request, locals: { runtime: { env } } } as any;
}

function jsonRequest(url: string, body: unknown, extra: Record<string, string> = {}) {
  return new Request(url, {
    method: "POST",
    headers: { origin: new URL(url).origin, accept: "application/json", "content-type": "application/json", ...extra },
    body: JSON.stringify(body),
  });
}

function newLead(overrides: Record<string, unknown> = {}) {
  return {
    name: "Avery Jones", email: "avery@example.com", service: "other",
    message: "Please share availability for our event.", consent: true, eventDate: "2099-06-01",
    ...overrides,
  };
}

test("lead APIs and outbox work against migrated SQLite D1", async (t) => {
  const previous = {
    enabled: business.enabled,
    inquiriesEnabled: business.inquiries.enabled,
    services: business.services,
  };
  business.enabled = true;
  business.inquiries.enabled = true;
  business.services = [{ id: "wedding", title: "Wedding", description: "Wedding service" }];
  const db = makeD1();
  const env = {
    DB: db as unknown as D1Database,
    ADMIN_API_TOKEN: "integration-admin-token",
    ENVIRONMENT: "test",
    LEADS_ALLOW_UNVERIFIED_LOCAL: "true",
    LEAD_RATE_LIMIT_SALT: "integration-salt",
    LEAD_NOTIFICATION_EMAIL: "owner@example.com",
    EMAIL_API_KEY: "test-email-api-key",
    EMAIL_FROM: "Example Studio <hello@example.com>",
  } as unknown as LeadEnv;
  const baseUrl = "https://localhost/api/inquiries";

  try {
    await t.test("JSON capture, idempotency fingerprint, and safe conflicts", async () => {
      const first = await submitInquiry(apiContext(jsonRequest(baseUrl, newLead(), { "idempotency-key": "sqlite-key-0001" }), env));
      assert.equal(first.status, 201);
      const firstBody = await first.json() as { id: string; ok: boolean };
      assert.equal(firstBody.ok, true);
      assert.equal(typeof firstBody.id, "string", "JSON success retains the generated lead id for correlation");

      const replay = await submitInquiry(apiContext(jsonRequest(baseUrl, newLead(), { "idempotency-key": "sqlite-key-0001" }), env));
      assert.equal(replay.status, 200);
      assert.equal((await replay.json() as { id: string }).id, firstBody.id);
      assert.equal((await db.prepare("SELECT COUNT(*) n FROM leads WHERE idempotency_key=?").bind("sqlite-key-0001").first<{ n: number }>())?.n, 1);
      assert.equal((await db.prepare("SELECT COUNT(*) n FROM lead_outbox WHERE lead_id=?").bind(firstBody.id).first<{ n: number }>())?.n, 3);

      const changed = await submitInquiry(apiContext(jsonRequest(baseUrl, newLead({ message: "A different payload on this retry." }), { "idempotency-key": "sqlite-key-0001" }), env));
      assert.equal(changed.status, 409);
    });

    await t.test("HTML form posts return safe human pages and accept checkbox values", async () => {
      const values = new URLSearchParams({ name: "Casey Guest", email: "casey@example.com", service: "other", message: "Please contact me about availability.", consent: "yes", eventDate: "2099-07-01" });
      const response = await submitInquiry(apiContext(new Request(baseUrl, {
        method: "POST",
        headers: { origin: "https://localhost", accept: "text/html", "content-type": "application/x-www-form-urlencoded" },
        body: values,
      }), env));
      assert.equal(response.status, 201);
      assert.match(response.headers.get("content-type") || "", /text\/html/);
      const html = await response.text();
      assert.match(html, /Return to contact/);
      assert.match(html, /mailto:support%40arkwebservices.com/);
      assert.doesNotMatch(html, /Casey Guest/);
    });

    await t.test("malformed payloads, cross-origin, and oversized bodies are rejected", async () => {
      for (const body of ["null", "[]"]) {
        const response = await submitInquiry(apiContext(new Request(baseUrl, {
          method: "POST", headers: { origin: "https://localhost", "content-type": "application/json" }, body,
        }), env));
        assert.equal(response.status, 400);
      }
      const crossOrigin = await submitInquiry(apiContext(jsonRequest(baseUrl, newLead(), { origin: "https://attacker.example" }), env));
      assert.equal(crossOrigin.status, 403);
      const tooLarge = await submitInquiry(apiContext(new Request(baseUrl, {
        method: "POST", headers: { origin: "https://localhost", accept: "application/json", "content-type": "application/json" }, body: " ".repeat(20_001),
      }), env));
      assert.equal(tooLarge.status, 413);
    });

    await t.test("real SQL rate limiter blocks the sixth same-window request", async () => {
      let last: Response | undefined;
      for (let i = 0; i < 6; i++) {
        const request = jsonRequest(baseUrl, newLead(), { "cf-connecting-ip": "198.51.100.77", "idempotency-key": `rate-limit-key-${i.toString().padStart(4, "0")}` });
        last = await submitInquiry(apiContext(request, env));
      }
      assert.equal(last?.status, 429);
      const rows = await db.prepare("SELECT COUNT(*) n FROM lead_rate_limits WHERE ip_hash=?").bind("unused").first<{ n: number }>();
      assert.equal(rows?.n, 0);
      assert.equal((await db.prepare("SELECT SUM(hits) n FROM lead_rate_limits").first<{ n: number }>())?.n, 6);
    });

    await t.test("admin listing and status changes cancel only the reminder", async () => {
      const target = await db.prepare("SELECT id FROM leads WHERE idempotency_key=?").bind("sqlite-key-0001").first<{ id: string }>();
      assert.ok(target);
      const auth = { authorization: "Bearer integration-admin-token" };
      const patch = await updateLead(apiContext(new Request("https://localhost/api/admin/leads", {
        method: "PATCH", headers: { ...auth, "content-type": "application/json" }, body: JSON.stringify({ id: target!.id, status: "contacted" }),
      }), env));
      assert.equal(patch.status, 200);
      const jobs = await db.prepare("SELECT kind,status FROM lead_outbox WHERE lead_id=? ORDER BY kind").bind(target!.id).all<{ kind: string; status: string }>();
      assert.deepEqual(Object.fromEntries(jobs.results.map((row) => [row.kind, row.status])), { ack: "pending", owner: "pending", reminder: "cancelled" });
      const listed = await listLeads(apiContext(new Request("https://localhost/api/admin/leads", { headers: auth }), env));
      assert.equal(listed.status, 200);
      const body = await listed.json() as { counts: Record<string, number>; leads: Array<{ id: string }> };
      assert.ok(body.leads.some((lead) => lead.id === target!.id));
      assert.equal(body.counts.contacted, 1);
      const unauthorized = await listLeads(apiContext(new Request("https://localhost/api/admin/leads"), env));
      assert.equal(unauthorized.status, 401);
    });

    await t.test("outbox retries failures with stable IDs and marks successful sends", async () => {
      const job = await db.prepare("SELECT id FROM lead_outbox WHERE kind='owner' AND status='pending' ORDER BY created_at LIMIT 1").first<{ id: string }>();
      assert.ok(job);
      await db.prepare("UPDATE lead_outbox SET due_at='2999-01-01T00:00:00.000Z' WHERE id!=?").bind(job!.id).run();
      const now = new Date(Date.now() + 60_000).toISOString();
      let calls = 0;
      let seenKey = "";
      const failOnce: typeof fetch = async (_input, init) => {
        calls++;
        seenKey = new Headers(init?.headers).get("idempotency-key") || "";
        return new Response("temporary failure", { status: calls === 1 ? 503 : 200 });
      };
      const first = await processOutbox(env, now, 1, failOnce);
      assert.equal(first.failed, 1);
      assert.equal(seenKey, job!.id);
      const failed = await db.prepare("SELECT status,attempts FROM lead_outbox WHERE id=?").bind(job!.id).first<{ status: string; attempts: number }>();
      assert.deepEqual(failed && { status: failed.status, attempts: failed.attempts }, { status: "failed", attempts: 1 });

      const due = await db.prepare("SELECT due_at FROM lead_outbox WHERE id=?").bind(job!.id).first<{ due_at: string }>();
      const retry = await processOutbox(env, due!.due_at, 1, failOnce);
      assert.equal(retry.sent, 1);
      const delivered = await db.prepare("SELECT status,attempts FROM lead_outbox WHERE id=?").bind(job!.id).first<{ status: string; attempts: number }>();
      assert.deepEqual(delivered && { status: delivered.status, attempts: delivered.attempts }, { status: "sent", attempts: 1 });
    });

    await t.test("concurrent outbox runners deliver one pending job only once", async () => {
      const response = await submitInquiry(apiContext(jsonRequest(baseUrl, newLead(), { "idempotency-key": "concurrent-job-key-01" }), env));
      assert.equal(response.status, 201);
      const lead = await db.prepare("SELECT id FROM leads WHERE idempotency_key=?").bind("concurrent-job-key-01").first<{ id: string }>();
      assert.ok(lead);
      await db.prepare("UPDATE lead_outbox SET due_at='2999-01-01T00:00:00.000Z' WHERE lead_id!=? OR kind!='ack'").bind(lead!.id).run();
      let deliveries = 0;
      const fakeFetch: typeof fetch = async () => {
        deliveries++;
        await new Promise((resolve) => setTimeout(resolve, 5));
        return new Response("{}", { status: 200 });
      };
      const now = new Date().toISOString();
      const results = await Promise.all([
        processOutbox(env, now, 20, fakeFetch),
        processOutbox(env, now, 20, fakeFetch),
      ]);
      assert.equal(deliveries, 1);
      assert.equal(results.reduce((count, result) => count + result.sent, 0), 1);
      const ack = await db.prepare("SELECT status FROM lead_outbox WHERE lead_id=? AND kind='ack'").bind(lead!.id).first<{ status: string }>();
      assert.equal(ack?.status, "sent");
    });

    await t.test("D1 batch failure rolls back earlier statements", async () => {
      const before = (await db.prepare("SELECT COUNT(*) n FROM leads").first<{ n: number }>())?.n;
      await assert.rejects(() => db.batch([
        db.prepare("INSERT INTO leads (id,idempotency_key,request_fingerprint,name,email,service,message,consent,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
          .bind("rollback-id", "rollback-key", "fingerprint", "Rollback", "rollback@example.com", "other", "Testing transaction rollback", 1, "new", new Date().toISOString(), new Date().toISOString()),
        db.prepare("INSERT INTO table_that_does_not_exist(value) VALUES (?)").bind("force rollback"),
      ]));
      assert.equal((await db.prepare("SELECT COUNT(*) n FROM leads").first<{ n: number }>())?.n, before);
    });
  } finally {
    business.enabled = previous.enabled;
    business.inquiries.enabled = previous.inquiriesEnabled;
    business.services = previous.services;
    db.close();
  }
});
