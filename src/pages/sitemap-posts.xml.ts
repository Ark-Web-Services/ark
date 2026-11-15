import { editorialEnabled, businessMode } from "../lib/site-mode";
// ═══════════════════════════════════════════════════════════════
// /sitemap-posts.xml — Content articles (blog posts)
//
// Priority logic:
//   • Featured posts           → 0.9
//   • Posts with lastModified  → 0.8
//   • Everything else          → 0.7
//
// changefreq logic:
//   • Updated in last 30 days  → weekly
//   • Updated in last 180 days → monthly
//   • Everything older         → yearly
// ═══════════════════════════════════════════════════════════════

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { siteConfig } from "../data/navigation";
import { canonicalize } from "../lib/seo";
import { lastModifiedFor } from "../lib/git-dates";

type Changefreq = "daily" | "weekly" | "monthly" | "yearly";

function deriveChangefreq(d: Date): Changefreq {
  const days = (Date.now() - d.getTime()) / 86_400_000;
  if (days < 30) return "weekly";
  if (days < 180) return "monthly";
  return "yearly";
}

export const GET: APIRoute = async () => {
  const posts = !editorialEnabled ? [] : await getCollection("posts", ({ data }) => {
    // Never index drafts or explicitly hidden
    return data.status === "published" && !(data as any).draft && !(data as any).noindex;
  });

  const entries = posts.map((p) => {
    const slug = p.id.replace(/\.(mdx?|md)$/, "");
    // Real date the file last changed, from git — not the frontmatter field,
    // which nobody remembers to bump and which once left every post
    // advertising a lastmod months stale. Frontmatter acts as the floor.
    const modified = lastModifiedFor(`src/content/posts/${p.id}`, p.data.lastModified ?? p.data.date);
    const lastmod = modified.toISOString();
    const priority = p.data.featured ? "0.9" : p.data.lastModified ? "0.8" : "0.7";
    const changefreq = deriveChangefreq(modified);

    return {
      loc: canonicalize(`${siteConfig.url}/posts/${slug}/`),
      lastmod,
      changefreq,
      priority,
    };
  });

  // Sort by priority DESC then lastmod DESC — helps crawl budget
  entries.sort((a, b) => {
    if (a.priority !== b.priority) return parseFloat(b.priority) - parseFloat(a.priority);
    return b.lastmod.localeCompare(a.lastmod);
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries
  .map(
    (e) => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
    <xhtml:link rel="alternate" hreflang="${siteConfig.lang}" href="${e.loc}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${e.loc}" />
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
