# Your Niche Site — Autonomous Authority Engine

**Master plan, template edition — 2026-09-17**

Goal: the site observes its search performance and configured communities
every day, synthesizes evidence once a week, and can ship one genuinely useful
article every week — with SEO health, internal linking, sitemap submission,
visual distribution, and backlink prospecting running on rails.

---

## 0. Where we actually are (verified from the repository 2026-09-17)

This template must not carry one site's historical metrics into a new niche.
Record a fresh baseline after `config.url` is live and Search Console has enough
data.

| Capability | Current template state |
| --- | --- |
| Push deployment | `default` pipeline: install → build → LLM reachability report → deploy → non-blocking GSC sync |
| Sitemap freshness | Post `lastmod` comes from git history through `src/lib/git-dates.ts`; full-history clones prevent stale or build-time dates |
| Daily observation | `npm run observe` is wired to `scripts/run-schedule.ts` |
| Weekly synthesis | `npm run analyze` is wired and constrained to IDs from `config.silos` |
| Weekly article | `npm run write:weekly` includes duplicate-keyword, link, fact-check, review, and TypeScript gates |
| Weekly SEO audit | `npm run audit:seo` is a non-blocking scheduled pipeline |
| Weekly backlinks | `npm run backlinks` creates a human-operated queue; it sends nothing |
| Visual distribution | `npm run distribute` runs only from its cron/custom pipeline and configured channels |
| Scheduled pipeline count | **Six**, not two: `nightly-gsc`, `visual-distribution`, `daily-observe`, `weekly-content`, `weekly-audit`, `weekly-backlinks` |
| D1 | Provisioned by setup but optional at runtime; its binding in `wrangler.toml` is currently commented out |

### Configuration contract

`niche.config.ts` is the source of truth, not this plan:

- Identity and canonical host: `config.id`, `config.siteName`, `config.url`,
  `config.contactEmail`, `config.nicheNoun`, `config.lang`, and `config.locale`.
- Editorial positioning: `config.nicheContext`, `config.contentGuidelines`,
  `config.seedKeywords`, `config.competitors`, and `config.author`.
- Information architecture: `config.silos`. Each `SiloConfig` can supply
  `id`, `pillar`, `label`, `color`, `description`, `seoTitle`,
  `seoDescription`, `intro`, `faq`, and `startHere`.
- Linkable utilities: `config.tools`; each ID corresponds to a route module
  already placed under the existing `src/pages/tools` directory.
- Community and evidence sources: `config.redditSubreddits`,
  `config.communityForums`, `config.communityLinks`, and
  `config.trustedSources`.
- Infrastructure: `config.cloudflareProjectName` and
  `config.d1DatabaseName`.
- Run limits: `config.scheduling.maxContentPerRun` and
  `config.scheduling.maxReviewIterations`.

### Deployment-readiness gaps — current repository truth

1. **Cron provisioning — fixed.** `scripts/setup-niche.sh` now registers all
   six names that `.drone.yml` routes on: `nightly-gsc`, `daily-observe`,
   `weekly-content`, `weekly-audit`, `weekly-backlinks`, and
   `visual-distribution`. A name that does not match a `trigger.cron` value
   fires nothing, so keep the two files in step when adding a pipeline.
2. **Cron syntax — fixed.** All expressions are now six-field
   (`second minute hour day month weekday`), which is what this Drone project
   requires. A five-field value is accepted and then misparses **silently**,
   running at the wrong time or never — never shorten these.
3. **Secret provisioning is incomplete.** The setup script automates baseline
   Cloudflare and Google secrets, but its legacy aliases do not cover the full
   active `from_secret` inventory. In particular, it creates `GEMINI_KEY`
   while `weekly-content` reads `GEMINI_API_KEY`; see `docs/DRONE_SETUP.md`.
4. **The Indexing API policy and implementation disagree.** `.drone.yml`
   correctly says broad Indexing API use is not supported for ordinary pages,
   but the invoked `scripts/gsc-sitemap-sync.ts` still attempts
   `URL_UPDATED` for all changed sitemap URLs. Sitemap submission is valid;
   broad notifications must not be treated as a supported indexing strategy.
5. **Some deployment configuration remains instance-shaped outside
   `niche.config.ts`.** Before launch, search the current `.drone.yml`,
   `.lighthouserc.json`, `wrangler.toml`, and automation sources for inherited
   literals and verify them against the config. This plan does not pretend
   another agent's concurrent changes are already complete.

### Storage: repo first, D1 optional

`db/schema.sql` exists and `scripts/d1-sync.ts` can mirror data to Cloudflare
D1, while the D1 binding in `wrangler.toml` is currently commented out. The
engine's durable default memory is the git repository: generated JSON and
Markdown are versioned, diffable, reviewable, and available to Astro without a
database credential at build time. D1 remains an optional queryable mirror;
none of the core schedule should silently depend on it until the binding and
migration are deliberately enabled.

---

## 1. Architecture

