// ═══════════════════════════════════════════════════════════════
// DISTRIBUTION ENGINE — The orchestrator that executes a Plan
// across Pinterest, Imgur, and Tumblr in coordinated fashion.
//
// Order of operations (default):
//   1. Validate + normalize plan
//   2. Load primary image (local/url/base64 → Buffer + base64)
//   3. (Optional) Imgur upload first → produces canonical link for interlinking
//   4. Pinterest pin (using imgur URL if requested)
//   5. Tumblr post (using imgur URL if requested)
//   6. Compose DistributionReport with live URLs + persist to disk
// ═══════════════════════════════════════════════════════════════

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type {
  DistributionPlan,
  DistributionReport,
  PlatformResult,
} from './types';
import { validatePlan, normalizePlan } from './validator';
import { loadImage, type LoadedImage } from './image-loader';
import { ImgurClient, type ImgurUploadResult } from './imgur-client';
import { PinterestClient } from './pinterest-client';
import { TumblrClient } from './tumblr-client';

export interface EngineOptions {
  log_dir?: string;
  imgur?: ImgurClient;
  pinterest?: PinterestClient;
  tumblr?: TumblrClient;
  /** When true, do not perform any HTTP — just return what *would* happen. */
  dry_run_override?: boolean;
}

const DEFAULT_LOG_DIR = 'data/distribution-logs';

export class DistributionEngine {
  constructor(private opts: EngineOptions = {}) {}

  async execute(planInput: DistributionPlan): Promise<DistributionReport> {
    const start = Date.now();
    const alerts: string[] = [];

    // 1. Validate
    const v = validatePlan(planInput);
    if (!v.valid) {
      throw new Error(`Plan validation failed:\n  - ${v.errors.join('\n  - ')}`);
    }
    for (const w of v.warnings) alerts.push(`⚠️ ${w}`);

    const plan = normalizePlan(planInput);
    const isDry = this.opts.dry_run_override || plan.execution_mode === 'dry_run';

    // 2. Load image
    let primary: LoadedImage | null = null;
    try {
      primary = await loadImage(plan.asset_package.primary_image);
    } catch (err: any) {
      throw new Error(`Image load failed: ${err.message}`);
    }

    const results: PlatformResult[] = [];
    const order = plan.execution_order!;

    // Track Imgur output for interlinking
    let imgurResult: ImgurUploadResult | null = null;

    for (const platform of order) {
      const route = (plan.platform_routes as any)[platform];
      if (!route || route.enabled === false) continue;

      let res: PlatformResult;
      try {
        if (isDry) {
          res = await this.simulate(platform, plan, primary, imgurResult);
        } else if (platform === 'imgur') {
          res = await this.runImgur(plan, primary);
          if (res.success && res.direct_image_url) {
            imgurResult = {
              id: res.resource_id!,
              deletehash: res.delete_hash || '',
              link: res.direct_image_url,
              page_url: res.live_url || '',
              album_id: undefined,
              album_url: res.album_url,
              raw: res.raw_response,
            };
          }
        } else if (platform === 'pinterest') {
          res = await this.runPinterest(plan, primary, imgurResult);
        } else if (platform === 'tumblr') {
          res = await this.runTumblr(plan, primary, imgurResult);
        } else {
          continue;
        }
      } catch (err: any) {
        res = {
          platform,
          success: false,
          attempt: 1,
          timestamp: new Date().toISOString(),
          error: err.message || String(err),
        };
        if (plan.retry_policy?.fail_fast) {
          results.push(res);
          break;
        }
      }
      results.push(res);
    }

    const report: DistributionReport = {
      plan_id: plan.plan_id,
      generated_at: new Date().toISOString(),
      execution_mode: plan.execution_mode!,
      asset_title: plan.asset_package.title,
      total_platforms: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
      interlinking_used: !!(
        imgurResult &&
        (plan.interlinking_logic?.use_imgur_url_for_pinterest ||
          plan.interlinking_logic?.use_imgur_url_for_tumblr)
      ),
      duration_ms: Date.now() - start,
      alerts,
    };

    this.persistReport(report);
    return report;
  }

  // ── Per-platform runners ────────────────────────────────────

  private async runImgur(
    plan: DistributionPlan,
    image: LoadedImage | null
  ): Promise<PlatformResult> {
    if (!image) throw new Error('Imgur: no image loaded');
    const route = plan.platform_routes.imgur!;
    const client = this.opts.imgur || ImgurClient.fromEnv();

    let albumId: string | undefined = route.album_id || undefined;
    let albumUrl: string | undefined;

    if (!albumId && route.create_album_if_missing) {
      const album = await client.createAlbum({
        title: route.album_title || plan.asset_package.title,
        description: route.album_description || plan.asset_package.summary,
        privacy: route.privacy || 'public',
      });
      albumId = album.id;
      albumUrl = album.link;
    }

    let description = route.description || plan.asset_package.summary || '';
    if (route.include_source_attribution !== false && plan.asset_package.canonical_source_url) {
      description = `${description}\n\nSource: ${plan.asset_package.canonical_source_url}`.trim();
    }

    const upload = await client.uploadImage({
      image,
      title: route.image_title || plan.asset_package.title,
      description,
      album_id: albumId,
    });

    return {
      platform: 'imgur',
      success: true,
      attempt: 1,
      timestamp: new Date().toISOString(),
      live_url: upload.page_url,
      direct_image_url: upload.link,
      delete_hash: upload.deletehash,
      resource_id: upload.id,
      album_url: albumUrl || upload.album_url,
      raw_response: upload.raw,
    };
  }

