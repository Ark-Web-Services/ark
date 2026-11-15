// ═══════════════════════════════════════════════════════════════
// ADMIN API — Competitors endpoint
// SSR API for fetching competitor intelligence
// Route: /admin/api/competitors
// ═══════════════════════════════════════════════════════════════

import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  const db = locals?.runtime?.env?.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "D1 not available" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const limit = parseInt(url.searchParams.get("limit") || "20");

  try {
    const { results } = await db
      .prepare("SELECT * FROM competitors ORDER BY content_count DESC LIMIT ?")
      .bind(limit)
      .all();

    return new Response(JSON.stringify({ competitors: results }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Query failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
