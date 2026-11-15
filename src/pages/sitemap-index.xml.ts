import { editorialEnabled, businessMode } from "../lib/site-mode";
// ═══════════════════════════════════════════════════════════════
// /sitemap-index.xml — Master sitemap index
//
// Replaces the default @astrojs/sitemap output with a hand-rolled
// multi-file sitemap architecture:
//
//    /sitemap-index.xml  ← this file
//      ├─ /sitemap-pages.xml     (homepage + silos + static pages)
//      ├─ /sitemap-posts.xml     (all content articles)
//      └─ /sitemap-images.xml    (image sitemap for Google Images)
//
// Benefits:
//   ✅ Google processes each child sitemap independently
//   ✅ Clear priorities (homepage > silos > posts > utilities)
//   ✅ Accurate lastmod (from file system / frontmatter)
//   ✅ No 50k URL limit issue even at scale
//   ✅ Image sitemap maximises Discover & Images traffic
//   ✅ changefreq + priority tuned per content type
// ═══════════════════════════════════════════════════════════════

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { siteConfig } from "../data/navigation";

// Prerendered like every other sitemap route. The duplicated Content-Type and
// Cache-Control headers seen live came from public/_headers carrying BOTH an
// exact /sitemap-index.xml rule and the /sitemap-*.xml wildcard; the redundant
// exact rule has been removed rather than making this a runtime route.

export const GET: APIRoute = async () => {
  // Derive lastmod from real content dates — stamping the build time
  // on every deploy makes Google distrust our lastmod values.
  const posts = !editorialEnabled ? [] : await getCollection("posts", ({ data }) => {
    return data.status === "published" && !(data as any).draft && !(data as any).noindex;
  });
  const contentLastmod = posts.length ? new Date(
    Math.max(...posts.map((p) => (p.data.lastModified ?? p.data.date).getTime()))
  ).toISOString() : undefined;

  const sitemaps: { loc: string; lastmod?: string }[] = [
    { loc: `${siteConfig.url}/sitemap-pages.xml`, lastmod: contentLastmod },
    { loc: `${siteConfig.url}/sitemap-posts.xml`, lastmod: contentLastmod },
    { loc: `${siteConfig.url}/sitemap-images.xml`, lastmod: contentLastmod },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (s) => `  <sitemap>
    <loc>${s.loc}</loc>
${s.lastmod ? `    <lastmod>${s.lastmod}</lastmod>` : ""}
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
};
