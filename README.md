# ARK Web Services

ARK Web Services is a service-business website built with Astro 5 and the Godfather SEO Engine. It carries forward Ark's WordPress rescue, custom development, one-time SEO foundations, and free site review services.

## Development

Use Node.js 22.13 or newer.

```sh
npm ci
npm run dev
```

Run the repository checks before proposing changes:

```sh
npm run check
npm test
npm run build
```

## Hosting and automation

The site builds as a static Astro site for Cloudflare Pages. `wrangler.toml` names the Pages project `arkwebservices-com` and sets `dist` as the build output. Drone runs verification and build steps on pushes to the Git `master` branch, then deploys the output to the Cloudflare Pages production branch named `main`. The Git and Cloudflare branch names serve different systems.

Cloudflare account credentials, DNS, and resources are managed separately and are not provisioned by this repository. The weekly-content Drone cron uses the gated generation and promotion workflow described in [docs/CONTENT_AUTOPUBLISH.md](docs/CONTENT_AUTOPUBLISH.md); it promotes reviewed, preflight-passing content to Git `master` only after validation.

## Inquiries and analytics

Inquiry capture is disabled until production storage, spam protection, and email delivery are configured. The site provides working email and phone links and never reports an unsent form as successful.

Google Analytics is configured with Ark's measurement ID and loads only after a visitor opts in through the analytics notice.

## Engine updates

Review Godfather SEO Engine updates before applying them. Client facts, brand assets, service copy, and deployment configuration belong to this Ark site.
