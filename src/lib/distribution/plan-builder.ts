// ═══════════════════════════════════════════════════════════════
// PLAN BUILDER — Helpers to assemble valid DistributionPlan objects
// from agent output / niche.config / raw inputs.
//
// Includes:
//   • generatePlanId()
//   • buildPlanFromAsset()  – ergonomic constructor with sensible defaults
//   • postFormatPolicy()    – picks NPF vs photo for Tumblr based on content
//   • normalizeSeoTags()    – produces SEO-clean Tumblr tags from keywords
// ═══════════════════════════════════════════════════════════════

import type {
  DistributionPlan,
  AssetPackage,
  PinterestRoute,
  ImgurRoute,
  TumblrRoute,
} from './types';

export function generatePlanId(slugSeed: string): string {
  const ts = Date.now();
  const slug = (slugSeed || 'plan')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `plan_${ts}_${slug || 'asset'}`;
}

export function normalizeSeoTags(tags: string[], maxLen = 139, maxCount = 30): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    if (typeof raw !== 'string') continue;
    const t = raw.trim().replace(/^#/, '').slice(0, maxLen);
    const key = t.toLowerCase();
    if (!t || seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= maxCount) break;
  }
  return out;
}

/** Heuristic: long-form guide → NPF; short caption-style → legacy photo. */
export function pickTumblrFormat(asset: AssetPackage): 'npf' | 'photo' {
  const len = (asset.guide_content || '').length;
  return len > 280 ? 'npf' : 'photo';
}

export interface BuildPlanInput {
  asset: AssetPackage;
  niche_id?: string;
  pinterest?: Partial<PinterestRoute> & { board_id: string };
  imgur?: Partial<ImgurRoute>;
  tumblr?: Partial<TumblrRoute> & { blog_name: string };
  use_imgur_for_pinterest?: boolean;
  use_imgur_for_tumblr?: boolean;
  execution_mode?: 'dry_run' | 'live' | 'queue';
  cross_reference?: boolean;
}

export function buildPlanFromAsset(input: BuildPlanInput): DistributionPlan {
  const seoTags = normalizeSeoTags([
    ...(input.asset.tags || []),
    ...(input.asset.keywords || []),
  ]);

  const plan: DistributionPlan = {
    plan_id: generatePlanId(input.asset.title),
    version: '1.0.0',
    created_at: new Date().toISOString(),
    niche_id: input.niche_id,
    execution_mode: input.execution_mode || 'live',
    asset_package: {
      ...input.asset,
      tags: seoTags,
    },
    platform_routes: {},
    interlinking_logic: {
      primary_host: 'imgur',
      use_imgur_url_for_pinterest: !!input.use_imgur_for_pinterest,
      use_imgur_url_for_tumblr: !!input.use_imgur_for_tumblr,
      cross_reference_in_descriptions: !!input.cross_reference,
    },
    execution_order: ['imgur', 'pinterest', 'tumblr'],
    retry_policy: { max_attempts: 3, backoff_ms: 2000, fail_fast: false },
  };

  if (input.imgur) {
    plan.platform_routes.imgur = {
      enabled: true,
      create_album_if_missing: true,
      privacy: 'public',
      include_source_attribution: true,
      ...input.imgur,
    };
  }

  if (input.pinterest) {
    plan.platform_routes.pinterest = {
      enabled: true,
      publish_state: 'published',
      pin_title: input.asset.title.slice(0, 100),
      pin_description: (input.asset.summary || '').slice(0, 800),
      destination_link: input.asset.canonical_source_url,
      alt_text: input.asset.primary_image.alt_text,
      ...input.pinterest,
    };
  }

  if (input.tumblr) {
    plan.platform_routes.tumblr = {
      enabled: true,
      post_format: pickTumblrFormat(input.asset),
      tags: seoTags,
      click_through_url: input.asset.canonical_source_url,
      source_url: input.asset.canonical_source_url,
      post_state: 'published',
      ...input.tumblr,
    };
  }

  return plan;
}
