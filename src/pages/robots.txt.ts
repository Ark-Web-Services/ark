// ═══════════════════════════════════════════════════════════════
// /robots.txt — Dynamic, derives Sitemap URL from niche.config.ts
//
// This file now lives in /src/pages (dynamic) and REPLACES
// /public/robots.txt so that the sitemap URL is automatically
// correct for every niche clone of the Godfather template.
// ═══════════════════════════════════════════════════════════════

import business from "../../business.config";
import type { APIRoute } from "astro";
import { siteConfig } from "../data/navigation";

export const GET: APIRoute = async () => {
  if (business.enabled && /(?:\.example|\.invalid|example\.com)$/.test(new URL(business.website || siteConfig.url).hostname)) return new Response("User-agent: *\nDisallow: /\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const body = `# ═══════════════════════════════════════════════════════════════
# robots.txt — ${siteConfig.title}
# Generated dynamically from niche.config.ts at build-time
# ═══════════════════════════════════════════════════════════════

# Standard web crawlers — full access
User-agent: *
Allow: /
Disallow: /go/
Disallow: /api/
Disallow: /search/
Disallow: /_admin/
Disallow: /admin/
Disallow: /~partytown/
Disallow: /*?*utm_
Disallow: /*?*fbclid
Disallow: /*?*gclid

# Explicit allow for SEO-critical engines
User-agent: Googlebot
Allow: /
Disallow: /go/
Disallow: /api/
Disallow: /_admin/
Disallow: /admin/
Disallow: /~partytown/

User-agent: Googlebot-Image
Allow: /assets/images/
Disallow: /_admin/
Disallow: /admin/

User-agent: Bingbot
Allow: /
Disallow: /_admin/
Disallow: /admin/

User-agent: DuckDuckBot
Allow: /
Disallow: /_admin/
Disallow: /admin/

# ── AI Agent Policies ────────────────────────────────────────

# GPTBot (ChatGPT) — Allow citation, block training of our content
User-agent: GPTBot
Allow: /
Allow: /api/agent-content
Disallow: /go/
Disallow: /_admin/
Disallow: /admin/

User-agent: OAI-SearchBot
Allow: /
Disallow: /_admin/
Disallow: /admin/

User-agent: ChatGPT-User
Allow: /
Disallow: /_admin/
Disallow: /admin/

# Google-Extended (Gemini training) — block training
User-agent: Google-Extended
Disallow: /

# Common Crawl — block
User-agent: CCBot
Disallow: /

# Anthropic (Claude training) — block training
User-agent: anthropic-ai
Disallow: /

User-agent: ClaudeBot
Disallow: /

# Perplexity — allow citation
User-agent: PerplexityBot
Allow: /
Allow: /api/agent-content
Disallow: /go/
Disallow: /_admin/
Disallow: /admin/

# Cohere, ByteDance, Applebot-Extended — block training
User-agent: cohere-ai
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: Amazonbot
Disallow: /

User-agent: FacebookBot
Disallow: /

Sitemap: ${siteConfig.url}/sitemap-index.xml
`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
};