  private async runPinterest(
    plan: DistributionPlan,
    image: LoadedImage | null,
    imgur: ImgurUploadResult | null
  ): Promise<PlatformResult> {
    if (!image) throw new Error('Pinterest: no image loaded');
    const route = plan.platform_routes.pinterest!;
    const client = this.opts.pinterest || PinterestClient.fromEnv();

    const useImgur =
      route.media_source_override === 'imgur' ||
      plan.interlinking_logic?.use_imgur_url_for_pinterest;

    const useImgurUrl = useImgur && imgur?.link;
    let boardId = route.board_id;

    // Resolve Board ID if missing or placeholder
    if (!boardId || boardId.startsWith('RESOLVE_')) {
      const boardName = route.board_name || 'My Pins';
      const existing = await client.findBoardByName(boardName);
      if (existing) {
        boardId = existing.id;
      } else {
        // Create if missing (Pinterest always allows creation)
        const created = await client.createBoard({
          name: boardName,
          description: 'Created by Godfather Distribution Engine',
        });
        boardId = created.id;
      }
    }

    const pin = await client.createPin({
      board_id: boardId,
      board_section_id: route.board_section_id,
      title: route.pin_title || plan.asset_package.title,
      description: route.pin_description || plan.asset_package.summary,
      link: route.destination_link || plan.asset_package.canonical_source_url,
      alt_text: route.alt_text || plan.asset_package.primary_image.alt_text,
      dominant_color: route.dominant_color,
      publish_state: route.publish_state || 'published',
      ...(useImgurUrl
        ? { image_url: imgur!.link }
        : {
            image_base64: {
              data: image.base64,
              content_type: image.mime_type,
            },
          }),
    });

    return {
      platform: 'pinterest',
      success: true,
      attempt: 1,
      timestamp: new Date().toISOString(),
      live_url: pin.pin_url,
      resource_id: pin.id,
      board_id: pin.board_id,
      raw_response: pin.raw,
    };
  }

  private async runTumblr(
    plan: DistributionPlan,
    image: LoadedImage | null,
    imgur: ImgurUploadResult | null
  ): Promise<PlatformResult> {
    if (!image) throw new Error('Tumblr: no image loaded');
    const route = plan.platform_routes.tumblr!;
    const client = this.opts.tumblr || TumblrClient.fromEnv();

    const useImgur =
      route.media_source_override === 'imgur' ||
      plan.interlinking_logic?.use_imgur_url_for_tumblr;

    const tags = (route.tags || plan.asset_package.tags || []).slice(0, 30);
    const slug = route.custom_url_slug;
    const sourceUrl = route.source_url || plan.asset_package.canonical_source_url;
    const clickThrough = route.click_through_url || plan.asset_package.canonical_source_url;
    const state = route.post_state || 'published';
    const publishOn = route.publish_on;

    const fmt = route.post_format || 'npf';

    let result;
    if (fmt === 'photo') {
      // Legacy "photo" with `link` parameter — image acts as a clickable button
      const caption =
        route.caption_html ||
        (plan.asset_package.guide_content
          ? `<p>${plan.asset_package.guide_content.replace(/\n+/g, '</p><p>')}</p>`
          : `<p>${plan.asset_package.summary || ''}</p>`);
      result = await client.createPhotoPost({
        blog_name: route.blog_name,
        caption,
        link: clickThrough,
        source: sourceUrl,
        tags,
        state,
        publish_on: publishOn,
        slug,
        ...(useImgur && imgur?.link
          ? { source_url: imgur.link }
          : { data64: image.base64 }),
      });
    } else {
      // NPF post (richer content + click-through)
      result = await client.createNpfPost({
        blog_name: route.blog_name,
        title: route.post_title || plan.asset_package.title,
        guide_content: plan.asset_package.guide_content || plan.asset_package.summary,
        click_through_url: clickThrough,
        source_url: sourceUrl,
        tags,
        state,
        publish_on: publishOn,
        slug,
        ...(useImgur && imgur?.link
          ? { image_url: imgur.link }
          : { image_data64: image.base64 }),
      });
    }

    return {
      platform: 'tumblr',
      success: true,
      attempt: 1,
      timestamp: new Date().toISOString(),
      live_url: result.post_url,
      post_url: result.post_url,
      resource_id: result.id,
      raw_response: result.raw,
    };
  }

  // ── Dry-run simulation ──────────────────────────────────────

  private async simulate(
    platform: 'pinterest' | 'imgur' | 'tumblr',
    plan: DistributionPlan,
    image: LoadedImage | null,
    imgur: ImgurUploadResult | null
  ): Promise<PlatformResult> {
    return {
      platform,
      success: true,
      attempt: 1,
      timestamp: new Date().toISOString(),
      live_url: `https://${platform}.example.com/dry-run/${plan.plan_id}`,
      resource_id: `dryrun_${platform}_${Date.now()}`,
      raw_response: {
        dry_run: true,
        would_upload_size: image?.size_bytes,
        interlink_imgur_url: imgur?.link,
      },
    };
  }

  // ── Persistence ─────────────────────────────────────────────

  private persistReport(report: DistributionReport): void {
    const dir = this.opts.log_dir || DEFAULT_LOG_DIR;
    const abs = join(process.cwd(), dir);
    if (!existsSync(abs)) mkdirSync(abs, { recursive: true });
    const file = join(abs, `${report.plan_id}.json`);
    writeFileSync(file, JSON.stringify(report, null, 2));
  }
}
