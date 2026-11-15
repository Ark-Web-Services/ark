import type { APIRoute } from "astro";
import business from "../../../business.config";
import { createLead, IdempotencyConflictError, sameOrigin, sha256, validateLead, verifyTurnstile, type LeadEnv } from "../../lib/leads";

export const prerender=false;
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
function isHtmlRequest(request: Request) { return request.headers.get("accept")?.includes("text/html") ?? false; }
export function htmlResult(message: string, email: string, status: number) {
  const safeMessage = message.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
  const safeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? encodeURIComponent(email) : "";
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Inquiry</title><main><h1>${safeMessage}</h1><p><a href="/contact/">Return to contact</a>${safeEmail ? ` · <a href="mailto:${safeEmail}">Email us</a>` : ""}</p></main></html>`, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
function result(request: Request, message: string, email: string, status: number, ok = false, id?: string) {
  return isHtmlRequest(request) ? htmlResult(message, email, status) : json(ok ? { ok: true, message, ...(id ? { id } : {}) } : { error: message }, status);
}
async function readBody(request: Request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 20_000) throw new RangeError("too-large");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid-body");
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > 20_000) { await reader.cancel(); throw new RangeError("too-large"); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const text = new TextDecoder().decode(bytes);
  if (request.headers.get("content-type")?.includes("application/json")) return JSON.parse(text) as unknown;
  return Object.fromEntries(new URLSearchParams(text));
}

export const POST: APIRoute = async ({ request, locals }) => {
  const cfg = business as any;
  const friendly = (message: string, status: number, ok = false, id?: string) => result(request, message, cfg.email ?? "", status, ok, id);
  if (cfg.enabled === false || cfg.inquiries?.enabled === false) return friendly("Inquiry capture is unavailable.", 404);
  if (!sameOrigin(request)) return friendly("This form request could not be verified. Return to the contact page and try again.", 403);
  const env = (locals as any).runtime?.env as LeadEnv | undefined;
  if (!env?.DB) return friendly("The inquiry service is temporarily unavailable. Please email us.", 503);

  let raw: any;
  try { raw = await readBody(request); }
  catch (error) {
    if (error instanceof RangeError) return friendly("The submitted form is too large. Please shorten your message and try again.", 413);
    return friendly("The submitted form could not be read. Please try again.", 400);
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return friendly("Please submit a valid inquiry.", 400);
  if (typeof raw.website === "string" && raw.website.trim()) return friendly(cfg.inquiries?.successMessage || "Thank you. Your inquiry was received.", 200, true);

  let input: ReturnType<typeof validateLead>;
  try {
    input = validateLead(raw);
    const services = (cfg.services || []).map((service: any) => [service.id, service.title]).flat();
    if (services.length && input.service !== "other" && !services.includes(input.service)) throw new Error("Please select a listed service.");
  } catch (error) { return friendly((error as Error).message, 400); }

  const url = new URL(request.url);
  const localAllowed = env.ENVIRONMENT !== "production" && env.LEADS_ALLOW_UNVERIFIED_LOCAL === "true" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  const ip = request.headers.get("cf-connecting-ip") || undefined;
  const isLoopback = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  const developmentEnvironment = ["development", "test", "local"].includes((env.ENVIRONMENT || "").toLowerCase());
  const production = !isLoopback && !developmentEnvironment;
  if (production && (!ip || !env.LEAD_RATE_LIMIT_SALT)) return friendly("The inquiry service is temporarily unavailable. Please email us.", 503);
  try {
    const captcha = typeof raw["cf-turnstile-response"] === "string" ? raw["cf-turnstile-response"] : "";
    if (!localAllowed && (!env.TURNSTILE_SECRET_KEY || !captcha || !await verifyTurnstile(captcha, env.TURNSTILE_SECRET_KEY, ip, url.hostname))) {
      return friendly("Please complete the verification challenge and try again.", 400);
    }
    if (ip) {
      const salt = env.LEAD_RATE_LIMIT_SALT || "local-development-only";
      const hash = await sha256(`${salt}:${ip}`);
      const window = Math.floor(Date.now() / 60_000);
      await env.DB.prepare("INSERT INTO lead_rate_limits(ip_hash,window_start,hits) VALUES(?,?,1) ON CONFLICT(ip_hash,window_start) DO UPDATE SET hits=hits+1")
        .bind(hash, window).run();
      const row = await env.DB.prepare("SELECT hits FROM lead_rate_limits WHERE ip_hash=? AND window_start=?").bind(hash, window).first<{ hits: number }>();
      if ((row?.hits ?? 0) > 5) return friendly("Please wait before submitting another inquiry.", 429);
    }
    const key = String(request.headers.get("idempotency-key") || raw.idempotencyKey || "").trim();
    if (key && !/^[a-zA-Z0-9._:-]{8,128}$/.test(key)) return friendly("The inquiry retry key is invalid. Please reload the form and try again.", 400);
    const resultRow = await createLead(env, input, {
      id: crypto.randomUUID(), createdAt: new Date().toISOString(), idempotencyKey: key || crypto.randomUUID(),
      notificationEmail: env.LEAD_NOTIFICATION_EMAIL || cfg.email, siteName: cfg.name || "Our team", webhookUrl: env.LEAD_WEBHOOK_URL,
    });
    return friendly(cfg.inquiries?.successMessage || "Thank you. Your inquiry was received.", resultRow.created ? 201 : 200, true, resultRow.id);
  } catch (error) {
    if (error instanceof IdempotencyConflictError) return friendly(error.message, 409);
    return friendly("The inquiry could not be saved. Please try again or email us.", 503);
  }
};
