PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS leads (
 id TEXT PRIMARY KEY, idempotency_key TEXT NOT NULL UNIQUE, request_fingerprint TEXT NOT NULL,
 name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, event_date TEXT, location TEXT,
 guest_count INTEGER, budget TEXT, service TEXT NOT NULL, message TEXT NOT NULL,
 consent INTEGER NOT NULL CHECK(consent=1), source TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT,
 status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','consultation','booked','closed')),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS leads_created_idx ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status,created_at DESC);
CREATE TABLE IF NOT EXISTS lead_outbox (
 id TEXT PRIMARY KEY, lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
 kind TEXT NOT NULL CHECK(kind IN ('owner','ack','reminder','webhook')), to_email TEXT, payload TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('pending','failed','processing','sent','cancelled','dead')),
 attempts INTEGER NOT NULL DEFAULT 0, due_at TEXT NOT NULL, created_at TEXT NOT NULL,
 sent_at TEXT, last_error TEXT, claim_token TEXT, lease_expires_at TEXT, UNIQUE(lead_id,kind)
);
CREATE INDEX IF NOT EXISTS lead_outbox_due_idx ON lead_outbox(status,due_at);
CREATE TABLE IF NOT EXISTS lead_rate_limits (
 ip_hash TEXT NOT NULL, window_start INTEGER NOT NULL, hits INTEGER NOT NULL,
 PRIMARY KEY(ip_hash,window_start)
);
CREATE INDEX IF NOT EXISTS lead_rate_limits_window_idx ON lead_rate_limits(window_start);
