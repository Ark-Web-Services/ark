// ═══════════════════════════════════════════════════════════════
// INIT-NICHE.TS — Thin CLI entry point for niche customization
// ═══════════════════════════════════════════════════════════════

import 'dotenv/config';
import business from '../business.config';
if (business.enabled) throw new Error('Service-business facts are edited in business.config.ts. The guide customizer is disabled for this site.');

import { runNicheCustomizer } from '../agents/niche-customizer';
import { printLlmError } from './lib/llm';

try {
  await runNicheCustomizer(process.argv.slice(2));
} catch (error) {
  printLlmError(error);
  console.error('💡 No files were intentionally committed. Fix the reported input, schema, or provider issue and run the command again.');
  process.exitCode = 1;
}
