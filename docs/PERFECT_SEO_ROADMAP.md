# 🏆 The Path to Perfect SEO — Everything Else Your Niche Site Needs

> Companion document to the Lighthouse, sitemap, and Search Console foundation
> in this template. This is the "what's next" master checklist — a prioritized,
> opinionated roadmap to a 100-across-the-board Lighthouse score **and**
> top-3 rankings for the target queries maintained in `niche.config.ts`.

---

## 0. What the Template Already Ships

Treat this table as a capability map, then verify the generated site after
customizing `niche.config.ts`.

| # | Capability | Files |
|---|------------|-------|
| 1 | Lighthouse-oriented base layout: FOUC-free theme, preconnects, theme metadata, canonical and hreflang tags, robots override, and Organization + WebSite JSON-LD | `src/layouts/BaseLayout.astro` |
| 2 | Strict, accessible breadcrumbs | `src/components/Breadcrumbs.astro` |
| 3 | Multi-file **sitemap** (`index → pages / posts / images`) with `priority`, `changefreq`, `lastmod`, and hreflang | `src/pages/sitemap-index.xml.ts`, `src/pages/sitemap-pages.xml.ts`, `src/pages/sitemap-posts.xml.ts`, `src/pages/sitemap-images.xml.ts` |
| 4 | Image sitemap for image search and discovery surfaces | `src/pages/sitemap-images.xml.ts` |
| 5 | RSS 2.0 and Atom 1.0 feeds | `src/pages/rss.xml.ts`, `src/pages/atom.xml.ts` |
| 6 | Dynamic `robots.txt` using `config.url` | `src/pages/robots.txt.ts` |
| 7 | Search Console sitemap submission after deploy and on the `nightly-gsc` schedule | `scripts/gsc-sitemap-sync.ts`, `.drone.yml` |
| 8 | Security, caching, redirects, manifest, contact metadata, and a custom 404 | `public/_headers`, `public/_redirects`, `public/site.webmanifest`, `public/.well-known/security.txt`, `public/humans.txt`, `src/pages/404.astro` |
| 9 | Canonicalization and reusable Organization, HowTo, Product, and other schema helpers | `src/lib/seo.ts` |
| 10 | Compressed HTML, inlined critical styles, and trailing-slash canonical URLs | `astro.config.mjs` |

### Sitemap `lastmod`: keep it honest automatically

`src/pages/sitemap-posts.xml.ts` calls
`lastModifiedFor()` from `src/lib/git-dates.ts`. That helper makes one pass
over git history, records the latest commit date for each content file, and
uses the later of that date and an explicit frontmatter `lastModified`. A
forgotten frontmatter edit therefore cannot leave a post's `lastmod` stale.

This is deliberately different from stamping build time on every URL: build
time changes when content did not, which trains crawlers to ignore the signal.
The deploy and weekly-audit pipelines use `clone.depth: 0` so git history is
available. In a shallow clone or without git, the helper warns and falls back
to declared frontmatter dates rather than inventing a date.

### Search Console and the Indexing API: current repository truth

The supported flow is: deploy → purge the edge cache → submit
`/sitemap-index.xml` to Search Console → confirm the live sitemap. Search
Console discovery and recrawling should come from the sitemap and normal crawl
signals. Google's Indexing API is restricted to eligible page types, so it
must not be presented as a broad recrawl API for ordinary niche articles.

There is current implementation drift to resolve before relying on this flow:
`.drone.yml` explicitly says the Indexing API is not used, but it invokes
`scripts/gsc-sitemap-sync.ts`, and that script currently attempts
`URL_UPDATED` notifications for every changed sitemap URL. Treat those broad
calls as unsupported; the sitemap submission is the valid automation. The
same setup drift exists in `scripts/setup-niche.sh`, which still enables the
Indexing API even though the declared pipeline policy does not use it.

---

## 1. Remaining Lighthouse Gaps (quick wins, < 1 day each)

### 1.1 LCP Image Policy

- [x] Pass the post hero into `BaseLayout` through `heroPreload` in `src/layouts/PostLayout.astro`.
- [ ] Verify every hero emits responsive `srcset`/`sizes`, modern formats, and an appropriate fallback at the rendered breakpoints.
- [ ] Reserve the intrinsic hero dimensions or an explicit `aspect-ratio` so the image produces **CLS 0**.
- [ ] Do not lazy-load the LCP image; keep below-the-fold images lazy.

### 1.2 Fonts

