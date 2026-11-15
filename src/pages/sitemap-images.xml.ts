import { editorialEnabled, businessMode } from "../lib/site-mode";
// ═══════════════════════════════════════════════════════════════
// /sitemap-images.xml — Google Image Sitemap
//
// Gives Google an explicit inventory of every image on the site
// along with its page, title, and caption. This is one of the
// highest-ROI SEO wins — unlocks Google Images + Discover traffic
// and gets new images indexed within hours instead of weeks.
//
// Spec: https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps
// ═══════════════════════════════════════════════════════════════

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { siteConfig } from "../data/navigation";
import { canonicalize, absoluteUrl } from "../lib/seo";

interface ImageEntry {
  loc: string;
  url: string;
  title: string;
  caption?: string;
}

// Extract markdown images from post body
const MD_IMG = /!\[([^\]]*)\]\((\/[^)\s]+)\)/g;

export const GET: APIRoute = async () => {
  const posts = !editorialEnabled ? [] : await getCollection("posts", ({ data }) => {
    return data.status === "published" && !(data as any).draft && !(data as any).noindex;
  });

  const entries: { pageLoc: string; images: ImageEntry[] }[] = [];

  for (const post of posts) {
    const slug = post.id.replace(/\.(mdx?|md)$/, "");
    const pageLoc = canonicalize(`${siteConfig.url}/posts/${slug}/`);
    const images: ImageEntry[] = [];

    // 1. Hero image from frontmatter
    if (post.data.image) {
      images.push({
        loc: pageLoc,
        url: absoluteUrl(post.data.image),
        title: post.data.imageAlt ?? post.data.title,
        caption: post.data.description,
      });
    }

    // 2. Images embedded in the post body
    const body = (post.body || "") as string;
    let m: RegExpExecArray | null;
    while ((m = MD_IMG.exec(body))) {
      const [, alt, src] = m;
      images.push({
        loc: pageLoc,
        url: absoluteUrl(src),
        title: alt || post.data.title,
        caption: alt || undefined,
      });
    }

    if (images.length > 0) entries.push({ pageLoc, images });
  }

  // Also include hero/default OG images for the homepage + silos
  if (!businessMode) entries.push({
    pageLoc: canonicalize(`${siteConfig.url}/`),
    images: [
      {
        loc: canonicalize(`${siteConfig.url}/`),
        url: absoluteUrl("/assets/images/default-og.webp"),
        title: siteConfig.title,
        caption: siteConfig.tagline,
      },
    ],
  });

  if (businessMode) {
    const { default: business } = await import('../../business.config');
    if (business.hero.image) entries.push({ pageLoc: canonicalize(`${siteConfig.url}/`), images: [{ loc: canonicalize(`${siteConfig.url}/`), url: absoluteUrl(business.hero.image), title: business.hero.imageAlt || business.name }] });
    for (const project of business.projects) if (!project.demo) entries.push({ pageLoc: canonicalize(`${siteConfig.url}/portfolio/`), images: [{ loc: canonicalize(`${siteConfig.url}/portfolio/`), url: absoluteUrl(project.image), title: project.imageAlt }] });
  }
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries
  .map(
    (e) => `  <url>
    <loc>${e.pageLoc}</loc>
${e.images
  .map(
    (img) => `    <image:image>
      <image:loc>${escape(img.url)}</image:loc>
      <image:title>${escape(img.title)}</image:title>${
      img.caption ? `\n      <image:caption>${escape(img.caption)}</image:caption>` : ""
    }
    </image:image>`
  )
  .join("\n")}
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
