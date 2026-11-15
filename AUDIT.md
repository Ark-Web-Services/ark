# 🎩 Godfather SEO Engine — Complete Audit & Architecture Document

**Version:** 3.1 — Post-Backport
**Date:** Auto-generated
**Status:** ✅ Refactored & Production-Ready Template

---

## Overview

The Godfather SEO Engine is a multi-niche, AI-powered SEO authority site framework. Each repository is a single niche — "The {Niche} Guide" — intended to be the all-encompassing, single-source-of-truth Wikipedia for that niche, capturing traffic from every possible angle.

**Tech Stack:** Astro 5 + Cloudflare Pages + D1 + Drone CI
**Pipeline:** Orchestrator → Intel → Strategy → Writer → Review → PR → Audit → Deploy

---

## PART 1: Niche Configuration System

### Architecture: One Repo = One Niche

Every niche is its own repository, cloned from this template. All niche-specific configuration lives in a single file: `niche.config.ts`.

**This is a living file** — agents read from it AND update it as they discover new keywords, competitors, article maps, and silo structures.

```
/
├── niche.config.ts              ← Single source of truth (living file)
├── agents/
│   ├── orchestrator.ts          ← Upstream controller
│   ├── reviewer.ts              ← Quality review framework
│   ├── strategy.ts              ← Planning with search volume + freshness
│   ├── writer.ts                ← Content gen + refresh + fact-check
│   ├── outreach.ts              ← Human-gated suggestions
│   └── social-auditor.ts        ← Reddit community intelligence
├── scripts/
│   ├── gsc-intel.ts             ← Google Search Console API (replaces scraper)
│   ├── sitemap-heist.ts         ← Competitor sitemap parser (improved)
│   ├── audit.ts                 ← Technical audit (deployed URL)
│   ├── d1-sync.ts               ← Data sync to Cloudflare D1
│   └── internal-link-audit.ts   ← Content link checker
```

### What's in niche.config.ts

| Section | Fields | Purpose |
|---------|--------|---------|
| **Identity** | `id`, `siteName`, `tagline`, `url`, `description` | Site branding & SEO |
| **Author/E-E-A-T** | `name`, `bio`, `credentials`, `avatar`, `social` | Trust signals |
| **Silos** | Array of `{id, pillar, label, color, description, seoTitle?, seoDescription?, intro?, faq?, startHere?}` | Content architecture + hub-page SEO |
| **Navigation** | `primaryNav`, `footerNav` | Site structure |
| **SEO Intelligence** | `seedKeywords`, `competitors`, `nicheContext`, `contentGuidelines` | Agent prompts (living data) |
| **Tools** | `tools[]` (`{id, title, icon, description}`) | Interactive tools; `/tools/` is not built when empty |
| **Affiliates** | `defaultProducts`, `pageProductMap`, `affiliateDisclaimer` | Monetization |
| **Deployment** | `cloudflareProjectName`, `d1DatabaseName` | Infrastructure |
| **Scheduling** | `maxContentPerRun`, `maxReviewIterations` | Pipeline limits |
| **Social** | `redditSubreddits`, `communityForums`, `communityLinks`, `trustedSources` | Community channels + E-E-A-T sourcing |
| **Contact** | `contactEmail`, `nicheNoun` | Static-page copy and generated prose |

### Launching a New Niche: 4-Step Process

1. **Clone** this template repo, `npm install`
2. **Customize** — `npm run init-niche -- --niche "..." --domain ...` runs
   `agents/niche-customizer.ts`, which generates a complete `niche.config.ts`
   from a niche brief and validates it against the `NicheConfig` type before
   writing. `--dry-run` previews; `--force` is required to overwrite an
   already-customized repo.
3. **Provision** — `./scripts/setup-niche.sh` creates the Cloudflare Pages
   project, D1 database, GCP service account, Drone secrets and all six crons.
4. **Deploy** — `git push origin main`

Full runbook: [`docs/NICHE_SETUP.md`](docs/NICHE_SETUP.md).

---

