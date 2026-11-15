// ═══════════════════════════════════════════════════════════════
// AUTOMATED INTERNAL LINKING ENGINE
// Phase 1: Implements Hub-and-Spoke (Silo) model linking
// Ensures every article links back to its pillar + siblings
// Rule of 3-5: Every article must have ≥3 internal links
// ═══════════════════════════════════════════════════════════════

import { getCollection, type CollectionEntry } from "astro:content";
import { silos } from "@data/navigation";

type Post = CollectionEntry<"posts">;

// ── Get related posts (same category first, then tags) ───────
export async function getRelatedPosts(
  currentPost: Post,
  maxRelated: number = 4
): Promise<Post[]> {
  const allPosts = await getCollection("posts", ({ data }) => data.status === "published");
  const related: Post[] = [];
  const seen = new Set<string>();
  seen.add(currentPost.id);

  // Priority 1: Manually specified related posts
  if (currentPost.data.relatedSlugs?.length) {
    for (const slug of currentPost.data.relatedSlugs) {
      const post = allPosts.find((p) => p.id.includes(slug));
      if (post && !seen.has(post.id) && related.length < maxRelated) {
        related.push(post);
        seen.add(post.id);
      }
    }
  }

  // Priority 2: Same category posts
  if (related.length < maxRelated) {
    const catPosts = allPosts.filter(
      (p) =>
        p.data.category === currentPost.data.category && !seen.has(p.id)
    );
    // Sort by popularity descending
    catPosts.sort((a, b) => (b.data.popularity ?? 0) - (a.data.popularity ?? 0));
    for (const post of catPosts) {
      if (related.length >= maxRelated) break;
      related.push(post);
      seen.add(post.id);
    }
  }

  // Priority 3: Same tag posts (fill remaining slots)
  if (related.length < maxRelated && currentPost.data.tags.length > 0) {
    for (const tag of currentPost.data.tags) {
      const tagPosts = allPosts.filter(
        (p) => p.data.tags.includes(tag) && !seen.has(p.id)
      );
      for (const post of tagPosts) {
        if (related.length >= maxRelated) break;
        related.push(post);
        seen.add(post.id);
      }
    }
  }

  // Priority 4: Most popular posts (last resort)
  if (related.length < maxRelated) {
    const remaining = allPosts.filter((p) => !seen.has(p.id));
    remaining.sort((a, b) => (b.data.popularity ?? 0) - (a.data.popularity ?? 0));
    for (const post of remaining) {
      if (related.length >= maxRelated) break;
      related.push(post);
      seen.add(post.id);
    }
  }

  return related;
}

// ── Get pillar page for a category ───────────────────────────
export function getPillarForCategory(
  category: string
): { url: string; label: string } | null {
  const silo = silos.find((s) => s.id === category);
  return silo ? { url: silo.pillar, label: silo.label } : null;
}

// ── Get silo color for category ──────────────────────────────
export function getSiloColor(category: string): string {
  const silo = silos.find((s) => s.id === category);
  return silo?.color ?? "#6B7280";
}

// ── Generate breadcrumbs from URL ────────────────────────────
export function generateBreadcrumbs(
  url: string,
  title: string
): { name: string; url: string }[] {
  const crumbs: { name: string; url: string }[] = [
    { name: "Home", url: "/" },
  ];

  const segments = url.split("/").filter(Boolean);
  let path = "";

  for (let i = 0; i < segments.length; i++) {
    path += `/${segments[i]}`;
    const isLast = i === segments.length - 1;
    // /posts/ has no index page — the post listing lives at /articles/
    if (!isLast && segments[i] === "posts") {
      crumbs.push({ name: "Articles", url: "/articles/" });
      continue;
    }
    const name = isLast
      ? title
      : segments[i].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({ name, url: isLast ? url : `${path}/` });
  }

  return crumbs;
}

// ── Internal link audit (build-time check) ───────────────────
export async function auditInternalLinks(): Promise<{
  orphans: string[];
  underLinked: { slug: string; linkCount: number }[];
}> {
  const allPosts = await getCollection("posts");
  const orphans: string[] = [];
  const underLinked: { slug: string; linkCount: number }[] = [];

  for (const post of allPosts) {
    const { body } = post;
    const internalLinks = (body.match(/\[.*?\]\(\/.*?\)/g) || []).length;

    // Check for orphan pages (no category = no silo)
    if (!post.data.category) {
      orphans.push(post.id);
    }

    // Rule of 3-5: flag articles with fewer than 3 internal links
    if (internalLinks < 3) {
      underLinked.push({ slug: post.id, linkCount: internalLinks });
    }
  }

  return { orphans, underLinked };
}
