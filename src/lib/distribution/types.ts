// ═══════════════════════════════════════════════════════════════
// DISTRIBUTION TYPES — TypeScript mirror of distribution-plan.schema.json
// ═══════════════════════════════════════════════════════════════

export type ExecutionMode = 'dry_run' | 'live' | 'queue';
export type ImageSourceType = 'local' | 'url' | 'base64';
export type PinPublishState = 'published' | 'draft';
export type TumblrPostFormat = 'photo' | 'npf' | 'text';
export type TumblrPostState = 'published' | 'queue' | 'draft' | 'private';
export type ImgurPrivacy = 'public' | 'hidden' | 'secret';

export interface ImageRef {
  source: string;
  source_type?: ImageSourceType;
  alt_text?: string;
  width?: number;
  height?: number;
}

export interface AssetPackage {
  title: string;
  guide_content?: string;
  summary?: string;
  primary_image: ImageRef;
  additional_images?: ImageRef[];
  canonical_source_url?: string;
  tags?: string[];
  keywords?: string[];
}

export interface PinterestRoute {
  enabled?: boolean;
  board_id: string;
  board_name?: string;
  board_section_id?: string | null;
  pin_title?: string;
  pin_description?: string;
  destination_link?: string;
  alt_text?: string;
  media_source_override?: 'asset_package' | 'imgur';
  dominant_color?: string;
  publish_state?: PinPublishState;
}

export interface ImgurRoute {
  enabled?: boolean;
  album_id?: string | null;
  create_album_if_missing?: boolean;
  album_title?: string;
  album_description?: string;
  image_title?: string;
  description?: string;
  privacy?: ImgurPrivacy;
  include_source_attribution?: boolean;
}

export interface TumblrRoute {
  enabled?: boolean;
  blog_name: string;
  post_format?: TumblrPostFormat;
  post_title?: string;
  caption_html?: string;
  click_through_url?: string;
  source_url?: string;
  tags?: string[];
  custom_url_slug?: string;
  post_state?: TumblrPostState;
  publish_on?: string;
  media_source_override?: 'asset_package' | 'imgur';
}

export interface PlatformRoutes {
  pinterest?: PinterestRoute;
  imgur?: ImgurRoute;
  tumblr?: TumblrRoute;
}

export interface InterlinkingLogic {
  primary_host?: 'asset_package' | 'imgur';
  use_imgur_url_for_pinterest?: boolean;
  use_imgur_url_for_tumblr?: boolean;
  cross_reference_in_descriptions?: boolean;
}

export interface RetryPolicy {
  max_attempts?: number;
  backoff_ms?: number;
  fail_fast?: boolean;
}

export interface DistributionPlan {
  plan_id: string;
  version: '1.0.0';
  created_at?: string;
  niche_id?: string;
  execution_mode?: ExecutionMode;
  asset_package: AssetPackage;
  platform_routes: PlatformRoutes;
  interlinking_logic?: InterlinkingLogic;
  execution_order?: ('imgur' | 'pinterest' | 'tumblr')[];
  retry_policy?: RetryPolicy;
}

// ── Result types ─────────────────────────────────────────────

export interface PlatformResult {
  platform: 'pinterest' | 'imgur' | 'tumblr';
  success: boolean;
  attempt: number;
  timestamp: string;
  live_url?: string;          // Public URL of the post
  resource_id?: string;       // Platform-side ID (pin_id, post_id, image hash)
  raw_response?: any;
  error?: string;
  // Imgur extras
  direct_image_url?: string;
  delete_hash?: string;
  album_url?: string;
  // Tumblr extras
  post_url?: string;
  // Pinterest extras
  board_id?: string;
}

export interface DistributionReport {
  plan_id: string;
  generated_at: string;
  execution_mode: ExecutionMode;
  asset_title: string;
  total_platforms: number;
  successful: number;
  failed: number;
  results: PlatformResult[];
  interlinking_used: boolean;
  duration_ms: number;
  alerts: string[];
}
