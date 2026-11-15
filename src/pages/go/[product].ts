// ═══════════════════════════════════════════════════════════════
// AFFILIATE REDIRECT — Phase 2: /go/[product] cloaked redirects
// SSR route: resolves product slug → affiliate URL via D1
// Tracks clicks with fire-and-forget counter increment
// ═══════════════════════════════════════════════════════════════

import type { APIRoute } from "astro";
import { resolveRedirect } from "@lib/d1";

export const prerender = false; // Force SSR for this route

export const GET: APIRoute = async ({ params, locals, redirect }) => {
  const slug = params.product;
  if (!slug) {
    return new Response("Not Found", { status: 404 });
  }

  const db = locals?.runtime?.env?.DB;
  const targetUrl = await resolveRedirect(slug, db);

  if (targetUrl) {
    return redirect(targetUrl, 302);
  }

  // Fallback: redirect to homepage if product not found
  return redirect("/", 302);
};