- [ ] Add `font-display: swap` to every local `@font-face` block.
- [ ] Subset to only the scripts required by `config.lang` and `config.locale`.
- [ ] Prefer a variable `woff2` where its byte cost beats multiple static faces.

### 1.3 JavaScript Diet

- [ ] Keep filters and other state in URLs where possible, so navigation is shareable and usable without a large client bundle.
- [ ] Hydrate only interactive components, using the least eager Astro client directive that preserves the UX.
- [ ] Audit the production bundle with `npm run build`; do not infer shipped JavaScript from source alone.
- [ ] Ensure external links opened in a new tab use safe opener/referrer behavior.

### 1.4 Accessibility 100

- [ ] Ensure every icon-only `<button>` has an accessible name; include `src/components/Header.astro`, `src/components/Sidebar.astro`, and `src/components/ProductBox.astro` in the audit.
- [ ] Enforce at least 4.5:1 contrast for normal text in both themes and all configured silo colors (`config.silos[].color`).
- [x] Keep the skip link and main-content focus target.
- [ ] Verify the skip link is visibly apparent on keyboard focus and that focus order remains logical.

### 1.5 Best Practices 100

- [x] Keep deprecated compatibility metadata out of `src/layouts/BaseLayout.astro`.
- [ ] Validate the production response headers in `public/_headers`; a local HTML inspection cannot prove the CDN applied them.
- [ ] Add SRI only to immutable third-party scripts with stable versioned URLs; avoid SRI on scripts whose provider mutates content in place.
- [ ] Keep CSP changes in report-only mode until all required sources are observed, then enforce the smallest working policy.

---

## 2. Technical SEO To-Do (the invisible wins)

### 2.1 Canonicalization & Duplicate Content

- [ ] Force HTTPS and the preferred host derived from `config.url`; verify every redirect in production.
- [ ] Ensure tracking parameters never change the canonical URL. Keep redirect/transform rules and `canonicalize()` aligned.
- [ ] Add pagination discovery links if a silo index is paginated; derive silo routes from `config.silos[].pillar`.
- [ ] Self-reference the canonical on every indexable page and make the SEO audit compare it with the final URL after redirects.

### 2.2 Structured Data Expansion

- [x] `BreadcrumbList`
- [x] `Article` / `FAQPage`
- [ ] **`HowTo`** for genuinely procedural pages. `generateHowToSchema()` exists; wire it to structured frontmatter. Use it for semantic accuracy, not a promise of a search rich result.
- [ ] **`Review` + `Product`** on real product evaluations. Base product facts on `config.defaultProducts` and page assignments on `config.pageProductMap`.
- [ ] **`VideoObject`** only when the page embeds a video and exposes matching metadata.
- [ ] **`ItemList`** on silo landing pages generated from the articles shown there.
- [ ] **`WebPage`** metadata on atomic-answer sections where it accurately describes the visible page.
- [ ] Validate with Google's Rich Results Test and Schema.org Validator, and add deterministic checks to `scripts/audit.ts` or `scripts/seo-audit.ts`.

### 2.3 Internal Linking (the silent compounding asset)

- [ ] Use `npm run link-audit` and fail CI when a post has fewer than three valid internal article links, lacks its silo link, or creates an orphan.
- [ ] Build the pillar-hub graph from `config.silos`: every article links up to its configured pillar and sideways to at least two relevant siblings.
- [ ] During generation, match concepts against the existing content inventory and inject only contextually useful links with varied, descriptive anchors.
- [ ] Render a short related-guides block from verified slugs; never generate links to routes that do not exist.

### 2.4 Crawl Budget Optimization

- [x] Keep administrative/API routes and known tracking parameters out of crawl space through `src/pages/robots.txt.ts` and authentication.
- [ ] Block new faceted-navigation combinations (`?filter=`, `?sort=`) before launching them.
- [ ] Submit child sitemaps individually in Search Console when separate reporting materially improves diagnosis.
- [ ] Test conditional responses for `/sitemap-*.xml` against the deployed CDN. Do not claim `304 Not Modified` until the live response proves it.

### 2.5 Core Web Vitals (lab + field)

- [ ] Add CrUX and privacy-reviewed real-user monitoring for LCP, INP, and CLS; aggregate by route rather than storing unnecessary visitor identifiers.
- [ ] Alert when p75 LCP exceeds 2.5s, INP exceeds 200ms, or CLS exceeds 0.1 for a URL group with enough field data.
- [ ] Keep Lighthouse as a lab regression gate; do not substitute its score for field data.

