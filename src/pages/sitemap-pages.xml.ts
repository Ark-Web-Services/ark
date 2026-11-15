// ═══════════════════════════════════════════════════════════════
// /sitemap-pages.xml — Homepage, silos, static pages
//
// lastmod is derived from real post dates (frontmatter, which in
// turn mirrors git history) rather than the build timestamp —
// stamping every URL with the deploy time trains Google to ignore
// our lastmod entirely.
// ═══════════════════════════════════════════════════════════════

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { siteConfig, silos } from "../data/navigation";
import nicheConfig from "../../niche.config";
import { businessMode, businessPaths, editorialEnabled, escapeXml } from "../lib/site-mode";
import { canonicalize } from "../lib/seo";

interface Entry {
  loc: string;
  lastmod?: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: string;
}

export const GET: APIRoute = async () => {
  const posts = !editorialEnabled ? [] : await getCollection("posts", ({ data }) => {
    return data.status === "published" && !(data as any).draft && !(data as any).noindex;
  });

  const postDate = (p: (typeof posts)[number]) =>
    (p.data.lastModified ?? p.data.date).getTime();

  const maxDate = (list: typeof posts): string | undefined => {
    if (list.length === 0) return undefined;
    return new Date(Math.max(...list.map(postDate))).toISOString();
  };

  const siteLastmod = maxDate(posts);
  const entries: Entry[] = [];

  // ── 1. Homepage (highest priority) ─────────────────────────
  entries.push({
    loc: canonicalize(`${siteConfig.url}/`),
    lastmod: siteLastmod,
    changefreq: "daily",
    priority: "1.0",
  });

  // ── 2. Silo pillar pages (very high priority) ──────────────
  for (const silo of (editorialEnabled ? silos : [])) {
    entries.push({
      loc: canonicalize(`${siteConfig.url}${silo.pillar}`),
      lastmod: maxDate(posts.filter((p) => p.data.category === silo.id)),
      changefreq: "weekly",
      priority: "0.9",
    });
  }

  // ── 3. Hub / index pages ───────────────────────────────────
  if (editorialEnabled) entries.push({
    loc: canonicalize(`${siteConfig.url}/articles/`),
    lastmod: siteLastmod,
    changefreq: "daily",
    priority: "0.8",
  });

  // ── 3b. Interactive tools (linkable assets) ────────────────
  // Discovered from the filesystem rather than listed by hand — a hardcoded
  // list silently drops any tool added later, which is how the stocking
  // calculator shipped without a sitemap entry.
  const toolPages = nicheConfig.tools.length === 0 ? [] : [
    "/tools/", ...nicheConfig.tools.map(tool => `/tools/${tool.id}/`),
  ];
  for (const path of toolPages) {
    entries.push({
      loc: canonicalize(`${siteConfig.url}${path}`),
      changefreq: "monthly",
      priority: "0.8",
    });
  }

  // ── 4. Static info pages (About, Contact, Privacy) ─────────
  // No lastmod — these rarely change and we won't fake a date.
  const staticPages: { path: string; priority: string; changefreq: Entry["changefreq"] }[] = [
    { path: "/about/", priority: "0.6", changefreq: "monthly" },
    { path: "/contact/", priority: "0.4", changefreq: "yearly" },
    { path: "/privacy/", priority: "0.3", changefreq: "yearly" },
  ];

  for (const page of staticPages) {
    entries.push({
      loc: canonicalize(`${siteConfig.url}${page.path}`),
      changefreq: page.changefreq,
      priority: page.priority,
    });
  }

  if (businessMode) {
    for (const path of businessPaths.filter(path => !['/', '/about/', '/contact/', '/privacy/'].includes(path))) entries.push({ loc: canonicalize(`${siteConfig.url}${path}`), changefreq: 'monthly', priority: '0.8' });
    if (editorialEnabled) {
      const serviceIds = new Set((await import('../../business.config')).default.services.map(service => service.id));
      const leadPages = await getCollection('leadPages', ({ data }) => data.status === 'published' && serviceIds.has(data.service));
      for (const page of leadPages) entries.push({ loc: canonicalize(`${siteConfig.url}/solutions/${page.id}/`), changefreq: 'monthly', priority: '0.7' });
    }
  }
  const contentPages = await getCollection('pages');
  if (!businessMode) for (const page of contentPages) {
    const path = `/${page.id.replace(/\.(mdx?|md)$/, '')}/`;
    if (!page.data.noindex && !entries.some(entry => entry.loc === canonicalize(`${siteConfig.url}${path}`))) entries.push({ loc: canonicalize(`${siteConfig.url}${path}`), changefreq: 'monthly', priority: '0.5' });
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries
  .map(
    (e) => `  <url>
    <loc>${escapeXml(e.loc)}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ""}
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
    <xhtml:link rel="alternate" hreflang="${siteConfig.lang}" href="${escapeXml(e.loc)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(e.loc)}" />
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
};
