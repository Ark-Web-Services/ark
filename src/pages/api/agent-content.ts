// ═══════════════════════════════════════════════════════════════
// AGENT CONTENT API — Phase 3: AIO Markdown endpoint
// Serves clean Markdown to AI crawlers for efficient ingestion
// Reduces token count by ~80% vs raw HTML
// ═══════════════════════════════════════════════════════════════

import { editorialEnabled } from "../../lib/site-mode";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { siteConfig } from "@data/navigation";

export const prerender = false; // SSR

export const GET: APIRoute = async ({ url }) => {
  if (!editorialEnabled) return new Response("Not found", { status: 404 });
  const slug = url.searchParams.get("slug");

  if (!slug) {
    // Return site index in Markdown
    const posts = await getCollection("posts");
    const sortedPosts = posts.sort(
      (a, b) => b.data.date.getTime() - a.data.date.getTime()
    );

    let markdown = `# ${siteConfig.title}\n\n`;
    markdown += `> ${siteConfig.description}\n\n`;
    markdown += `## Articles\n\n`;

    for (const post of sortedPosts) {
      markdown += `- [${post.data.title}](${siteConfig.url}/posts/${post.id}/)`;
      if (post.data.atomicAnswer) {
        markdown += `\n  > ${post.data.atomicAnswer}`;
      }
      markdown += `\n`;
    }

    return new Response(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "X-Content-Format": "markdown",
        "X-Robots-Tag": "noindex", // Don't index the API endpoint itself
      },
    });
  }

  // Return specific article in Markdown
  const posts = await getCollection("posts");
  const post = posts.find((p) => p.id === slug);

  if (!post) {
    return new Response("# 404 Not Found\n\nArticle not found.", {
      status: 404,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }

  let markdown = `# ${post.data.title}\n\n`;

  if (post.data.atomicAnswer) {
    markdown += `> **Quick Answer:** ${post.data.atomicAnswer}\n\n`;
  }

  markdown += `**Author:** ${post.data.author}\n`;
  markdown += `**Published:** ${post.data.date.toISOString().split("T")[0]}\n`;
  if (post.data.lastModified) {
    markdown += `**Updated:** ${post.data.lastModified.toISOString().split("T")[0]}\n`;
  }
  markdown += `**Category:** ${post.data.category}\n\n`;

  if (post.data.keyTakeaways.length > 0) {
    markdown += `## Key Takeaways\n\n`;
    for (const takeaway of post.data.keyTakeaways) {
      markdown += `- ${takeaway}\n`;
    }
    markdown += `\n`;
  }

  // Include raw MDX body (stripping import/component lines)
  const body = (post.body ?? "")
    .split("\n")
    .filter((line) => !line.startsWith("import ") && !line.startsWith("<"))
    .join("\n");
  markdown += body;

  if (post.data.faq.length > 0) {
    markdown += `\n\n## FAQ\n\n`;
    for (const qa of post.data.faq) {
      markdown += `### ${qa.question}\n\n${qa.answer}\n\n`;
    }
  }

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Format": "markdown",
    },
  });
};
