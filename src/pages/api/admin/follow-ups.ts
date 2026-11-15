import type { APIRoute } from "astro";
import { isAuthorized, processOutbox, type LeadEnv } from "../../../lib/leads";

export const prerender = false;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
});

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime?.env as LeadEnv | undefined;
  if (!env?.DB) return json({ error: "Unavailable" }, 503);
  if (!isAuthorized(request, env.ADMIN_API_TOKEN)) return json({ error: "Unauthorized" }, 401);
  try {
    return json(await processOutbox(env, new Date().toISOString(), 20));
  } catch {
    return json({ error: "Outbox processing failed." }, 503);
  }
};
