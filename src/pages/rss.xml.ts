import { editorialEnabled, businessMode } from "../lib/site-mode";
// ═══════════════════════════════════════════════════════════════
// /rss.xml — RSS 2.0 feed (content:encoded, full body)
// ═══════════════════════════════════════════════════════════════

import type { APIRoute } from "astro";
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { siteConfig } from "../data/navigation";
import { canonicalize } from "../lib/seo";

export const GET: APIRoute = async (context) => {
  const posts = !editorialEnabled ? [] : await getCollection("posts", ({ data }) => {
    return data.status === "published" && !(data as any).draft && !(data as any).noindex;
  });

  const sorted = posts.sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );

  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: context.site ?? siteConfig.url,
    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
      content: "http://purl.org/rss/1.0/modules/content/",
      dc: "http://purl.org/dc/elements/1.1/",
    },
    customData: `<language>${siteConfig.lang}</language>
<atom:link href="${siteConfig.url}/rss.xml" rel="self" type="application/rss+xml" />
<image>
  <url>${siteConfig.url}/assets/images/logo.png</url>
  <title>${siteConfig.title}</title>
  <link>${siteConfig.url}</link>
</image>`,
    items: sorted.map((p) => {
      const slug = p.id.replace(/\.(mdx?|md)$/, "");
      return {
        title: p.data.title,
        pubDate: p.data.date,
        description: p.data.description,
        link: canonicalize(`${siteConfig.url}/posts/${slug}/`),
        categories: [p.data.category, ...(p.data.tags ?? [])],
        author: p.data.author ?? siteConfig.author.name,
      };
    }),
  });
};
