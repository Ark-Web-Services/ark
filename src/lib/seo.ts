// ═══════════════════════════════════════════════════════════════
// SEO UTILITIES — Schema.org generation, meta helpers
// LIGHTHOUSE-PERFECT EDITION — adds:
//   • canonicalize() — normalises URLs for canonical/OG
//   • generateOrganizationSchema()
//   • generateBreadcrumbSchema()
//   • generateHowToSchema()
//   • generateFaqSchema() w/ safe empty handling
//   • generateImageObjectSchema()
//   • absoluteUrl()
// ═══════════════════════════════════════════════════════════════

import { siteConfig } from "@data/navigation";
import type { Product } from "@data/affiliates";

// ── URL helpers ──────────────────────────────────────────────

/**
 * Normalise a URL for use in canonical / OG:
 *   • forces https
 *   • strips tracking query params (utm_*, fbclid, gclid, ref, etc.)
 *   • strips hash
 *   • enforces single trailing slash (except for files with extensions)
 *   • lowercases host
 */
export function canonicalize(raw: string): string {
  try {
    const u = new URL(raw);
    u.protocol = "https:";
    u.hostname = u.hostname.toLowerCase();

    // Strip trackers
    const killers = [
      /^utm_/i,
      /^fbclid$/i,
      /^gclid$/i,
      /^mc_[ec]id$/i,
      /^ref$/i,
      /^source$/i,
      /^campaign$/i,
      /^igshid$/i,
      /^yclid$/i,
      /^_hsenc$/i,
      /^_hsmi$/i,
    ];
    const keys = [...u.searchParams.keys()];
    for (const k of keys) {
      if (killers.some((rx) => rx.test(k))) u.searchParams.delete(k);
    }

    u.hash = "";

    // Trailing slash normalisation
    const isFile = /\.[a-z0-9]{2,5}$/i.test(u.pathname);
    if (!isFile && !u.pathname.endsWith("/")) u.pathname += "/";

    let out = u.toString();
    // URL serializer sometimes leaves '?'; clean up
    out = out.replace(/\?$/, "");
    return out;
  } catch {
    return raw;
  }
}

export function absoluteUrl(path: string): string {
  if (!path) return siteConfig.url;
  if (path.startsWith("http")) return path;
  return `${siteConfig.url.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

// ── Article Schema ───────────────────────────────────────────
export function generateArticleSchema(page: {
  title: string;
  description: string;
  url: string;
  image?: string;
  date: Date;
  lastModified?: Date;
  author?: string;
  wordCount: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(page.url),
    },
    headline: page.title.slice(0, 110), // Google caps headline length
    description: page.description,
    ...(page.image && {
      image: {
        "@type": "ImageObject",
        url: absoluteUrl(page.image),
        width: 1200,
        height: 630,
      },
    }),
    author: {
      "@type": "Person",
      name: page.author ?? siteConfig.author.name,
      url: absoluteUrl("/about/"),
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.title,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/assets/images/logo.png"),
        width: 600,
        height: 60,
      },
    },
    datePublished: page.date.toISOString(),
    dateModified: (page.lastModified ?? page.date).toISOString(),
    wordCount: page.wordCount,
    inLanguage: siteConfig.lang,
  };
}

// ── FAQ Schema ───────────────────────────────────────────────
export function generateFaqSchema(
  faq: { question: string; answer: string }[]
) {
  if (!faq || faq.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((qa) => ({
      "@type": "Question",
      name: qa.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: qa.answer,
      },
    })),
  };
}

// ── HowTo Schema (for tutorials) ─────────────────────────────
export function generateHowToSchema(howto: {
  name: string;
  description: string;
  image?: string;
  totalTime?: string; // ISO 8601 duration, e.g. PT30M
  estimatedCost?: { currency: string; value: string };
  supply?: string[];
  tool?: string[];
  steps: { name: string; text: string; image?: string; url?: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: howto.name,
    description: howto.description,
    ...(howto.image && { image: absoluteUrl(howto.image) }),
    ...(howto.totalTime && { totalTime: howto.totalTime }),
    ...(howto.estimatedCost && {
      estimatedCost: {
        "@type": "MonetaryAmount",
        currency: howto.estimatedCost.currency,
        value: howto.estimatedCost.value,
      },
    }),
    ...(howto.supply && {
      supply: howto.supply.map((s) => ({ "@type": "HowToSupply", name: s })),
    }),
    ...(howto.tool && {
      tool: howto.tool.map((t) => ({ "@type": "HowToTool", name: t })),
    }),
    step: howto.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      ...(s.image && { image: absoluteUrl(s.image) }),
      ...(s.url && { url: absoluteUrl(s.url) }),
    })),
  };
}

// ── Product Schema ───────────────────────────────────────────
export function generateProductSchema(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: absoluteUrl(product.image),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating.toString(),
      reviewCount: product.ratingCount.toString(),
      bestRating: "5",
      worstRating: "1",
    },
    offers: {
      "@type": "Offer",
      price: product.price.replace(/[^0-9.]/g, "").split(".")[0] || "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: product.affiliateUrl,
    },
  };
}

// ── Breadcrumb Schema ────────────────────────────────────────
export function generateBreadcrumbSchema(
  crumbs: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.url),
    })),
  };
}

// ── WebSite Schema ───────────────────────────────────────────
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    name: siteConfig.title,
    alternateName: siteConfig.tagline,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: siteConfig.lang,
    publisher: { "@id": `${siteConfig.url}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ── Organization Schema ──────────────────────────────────────
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.title,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      "@id": `${siteConfig.url}/#logo`,
      url: absoluteUrl("/assets/images/logo.png"),
      width: 600,
      height: 60,
      caption: siteConfig.title,
    },
    image: { "@id": `${siteConfig.url}/#logo` },
    sameAs: siteConfig.author.social.map((s) => s.url),
    description: siteConfig.description,
  };
}

// ── ImageObject Schema ───────────────────────────────────────
export function generateImageObjectSchema(img: {
  url: string;
  width?: number;
  height?: number;
  caption?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    contentUrl: absoluteUrl(img.url),
    url: absoluteUrl(img.url),
    ...(img.width && { width: img.width }),
    ...(img.height && { height: img.height }),
    ...(img.caption && { caption: img.caption }),
  };
}

// ── Reading time + word count ────────────────────────────────
export function estimateReadingTime(content: string): number {
  const words = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 250));
}

export function wordCount(content: string): number {
  return content.split(/\s+/).filter(Boolean).length;
}

export function excerptFromMarkdown(content: string, maxLength = 160): string {
  const paragraphs = content
    .replace(/^---[\s\S]*?---/, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .split(/\n\s*\n/)
    .map((paragraph) =>
      paragraph
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_`~]/g, "")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(
      (paragraph) =>
        paragraph.length >= 80 &&
        !/^(#{1,6}|[-+>]|\d+\.|\|)/.test(paragraph)
    );

  const excerpt = paragraphs[0] ?? "";
  if (excerpt.length <= maxLength) return excerpt;

  const shortened = excerpt.slice(0, maxLength + 1);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > 0 ? lastSpace : maxLength).trim()}...`;
}
