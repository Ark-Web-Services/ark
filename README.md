# ARK Web Services

ARK Web Services is a service-business website built with Astro 5 and the Godfather SEO Engine. It carries forward Ark's WordPress rescue, custom development, one-time SEO foundations, and free site review services.

## Development

Use Node.js 22.13 or newer.

```sh
npm ci
npm run dev
```

Before proposing changes, run the available source checks:

```sh
npm run check
npm test
npm run build
```

## Hosting

The site builds as a static Astro site for Cloudflare Pages. `wrangler.toml` names the Pages project `arkwebservices-com` and sets `dist` as the build output. Cloudflare resources, DNS, and deployment credentials are configured separately and are not provisioned by this repository.

## Inquiries

Inquiry capture remains disabled until production storage, spam protection, and email delivery are configured. The site provides working email and phone links and never reports an unsent form as successful.

## Engine updates

Review Godfather SEO Engine updates before applying them. Client facts, brand assets, service copy, and deployment configuration belong to this Ark site.
