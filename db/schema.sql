-- ═══════════════════════════════════════════════════════════════
-- CLOUDFLARE D1 SCHEMA — SEO Authority Affiliate Engine
-- Phase 2: Dynamic product data with live price updates
-- Phase 4: Godfather SEO Engine — Keywords, Ranks, Competitors
-- Run: wrangler d1 execute seo-authority-db --file=./db/schema.sql
-- ═══════════════════════════════════════════════════════════════

-- ── PHASE 2: Affiliate Engine Tables ─────────────────────────

-- Products table: the single source of truth for affiliate data
CREATE TABLE IF NOT EXISTS products (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  short_name    TEXT NOT NULL,
  price         TEXT NOT NULL,
  rating        REAL NOT NULL DEFAULT 0,
  rating_count  INTEGER NOT NULL DEFAULT 0,
  affiliate_url TEXT NOT NULL,
  image         TEXT NOT NULL DEFAULT '',
  badge         TEXT DEFAULT NULL,
  pros          TEXT NOT NULL DEFAULT '[]',    -- JSON array
  cons          TEXT NOT NULL DEFAULT '[]',    -- JSON array
  in_stock      INTEGER NOT NULL DEFAULT 1,   -- 0 = out of stock
  last_updated  TEXT NOT NULL DEFAULT (datetime('now')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Page-product mapping: which products appear on which pages
CREATE TABLE IF NOT EXISTS page_product_map (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  page_slug   TEXT NOT NULL,
  heading     TEXT NOT NULL,
  product_ids TEXT NOT NULL DEFAULT '[]',       -- JSON array of product IDs
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Affiliate redirects: URL cloaking with analytics
CREATE TABLE IF NOT EXISTS affiliate_redirects (
  slug          TEXT PRIMARY KEY,               -- e.g., "starter-kit"
  product_id    TEXT NOT NULL,
  target_url    TEXT NOT NULL,
  click_count   INTEGER NOT NULL DEFAULT 0,
  last_clicked  TEXT DEFAULT NULL,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ── PHASE 4: Godfather SEO Engine Tables ─────────────────────

-- Keywords: The intelligence database — what we're tracking
CREATE TABLE IF NOT EXISTS keywords (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  term           TEXT UNIQUE NOT NULL,
  difficulty     INTEGER DEFAULT 0,          -- 0-100 estimated difficulty
  search_volume  INTEGER DEFAULT 0,          -- Monthly search volume estimate
  intent         TEXT DEFAULT 'informational', -- informational, transactional, navigational
  silo           TEXT DEFAULT NULL,           -- Which content silo this belongs to
  priority       INTEGER DEFAULT 5,          -- 1-10 priority score
  status         TEXT DEFAULT 'tracking',    -- tracking, striking-distance, ranked, lost
  last_checked   DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rank logs: Historical position tracking per keyword
CREATE TABLE IF NOT EXISTS rank_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword_id  INTEGER NOT NULL,
  position    INTEGER DEFAULT 0,            -- 0 = not ranked
  url         TEXT DEFAULT NULL,            -- Which of our URLs ranks
  serp_data   TEXT DEFAULT '{}',           -- JSON blob of SERP features present
  timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(keyword_id) REFERENCES keywords(id)
);

-- Competitors: Domain-level intelligence
CREATE TABLE IF NOT EXISTS competitors (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  domain          TEXT UNIQUE NOT NULL,
  silo_structure  TEXT DEFAULT '{}',  -- JSON blob of their URL patterns/silos
  top_keywords    TEXT DEFAULT '[]',  -- JSON blob of keywords they rank for
  content_count   INTEGER DEFAULT 0,  -- Estimated number of content pages
  da_estimate     INTEGER DEFAULT 0,  -- Domain authority estimate 0-100
  last_scraped    DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Content gaps: Topics competitors cover that we don't
CREATE TABLE IF NOT EXISTS content_gaps (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  topic           TEXT NOT NULL,
  competitor_id   INTEGER,
  competitor_url  TEXT DEFAULT NULL,
  our_coverage    TEXT DEFAULT 'none',  -- none, partial, full
  priority        INTEGER DEFAULT 5,    -- 1-10 priority score
  assigned_silo   TEXT DEFAULT NULL,
  status          TEXT DEFAULT 'identified', -- identified, planned, writing, published
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(competitor_id) REFERENCES competitors(id)
);

-- Execution plans: AI-generated strategic plans
CREATE TABLE IF NOT EXISTS execution_plans (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_type       TEXT NOT NULL,        -- weekly-sprint, content-refresh, gap-fill
  plan_data       TEXT NOT NULL,        -- Full JSON execution plan from Strategy Agent
  status          TEXT DEFAULT 'pending', -- pending, executing, completed, failed
  results         TEXT DEFAULT '{}',    -- JSON results after execution
  created_by      TEXT DEFAULT 'strategy-agent',
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at    DATETIME DEFAULT NULL
);

-- Audit logs: Technical SEO health tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_type      TEXT NOT NULL,        -- lighthouse, accessibility, internal-links
  url             TEXT DEFAULT NULL,
  scores          TEXT NOT NULL,        -- JSON blob of scores
  issues          TEXT DEFAULT '[]',    -- JSON array of issues found
  timestamp       DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Outreach targets: Link building intelligence
CREATE TABLE IF NOT EXISTS outreach_targets (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  domain          TEXT NOT NULL,
  contact_page    TEXT DEFAULT NULL,
  relevance_score INTEGER DEFAULT 5,    -- 1-10 how relevant to our niche
  da_estimate     INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'identified', -- identified, pitched, responded, linked, rejected
  pitch_template  TEXT DEFAULT NULL,    -- Generated outreach email template
  notes           TEXT DEFAULT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_contacted  DATETIME DEFAULT NULL
);

-- ── Indexes for performance ──────────────────────────────────

-- Phase 2 indexes
CREATE INDEX IF NOT EXISTS idx_products_badge ON products(badge);
CREATE INDEX IF NOT EXISTS idx_page_map_slug ON page_product_map(page_slug);
CREATE INDEX IF NOT EXISTS idx_redirects_active ON affiliate_redirects(is_active);

-- Phase 4 indexes
CREATE INDEX IF NOT EXISTS idx_keywords_status ON keywords(status);
CREATE INDEX IF NOT EXISTS idx_keywords_silo ON keywords(silo);
CREATE INDEX IF NOT EXISTS idx_keywords_priority ON keywords(priority DESC);
CREATE INDEX IF NOT EXISTS idx_rank_logs_keyword ON rank_logs(keyword_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_rank_logs_position ON rank_logs(position);
CREATE INDEX IF NOT EXISTS idx_competitors_domain ON competitors(domain);
CREATE INDEX IF NOT EXISTS idx_content_gaps_status ON content_gaps(status);
CREATE INDEX IF NOT EXISTS idx_content_gaps_priority ON content_gaps(priority DESC);
CREATE INDEX IF NOT EXISTS idx_execution_plans_status ON execution_plans(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_type ON audit_logs(audit_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_status ON outreach_targets(status);
