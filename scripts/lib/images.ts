// ═══════════════════════════════════════════════════════════════
// IMAGES.TS — Replicate hero-image generation and validation
// ═══════════════════════════════════════════════════════════════

import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import nicheConfig from '../../niche.config';
import { callReplicatePrediction } from './llm';

export interface GeneratedHeroImage {
  image: string;
  imageAlt: string;
  file: string;
}

const IMAGE_DIR = join(process.cwd(), 'src/assets/images/posts');
const MIN_WEBP_BYTES = 10_000;
const MAX_WEBP_BYTES = 25 * 1024 * 1024;

function isWebp(buffer: Buffer): boolean {
  return buffer.length >= 12
    && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
}

function safeSlug(slug: string): string {
  const clean = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!clean || clean !== slug) throw new Error(`Hero image slug must already be URL-safe: ${slug}`);
  return clean;
}

export async function generateHeroImage(slug: string, title: string, subject: string): Promise<GeneratedHeroImage> {
  const cleanSlug = safeSlug(slug);
  mkdirSync(IMAGE_DIR, { recursive: true });
  const file = join(IMAGE_DIR, `${cleanSlug}.webp`);
  if (existsSync(file)) throw new Error(`Refusing to overwrite existing hero image: ${file}`);

  const model = process.env.IMAGE_MODEL || 'black-forest-labs/flux-dev';
  const prompt = `Photorealistic editorial photography for an authoritative ${nicheConfig.nicheNoun} guide from ${nicheConfig.siteName} titled "${title}". Subject: ${subject}. ${nicheConfig.nicheContext} Show the subject clearly in an authentic real-world setting with natural light, crisp detail, restrained natural color, and a calm documentary composition. No text, no labels, no logo, no collage, no illustration. 16:9 editorial hero image.`;

  try {
    const prediction = await callReplicatePrediction<string[] | string>(model, {
      prompt,
      aspect_ratio: '16:9',
      output_format: 'webp',
      output_quality: Math.min(100, Math.max(50, Number(process.env.IMAGE_OUTPUT_QUALITY || 88))),
      num_outputs: 1,
    }, 'heavy');
    const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    if (typeof output !== 'string' || !/^https:\/\//.test(output)) throw new Error('Image model returned no HTTPS output URL.');

    const response = await fetch(output, { signal: AbortSignal.timeout(60_000) });
    if (!response.ok) throw new Error(`Image download failed with HTTP ${response.status}.`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!isWebp(buffer)) throw new Error('Downloaded image is not a WebP (missing RIFF/WEBP magic bytes).');
    if (buffer.length < MIN_WEBP_BYTES || buffer.length > MAX_WEBP_BYTES) {
      throw new Error(`Downloaded WebP has an unsafe size (${buffer.length} bytes).`);
    }
    writeFileSync(file, buffer);
    const written = readFileSync(file);
    if (!isWebp(written) || written.length !== buffer.length) throw new Error('Written WebP failed integrity verification.');
    return {
      image: `/assets/images/posts/${cleanSlug}.webp`,
      // Keep alt short and descriptive. Interpolating the full title produced a
      // 266-character alt that repeated the title twice.
      imageAlt: `${subject} for a guide to ${nicheConfig.nicheNoun}`.slice(0, 125),
      file,
    };
  } catch (error) {
    if (existsSync(file)) unlinkSync(file);
    throw error;
  }
}
