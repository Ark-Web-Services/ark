# Service-business starter

The engine supports its original guide sites and a separate service-business mode. `business.config.ts` holds owner-approved facts and presentation. Research agents must not rewrite this file. Existing guide behavior remains the default.

## Create a client folder

From the engine:

```sh
npm run template:service -- --out ../service-business-template --name "Your Studio" --domain studio.example --email hello@studio.example
```

The command refuses an existing destination. It excludes secrets, Git history, dependencies and generated output, enables business mode, and records engine file hashes in `.engine-origin.json`. Install dependencies in the new folder with `npm ci`. No account or infrastructure is created by cloning.

The checked-in starter uses a reserved example domain, noindex, empty testimonials and portfolio, and instructional service/process copy. This is a template, not a published client website. Replace sample copy and supply authorized photographs before launch. Empty proof sections are omitted. The guide customizer is disabled for business sites so it cannot rewrite approved business facts.

## Configure

1. Edit `business.config.ts`: real name, description, email, phone, city/service areas, brand fonts/colors, services, about copy, process, FAQs, real projects and approved testimonials. Local photos belong in `public/assets/client/` and use `/assets/client/...` URLs. Supply alt text and photographer credit.
2. Keep `niche.config.ts` identity/domain/contact values aligned for sitemaps and scripts. Leave article silos, products and tools empty unless enabling `contentEnabled` intentionally. The business homepage does not require posts.
3. Set the site's dedicated Cloudflare project/database in `wrangler.toml`. Run infrastructure setup with `--dry-run` first, then provision with `scripts/setup-niche.sh`. Review domain activation and DNS manually. Business sites omit guide-specific model/content schedules by default.
4. Follow [LEAD_OPERATIONS.md](LEAD_OPERATIONS.md) to bind D1, apply the lead migration, add Turnstile and email credentials, and schedule outbox delivery. Until configured, inquiries show an email fallback. Never place a secret in public config.
5. Run `npm run check`, `npm test`, `npm run build`, and `npm run check:launch -- --public-only`. Supply runtime secrets for the full launch check. Test a deployed inquiry, verify its stored lead and both delivery jobs, then advance its status and confirm reminders cancel.
6. Run `npm run client:presence` to prepare manual profile/social handoffs. This does not publish to external accounts.

## Updating inherited code

From a client folder:

```sh
npm run engine:sync -- --from ../godfather-seo-engine-v3
npm run engine:sync -- --from ../godfather-seo-engine-v3 --apply
```

The first command only reports. Updates apply only when managed local files still match their recorded engine baseline. A conflict aborts the whole apply. Client facts, content, uploads, runtime data, deployment config, and product/design notes are protected. Review changed dependencies and use `npm ci` if the lockfile changes. Commit or back up client work before applying an update, then run checks/build. The updater does not merge local customizations or publish anything.

## Delivery boundary

Included code provides website sections, lead intake, lead status APIs, transactional email/reminder processing, attribution events, manual profile/social handoffs, and safe engine inheritance. Google profile/directory editing, social video production, account permissions, client photo selection, and external approvals remain delivery work. A scheduler must invoke the authenticated outbox endpoint; static hosting alone does not run background jobs. No guarantee of rankings or bookings is made.
