export type LeadStatus = "new" | "contacted" | "consultation" | "booked" | "closed";
export type LeadKind = "owner" | "ack" | "reminder" | "webhook";
export type LeadInput = {
  name: string; email: string; phone?: string; eventDate?: string; location?: string;
  guestCount?: number; budget?: string; service: string; message: string; consent: true;
  source?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string;
};
export type LeadEnv = {
  DB: D1Database; TURNSTILE_SECRET_KEY?: string; ADMIN_API_TOKEN?: string;
  EMAIL_API_KEY?: string; EMAIL_FROM?: string; LEAD_NOTIFICATION_EMAIL?: string;
  LEAD_WEBHOOK_URL?: string; LEAD_WEBHOOK_SECRET?: string; LEAD_RATE_LIMIT_SALT?: string;
  ENVIRONMENT?: string; LEADS_ALLOW_UNVERIFIED_LOCAL?: string;
};
export const STATUSES: LeadStatus[] = ["new", "contacted", "consultation", "booked", "closed"];
export const MAX_OUTBOX_ATTEMPTS = 8;
export const retryDelaySeconds = (attempt: number) => Math.min(86_400, 60 * 2 ** Math.min(Math.max(1, attempt), 11));

const FIELD_LIMITS: Record<string, number> = {
  name: 120, email: 254, phone: 40, eventDate: 10, location: 200, budget: 80,
  service: 100, message: 4000, source: 120, utmSource: 120, utmMedium: 120, utmCampaign: 120,
};
function field(raw: Record<string, unknown>, key: string, max: number): string {
  const value = raw[key];
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") throw new Error(`The ${key} field is invalid.`);
  const normalized = value.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (normalized.length > max) throw new Error(`The ${key} field is too long.`);
  return normalized;
}

