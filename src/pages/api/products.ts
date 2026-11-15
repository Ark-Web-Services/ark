// ═══════════════════════════════════════════════════════════════
// PRODUCTS API — Phase 2: D1-powered product data endpoint
// Returns live product data for client-side price displays
// ═══════════════════════════════════════════════════════════════

import type { APIRoute } from "astro";
import { getAllProducts, getProductsForPage } from "@lib/d1";

export const prerender = false; // SSR

export const GET: APIRoute = async ({ url, locals }) => {
  const db = locals?.runtime?.env?.DB;
  const pageSlug = url.searchParams.get("page");

  try {
    if (pageSlug) {
      const data = await getProductsForPage(pageSlug, db);
      return new Response(JSON.stringify(data ?? { heading: "", items: [] }), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300, s-maxage=600", // 5m client, 10m CDN
        },
      });
    }

    const products = await getAllProducts(db);
    return new Response(JSON.stringify(products), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, s-maxage=600",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch products" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
