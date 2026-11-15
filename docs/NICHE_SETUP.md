# 🎩 Launching a New Niche — Operator Runbook

Clone → customize → provision → deploy. Roughly 20 minutes of work, plus manual
Search Console, Cloudflare domain, and runtime-secret setup.

Every niche is its own repository. Nothing in this template is shared between
niches at runtime — only the credentials in `~/.godfather/credentials`.

---

## Prerequisites

Install once, reused for every niche:

```bash
brew install --cask google-cloud-sdk   # gcloud
brew install drone/drone/drone         # drone CLI
brew install node                      # provides npx/wrangler
```

`scripts/setup-niche.sh` checks for all three and refuses to run without them.

You will be prompted for these the first time and they are cached in
`~/.godfather/credentials` (mode 600) for every subsequent niche:

| Credential | Used for |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Pages project and D1 database |
| `CLOUDFLARE_ACCOUNT_ID` | same |
| `DRONE_SERVER` / `DRONE_TOKEN` | CI secrets + cron registration |
| `GITEA_ORG` | deriving the Drone repo path |
| `GEMINI_API_KEY` / `CLAUDE_API_KEY` | the agent pipeline |
| `ADMIN_API_TOKEN` | Optional existing business-admin bearer secret; export it for setup to add the matching Drone secret. It is not generated or cached, and must also be set manually in Cloudflare Pages runtime settings. |

---

## Step 1 — Clone and install

```bash
git clone <this repo> the-espresso-guide
cd the-espresso-guide
npm install
```

---

## Step 2 — AI customization

This rewrites `niche.config.ts` for your niche: identity, author/E-E-A-T block,
4–6 content silos (each with SEO title, description, intro copy, FAQ entries and
"start here" routing), navigation, seed keywords, competitors, community links,
trusted sources, affiliate scaffolding, and 2–3 proposed interactive tools.

```bash
# Always preview first — writes nothing
npm run init-niche:dry -- --niche "home espresso brewing" --domain espresso.example

# Then commit to it
npm run init-niche -- \
  --niche "home espresso brewing" \
  --domain espresso.example \
  --positioning "For home baristas who want repeatable shots, not gear worship"
```

| Flag | Meaning |
|---|---|
| `--niche <text>` | **Required.** The niche as a noun phrase |
| `--domain <domain>` | **Required.** Target domain; scheme optional |
| `--positioning <text>` | Audience / angle note (alias: `--brief`) |
| `--dry-run` | Generate + validate + print, write nothing |
| `--force` | Allow replacing an already-customized repo |
| `--help` | Show usage |

**What protects you here.** The model's output passes a two-stage gate before
anything is written: runtime schema and invariant checks on the JSON, then
TypeScript compiler diagnostics against the real `NicheConfig` declaration in a
throwaway candidate file. Only if both pass does it back up the existing
`niche.config.ts` and replace it. A repo that no longer contains the template
placeholders is treated as already customized and refuses to be overwritten
without `--force`.

If it fails, nothing was written — fix the reported input or provider issue and
run it again. The LLM provider order is configurable via `LLM_PROVIDER_ORDER*`
in `.env`; the default order is `ollama → replicate → gemini → anthropic`.

It also rewrites `data/seed-keywords.json` and the prose in
`src/content/pages/{about,contact,privacy}.md`.

---

## Step 3 — Review what it generated

Read `niche.config.ts` top to bottom. Three things genuinely need a human:

1. **Affiliate URLs in `defaultProducts` are deliberate placeholders.** The
   customizer will not invent real affiliate links. Replace them with your own
   tagged URLs, or remove the products.
2. **The `author` block must become real.** Search engines evaluate E-E-A-T on
   identifiable people. A generated "Editorial Team" bio is a starting point,
   not a credential.
3. **Silo structure is a proposal.** It determines your URL hierarchy and the
   `category` enum every post is validated against — changing it later means
   redirects. Get it right now.

Then delete the build fixture:

```bash
rm src/content/posts/EXAMPLE-first-post.md
```

> Astro fails a declared-but-empty content collection, so the template ships one
> example post to keep a fresh clone building. It documents the frontmatter
> contract — read it once, then delete it. The customizer does **not** remove it
> for you.

Confirm the repo still stands up:

```bash
npx tsc --noEmit -p tsconfig.json
npm run build
```

---

## Step 4 — Provision infrastructure

```bash
./scripts/setup-niche.sh --dry-run   # preview every API call
./scripts/setup-niche.sh
```

It reads `niche.config.ts` and provisions, in order:

