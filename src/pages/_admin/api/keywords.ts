// ═══════════════════════════════════════════════════════════════
// ADMIN API — Keywords endpoint
// SSR API for the admin dashboard to read/write keyword data
// Route: /admin/api/keywords
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

  const status = url.searchParams.get("status");
  const limit = parseInt(url.searchParams.get("limit") || "50");

  try {
    let query = "SELECT * FROM keywords";
    const params: any[] = [];

    if (status) {
      query += " WHERE status = ?";
      params.push(status);
    }

    query += " ORDER BY priority DESC, last_checked DESC LIMIT ?";
    params.push(limit);

    const { results } = await db.prepare(query).bind(...params).all();

    return new Response(JSON.stringify({ keywords: results }), {
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

export const POST: APIRoute = async ({ request, locals }) => {
  const db = locals?.runtime?.env?.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "D1 not available" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json() as { term?: string; difficulty?: number; search_volume?: number; intent?: string; silo?: string; priority?: number };
    const { term, difficulty, search_volume, intent, silo, priority } = body;

    if (!term) {
      return new Response(JSON.stringify({ error: "term is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await db
      .prepare(
        `INSERT INTO keywords (term, difficulty, search_volume, intent, silo, priority)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(term) DO UPDATE SET
           difficulty = COALESCE(?, difficulty),
           search_volume = COALESCE(?, search_volume),
           intent = COALESCE(?, intent),
           silo = COALESCE(?, silo),
           priority = COALESCE(?, priority),
           last_checked = datetime('now')`
      )
      .bind(
        term,
        difficulty || 0,
        search_volume || 0,
        intent || "informational",
        silo || null,
        priority || 5,
        difficulty,
        search_volume,
        intent,
        silo,
        priority
      )
      .run();

    return new Response(JSON.stringify({ success: true, term }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Insert failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
