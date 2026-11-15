// ═══════════════════════════════════════════════════════════════
// NAVIGATION & CONTENT SILO ARCHITECTURE — Reads from niche.config.ts
// ═══════════════════════════════════════════════════════════════

import nicheConfig from '../../niche.config';
import type { NavItem, SiloConfig } from '../../niche.config';

// Re-export types for backward compatibility
export type { NavItem };
export type Silo = SiloConfig;

export interface SiteConfig {
  title: string;
  tagline: string;
  description: string;
  url: string;
  locale: string;
  lang: string;
  ga4Id: string;
  author: {
    name: string;
    bio: string;
    avatar: string;
    social: { platform: string; url: string }[];
  };
}

// ── Derived from niche.config.ts ─────────────────────────────

export const siteConfig: SiteConfig = {
  title: nicheConfig.siteName,
  tagline: nicheConfig.tagline,
  description: nicheConfig.description,
  url: nicheConfig.url,
  locale: nicheConfig.locale,
  lang: nicheConfig.lang,
  ga4Id: nicheConfig.ga4Id,
  author: {
    name: nicheConfig.author.name,
    bio: nicheConfig.author.bio,
    avatar: nicheConfig.author.avatar,
    social: nicheConfig.author.social,
  },
};

export const primaryNav: NavItem[] = nicheConfig.primaryNav;
export const silos: SiloConfig[] = nicheConfig.silos;
export const footerNav = nicheConfig.footerNav;
