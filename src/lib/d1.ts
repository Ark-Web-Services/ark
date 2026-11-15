// ═══════════════════════════════════════════════════════════════
// D1 DATABASE HELPERS — Phase 2
// Provides typed queries for the Cloudflare D1 affiliate engine.
// Falls back to static data if D1 is unavailable.
// ═══════════════════════════════════════════════════════════════

import type { Product } from "@data/affiliates";
import {
  products as staticProducts,
  pageProductMap as staticMap,
} from "@data/affiliates";

type D1Database = import("@cloudflare/workers-types").D1Database;

// ── Raw D1 row types ─────────────────────────────────────────
interface D1ProductRow {
  id: string;
  name: string;
  short_name: string;
  price: string;
  rating: number;
  rating_count: number;
  affiliate_url: string;
  image: string;
  badge: string | null;
  pros: string;
  cons: string;
  in_stock: number;
}

interface D1PageMapRow {
  page_slug: string;
  heading: string;
  product_ids: string;
}

interface D1RedirectRow {
  slug: string;
  product_id: string;
  target_url: string;
  is_active: number;
}

// ── Transform D1 row → Product ───────────────────────────────
function rowToProduct(row: D1ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    price: row.price,
    rating: row.rating,
    ratingCount: row.rating_count,
    affiliateUrl: row.affiliate_url,
    image: row.image,
    badge: row.badge ?? undefined,
    pros: JSON.parse(row.pros),
    cons: JSON.parse(row.cons),
  };
}

// ── Get all products from D1 (fallback to static) ────────────
export async function getAllProducts(db?: D1Database): Promise<Product[]> {
  if (!db) return staticProducts;

  try {
    const { results } = await db
      .prepare("SELECT * FROM products WHERE in_stock = 1 ORDER BY name")
      .all<D1ProductRow>();
    return results.map(rowToProduct);
  } catch {
    console.warn("[D1] Failed to fetch products, using static fallback");
    return staticProducts;
  }
}

// ── Get product by ID ────────────────────────────────────────
export async function getProductById(
  id: string,
  db?: D1Database
): Promise<Product | null> {
  if (!db) return staticProducts.find((p) => p.id === id) ?? null;

  try {
    const row = await db
      .prepare("SELECT * FROM products WHERE id = ?")
      .bind(id)
      .first<D1ProductRow>();
    return row ? rowToProduct(row) : null;
  } catch {
    return staticProducts.find((p) => p.id === id) ?? null;
  }
}

// ── Get products for a page slug (D1 → static fallback) ──────
export async function getProductsForPage(
  slug: string,
  db?: D1Database
): Promise<{ heading: string; items: Product[] } | null> {
  if (!db) {
    const mapping = staticMap[slug];
    if (!mapping) return null;
    const items = mapping.products
      .map((pid) => staticProducts.find((p) => p.id === pid))
      .filter((p): p is Product => p !== undefined);
    return { heading: mapping.heading, items };
  }

  try {
    const mapRow = await db
      .prepare("SELECT * FROM page_product_map WHERE page_slug = ?")
      .bind(slug)
      .first<D1PageMapRow>();

    if (!mapRow) return null;

    const productIds: string[] = JSON.parse(mapRow.product_ids);
    const placeholders = productIds.map(() => "?").join(",");
    const { results } = await db
      .prepare(
        `SELECT * FROM products WHERE id IN (${placeholders}) AND in_stock = 1`
      )
      .bind(...productIds)
      .all<D1ProductRow>();

    return {
      heading: mapRow.heading,
      items: results.map(rowToProduct),
    };
  } catch {
    const mapping = staticMap[slug];
    if (!mapping) return null;
    const items = mapping.products
      .map((pid) => staticProducts.find((p) => p.id === pid))
      .filter((p): p is Product => p !== undefined);
    return { heading: mapping.heading, items };
  }
}

// ── Resolve affiliate redirect ───────────────────────────────
export async function resolveRedirect(
  slug: string,
  db?: D1Database
): Promise<string | null> {
  if (!db) {
    const product = staticProducts.find(
      (p) => p.shortName.toLowerCase().replace(/\s+/g, "-") === slug
    );
    return product?.affiliateUrl ?? null;
  }

  try {
    const row = await db
      .prepare(
        "SELECT target_url FROM affiliate_redirects WHERE slug = ? AND is_active = 1"
      )
      .bind(slug)
      .first<D1RedirectRow>();

    if (row) {
      // Increment click counter (fire-and-forget)
      db.prepare(
        "UPDATE affiliate_redirects SET click_count = click_count + 1, last_clicked = datetime('now') WHERE slug = ?"
      )
        .bind(slug)
        .run()
        .catch(() => {});
      return row.target_url;
    }
    return null;
  } catch {
    return null;
  }
}