### 2.6 International & Mobile

- [ ] For a single-language site, emit `config.lang` plus `x-default` consistently in page markup and sitemaps.
- [ ] When adding locales, generate a complete reciprocal hreflang matrix and localized canonical URLs; do not merely translate navigation.
- [x] Keep `viewport-fit=cover` for devices with display cutouts.

---

## 3. Content SEO (the biggest lever of all)

### 3.1 Topical Authority & E-E-A-T

- [ ] Build honest author pages from `config.author`, including verifiable credentials and the articles actually written or reviewed by that person or team. Never invent personas.
- [ ] Add qualified reviewers for safety-, health-, legal-, or financial-adjacent material and represent review relationships accurately in visible copy and schema.
- [ ] Add original photographs, measurements, screenshots, or experiments wherever first-hand evidence improves the answer.
- [ ] Put concrete experience signals in a reusable experience-callout component, but only when the claimed test really occurred.
- [ ] Publish a methodology page describing editorial standards, product testing, corrections, use of `config.trustedSources`, and AI-assisted workflow boundaries.

### 3.2 Keyword Coverage Map

- [ ] Use GSC data and `config.seedKeywords` to maintain:
  - Striking-distance queries (positions 8–20) → priority refresh queue
  - High-impression / low-CTR pages → title and description test queue
  - Rising topics → strategy backlog
  - Cannibalization clusters → one explicit query owner
- [ ] Evaluate gaps inside the silos defined in `config.silos`; do not hardcode topic lists in operational documentation.
- [ ] Use `config.tools` for calculators, lookups, and reference utilities that solve recurring audience problems and can earn links.
- [ ] Keep each silo landing page differentiated with `seoTitle`, `seoDescription`, `intro`, `faq`, and `startHere` where those optional fields improve search intent coverage.

### 3.3 On-Page Freshness

- [x] Every post exposes a meaningful `dateModified`; post sitemap dates are protected by git history through `src/lib/git-dates.ts`.
- [ ] Show a visible "Last reviewed" date only when a substantive review occurred.
- [ ] Add a compact changelog to refreshed articles when readers benefit from knowing what changed.

### 3.4 SERP Feature Capture

- [ ] Keep the Atomic Answer concise and expose only visible, accurate copy in structured data.
- [ ] Target answer-friendly layouts with:
  - A direct answer immediately after H1
  - An ordered list for procedural intent
  - A table for comparison intent
- [ ] Answer three to five real audience questions per post in approximately 35–60 words each; derive topics from GSC and configured community sources.
- [ ] Ship descriptive image alternatives that explain the image's purpose without keyword stuffing.
- [ ] Add video only when it improves the task; include captions, transcript, poster dimensions, and matching `VideoObject` data.

### 3.5 Content Pruning

- [ ] Monthly: review pages with no clicks or impressions over a sufficiently long window. Improve, consolidate, redirect, or remove only after checking query intent, backlinks, seasonality, and conversion value.
- [ ] Prefer a relevant `301` when content has a true replacement; use `410` only when removal is intentional and no replacement serves the same intent.

---

## 4. Off-Page SEO / Authority

### 4.1 Link Building

- [ ] `agents/outreach.ts` drafts pitches; track research, contact, response, and earned-link stages in D1 or another CRM. Keep sending human-approved.
- [ ] Create at least two linkable assets from recurring audience needs. Register interactive utilities in `config.tools` and give each a matching `src/pages/tools/<id>.astro` page.
- [ ] Build a recurring expert-source and digital-PR cadence appropriate to `config.nicheNoun`.
- [ ] Compare Search Console link data with a second backlink source before prioritizing outreach.

### 4.2 Brand Signals

- [ ] Keep brand name, contact details (`config.contactEmail`), author identity, and Organization `sameAs` links consistent.
- [ ] Claim only channels the site will maintain. Use `config.communityLinks`, `config.redditSubreddits`, and `config.communityForums` instead of hardcoded communities.
- [ ] Seek independent coverage; never create or solicit an encyclopedia entry merely for SEO.

### 4.3 Digital PR

- [ ] Publish an original, reproducible study or dataset when the niche can support one. Document sample, method, limitations, and downloadable data so the result is genuinely citable.

---

## 5. Monitoring & Ops (what turns "fixed now" into "still fixed in 6 months")

### 5.1 Continuous Lighthouse

