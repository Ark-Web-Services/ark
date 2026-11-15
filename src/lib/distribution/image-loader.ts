// ═══════════════════════════════════════════════════════════════
// IMAGE LOADER — Resolves any source_type into raw bytes + base64
// Handles: local files, remote URLs, base64 strings
// Used by Imgur (multipart/base64), Pinterest (URL or base64),
// and Tumblr (URL or base64).
// ═══════════════════════════════════════════════════════════════

import { readFileSync, existsSync, statSync } from 'fs';
import { resolve, extname, basename } from 'path';
import type { ImageRef } from './types';

export interface LoadedImage {
  bytes: Buffer;
  base64: string;
  data_url: string;
  mime_type: string;
  filename: string;
  size_bytes: number;
}

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

function mimeFromExt(path: string): string {
  return MIME_BY_EXT[extname(path).toLowerCase()] || 'application/octet-stream';
}

export async function loadImage(ref: ImageRef): Promise<LoadedImage> {
  const sourceType = ref.source_type || (ref.source.startsWith('http') ? 'url' : 'local');

  let bytes: Buffer;
  let mime = 'image/jpeg';
  let filename = 'image.jpg';

  if (sourceType === 'local') {
    const abs = resolve(process.cwd(), ref.source);
    if (!existsSync(abs)) {
      throw new Error(`Local image not found: ${abs}`);
    }
    bytes = readFileSync(abs);
    mime = mimeFromExt(abs);
    filename = basename(abs);
  } else if (sourceType === 'url') {
    const res = await fetch(ref.source);
    if (!res.ok) {
      throw new Error(`Failed to fetch image (${res.status}): ${ref.source}`);
    }
    const ab = await res.arrayBuffer();
    bytes = Buffer.from(ab);
    mime = res.headers.get('content-type') || mimeFromExt(ref.source);
    const urlPath = new URL(ref.source).pathname;
    filename = basename(urlPath) || 'remote-image.jpg';
  } else if (sourceType === 'base64') {
    const cleaned = ref.source.replace(/^data:[^;]+;base64,/, '');
    bytes = Buffer.from(cleaned, 'base64');
    if (ref.source.startsWith('data:')) {
      const m = ref.source.match(/^data:([^;]+);base64,/);
      if (m) mime = m[1];
    }
    filename = 'embedded.jpg';
  } else {
    throw new Error(`Unsupported source_type: ${sourceType}`);
  }

  const base64 = bytes.toString('base64');
  return {
    bytes,
    base64,
    data_url: `data:${mime};base64,${base64}`,
    mime_type: mime,
    filename,
    size_bytes: bytes.length,
  };
}
