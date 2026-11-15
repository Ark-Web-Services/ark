// ═══════════════════════════════════════════════════════════════
// ADMIN API — Ranks endpoint
// SSR API for fetching rank history data
// Route: /admin/api/ranks
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

  const keywordId = url.searchParams.get("keyword_id");
  const limit = parseInt(url.searchParams.get("limit") || "100");

  try {
    let query: string;
    let params: any[];

    if (keywordId) {
      query = `
        SELECT r.*, k.term
        FROM rank_logs r
        JOIN keywords k ON r.keyword_id = k.id
        WHERE r.keyword_id = ?
        ORDER BY r.timestamp DESC
        LIMIT ?
      `;
      params = [parseInt(keywordId), limit];
    } else {
      query = `
        SELECT r.*, k.term
        FROM rank_logs r
        JOIN keywords k ON r.keyword_id = k.id
        ORDER BY r.timestamp DESC
        LIMIT ?
      `;
      params = [limit];
    }

    const { results } = await db.prepare(query).bind(...params).all();

    return new Response(JSON.stringify({ ranks: results }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Query failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