## PART 2: Agent System Architecture

### Pipeline Overview

```
Orchestrator (assesses state, decides what to run)
    │
    ├── Intel Phase
    │   ├── GSC Intel (legal rank/traffic data)
    │   └── Sitemap Heist (competitor analysis)
    │
    ├── Strategy Phase
    │   ├── Data Enrichment (search volume, freshness, CTR)
    │   ├── Strategic Planning (Gemini Pro)
    │   └── Quality Review (reviewer framework)
    │
    ├── Editorial Phase
    │   ├── SERP Research (competitive intel fed to writer)
    │   ├── Content Generation (Claude — new + refresh)
    │   ├── Fact-Check Pass (Gemini Flash)
    │   └── Quality Review (reviewer framework)
    │
    ├── Outreach Phase (human-gated, monthly)
    │   └── Suggestions only — human reviews and sends
    │
    ├── Social Phase (human-gated, monthly)
    │   └── Reddit response suggestions — human reviews and posts
    │
    └── Deploy Phase
        ├── Create PR (human review gate)
        ├── Build + Lighthouse + Pa11y
        └── Cloudflare Pages deploy (after PR merge)
```

### 2.1 Orchestrator Agent — Grade: A

The upstream controller that manages everything. Assesses site state (startup/growth/maintenance), decides which pipelines to run, and coordinates execution.

**Key Features:**
- Detects site phase automatically (startup: <10 articles, growth: <50, maintenance: 50+)
- Checks for missing foundations (about page, pillar pages, RSS)
- Reviews audit logs and pending human reviews
- Generates status reports

### 2.2 Review Framework — Grade: A

Every agent's work passes through a separate reviewer (Gemini Pro at low temperature) before being accepted.

**How it works:**
1. Agent produces output
2. Reviewer scores against criteria template (1-10 per criterion)
3. If score < threshold → feedback sent back to agent
4. Agent re-generates with feedback
5. Max iterations cap (default: 3) prevents infinite loops
6. If cap hit → flagged for human review with improvement suggestion

**Review Templates:** Strategy, Writer, Outreach, Social Auditor — each with specific criteria and delivery format requirements.

### 2.3 Strategy Agent — Grade: A-

**Improvements implemented:**
- ✅ Search volume data — Uses GSC impressions as proxy for traffic potential
- ✅ Content freshness scoring — File modification dates with decay detection (fresh/aging/stale)
- ✅ CTR estimation — Direct from GSC click/impression data
- ✅ SERP feature awareness — CTR anomalies (good position + low CTR = featured snippet present)
- ✅ Multi-phase pipeline: Freshness → GSC Enrichment → Intelligence Gathering → Strategic Planning → Review
- ✅ Temperature: 0.2 (max consistency for strategic decisions)

### 2.4 Writer Agent — Grade: A-

**Improvements implemented:**
- ✅ SERP research before writing — GSC data + competitor topics fed into Claude prompt
- ✅ Fact-checking step — Gemini Flash verifies claims after generation
- ✅ Content quality validation — Review framework scores against 10 criteria
- ✅ Image placeholders — `<!-- IMAGE: description -->` markers for future generation
- ✅ Dynamic internal links — Discovers existing content collection at runtime
- ✅ Content refresh capability — `refreshContent()` updates existing articles
- ✅ External source citations — Requires 2+ authoritative external sources
- ✅ Temperature: 0.6 (more factual while keeping voice)
- ✅ Uses Claude (excellent for long-form writing quality)

### 2.5 Outreach Agent — Grade: B+

**Redesigned as human-gated:**
- ✅ Generates SUGGESTIONS only — nothing auto-sent
- ✅ Draft pitch templates marked as "REVIEW AND PERSONALIZE"
- ✅ Linkable asset ideas for genuine value creation
- ✅ All output marked with `status: PENDING_HUMAN_REVIEW`

### 2.6 Social Auditor — Grade: B+