export function validateLead(raw: unknown, now = new Date()): LeadInput {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Please submit a valid inquiry.");
  const data = raw as Record<string, unknown>;
  const name = field(data, "name", FIELD_LIMITS.name);
  const email = field(data, "email", FIELD_LIMITS.email).toLowerCase();
  const service = field(data, "service", FIELD_LIMITS.service);
  const message = field(data, "message", FIELD_LIMITS.message);
  const consent = data.consent === true || data.consent === "true" || data.consent === "on" || data.consent === "yes";
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !service || message.length < 5 || !consent) {
    throw new Error("Please provide valid contact details, a service, a message, and consent.");
  }

  const eventDate = field(data, "eventDate", FIELD_LIMITS.eventDate) || undefined;
  if (eventDate) {
    const date = new Date(`${eventDate}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== eventDate || date.getTime() <= now.getTime()) {
      throw new Error("Event date must be a valid future date.");
    }
  }
  let guestCount: number | undefined;
  if (data.guestCount !== undefined && data.guestCount !== "") {
    guestCount = Number(data.guestCount);
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 100_000) throw new Error("Guest count is invalid.");
  }

  return {
    name, email, phone: field(data, "phone", FIELD_LIMITS.phone) || undefined, eventDate,
    location: field(data, "location", FIELD_LIMITS.location) || undefined, guestCount,
    budget: field(data, "budget", FIELD_LIMITS.budget) || undefined, service, message, consent: true,
    source: field(data, "source", FIELD_LIMITS.source) || undefined,
    utmSource: field(data, "utmSource", FIELD_LIMITS.utmSource) || undefined,
    utmMedium: field(data, "utmMedium", FIELD_LIMITS.utmMedium) || undefined,
    utmCampaign: field(data, "utmCampaign", FIELD_LIMITS.utmCampaign) || undefined,
  };
}

export function isAuthorized(request: Request, token?: string) {
  return !!token && request.headers.get("authorization") === `Bearer ${token}`;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}
export async function verifyTurnstile(token: string, secret: string, ip?: string, hostname?: string) {
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body,
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Turnstile returned ${response.status}`);
  const data = await response.json() as { success?: boolean; hostname?: string; action?: string };
  return data.success === true && (!data.action || data.action === "inquiry") && (!hostname || data.hostname === hostname);
}
export async function sha256(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
export async function fingerprintLead(input: LeadInput) { return sha256(JSON.stringify(input)); }

export class IdempotencyConflictError extends Error {
  constructor() { super("This idempotency key was already used for a different inquiry."); }
}
export async function createLead(env: LeadEnv, input: LeadInput, opts: {
  id: string; createdAt: string; idempotencyKey: string; notificationEmail?: string;
  siteName: string; webhookUrl?: string;
}) {
  const db = env.DB;
  const fingerprint = await fingerprintLead(input);
  const ownerId = `${opts.id}:owner`, ackId = `${opts.id}:ack`, reminderId = `${opts.id}:reminder`;
  const ownerPayload = JSON.stringify({ siteName: opts.siteName, lead: input });
  const webhookPayload = JSON.stringify({ siteName: opts.siteName, lead: input });
  const dueTomorrow = new Date(Date.parse(opts.createdAt) + 86_400_000).toISOString();
  const statements = [
    db.prepare(`INSERT INTO leads (id,idempotency_key,request_fingerprint,name,email,phone,event_date,location,guest_count,budget,service,message,consent,source,utm_source,utm_medium,utm_campaign,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(idempotency_key) DO NOTHING`)
      .bind(opts.id, opts.idempotencyKey, fingerprint, input.name, input.email, input.phone ?? null, input.eventDate ?? null, input.location ?? null, input.guestCount ?? null, input.budget ?? null, input.service, input.message, 1, input.source ?? null, input.utmSource ?? null, input.utmMedium ?? null, input.utmCampaign ?? null, "new", opts.createdAt, opts.createdAt),
    db.prepare(`INSERT INTO lead_outbox(id,lead_id,kind,to_email,payload,status,due_at,created_at) SELECT ?,id,'owner',?,?,'pending',?,? FROM leads WHERE idempotency_key=? AND request_fingerprint=? ON CONFLICT(lead_id,kind) DO NOTHING`)
      .bind(ownerId, opts.notificationEmail ?? null, ownerPayload, opts.createdAt, opts.createdAt, opts.idempotencyKey, fingerprint),
    db.prepare(`INSERT INTO lead_outbox(id,lead_id,kind,to_email,payload,status,due_at,created_at) SELECT ?,id,'ack',email,?,'pending',?,? FROM leads WHERE idempotency_key=? AND request_fingerprint=? ON CONFLICT(lead_id,kind) DO NOTHING`)
      .bind(ackId, JSON.stringify({ siteName: opts.siteName, name: input.name }), opts.createdAt, opts.createdAt, opts.idempotencyKey, fingerprint),
    db.prepare(`INSERT INTO lead_outbox(id,lead_id,kind,to_email,payload,status,due_at,created_at) SELECT ?,id,'reminder',?,?,'pending',?,? FROM leads WHERE idempotency_key=? AND request_fingerprint=? ON CONFLICT(lead_id,kind) DO NOTHING`)
      .bind(reminderId, opts.notificationEmail ?? null, ownerPayload, dueTomorrow, opts.createdAt, opts.idempotencyKey, fingerprint),
  ];
  if (opts.webhookUrl) statements.push(db.prepare(`INSERT INTO lead_outbox(id,lead_id,kind,to_email,payload,status,due_at,created_at) SELECT ?,id,'webhook',?,?,'pending',?,? FROM leads WHERE idempotency_key=? AND request_fingerprint=? ON CONFLICT(lead_id,kind) DO NOTHING`)
    .bind(`${opts.id}:webhook`, opts.webhookUrl, webhookPayload, opts.createdAt, opts.createdAt, opts.idempotencyKey, fingerprint));
  const results = await db.batch(statements);
  const created = results[0]?.meta?.changes === 1;
  const existing = await db.prepare("SELECT id,request_fingerprint FROM leads WHERE idempotency_key=?")
    .bind(opts.idempotencyKey).first<{ id: string; request_fingerprint: string }>();
  if (!existing) throw new Error("Lead insert did not produce a row.");
  if (existing.request_fingerprint !== fingerprint) throw new IdempotencyConflictError();
  return { created, id: existing.id };
}

type OutboxRow = {
  id: string; lead_id: string; kind: LeadKind; to_email: string | null; payload: string;
  status: string; attempts: number; lead_status: LeadStatus;
};
async function deliverOutbox(env: LeadEnv, row: OutboxRow, fetcher: typeof fetch) {
  const data = JSON.parse(row.payload) as { siteName: string; name?: string; lead?: LeadInput };
  if (row.kind === "webhook") {
    if (!row.to_email || !env.LEAD_WEBHOOK_SECRET) throw new Error("Webhook URL/secret configuration missing.");
    const webhook = new URL(row.to_email);
    if (webhook.protocol !== "https:" || webhook.username || webhook.password) throw new Error("Webhook URL must be a credential-free HTTPS URL.");
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.LEAD_WEBHOOK_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(row.payload)));
    const hex = [...signature].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    const response = await fetcher(row.to_email, { method: "POST", headers: { "content-type": "application/json", "x-lead-signature": `sha256=${hex}`, "idempotency-key": row.id }, body: row.payload, signal: AbortSignal.timeout(10_000), redirect: "error" });
    if (!response.ok) throw new Error(`Webhook returned ${response.status}`);
    return;
  }
  if (!env.EMAIL_API_KEY || !env.EMAIL_FROM || !row.to_email) throw new Error("Email configuration/recipient missing.");
  const isAck = row.kind === "ack";
  const subject = isAck ? `We received your inquiry for ${data.siteName}` : `New inquiry: ${data.lead?.name} — ${data.lead?.service}`;
  const html = isAck
    ? `<p>Hi ${escapeHtml(data.name ?? "there")},</p><p>Thanks for contacting ${escapeHtml(data.siteName)}. We received your inquiry and will follow up.</p>`
    : `<p>${row.kind === "reminder" ? "Unadvanced inquiry reminder" : "New inquiry"} for ${escapeHtml(data.siteName)}.</p><pre>${escapeHtml(JSON.stringify(data.lead, null, 2))}</pre>`;
  const response = await fetcher("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${env.EMAIL_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": row.id },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [row.to_email], subject, html }), signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Resend returned ${response.status}`);
}

export async function processOutbox(env: LeadEnv, now = new Date().toISOString(), limit = 20, fetcher: typeof fetch = fetch) {
  const db = env.DB;
  const startedAt = Date.now();
  await db.prepare("DELETE FROM lead_rate_limits WHERE rowid IN (SELECT rowid FROM lead_rate_limits WHERE window_start < ? ORDER BY window_start LIMIT 100)")
    .bind(Math.floor(Date.parse(now) / 60_000) - 120).run();
  const rows = (await db.prepare(`SELECT o.*,l.status lead_status FROM lead_outbox o JOIN leads l ON l.id=o.lead_id WHERE ((o.status IN ('pending','failed') AND o.due_at<=?) OR (o.status='processing' AND o.lease_expires_at<=?)) ORDER BY o.due_at LIMIT ?`)
    .bind(now, now, Math.min(50, Math.max(1, limit))).all<OutboxRow>()).results;
  let sent = 0, failed = 0, cancelled = 0, claimed = 0;
  for (const row of rows) {
    if (row.kind === "reminder" && row.lead_status !== "new") {
      await db.prepare("UPDATE lead_outbox SET status='cancelled',claim_token=NULL,lease_expires_at=NULL WHERE id=? AND status!='sent'").bind(row.id).run();
      cancelled++;
      continue;
    }
    const claim = crypto.randomUUID();
    const claimedAt = new Date(Date.parse(now) + Math.max(0, Date.now() - startedAt)).toISOString();
    const leaseExpires = new Date(Date.parse(claimedAt) + 60_000).toISOString();
    const result = await db.prepare(`UPDATE lead_outbox SET status='processing',claim_token=?,lease_expires_at=? WHERE id=? AND ((status IN ('pending','failed') AND due_at<=?) OR (status='processing' AND lease_expires_at<=?)) AND (kind!='reminder' OR EXISTS (SELECT 1 FROM leads WHERE leads.id=lead_outbox.lead_id AND status='new'))`)
      .bind(claim, leaseExpires, row.id, claimedAt, claimedAt).run();
    if (!result.meta.changes) continue;
    claimed++;
    try {
      // Injected fetcher keeps delivery behavior testable without network access.
      await deliverOutbox({ ...env, DB: db }, row, fetcher);
      await db.prepare("UPDATE lead_outbox SET status='sent',sent_at=?,last_error=NULL,claim_token=NULL,lease_expires_at=NULL WHERE id=? AND claim_token=?")
        .bind(now, row.id, claim).run();
      sent++;
    } catch (error) {
      const attempts = Number(row.attempts ?? 0) + 1;
      const status = attempts >= MAX_OUTBOX_ATTEMPTS ? "dead" : "failed";
      const due = new Date(Date.parse(now) + retryDelaySeconds(attempts) * 1000).toISOString();
      await db.prepare("UPDATE lead_outbox SET status=?,attempts=?,due_at=?,last_error=?,claim_token=NULL,lease_expires_at=NULL WHERE id=? AND claim_token=?")
        .bind(status, attempts, due, String(error).slice(0, 500), row.id, claim).run();
      failed++;
    }
  }
  return { processed: rows.length, claimed, sent, failed, cancelled };
}
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}
