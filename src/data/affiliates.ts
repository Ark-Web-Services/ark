// ═══════════════════════════════════════════════════════════════
// AFFILIATE PRODUCT ENGINE — Reads from niche.config.ts
// ═══════════════════════════════════════════════════════════════

import nicheConfig from '../../niche.config';

export interface Product {
  id: string;
  name: string;
  shortName: string;
  price: string;
  rating: number;
  ratingCount: number;
  affiliateUrl: string;
  image: string;
  badge?: string;
  pros: string[];
  cons: string[];
}

export interface PageProductMapping {
  heading: string;
  products: string[];
}

// ── All derived from niche.config.ts ─────────────────────────

export const affiliateDisclaimer = nicheConfig.affiliateDisclaimer;

export const products: Product[] = nicheConfig.defaultProducts;

export const pageProductMap: Record<string, PageProductMapping> = nicheConfig.pageProductMap;

export function getProductsForPage(slug: string): {
  heading: string;
  items: Product[];
} | null {
  const mapping = pageProductMap[slug];
  if (!mapping) return null;

  const items = mapping.products
    .map((pid) => products.find((p) => p.id === pid))
    .filter((p): p is Product => p !== undefined);

  return { heading: mapping.heading, items };
}