**New agent for community engagement:**
- ✅ Discovers relevant subreddits (auto-suggest if none configured)
- ✅ Reads recent posts via Reddit JSON API (no auth needed)
- ✅ Identifies questions answerable from our knowledgebase
- ✅ Generates human-sounding response suggestions
- ✅ All output for HUMAN REVIEW — nothing auto-posted
- ✅ Responses lead with helpful answer, link is optional and natural

**NOTE:** This could evolve into a separate microservice called via API for multi-niche management. The current implementation as a pipeline step works for single-niche repos.

### 2.7 GSC Intelligence — Grade: A

**Replaces the fragile Google scraper entirely:**
- ✅ Uses official Google Search Console API (free, legal, reliable)
- ✅ Service account JWT authentication
- ✅ Real position data, clicks, impressions, CTR
- ✅ Graceful degradation — writes empty intelligence file if GSC not configured
- ✅ No CSS selector fragility, no IP blocking risk

### 2.8 Sitemap Heist — Grade: A-

**Improvements:**
- ✅ Proper XML tag extraction (no regex for document structure)
- ✅ Expanded sitemap discovery: robots.txt → 15+ known paths
- ✅ Sitemap URL caching — skips discovery on subsequent runs
- ✅ Reads competitors from niche.config.ts

### 2.9 Technical Audit — Grade: A-

