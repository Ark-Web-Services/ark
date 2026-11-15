# Engine 4.0 upgrade

The original guide mode remains the default. `business.config.ts` adds an independently configurable service-business mode, and `npm run template:service` creates a separate client folder with an engine provenance manifest. `npm run engine:sync` previews updates and refuses to overwrite locally changed managed files. Business facts, content, uploads, deployment settings, redirects, and brand documents remain client-owned.

## Delivered

- Six responsive business pages with configurable branding, services, optional portfolio/testimonials, process, FAQs, contact, privacy, and an error page.
- Worker/D1 inquiry intake with validation, Turnstile, abuse limits, duplicate-request protection, and durable jobs for owner notification, acknowledgment, 24-hour owner reminder, and optional signed CRM webhook.
- Bearer-protected lead status APIs, operator CLI, leased/retryable delivery processing, and a business-only Drone delivery schedule.
- Conversion events without inquiry field data and campaign attribution retained across page navigation.
- Draft profile/social handoffs for the requested directories and Instagram/TikTok, including explicit review snapshots. These tools do not publish to external accounts.
- Local-model structured output, adaptive context/output budgeting, fast network failure handling, and overnight preflight selectively backported from The Shrimp Guide. Shrimp-specific content and layout changes remain in that site.
- Corrected sitemap submission behavior, CDN/static-admin protection, relative redirect rules, infrastructure error reporting, and per-project Astro content caches.

## Verification

TypeScript checks and 28 offline automated tests pass. The tests include a migrated SQLite-backed D1 adapter, transactional rollback, duplicate submissions, rate limits, lead status changes, concurrent job claims, provider failures, inheritance conflicts, and mocked model requests. Production builds pass for guide and article-free business modes. Browser checks cover all six routes at 1440 and 390 pixels plus inquiry loading, error recovery, retry keys, success reset, and attribution. Local Cloudflare Pages/Worker/D1 checks confirm capture, authentication, status changes, and safe delivery failure without external sends.

## Before accepting real inquiries

Replace the instructional example copy, domain, email, and location. Add approved project photos/testimonials when available. Configure a dedicated D1 database and apply its migration, add Turnstile/email/admin secrets, enable inquiries, register the delivery schedule, and verify a deployed inquiry and its notifications. The launch checker intentionally rejects the unconfigured starter. The starter is noindex on its reserved `.example` domain.

Google Business Profile/vendor account access, actual profile publishing, social footage/production, and ongoing client service work remain external delivery tasks. There is no self-service client editing portal in this release. See [SERVICE_BUSINESS_SETUP.md](SERVICE_BUSINESS_SETUP.md), [LEAD_OPERATIONS.md](LEAD_OPERATIONS.md), and [CLIENT_PRESENCE.md](CLIENT_PRESENCE.md).
