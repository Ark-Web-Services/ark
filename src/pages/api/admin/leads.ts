import type { APIRoute } from "astro";
import { isAuthorized, STATUSES, type LeadEnv, type LeadStatus } from "../../../lib/leads";

export const prerender = false;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
});
function envOf(locals: any): LeadEnv | undefined { return locals.runtime?.env; }

export const GET: APIRoute = async ({ request, locals }) => {
  const env = envOf(locals);
  if (!env?.DB) return json({ error: "Unavailable" }, 503);
  if (!isAuthorized(request, env.ADMIN_API_TOKEN)) return json({ error: "Unauthorized" }, 401);
  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  const status = url.searchParams.get("status");
  if (status && !STATUSES.includes(status as LeadStatus)) return json({ error: "Invalid status." }, 400);
  const where = status ? " WHERE status = ?" : "";
  const statement = env.DB.prepare(`SELECT id,name,email,phone,event_date,location,guest_count,budget,service,message,source,utm_source,utm_medium,utm_campaign,status,created_at,updated_at FROM leads${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`);
  const { results } = await (status ? statement.bind(status, limit, offset) : statement.bind(limit, offset)).all();
  const counts = await env.DB.prepare("SELECT status,COUNT(*) count FROM leads GROUP BY status").all<{ status: string; count: number }>();
  return json({ leads: results, counts: Object.fromEntries(counts.results.map((row) => [row.status, row.count])), limit, offset });
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  const env = envOf(locals);
  if (!env?.DB) return json({ error: "Unavailable" }, 503);
  if (!isAuthorized(request, env.ADMIN_API_TOKEN)) return json({ error: "Unauthorized" }, 401);
  let body: any;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
  const id = typeof body?.id === "string" ? body.id : "";
  const status = body?.status as LeadStatus;
  if (!id || !STATUSES.includes(status)) return json({ error: "A valid id and status are required." }, 400);
  const result = await env.DB.prepare("UPDATE leads SET status=?,updated_at=? WHERE id=?").bind(status, new Date().toISOString(), id).run();
  if (!result.meta.changes) return json({ error: "Lead not found." }, 404);
  if (status !== "new") {
    await env.DB.prepare("UPDATE lead_outbox SET status='cancelled',claim_token=NULL,lease_expires_at=NULL WHERE lead_id=? AND kind='reminder' AND status IN ('pending','failed','processing')").bind(id).run();
  }
  return json({ ok: true, id, status });
};