**Improvements:**
- ✅ Runs against DEPLOYED URL (not file:// paths)
- ✅ Broken link detection (HEAD requests to all outbound links)
- ✅ Canonical validation (checks rel=canonical matches URL)
- ✅ Reads site URL from niche.config.ts

---

## PART 3: Gap Analysis — Resolved

### ✅ Previously Critical — Now Fixed

| # | Gap | Status | Resolution |
|---|-----|--------|------------|
| 1 | No Google Search Console integration | ✅ Fixed | `scripts/gsc-intel.ts` — full GSC API integration |
| 2 | No search volume data | ✅ Fixed | GSC impressions used as volume proxy in strategy agent |
| 3 | Writer has no SERP research | ✅ Fixed | GSC data + competitor topics fed into Claude prompt |
| 4 | Scraping Google will break | ✅ Fixed | Scraper removed, replaced with GSC API |
| 5 | No content refresh pipeline | ✅ Fixed | `refreshContent()` in writer agent |
| 6 | No human review gate | ✅ Fixed | Creates PR instead of direct commit + review framework |

### ✅ Previously Important — Now Fixed

| # | Gap | Status | Resolution |
|---|-----|--------|------------|
| 7 | No image pipeline | 🟡 Partial | Image placeholders (`<!-- IMAGE: -->`) — generation TBD |
| 8 | No content quality validation | ✅ Fixed | Review framework with scoring criteria |
| 9 | Missing pillar pages | ✅ Fixed | Orchestrator detects and flags for creation |
| 10 | No RSS feed | ✅ Fixed | `@astrojs/rss` added to dependencies |
| 11 | No /about/ page | ✅ Fixed | Orchestrator detects and flags for creation |
| 12 | No backlink monitoring | 🟡 Planned | Will build custom using GSC link data + Common Crawl |

### Remaining Items

| # | Item | Priority | Notes |
|---|------|----------|-------|
| 1 | AI image generation for content | Medium | Placeholder system in place, needs image gen API integration |
| 2 | Custom backlink monitor | Low | GSC provides some link data; Common Crawl for deeper analysis |
| 3 | Social auditor → microservice | Future | When managing multiple niches, extract to separate API service |
| 4 | Post schema carries domain-shaped optional fields | Low | `src/content/config.ts` still exposes `tankSize`, `temperature`, `phRange`, `lifespan`, `difficulty` — leftovers from the first niche. They are optional and harmless, but a generic `specs: {label, value}[]` rendered by `Sidebar.astro` would be the correct template shape |

---

## PART 4: Scheduling Architecture

### Decision: Git CI/CD (Drone) for Now

**Reasoning:** The goal is simplicity and getting content deployed quickly. Each niche is a git repo, Drone CI triggers pipelines on schedule. This works well for the current phase.

**Future evolution:** As the system scales to multiple niches, a centralized job queue (Redis + BullMQ + NestJS) may become the better architecture for managing queues across repos. But for MVP, git-based scheduling wins on simplicity.

> **Six-field crons.** Drone here uses `sec min hour dom mon dow`. A five-field
> expression is accepted and then misparses **silently**. The cron names
> registered by `scripts/setup-niche.sh` must match `trigger.cron` in
> `.drone.yml` exactly, or the pipeline never fires. Current set:
> `daily-observe` (`0 0 5 * * *`), `nightly-gsc` (`0 0 6 * * *`),
> `weekly-content` (`0 0 6 * * 1`), `visual-distribution` (`0 0 9 * * 2`),
> `weekly-audit` (`0 0 7 * * 3`), `weekly-backlinks` (`0 0 8 * * 5`).

### Scheduled Pipelines

**`daily-observe`** — community + search observation feeding the work queue.

**`nightly-gsc`** — Search Console sync; sitemap submission and recrawl requests.

**`weekly-content`** (the sprint):
- Orchestrator → GSC Intel → Sitemap Heist → D1 Sync → Strategy → Writer → gated publish → Build + Audit + Deploy
- Cost: ~$2-5/week (AI API calls)

**`weekly-audit`** — technical SEO audit, including the sitemap `lastmod`
staleness guard.

**`weekly-backlinks`** — backlink prospect queue (human-gated; outreach is never
sent automatically).

**`visual-distribution`** — Pinterest / Imgur / Tumblr distribution.

**On Deploy** (triggered by push to main):
- Build → Lighthouse + Pa11y → Broken Link Check → Canonical Validation → Deploy → CF cache purge → post-deploy sitemap sync

### Schedule Summary

| Task | Frequency | Cost/Run | Trigger |
|------|-----------|----------|---------|
| Orchestrator assessment | Weekly | ~$0.01 | Cron |
| GSC rank sync | Weekly | Free | Cron |
| Competitor sitemap analysis | Weekly | Free | Cron |
| Strategy analysis + review | Weekly | ~$0.50 | Cron |
| Content generation (max 3) | Weekly | ~$1-3 | Cron |
| Content refresh | Weekly | ~$0.50-1 | Cron |
| Technical audit | On deploy | Free | PR merge |
| Outreach intelligence | Monthly | ~$0.10 | Cron |
| Social audit | Monthly | ~$0.20 | Cron |

**Estimated monthly cost: ~$15-25** (AI API usage)

---

## PART 5: Agent Prompt Quality & Model Selection

### Model Selection Philosophy

Models are referenced by capability tier, not specific version. Always use the latest available:

| Role | Model | Why |
|------|-------|-----|
| Strategic Planning | **Gemini Pro** | Best for structured analysis, JSON output, and multi-source reasoning |
| Quality Reviews | **Gemini Pro** | Consistent scoring at low temperature (0.2) |
| Content Writing | **Claude** | Superior long-form writing quality, editorial voice, nuance |
| Fact Checking | **Gemini Flash** | Fast, cheap, accurate for verification tasks |
| Outreach Suggestions | **Gemini Pro** | Good at analyzing relationship opportunities |
| Social Responses | **Gemini Pro** | Understands conversational context |

**Multi-pass approach:** Content is generated by Claude (writing quality), reviewed by Gemini Pro (consistency), and fact-checked by Gemini Flash (accuracy). This leverages each model's strengths.

### Temperature Settings

| Agent | Temperature | Reasoning |
|-------|------------|-----------|
| Strategy | 0.2 | Maximum consistency for strategic decisions |
| Writer | 0.6 | Factual but maintains editorial voice |
| Reviewer | 0.2 | Consistent scoring |
| Outreach | 0.4 | Precision for templates |
| Social | 0.4 | Natural but controlled |
| Fact-checker | 0.1 | Maximum accuracy |

---

## PART 6: Production Readiness Assessment

### ✅ Ready Out of the Box

- Site builds and deploys (Astro 5 + Cloudflare Pages)
- Structured data (Article, FAQ, Product, Breadcrumb JSON-LD)
- Admin dashboard for monitoring
- Affiliate system with D1 dynamic pricing
- Internal linking engine (hub-and-spoke silo model)
- AIO optimization (atomicAnswer for AI Agent Overviews)
- Content silo architecture from niche.config.ts
- Human review gate (PR-based workflow)
- Quality review framework (max iteration cap)
- Content refresh pipeline
- GSC-based intelligence (free, legal, reliable)

### 🟡 Needs Niche-Specific Setup

- Fill in `niche.config.ts` with your niche values
- Set up Google Search Console and service account
- Configure Cloudflare D1 database
- Set API keys (Gemini, Claude) in Drone secrets
- Add competitor domains to config
- Configure Reddit subreddits for social auditor

---

## PART 7: Implementation Summary

### What Changed from the Original

1. **niche.config.ts** — Single source of truth. All 17 previously hardcoded files now import from here.
2. **Scraper removed** — Replaced with `gsc-intel.ts` (Google Search Console API). No more CSS selector fragility.
3. **Review framework** — `agents/reviewer.ts` with templates, scoring, max iteration cap.
4. **Orchestrator** — `agents/orchestrator.ts` manages pipeline decisions based on site state.
5. **Strategy agent** — Now has search volume (GSC impressions), content freshness, CTR data.
6. **Writer agent** — SERP research before writing, fact-check pass, content refresh, dynamic internal links.
7. **Outreach agent** — Human-gated. Generates suggestions only, nothing auto-sent.
8. **Social auditor** — New. Finds Reddit opportunities, generates response suggestions for human review.
9. **Sitemap heist** — Proper XML parsing, expanded discovery, sitemap URL caching.
10. **Technical audit** — Runs against deployed URL, broken link detection, canonical validation.
11. **Drone CI** — Creates PR instead of direct commit. Multi-pipeline (weekly + monthly).
12. **Package.json** — Added `@astrojs/rss`, removed `@ulixee/hero` (scraper dependency).

### Files Created/Modified

| File | Status | Purpose |
|------|--------|---------|
| `niche.config.ts` | **NEW** | Single source of truth for all niche config |
| `agents/orchestrator.ts` | **NEW** | Upstream pipeline controller |
| `agents/reviewer.ts` | **NEW** | Quality review framework |
| `agents/social-auditor.ts` | **NEW** | Reddit community intelligence |
| `scripts/gsc-intel.ts` | **NEW** | Google Search Console API (replaces scraper) |
| `agents/strategy.ts` | **REWRITTEN** | Multi-phase with search volume + freshness |
| `agents/writer.ts` | **REWRITTEN** | SERP research + fact-check + refresh |
| `agents/outreach.ts` | **REWRITTEN** | Human-gated suggestions |
| `scripts/sitemap-heist.ts` | **REWRITTEN** | Proper XML, expanded discovery, caching |
| `scripts/audit.ts` | **REWRITTEN** | Deployed URL, broken links, canonicals |
| `scripts/d1-sync.ts` | **UPDATED** | Reads domain from niche.config.ts |
| `src/data/navigation.ts` | **UPDATED** | Imports from niche.config.ts |
| `src/data/affiliates.ts` | **UPDATED** | Imports from niche.config.ts |
| `src/content/config.ts` | **UPDATED** | Dynamic silo categories from config |
| `astro.config.mjs` | **UPDATED** | Site URL from niche.config.ts |
| `wrangler.toml` | **UPDATED** | Removed hardcoded niche values |
| `.env.example` | **UPDATED** | Removed SITE_URL/SITE_NAME (now in config) |
| `.drone.yml` | **REWRITTEN** | PR workflow + multi-pipeline |
| `package.json` | **UPDATED** | New scripts, dependencies |
| `public/robots.txt` | **UPDATED** | Removed hardcoded sitemap URL |
| `scripts/scraper.ts` | **REMOVED** | Replaced by gsc-intel.ts |
