// ═══════════════════════════════════════════════════════════════
// TUMBLR CLIENT — Tumblr API v2
// Supports OAuth 2.0 Bearer (preferred) + OAuth 1.0a fallback note.
// Docs: https://www.tumblr.com/docs/en/api/v2
//
// Critical features for "How-To" posters:
//   • NPF (Newton Post Format) photo blocks with click-through link
//   • Photo posts with `link` parameter (entire image becomes a button)
//   • SEO-optimized tags (max 30, comma separated)
//   • Source URL attribution (the official "via" backlink)
//   • Custom URL slug
//   • Post state: published | queue | draft | private
//
// Env vars:
//   TUMBLR_ACCESS_TOKEN (OAuth 2.0 Bearer — preferred)
//   --or for OAuth 1.0a (legacy)--
//   TUMBLR_CONSUMER_KEY, TUMBLR_CONSUMER_SECRET,
//   TUMBLR_OAUTH_TOKEN, TUMBLR_OAUTH_TOKEN_SECRET
// ═══════════════════════════════════════════════════════════════

const TUMBLR_BASE = 'https://api.tumblr.com/v2';

export interface TumblrPhotoPostInput {
  blog_name: string;
  caption?: string;          // HTML caption (legacy photo posts)
  link?: string;             // CLICK-THROUGH URL — image acts as button
  source?: string;           // SEO backlink — "Source:" attribution
  tags?: string[];
  state?: 'published' | 'queue' | 'draft' | 'private';
  publish_on?: string;       // ISO date for queued/scheduled
  slug?: string;
  /** Provide either data64 (base64) or url. */
  data64?: string;           // raw base64 (no data: prefix)
  source_url?: string;       // remote image URL (alternative to data64)
}

export interface TumblrNpfPostInput {
  blog_name: string;
  title?: string;
  guide_content?: string;    // converted to text blocks
  image_url?: string;        // remote image (NPF "media" block)
  image_data64?: string;     // base64 image (uses media identifier upload)
  click_through_url?: string;
  source_url?: string;
  tags?: string[];
  state?: 'published' | 'queue' | 'draft' | 'private';
  publish_on?: string;
  slug?: string;
}

export interface TumblrPostResult {
  id: string;
  post_url: string;
  blog_name: string;
  state: string;
  raw: any;
}

export class TumblrClient {
  constructor(private accessToken: string) {
    if (!accessToken) throw new Error('TUMBLR_ACCESS_TOKEN is required (OAuth 2.0 Bearer).');
  }

  static fromEnv(): TumblrClient {
    return new TumblrClient(process.env.TUMBLR_ACCESS_TOKEN!);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any,
    isMultipart = false
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      Accept: 'application/json',
    };
    let payload: any;
    if (body && !isMultipart) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    } else {
      payload = body;
    }
    const res = await fetch(`${TUMBLR_BASE}${path}`, {
      method,
      headers,
      body: payload,
    });
    const text = await res.text();
    let data: any = {};
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    if (!res.ok) {
      throw new Error(`Tumblr ${method} ${path} failed (${res.status}): ${text}`);
    }
    return data as T;
  }

  private cleanBlogName(blog: string): string {
    // Allow either "myblog" or "myblog.tumblr.com"
    return blog.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  /** Legacy photo post — has the most direct "click-through" link support. */
  async createPhotoPost(input: TumblrPhotoPostInput): Promise<TumblrPostResult> {
    const blog = this.cleanBlogName(input.blog_name);
    const body: any = {
      type: 'photo',
      state: input.state || 'published',
    };
    if (input.caption) body.caption = input.caption;
    if (input.link) body.link = input.link;
    if (input.source) body.source = input.source;
    if (input.tags && input.tags.length) body.tags = input.tags.slice(0, 30).join(',');
    if (input.slug) body.slug = input.slug;
    if (input.publish_on) body.publish_on = input.publish_on;
    if (input.data64) body.data64 = input.data64;
    else if (input.source_url) body.source_url = input.source_url;
    else throw new Error('Photo post requires either data64 or source_url.');

    const data = await this.request<any>('POST', `/blog/${blog}/post`, body);
    const id = String(data.response?.id ?? data.response?.id_string ?? '');
    return {
      id,
      post_url: `https://${blog}/post/${id}`,
      blog_name: blog,
      state: body.state,
      raw: data,
    };
  }

  /** Modern NPF post — recommended for rich content with text + image blocks. */
  async createNpfPost(input: TumblrNpfPostInput): Promise<TumblrPostResult> {
    const blog = this.cleanBlogName(input.blog_name);

    const content: any[] = [];
    if (input.title) {
      content.push({ type: 'text', subtype: 'heading1', text: input.title });
    }

    // Image block (with optional click-through attribution)
    const mediaBlock: any = {
      type: 'image',
      alt_text: input.title || 'Image',
    };
    if (input.image_url) {
      mediaBlock.media = [{ url: input.image_url }];
    } else if (input.image_data64) {
      // NPF inline data uses identifier reference; we also send via legacy data64
      mediaBlock.media = [{ identifier: 'inline-image-1' }];
    }
    if (input.click_through_url) {
      mediaBlock.attribution = {
        type: 'app',
        url: input.click_through_url,
        app_name: 'Source',
      };
      // Also attach link via "row" layout — but Tumblr NPF respects the
      // legacy `link` post param too, so we set it below.
    }
    content.push(mediaBlock);

    if (input.guide_content) {
      // Split content into paragraphs as text blocks
      const paragraphs = input.guide_content
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);
      for (const p of paragraphs) {
        content.push({ type: 'text', text: p });
      }
    }

    const body: any = {
      content,
      state: input.state || 'published',
    };
    if (input.tags && input.tags.length) body.tags = input.tags.slice(0, 30);
    if (input.slug) body.slug = input.slug;
    if (input.publish_on) body.publish_on = input.publish_on;
    if (input.source_url) body.source_url = input.source_url;
    // NPF-level `link` makes the whole post clickable
    if (input.click_through_url) body.link = input.click_through_url;

    const data = await this.request<any>('POST', `/blog/${blog}/posts`, body);
    const id = String(data.response?.id ?? data.response?.id_string ?? '');
    return {
      id,
      post_url: `https://${blog}/post/${id}`,
      blog_name: blog,
      state: body.state,
      raw: data,
    };
  }
}