```text
PUSH (pipeline: default)
  install → build → LLM reachability report → deploy → GSC sitemap sync
  The audit block is currently commented out; do not count it as active.

NIGHTLY (cron: nightly-gsc)
  scripts/gsc-sitemap-sync.ts
    └─ submit the live sitemap index to Search Console
       (see section 0 for the unsupported broad-Indexing-API drift)

DAILY (05:00 UTC intent, cron: daily-observe)
  npm run observe
    ├─ GSC: queries / pages / countries, 7d + 28d, vs. prior period
    ├─ Indexation proxy: sitemap URL count vs. URLs earning impressions
    ├─ Health: status + TTFB for homepage, sitemap, robots, and leading pages
    └─ Community: configured sources, recurring phrases, and real engagement
       only where the source actually exposes it

WEEKLY (Mon 06:00 UTC intent, cron: weekly-content)
  npm run analyze
    ├─ read recent observations and the content inventory
    ├─ identify rising/decaying pages, CTR opportunities, gaps, and a tool idea
    └─ restrict proposed categories to config.silos IDs
  npm run write:weekly
    └─ brief → draft → factual-claim pass → reviewer gate → internal-link gate
       → TypeScript validation → repository persistence → push deploy

WEEKLY (Wed 07:00 UTC intent, cron: weekly-audit)
  npm run build → npm run audit:seo
    └─ broken links, orphans, metadata, canonical/robots/schema checks,
       thin content, image alternatives, sitemap parity, and regressions
       report without blocking the deploy pipeline

WEEKLY (Fri 08:00 UTC intent, cron: weekly-backlinks)
  npm run backlinks
    └─ deduplicated prospect research and a tailored angle per prospect;
       human-in-the-loop by design, with nothing sent automatically

SCHEDULED OR CUSTOM (cron: visual-distribution)
  npm run distribute
    └─ process plans for enabled channels in config.visualDistribution,
       then persist logs and archive processed plans
```

`.drone.yml` confirms the 05:00/06:00/07:00/08:00 timing intent for the four
observation/content/audit/backlink jobs. It does not encode an hour for
`nightly-gsc` or `visual-distribution`; cron expressions live in Drone. Do not
invent those two schedules—choose them operationally and verify the computed
next-run timestamps.

Every core editorial/SEO job is reachable through a verified npm script and
the shared `scripts/run-schedule.ts` dispatcher. The visual job has its own
verified `distribute` npm script. The business logic therefore remains usable
from Drone, a workstation scheduler, or another CI runner.

## 2. Reliability rules

- Each scheduler-neutral job records last run, duration, outcome, and error;
  the dispatcher reports a job that has not succeeded within twice its
  expected interval.
- Jobs must be **idempotent** and safe to retry for the same period. Persistence
  commits use narrowly scoped generated outputs, and `[skip ci]` is reserved
  for data updates that must not trigger a deployment loop.
- A job that cannot get required input **fails loudly with a named cause**. It
  must not write a plausible-looking empty observation or analysis.
- The weekly writer refuses publication on a duplicate slug or target keyword,
  invalid silo ID, missing hub link, fewer than three verified internal links,
  failed factual/reviewer gate, or TypeScript failure.
- GSC, audit, and backlink pipeline steps are marked non-blocking where an
  upstream service failure should not roll back a healthy deployment. Their
  failures still need visible logs and stale-job alerts.
- `src/lib/git-dates.ts` performs one full-history pass, uses the later of the
  commit date and declared content date, and falls back with a warning when git
  history is unavailable. Never replace it with build-time timestamps.
- Generated content commits intentionally omit `[skip ci]` so the normal push
  pipeline builds and deploys them; observational and queue commits avoid
  recursive CI.

## 3. Ranking expansion levers (ordered by measured ROI)

Use actual GSC and community evidence to reorder these after launch:

1. **Interactive utilities.** Register calculators, lookups, comparison aids,
   and reference tools in `config.tools`. Prioritize repeated audience tasks,
   not novelty.
2. **CTR repair.** Queue pages with meaningful impressions, defensible
   rankings, and weak CTR for title/description experiments. Preserve query
   ownership and stay within snippet budgets.
3. **Striking-distance capture.** Expand pages already ranking roughly 8–20
   when the missing sub-intent is supported by query evidence.
4. **Configured silo coverage.** Compare demand against `config.silos`, their
   `startHere` query owners, and the existing post inventory. Strengthen the
   correct page instead of creating cannibalizing near-duplicates.
5. **Internal linking.** Every new post links to its configured pillar and at
   least three verified articles; hubs link back, and audit findings drive
   orphan repair.
6. **Backlinks and citations.** Build prospects from observed conversations,
   competitor resource pages, `config.communityForums`,
   `config.communityLinks`, and `config.trustedSources`. A human researches and
   approves every contact.

## 4. Manual steps this plan cannot do for itself

1. **Replace every `{Niche}`/`TEMPLATE` placeholder and validate
   `niche.config.ts`.** The automation can consume configuration; it cannot
   decide the site's honest identity, expert credentials, or editorial scope.
2. **Provision infrastructure with `scripts/setup-niche.sh`.** It automates the
   Cloudflare Pages project, D1 database and migration, custom domains, Google
   Cloud project/service account/key, baseline Drone secrets, local env file,
   and `wrangler.toml` updates. Review `--dry-run` first.
3. **Grant Search Console access manually.** Add the generated service account
   to the property for `config.url`; the setup script cannot grant that site
   permission.
4. **Reconcile Drone after setup.** Register all six exact pipeline names with
   six-field UTC expressions, repair or remove obsolete records, verify `next`,
   and add the missing active secret names documented in
   `docs/DRONE_SETUP.md`.
5. **Choose the two unencoded schedules.** `.drone.yml` does not specify hours
   for `nightly-gsc` or `visual-distribution`; select non-conflicting UTC times
   and verify them in Drone rather than copying an inherited value.
6. **Exercise the human gates.** Verify author credentials, trusted sources,
   factual review, outreach approval, privacy choices, and production access
   controls. Automation can enforce structure; it cannot manufacture trust.
