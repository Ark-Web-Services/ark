// ═══════════════════════════════════════════════════════════════
// CONTENT COLLECTIONS — Type-safe schema with Zod
// Silo categories derived from niche.config.ts
// ═══════════════════════════════════════════════════════════════

import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { getSiloIds } from "../../niche.config";
import nicheConfig from "../../niche.config";

// Get silo IDs dynamically from config
const siloIds = getSiloIds();

const posts = defineCollection({
  type: "content",
  schema: z.object({
    status: z.enum(["draft", "published"]).default("published"),
    title: z.string().max(100, "Title should be ≤100 chars (SEO optimization recommended)"),
    description: z.string().max(300, "Description should be ≤300 chars (SEO optimization recommended)"),
    date: z.coerce.date(),
    lastModified: z.coerce.date().optional(),
    author: z.string().default(nicheConfig.author.name),

    // Categories from niche.config.ts silos
    category: z.enum(siloIds),
    tags: z.array(z.string()).default([]),

    // Media
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    imageCredit: z.string().optional(),

    // Layout
    sidebarType: z.enum(["default", "species", "review"]).default("default"),
    toc: z.boolean().default(true),
    comments: z.boolean().default(true),
    affiliateProducts: z.boolean().default(true),

    // Optional sidebar data
    difficulty: z.string().optional(),
    tankSize: z.string().optional(),
    temperature: z.string().optional(),
    phRange: z.string().optional(),
    lifespan: z.string().optional(),
    score: z.number().min(1).max(10).optional(),
    verdict: z.string().optional(),

    // SEO
    targetKeyword: z.string().optional(),
    keyTakeaways: z.array(z.string()).default([]),
    faq: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
    atomicAnswer: z.string().max(300).optional(),

    // Priority
    popularity: z.number().default(0),
    featured: z.boolean().default(false),

    // Internal linking
    pillarSlug: z.string().optional(),
    relatedSlugs: z.array(z.string()).default([]),
  }),
});

const pages = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updated: z.coerce.date().optional(),
    noindex: z.boolean().optional(),
  }),
});

const leadPages = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/lead-pages" }),
  schema: z.object({
    title: z.string().min(12).max(90),
    description: z.string().min(80).max(200),
    service: z.string().min(1).max(80),
    status: z.enum(["draft", "published"]).default("draft"),
    updated: z.coerce.date().optional(),
    ctaLabel: z.string().min(3).max(60).default("Request a site review"),
  }),
});

export const collections = { posts, pages, leadPages };
