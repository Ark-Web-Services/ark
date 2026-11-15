// ═══════════════════════════════════════════════════════════════
// WORK QUEUE API — token-gated, read-only "what to do next"
//
// GET /api/work-queue
//   Authorization: Bearer <WORK_QUEUE_TOKEN>
//
// Serves data/work-queue.json, generated at build time by
// scripts/build-work-queue.ts from the audit, the engine ledger, the
// backlink prospects and the latest GSC observation.
//
// Why this exists separately from /admin/engine/: that dashboard is HTML
// behind Cloudflare Access, which a scheduled agent cannot authenticate
// through. This endpoint is deliberately OUTSIDE /admin/* so a bearer
// token is sufficient, and it is read-only — there is no write path.
//
// Filters: ?priority=P0,P1  ?kind=content-gap,interactive-tool  ?limit=10
// ═══════════════════════════════════════════════════════════════

import type { APIRoute } from "astro";
// Bundled at build time on purpose: this route is SSR on Cloudflare
// Workers, where node:fs does not exist.
import queue from "../../../data/work-queue.json";

export const prerender = false; // SSR

/**
 * Timing-safe string comparison.
 *
 * A plain `===` on a secret leaks its length and, in principle, a prefix
 * through response timing. Workers have no crypto.timingSafeEqual, so
 * compare every byte and accumulate rather than returning early.
 */
function safeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  // Length inequality is unavoidably observable; still compare fully.
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return diff === 0;
}

const json = (body: unknown, status: number, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Never cache an authenticated response at the edge or in a shared proxy.
      "Cache-Control": "no-store, private",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      ...extraHeaders,
    },
  });

export const GET: APIRoute = async ({ request, locals }) => {
  const expected =
    (locals as { runtime?: { env?: Record<string, string> } })?.runtime?.env?.WORK_QUEUE_TOKEN ??
    // Local `astro dev` reads from process.env; Workers uses locals.runtime.env.
    (typeof process !== "undefined" ? process.env?.WORK_QUEUE_TOKEN : undefined);

  // Fail closed. An unset token must not mean "open to everyone".
  if (!expected) {
    return json(
      { error: "endpoint_not_configured", detail: "WORK_QUEUE_TOKEN is not set on this deployment." },
      503,
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const presented = /^Bearer\s+(.+)$/i.exec(header)?.[1]?.trim() ?? "";
  if (!presented || !safeEqual(presented, expected)) {
    return json({ error: "unauthorized" }, 401, { "WWW-Authenticate": 'Bearer realm="work-queue"' });
  }

  const url = new URL(request.url);
  const csv = (name: string) =>
    (url.searchParams.get(name) ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

  const priorities = csv("priority").map((value) => value.toUpperCase());
  const kinds = csv("kind");
  const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : 200;

  // Declared explicitly rather than inferred from the JSON: the committed
  // seed ships with `items: []`, which would infer as `never[]` and make
  // every field access below a type error on a freshly cloned niche.
  type Item = {
    priority: string;
    kind: string;
    [key: string]: unknown;
  };
  let items = queue.items as Item[];
  if (priorities.length) items = items.filter((item) => priorities.includes(item.priority));
  if (kinds.length) items = items.filter((item) => kinds.includes(item.kind));
  const total = items.length;
  items = items.slice(0, limit);

  return json(
    {
      generatedAt: queue.generatedAt,
      site: queue.site,
      sources: queue.sources,
      counts: queue.counts,
      policy: queue.policy,
      filtered: { priority: priorities, kind: kinds, limit, matched: total, returned: items.length },
      items,
    },
    200,
  );
};

// Any other method is rejected outright — this endpoint has no write path.
export const ALL: APIRoute = async () =>
  json({ error: "method_not_allowed", detail: "This endpoint is read-only. Use GET." }, 405, { Allow: "GET" });