- [ ] Run `npm run lighthouse` after deployment or in a dedicated environment and fail the quality gate if:
  - Performance < 90
  - SEO < 95
  - Accessibility < 95
  - Best Practices < 95
- [ ] Keep those thresholds aligned with `.lighthouserc.json`, and generate its URL list from `config.url`, `config.silos`, and real article routes. The current file still contains instance-specific URLs and is not yet template-neutral.

### 5.2 Uptime + Crawl Monitoring

- [ ] Monitor `/` and `/sitemap-index.xml` at a useful interval from outside the hosting provider.
- [ ] Use Search Console sitemap and URL Inspection data to detect indexation regressions. The Search Console API does not expose a complete replacement for the UI's page-indexing report, so label partial telemetry honestly.

### 5.3 Analytics Privacy

- [ ] Choose the canonical analytics source and document consent/retention behavior.
- [ ] Treat `config.ga4Id` as optional; load GA4 only when configured and when the site's consent policy allows it.
- [ ] Do not claim that a header or config flag provides privacy without testing the deployed requests and stored data.

### 5.4 CI Guardrails

- [ ] Run `npm run link-audit` and type/build checks before deployment.
- [ ] Preserve the deploy pipeline's dependency order: install → build → LLM reachability report → deploy → non-blocking GSC sitemap sync. The post-deploy audit block in `.drone.yml` is currently commented out, so do not describe it as active.
- [ ] Keep scheduled jobs isolated from deployment; generated commits intentionally trigger the normal push pipeline when publishing content.

---

## 6. Example `.lighthouserc.json` (adapt before use)

The checked-in `.lighthouserc.json` already carries the detailed assertions.
Replace its instance-specific `collect.url` entries with the host from
`config.url`, representative paths from `config.silos[].pillar`, `/articles/`,
and at least one real article. Keep the core thresholds:

```json
{
  "ci": {
    "collect": {
      "url": [
        "https://example.com/",
        "https://example.com/<configured-silo>/",
        "https://example.com/articles/",
        "https://example.com/posts/<real-article-slug>/"
      ],
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop",
        "throttlingMethod": "simulate"
      }
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "meta-description": ["error", { "minScore": 1 }],
        "canonical": ["error", { "minScore": 1 }],
        "robots-txt": ["error", { "minScore": 1 }],
        "is-crawlable": ["error", { "minScore": 1 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

---

## 7. 90-Day Execution Plan

| Week | Theme | Key Deliverables |
|-----|--------|------------------|
| 1 | **Foundations** | Customize `niche.config.ts`; verify build, canonical host, sitemaps, robots, GSC, and deployment |
| 2 | **LCP + font diet** | Responsive hero, preload verification, font subsetting |
| 3 | **Structured data pass 2** | HowTo, Review/Product, ItemList, and video metadata where applicable |
| 4 | **Pruning + refresh** | Select pages from evidence; improve, consolidate, redirect, or retain |
| 5–6 | **Linkable asset #1** | First high-value utility registered in `config.tools` |
| 7–8 | **Linkable asset #2** | Second data-rich tool or reference asset |
| 9 | **Original study** | Publish methods, findings, limitations, and outreach package |
| 10 | **Link-building sprint** | Human-reviewed outreach and expert-source pitches |
| 11 | **Internal-linking pass** | Full graph audit, orphan repair, query ownership |
| 12 | **Monitoring lock-in** | Lighthouse gate, field-vitals reporting, crawl/indexation alerts |

---

## 8. Success Metrics (measure monthly)

| Metric | Today (baseline) | 30d target | 90d target |
|--------|------------------|-----------|-----------|
| Lighthouse Performance (mobile) | measure after launch | 90+ | 95+ |
| Lighthouse SEO | measure after launch | 95+ | 100 |
| Indexed pages (GSC) | record valid baseline | explain all exclusions | all intended canonical URLs eligible/indexed |
| Average GSC position | record baseline | improve priority clusters | improve priority clusters further |
| p75 LCP | measure field data | < 2.5s | < 2.0s where data is sufficient |
| p75 INP | measure field data | < 200ms | sustain < 200ms |
| Referring domains | record baseline | quality growth | sustained quality growth |
| Organic clicks / month | record baseline | trend upward | compound from content + authority |

---

**None of the incremental items should block a technically sound launch.
Start with section 1's measurable Lighthouse work and section 3's evidence-led
content authority in parallel. Keep configuration in `niche.config.ts`, keep
operational claims tied to repository behavior, and let each month's data set
the next priority.**
