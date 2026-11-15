// ═══════════════════════════════════════════════════════════════
// PINTEREST CLIENT — Pinterest API V5
// Docs: https://developers.pinterest.com/docs/api/v5/
// Auth: OAuth2 Bearer token
// Env vars:
//   PINTEREST_ACCESS_TOKEN (required)
//   PINTEREST_API_BASE     (optional — defaults to api.pinterest.com)
// ═══════════════════════════════════════════════════════════════

const DEFAULT_BASE = 'https://api.pinterest.com/v5';

export interface PinterestPinInput {
  board_id: string;
  board_section_id?: string | null;
  title?: string;
  description?: string;
  link?: string;             // destination link (clickthrough)
  alt_text?: string;
  dominant_color?: string;
  /** Use one of: image_url OR image_base64 */
  image_url?: string;
  image_base64?: { data: string; content_type: string };
  publish_state?: 'published' | 'draft';
}

export interface PinterestPinResult {
  id: string;
  pin_url: string;
  board_id: string;
  raw: any;
}

export interface PinterestBoard {
  id: string;
  name: string;
  description?: string;
  privacy?: string;
}

export class PinterestClient {
  constructor(
    private accessToken: string,
    private base: string = DEFAULT_BASE
  ) {
    if (!accessToken) throw new Error('PINTEREST_ACCESS_TOKEN is required');
  }

  static fromEnv(): PinterestClient {
    return new PinterestClient(
      process.env.PINTEREST_ACCESS_TOKEN!,
      process.env.PINTEREST_API_BASE || DEFAULT_BASE
    );
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data: any = {};
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    if (!res.ok) {
      throw new Error(`Pinterest ${method} ${path} failed (${res.status}): ${text}`);
    }
    return data as T;
  }

  /** List boards belonging to the authenticated user. */
  async listBoards(): Promise<PinterestBoard[]> {
    const data = await this.request<any>('GET', '/boards');
    if (!data.items || data.items.length === 0) {
      console.log('🔍 Debug: Raw Pinterest /boards response:', JSON.stringify(data, null, 2));
    }
    return (data.items || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      privacy: b.privacy,
    }));
  }

  /** Resolve a board by name (case-insensitive). Returns first match. */
  async findBoardByName(name: string): Promise<PinterestBoard | null> {
    const boards = await this.listBoards();
    const target = name.trim().toLowerCase();
    return boards.find((b) => b.name.trim().toLowerCase() === target) || null;
  }

  /** Create a Pin. */
  async createPin(input: PinterestPinInput): Promise<PinterestPinResult> {
    if (!input.image_url && !input.image_base64) {
      throw new Error('Pin requires either image_url or image_base64.');
    }

    const media_source: any = input.image_url
      ? { source_type: 'image_url', url: input.image_url }
      : {
          source_type: 'image_base64',
          content_type: input.image_base64!.content_type,
          data: input.image_base64!.data,
        };

    const payload: any = {
      board_id: input.board_id,
      media_source,
    };
    if (input.board_section_id) payload.board_section_id = input.board_section_id;
    if (input.title) payload.title = input.title.slice(0, 100);
    if (input.description) payload.description = input.description.slice(0, 800);
    if (input.link) payload.link = input.link;
    if (input.alt_text) payload.alt_text = input.alt_text.slice(0, 500);
    if (input.dominant_color) payload.dominant_color = input.dominant_color;

    const data = await this.request<any>('POST', '/pins', payload);
    return {
      id: data.id,
      pin_url: `https://www.pinterest.com/pin/${data.id}/`,
      board_id: input.board_id,
      raw: data,
    };
  }

  /** Create a new board. */
  async createBoard(opts: {
    name: string;
    description?: string;
    privacy?: 'PUBLIC' | 'SECRET';
  }): Promise<PinterestBoard> {
    const data = await this.request<any>('POST', '/boards', {
      name: opts.name,
      description: opts.description,
      privacy: opts.privacy || 'PUBLIC',
    });
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      privacy: data.privacy,
    };
  }
}
