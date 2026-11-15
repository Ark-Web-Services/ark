/// <reference path="../.astro/types.d.ts" />

// ═══════════════════════════════════════════════════════════════
// ENVIRONMENT TYPE DEFINITIONS
// Extends Astro's runtime with Cloudflare D1 bindings
// Phase 4: Extended with Godfather SEO Engine types
// ═══════════════════════════════════════════════════════════════

type D1Database = import("@cloudflare/workers-types").D1Database;

interface CloudflareEnv {
  DB: D1Database;
  SITE_URL: string;
  SITE_NAME: string;
  ENVIRONMENT: string;
  GA4_ID: string;
  GEMINI_API_KEY?: string;
  CLAUDE_API_KEY?: string;
}

type Runtime = import("@astrojs/cloudflare").Runtime<CloudflareEnv>;

declare namespace App {
  interface Locals extends Runtime {}
}

// ── Agent Types (shared across scripts and agents) ───────────
declare namespace GodfatherEngine {
  interface KeywordRecord {
    id: number;
    term: string;
    difficulty: number;
    search_volume: number;
    intent: string;
    silo: string | null;
    priority: number;
    status: string;
    last_checked: string;
    created_at: string;
  }

  interface RankLog {
    id: number;
    keyword_id: number;
    position: number;
    url: string | null;
    serp_data: string;
    timestamp: string;
  }

  interface Competitor {
    id: number;
    domain: string;
    silo_structure: string;
    top_keywords: string;
    content_count: number;
    da_estimate: number;
    last_scraped: string;
    created_at: string;
  }

  interface ContentGap {
    id: number;
    topic: string;
    competitor_id: number | null;
    competitor_url: string | null;
    our_coverage: string;
    priority: number;
    assigned_silo: string | null;
    status: string;
    created_at: string;
  }

  interface ExecutionPlan {
    id: number;
    plan_type: string;
    plan_data: string;
    status: string;
    results: string;
    created_by: string;
    created_at: string;
    completed_at: string | null;
  }

  interface AuditLog {
    id: number;
    audit_type: string;
    url: string | null;
    scores: string;
    issues: string;
    timestamp: string;
  }

  interface OutreachTarget {
    id: number;
    domain: string;
    contact_page: string | null;
    relevance_score: number;
    da_estimate: number;
    status: string;
    pitch_template: string | null;
    notes: string | null;
    created_at: string;
    last_contacted: string | null;
  }
}
