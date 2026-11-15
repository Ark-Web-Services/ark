import { editorialEnabled, businessMode } from "../lib/site-mode";
// ═══════════════════════════════════════════════════════════════
// /atom.xml — Atom 1.0 feed (some readers prefer this over RSS)
// ═══════════════════════════════════════════════════════════════

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { siteConfig } from "../data/navigation";
import { canonicalize } from "../lib/seo";

export const GET: APIRoute = async () => {
  const posts = !editorialEnabled ? [] : await getCollection("posts", ({ data }) => {
    return data.status === "published" && !(data as any).draft && !(data as any).noindex;
  });

  const sorted = posts
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .slice(0, 50);

  const latest =
    sorted[0]?.data.lastModified ?? sorted[0]?.data.date ?? new Date();

  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${siteConfig.lang}">
  <title>${esc(siteConfig.title)}</title>
  <subtitle>${esc(siteConfig.tagline)}</subtitle>
  <link href="${siteConfig.url}/atom.xml" rel="self" type="application/atom+xml" />
  <link href="${siteConfig.url}/" rel="alternate" type="text/html" />
  <id>${siteConfig.url}/</id>
  <updated>${latest.toISOString()}</updated>
  <author>
    <name>${esc(siteConfig.author.name)}</name>
  </author>
  <generator uri="https://astro.build" version="5">Astro</generator>
${sorted
  .map((p) => {
    const slug = p.id.replace(/\.(mdx?|md)$/, "");
    const link = canonicalize(`${siteConfig.url}/posts/${slug}/`);
    return `  <entry>
    <title>${esc(p.data.title)}</title>
    <link href="${link}" rel="alternate" type="text/html" />
    <id>${link}</id>
    <published>${p.data.date.toISOString()}</published>
    <updated>${(p.data.lastModified ?? p.data.date).toISOString()}</updated>
    <summary type="html">${esc(p.data.description)}</summary>
    <author>
      <name>${esc(p.data.author ?? siteConfig.author.name)}</name>
    </author>
  </entry>`;
  })
  .join("\n")}
</feed>`;

  return new Response(feed, {
    status: 200,
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
};
