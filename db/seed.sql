-- ═══════════════════════════════════════════════════════════════
-- SEED DATA — Template Placeholders
-- ═══════════════════════════════════════════════════════════════
-- This file contains example seed data.
-- Update with your niche-specific products from niche.config.ts
-- Run: wrangler d1 execute seo-authority-db --file=./db/seed.sql
-- ═══════════════════════════════════════════════════════════════

-- Example products (replace with your niche-specific products)
INSERT OR REPLACE INTO products (id, name, short_name, price, rating, rating_count, affiliate_url, image, badge, pros, cons) VALUES
  ('product-001', 'Example Starter Kit', 'Starter Kit', '$49.99', 4.8, 1247,
   'https://amzn.to/XXXXXXX', '/assets/images/products/starter-kit.webp',
   'Editor''s Choice',
   '["Complete beginner package","High quality components","Excellent value"]',
   '["Instructions could be clearer"]'),

  ('product-002', 'Example Testing Kit', 'Test Kit', '$34.99', 4.6, 892,
   'https://amzn.to/XXXXXXX', '/assets/images/products/test-kit.webp',
   'Best Value',
   '["Accurate results","Easy to use"]',
   '["Consumables need replacing"]'),

  ('product-003', 'Example Pro System', 'Pro System', '$89.99', 4.9, 2103,
   'https://amzn.to/XXXXXXX', '/assets/images/products/pro-system.webp',
   'Top Rated',
   '["Professional quality","Easy maintenance","Quiet operation"]',
   '["Premium price point"]');

-- Example page-product mappings (update for your niche)
INSERT OR REPLACE INTO page_product_map (page_slug, heading, product_ids) VALUES
  ('beginners-guide', 'Essential Equipment for Beginners', '["product-001","product-002"]'),
  ('best-products', 'Best Products — Tested & Ranked', '["product-001","product-002","product-003"]');

-- Example affiliate redirects
INSERT OR REPLACE INTO affiliate_redirects (slug, product_id, target_url) VALUES
  ('starter-kit', 'product-001', 'https://amzn.to/XXXXXXX'),
  ('test-kit', 'product-002', 'https://amzn.to/XXXXXXX'),
  ('pro-system', 'product-003', 'https://amzn.to/XXXXXXX');