1. **Cloudflare** — Pages project, D1 database (capturing and verifying the
   database id), schema migration, and seed data. Add apex and `www` domains
   manually in Pages > project > Custom domains.
2. **Google Cloud** — project, Search Console API, a `gsc-bot` service account,
   and its JSON key written to `data/gsc-service-account.json`. The engine
   submits its sitemap through Search Console; it does not request routine
   indexing for ordinary guide pages. Google's [Indexing API eligibility](https://developers.google.com/search/apis/indexing-api/v3/quickstart)
   is limited to `JobPosting` and livestream `BroadcastEvent` pages.
3. **Drone CI** — all required secrets (`CF_TOKEN`, `CF_ACCOUNT_ID`,
   `D1_DATABASE_ID`, `GSC_KEY`, `GEMINI_KEY`, `CLAUDE_KEY`, plus the
   deploy-pipeline aliases `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`,
   `GOOGLE_SERVICE_ACCOUNT_KEY`). For enabled business inquiries, an already
   supplied `ADMIN_API_TOKEN` is added to Drone to authorize the outbox job.
   The setup script does not create this token or set it in Cloudflare Pages.
4. **Local files** — generates `.env`, rewrites `wrangler.toml` with the real
   D1 id, project name and database name.
5. **Cron jobs** — registers the site schedules. Business mode with content
   automation disabled gets GSC and SEO audit only. The `lead-follow-ups`
   schedule is added only when business inquiries are enabled and an existing
   `ADMIN_API_TOKEN` was supplied.

> **Six-field crons.** Drone here uses `sec min hour dom mon dow`. A five-field
> expression is accepted and then misparses **silently** — the job registers but
> fires at the wrong time or never. The names registered must match
> `trigger.cron` in `.drone.yml` exactly:
> `nightly-gsc`, `daily-observe`, `weekly-content`, `weekly-audit`,
> `weekly-backlinks`, `visual-distribution`; business inquiries also use
> `lead-follow-ups` on `0 */5 * * * *`.

The script refuses to run while `niche.config.ts` still contains `TEMPLATE_`
placeholders, so Step 2 cannot be skipped.

---

## Step 5 — Manual setup steps

`setup-niche.sh` prints the Search Console step at the end and offers to open
the browser:

> Add the service account as an **Owner** in Search Console.

1. Go to <https://search.google.com/search-console>
2. Select your domain property
3. **Settings → Users and permissions → Add user**
4. Paste `gsc-bot@godfather-<niche>.iam.gserviceaccount.com` → role **Owner**

Without this, every GSC-dependent pipeline (`nightly-gsc`, `weekly-audit`,
`daily-observe`) authenticates but returns nothing.

Add the apex and `www` domains to the Pages project in the Cloudflare dashboard.
For a business site that uses the outbox, set the same high-entropy
`ADMIN_API_TOKEN` as a Cloudflare Pages runtime secret and export it before
running setup so the script can add that existing value to Drone. The scheduled
pipeline posts only to the configured site's `/api/admin/follow-ups` endpoint;
it processes at most 20 due outbox items per five-minute run. It is not
registered for non-business sites or when inquiries are disabled.

---

## Step 6 — Deploy

```bash
git push origin main
```

Drone builds, runs the Lighthouse gate, deploys to Cloudflare Pages, purges the
CF cache, and runs the post-deploy sitemap sync. Watch it at
`$DRONE_SERVER/$GITEA_ORG/<repo>`.

---

## After launch

| Setting | Why |
|---|---|
| `WORK_QUEUE_TOKEN` | Required before `/api/work-queue` serves anything — it fails closed with a 503 when unset |
| `ADMIN_API_TOKEN` | Bearer secret required by `/admin/*`, `/_admin/*`, and `/api/admin/*`; set in Cloudflare Pages runtime settings. The optional follow-up cron requires the same existing value as a Drone secret. |
| `ENABLE_ADMIN_DASHBOARD` | Static admin HTML is always stripped from deployable output. Actual runtime HTML routes require this flag and the `ADMIN_API_TOKEN` bearer secret. |
| `GIT_BOT_NAME` / `GIT_BOT_EMAIL` | Identity for commits the pipeline makes; defaults derive from your domain |
| `GSC_PROPERTY` | Use the `sc-domain:` prefix for a domain property |
| Reddit / Pinterest / Imgur / Tumblr keys | Only needed for the observation and visual-distribution pipelines |

See `.env.example` for the complete list — it documents every variable the
scripts and pipelines actually read.
