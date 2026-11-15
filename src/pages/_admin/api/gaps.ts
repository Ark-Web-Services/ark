// ═══════════════════════════════════════════════════════════════
// ADMIN API — Gaps endpoint
// SSR API for fetching and updating content gaps
// Route: /admin/api/gaps
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

  const status = url.searchParams.get("status") || "identified";
  const limit = parseInt(url.searchParams.get("limit") || "30");

  try {
    const { results } = await db
      .prepare(
        "SELECT * FROM content_gaps WHERE status = ? ORDER BY priority DESC LIMIT ?"
      )
      .bind(status, limit)
      .all();

    return new Response(JSON.stringify({ gaps: results }), {
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

export const PATCH: APIRoute = async ({ request, locals }) => {
  const db = locals?.runtime?.env?.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "D1 not available" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json() as { id?: number; status?: string; priority?: number; assigned_silo?: string };
    const { id, status, priority, assigned_silo } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: "id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (status) {
      updates.push("status = ?");
      params.push(status);
    }
    if (priority !== undefined) {
      updates.push("priority = ?");
      params.push(priority);
    }
    if (assigned_silo) {
      updates.push("assigned_silo = ?");
      params.push(assigned_silo);
    }

    if (updates.length === 0) {
      return new Response(
        JSON.stringify({ error: "No fields to update" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    params.push(id);
    await db
      .prepare(`UPDATE content_gaps SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...params)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Update failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
