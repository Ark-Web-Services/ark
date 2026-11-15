// ═══════════════════════════════════════════════════════════════
// ADMIN API — Plans endpoint
// SSR API for fetching execution plans
// Route: /admin/api/plans
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

  const limit = parseInt(url.searchParams.get("limit") || "10");

  try {
    const { results } = await db
      .prepare(
        "SELECT * FROM execution_plans ORDER BY created_at DESC LIMIT ?"
      )
      .bind(limit)
      .all();

    // Parse plan_data JSON for each result
    const plans = (results || []).map((plan: any) => ({
      ...plan,
      plan_data:
        typeof plan.plan_data === "string"
          ? JSON.parse(plan.plan_data)
          : plan.plan_data,
      results:
        typeof plan.results === "string"
          ? JSON.parse(plan.results)
          : plan.results,
    }));

    return new Response(JSON.stringify({ plans }), {
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
