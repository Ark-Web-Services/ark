// ═══════════════════════════════════════════════════════════════
// IMGUR CLIENT — Authenticated uploads (image + album)
// API docs: https://apidocs.imgur.com/
// Auth modes:
//   - "client_id": anonymous Client-ID auth (Authorization: Client-ID xxx)
//   - "bearer":    OAuth2 access token (Authorization: Bearer xxx)
// Env vars:
//   IMGUR_CLIENT_ID       (required)
//   IMGUR_ACCESS_TOKEN    (optional — required for account-bound albums)
// ═══════════════════════════════════════════════════════════════

import type { LoadedImage } from './image-loader';

const IMGUR_BASE = 'https://api.imgur.com/3';

export interface ImgurUploadResult {
  id: string;
  deletehash: string;
  link: string;            // direct image URL
  page_url: string;        // imgur viewer URL https://imgur.com/<id>
  album_id?: string;
  album_url?: string;
  title?: string | null;
  description?: string | null;
  width?: number;
  height?: number;
  size?: number;
  type?: string;
  raw: any;
}

export interface ImgurAlbumResult {
  id: string;
  deletehash: string;
  link: string;            // album URL https://imgur.com/a/<id>
  raw: any;
}

export class ImgurClient {
  constructor(
    private clientId: string,
    private accessToken?: string
  ) {
    if (!clientId) throw new Error('IMGUR_CLIENT_ID is required');
  }

  static fromEnv(): ImgurClient {
    return new ImgurClient(
      process.env.IMGUR_CLIENT_ID!,
      process.env.IMGUR_ACCESS_TOKEN
    );
  }

  private authHeader(): string {
    return this.accessToken
      ? `Bearer ${this.accessToken}`
      : `Client-ID ${this.clientId}`;
  }

  /** Create an Imgur album (requires OAuth bearer for account-bound). */
  async createAlbum(opts: {
    title?: string;
    description?: string;
    privacy?: 'public' | 'hidden' | 'secret';
  }): Promise<ImgurAlbumResult> {
    const body = new URLSearchParams();
    if (opts.title) body.append('title', opts.title);
    if (opts.description) body.append('description', opts.description);
    if (opts.privacy) body.append('privacy', opts.privacy);

    const res = await fetch(`${IMGUR_BASE}/album`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    const data: any = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(`Imgur createAlbum failed: ${JSON.stringify(data)}`);
    }
    return {
      id: data.data.id,
      deletehash: data.data.deletehash,
      link: `https://imgur.com/a/${data.data.id}`,
      raw: data,
    };
  }

  /** Upload one image. If albumId or albumDeleteHash is set, image is added to that album. */
  async uploadImage(opts: {
    image: LoadedImage;
    title?: string;
    description?: string;
    album_id?: string;          // For OAuth user accounts
    album_deletehash?: string;  // For anonymous album linkage
    name?: string;
  }): Promise<ImgurUploadResult> {
    const body = new URLSearchParams();
    body.append('image', opts.image.base64);
    body.append('type', 'base64');
    if (opts.title) body.append('title', opts.title);
    if (opts.description) body.append('description', opts.description);
    if (opts.name) body.append('name', opts.name);
    if (opts.album_id) body.append('album', opts.album_id);
    else if (opts.album_deletehash) body.append('album', opts.album_deletehash);

    const res = await fetch(`${IMGUR_BASE}/image`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    const data: any = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(`Imgur uploadImage failed: ${JSON.stringify(data)}`);
    }
    const d = data.data;
    return {
      id: d.id,
      deletehash: d.deletehash,
      link: d.link,
      page_url: `https://imgur.com/${d.id}`,
      album_id: opts.album_id,
      album_url: opts.album_id ? `https://imgur.com/a/${opts.album_id}` : undefined,
      title: d.title,
      description: d.description,
      width: d.width,
      height: d.height,
      size: d.size,
      type: d.type,
      raw: data,
    };
  }
}
