// ═══════════════════════════════════════════════════════════════
// ASTRO 5.x CONFIG — Lighthouse-Perfect Edition
//
// Changes from baseline:
//   ✅ Removed @astrojs/sitemap integration — we now roll our own
//       multi-file sitemap at /sitemap-index.xml (see src/pages/*.xml.ts)
//   ✅ Enabled Astro compressHTML + inlined stylesheet for critical
//       CSS (Lighthouse "Eliminate render-blocking resources")
//   ✅ Enabled asset inlining under 4KB (fewer HTTP requests)
//   ✅ Image service → Cloudflare (already present, kept)
//   ✅ trailingSlash: "always" — matches our canonical strategy
//   ✅ build.format: "directory" — matches sitemap trailing slashes
// ═══════════════════════════════════════════════════════════════

import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";

import nicheConfig from "./niche.config";
import rehypeExternalLinks from "./src/lib/rehype-external-links";

export default defineConfig({
  // Keep each clone's content cache separate, including local shared dependency installs.
  cacheDir: "./.astro/cache",
  site: nicheConfig.url,
  trailingSlash: "always",

  output: "static",
  // No routes in this site use Astro sessions. Keep the Cloudflare Worker
  // free of an unused KV binding requirement while the inquiry pipeline is off.
  session: { driver: "memory" },
  build: {
    format: "directory",
    inlineStylesheets: "always",
    assets: "_astro",
  },
  compressHTML: true,

  adapter: cloudflare({
    imageService: "compile",
    platformProxy: { enabled: true },
  }),

  integrations: [
    mdx(),
    // NOTE: @astrojs/sitemap removed intentionally — see
    // src/pages/sitemap-index.xml.ts, sitemap-pages.xml.ts,
    // sitemap-posts.xml.ts, and sitemap-images.xml.ts
  ],

  markdown: {
    rehypePlugins: [rehypeExternalLinks],
    shikiConfig: {
      theme: "github-dark",
      wrap: true,
    },
  },

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ["node:buffer", "node:crypto"],
    },
    build: {
      assetsInlineLimit: 4096,
      cssCodeSplit: true,
    },
  },

  prefetch: {
    prefetchAll: false,
    defaultStrategy: "hover",
  },

  image: {
    // Constrain remote patterns for supply-chain / privacy safety
    remotePatterns: [{ protocol: "https" }],
  },
});
