import { businessTools } from './src/lib/business-tools';
// ═══════════════════════════════════════════════════════════════
// NICHE.CONFIG.TS — Single Source of Truth for the Entire System
// ═══════════════════════════════════════════════════════════════
// This file defines EVERYTHING about the niche this repo targets.
// Every agent, script, component, and config reads from here.
// This is a LIVING FILE — agents update it as they discover new
// keywords, competitors, article maps, and silo structures.
//
// To launch a new niche: clone this repo, edit THIS FILE, deploy.
// ═══════════════════════════════════════════════════════════════

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SiloConfig {
  id: string;
  pillar: string;
  label: string;
  color: string;
  description: string;
  /** Keyword-targeted <title> for the silo landing page. Falls back to `label`. */
  seoTitle?: string;
  /** Meta description for the silo landing page. Falls back to `description`. */
  seoDescription?: string;
  /** Body copy rendered above the article grid, one string per paragraph. */
  intro?: string[];
  /** Emitted as FAQPage JSON-LD and rendered below the grid. */
  faq?: FaqItem[];
  /**
   * The canonical page for this silo's main intents, rendered above the grid.
   * Names which article owns which query so the hub stops competing with its
   * own best post for the same term.
   */
  startHere?: { label: string; href: string; note: string }[];
}

export interface NavItem {
  title: string;
  url: string;
  icon?: string;
  description?: string;
  children?: { title: string; url: string }[];
}

export interface AuthorConfig {
  name: string;
  bio: string;
  credentials: string;
  avatar: string;
  social: { platform: string; url: string }[];
}

export interface ProductConfig {
  id: string;
  name: string;
  shortName: string;
  price: string;
  rating: number;
  ratingCount: number;
  affiliateUrl: string;
  image: string;
  badge?: string;
  pros: string[];
  cons: string[];
}

export interface ToolConfig {
  /** Slug-only; the page lives at src/pages/tools/<id>.astro */
  id: string;
  title: string;
  icon: string;
  description: string;
}

export interface ExternalLink {
  label: string;
  url: string;
  /** Optional one-line note rendered next to the link. */
  note?: string;
}

export interface NicheConfig {
  // ── Identity ─────────────────────────────────────────────
  id: string;
  siteName: string;
  tagline: string;
  url: string;
  description: string;
  locale: string;
  lang: string;
  ga4Id: string;
  /** Public contact address. Rendered on static pages and in security.txt. */
  contactEmail: string;
  /**
   * The niche as a noun phrase, used verbatim in generated copy:
   * "a reference site for {nicheNoun}" -> "home espresso brewing".
   */
  nicheNoun: string;

  // ── Author / E-E-A-T ────────────────────────────────────
  author: AuthorConfig;

  // ── Content Silos ────────────────────────────────────────
  silos: SiloConfig[];

  // ── Navigation ───────────────────────────────────────────
  primaryNav: NavItem[];
  footerNav: { title: string; url: string }[];

  // ── SEO Intelligence (living data — agents update this) ──
  seedKeywords: string[];
  competitors: string[];
  nicheContext: string;
  contentGuidelines: string;

  // ── Affiliates ───────────────────────────────────────────
  defaultProducts: ProductConfig[];
  pageProductMap: Record<string, { heading: string; products: string[] }>;
  affiliateDisclaimer: string;

  // ── Deployment ───────────────────────────────────────────
  cloudflareProjectName: string;
  d1DatabaseName: string;

  // ── Scheduling (per-task frequency overrides) ────────────
  scheduling: {
    maxContentPerRun: number;
    maxReviewIterations: number;
  };

  // ── Free Tools (interactive calculators / lookups) ───────
  // One entry per src/pages/tools/<id>.astro. Leave empty and the
  // /tools/ hub is not built at all.
  tools: ToolConfig[];

  // ── Social Channels ──────────────────────────────────────
  redditSubreddits: string[];
  communityForums: string[];
  /** Communities linked from the contact / about pages. */
  communityLinks: ExternalLink[];
  /** Sources the editorial guides are checked against (E-E-A-T). */
  trustedSources: ExternalLink[];

  // ── Visual Distribution Channels ─────────────────────────
  // Used by agents/distributor.ts to compose default plans.
  visualDistribution?: {
    pinterest?: {
      enabled: boolean;
      defaultBoardId?: string;
      defaultBoardName?: string;
      sectionId?: string | null;
    };
    imgur?: {
      enabled: boolean;
      defaultAlbumId?: string | null;
      createAlbumIfMissing?: boolean;
      defaultAlbumTitle?: string;
      privacy?: 'public' | 'hidden' | 'secret';
    };
    tumblr?: {
      enabled: boolean;
      blogName: string;
      preferredFormat?: 'photo' | 'npf';
      defaultPostState?: 'published' | 'queue' | 'draft';
    };
    interlinking?: {
      useImgurUrlForPinterest?: boolean;
      useImgurUrlForTumblr?: boolean;
      crossReferenceInDescriptions?: boolean;
    };
  };
}

// ═══════════════════════════════════════════════════════════════
// THE NICHE CONFIGURATION — Edit this to define your niche
// ═══════════════════════════════════════════════════════════════

const config: NicheConfig = {
  // ── Identity ─────────────────────────────────────────────
  id: 'TEMPLATE_NICHE_ID',
  siteName: 'The {Niche} Guide',
  tagline: 'The Definitive Encyclopedia for Everything {Niche}',
  url: 'https://www.the{niche}guide.com',
  description:
    'The most comprehensive, expert-curated guide to {Niche}. In-depth guides, expert advice, product reviews, and more — all backed by real-world experience.',
  locale: 'en_US',
  lang: 'en',
  ga4Id: 'G-XXXXXXXXXX',
  contactEmail: 'info@the{niche}guide.com',
  nicheNoun: '{niche}',

  // ── Author / E-E-A-T ────────────────────────────────────
  author: {
    name: 'The {Niche} Guide Team',
    bio: 'Expert practitioners with 10+ years of hands-on {niche} experience. Dedicated to evidence-based advice and comprehensive coverage.',
    credentials: 'Certified specialists in {niche}',
    avatar: '/assets/images/author-avatar.webp',
    social: [
      { platform: 'twitter', url: 'https://twitter.com/the{niche}guide' },
      { platform: 'youtube', url: 'https://youtube.com/@the{niche}guide' },
    ],
  },

  // ── Content Silos ────────────────────────────────────────
  silos: [
    {
      id: 'getting-started',
      pillar: '/getting-started/',
      label: 'Getting Started',
      color: '#10B981',
      description: 'Beginner-friendly guides to get started with {niche}',
    },
    {
      id: 'deep-dives',
      pillar: '/deep-dives/',
      label: 'Deep Dives',
      color: '#3B82F6',
      description: 'Comprehensive, in-depth articles on {niche} topics',
    },
    {
      id: 'how-to',
      pillar: '/how-to/',
      label: 'How-To Guides',
      color: '#8B5CF6',
      description: 'Step-by-step instructional guides',
    },
    {
      id: 'reviews',
      pillar: '/reviews/',
      label: 'Product Reviews',
      color: '#F59E0B',
      description: 'Tested and ranked product reviews',
    },
    {
      id: 'reference',
      pillar: '/reference/',
      label: 'Reference & Research',
      color: '#EF4444',
      description: 'Data-driven reference material and research',
    },
  ],

  // ── Navigation ───────────────────────────────────────────
  primaryNav: [
    { title: 'Home', url: '/', icon: 'home' },
    {
      title: 'Getting Started',
      url: '/getting-started/',
      icon: 'rocket',
      description: 'New? Start here.',
      children: [
        { title: "Beginner's Guide", url: '/guides/beginners-guide/' },
        { title: 'Essential Equipment', url: '/guides/essential-equipment/' },
        { title: 'Common Mistakes', url: '/guides/common-mistakes/' },
      ],
    },
    {
      title: 'Deep Dives',
      url: '/deep-dives/',
      icon: 'book-open',
      description: 'Comprehensive coverage',
      children: [],
    },
    {
      title: 'How-To Guides',
      url: '/how-to/',
      icon: 'clipboard',
      description: 'Step-by-step instructions',
      children: [],
    },
    {
      title: 'Reviews',
      url: '/reviews/',
      icon: 'star',
      description: 'Tested product reviews',
      children: [],
    },
    { title: 'Articles', url: '/articles/', icon: 'newspaper' },
  ],

  footerNav: [
    { title: 'About', url: '/about/' },
    { title: 'Editorial Policy', url: '/editorial-policy/' },
    { title: 'Contact', url: '/contact/' },
    { title: 'Privacy Policy', url: '/privacy/' },
    { title: 'Sitemap', url: '/sitemap/' },
  ],

  // ── SEO Intelligence (agents update this section) ────────
  seedKeywords: [
    // Agents will populate and expand this list
    // Example: 'best {niche} for beginners'
  ],

  competitors: [
    // Agents will discover and add competitors here
    // Example: 'competitor-site.com'
  ],

  nicheContext:
    'This is a comprehensive authority site about {niche}. The goal is to be the single source of truth — the Wikipedia of {niche} — covering every angle from beginner guides to expert deep-dives.',

  contentGuidelines:
    'Write with expert authority. Use the BLUF (Bottom Line Up Front) structure. Every paragraph must provide Information Gain. Use concrete numbers and specific examples. No filler, no fluff. Write for someone who has already read 10 articles on this topic.',

  // ── Affiliates ───────────────────────────────────────────
  defaultProducts: [
    // Populate with niche-specific affiliate products
    // {
    //   id: 'product-001',
    //   name: 'Example Product',
    //   shortName: 'Example',
    //   price: '$49.99',
    //   rating: 4.8,
    //   ratingCount: 1247,
    //   affiliateUrl: 'https://amzn.to/XXXXXXX',
    //   image: '/assets/images/products/example.webp',
    //   badge: "Editor's Choice",
    //   pros: ['Pro 1', 'Pro 2'],
    //   cons: ['Con 1'],
    // },
  ],

  pageProductMap: {
    // Mapping of page slugs to product recommendations
    // 'beginners-guide': {
    //   heading: 'Essential Equipment for Beginners',
    //   products: ['product-001', 'product-002'],
    // },
  },

  affiliateDisclaimer:
    'This site contains affiliate links. We may earn a commission at no extra cost to you if you purchase through our links. All recommendations are based on genuine testing and expertise.',

  // ── Deployment ───────────────────────────────────────────
  cloudflareProjectName: 'TEMPLATE-niche-authority',
  d1DatabaseName: 'seo-authority-db-TEMPLATE',

  // ── Scheduling ───────────────────────────────────────────
  scheduling: {
    maxContentPerRun: 3,
    maxReviewIterations: 3,
  },

  // ── Social Channels ──────────────────────────────────────
  // ── Free Tools ───────────────────────────────────────────
  // Each entry needs a matching src/pages/tools/<id>.astro page.
  // Interactive tools earn links and rank for "calculator"/"chart"
  // queries the article silos cannot reach. Start empty; the niche
  // customizer proposes the first two or three.
  tools: businessTools.map(({ id, title, description }) => ({ id, title, description, icon: "" })),

  redditSubreddits: [
    // Agents will discover relevant subreddits
    // Example: 'r/niche', 'r/related_topic'
  ],
  communityForums: [],

  communityLinks: [
    { label: 'r/{niche}', url: 'https://www.reddit.com/r/{niche}/', note: 'Most active {niche} community' },
  ],

  trustedSources: [
    { label: '{Authority Site}', url: 'https://www.example.com/' },
  ],

  // ── Visual Distribution Channels ─────────────────────────
  // Pinterest, Imgur, and Tumblr orchestration defaults.
  // Override per-plan in data/plans/*.json (see
  // schemas/distribution-plan.schema.json).
  visualDistribution: {
    pinterest: {
      enabled: false,
      defaultBoardId: '',
      defaultBoardName: '',
      sectionId: null,
    },
    imgur: {
      enabled: false,
      defaultAlbumId: null,
      createAlbumIfMissing: true,
      defaultAlbumTitle: 'Visual Guides',
      privacy: 'public',
    },
    tumblr: {
      enabled: false,
      blogName: '',
      preferredFormat: 'npf',
      defaultPostState: 'published',
    },
    interlinking: {
      useImgurUrlForPinterest: true,
      useImgurUrlForTumblr: true,
      crossReferenceInDescriptions: false,
    },
  },
};

export default config;

// ── Helper Functions ─────────────────────────────────────────

export function getSiloIds(): [string, ...string[]] {
  const ids = config.silos.map((s) => s.id);
  if (ids.length === 0) return ['uncategorized'];
  return ids as [string, ...string[]];
}

export function getSiteDomain(): string {
  try {
    return new URL(config.url).hostname.replace('www.', '');
  } catch {
    return config.url;
  }
}

export function getSiloById(id: string): SiloConfig | undefined {
  return config.silos.find((s) => s.id === id);
}

export function getToolById(id: string): ToolConfig | undefined {
  return config.tools.find((t) => t.id === id);
}

export function getProductById(id: string): ProductConfig | undefined {
  return config.defaultProducts.find((p) => p.id === id);
}

Object.assign(config, {
  id: "arkwebservices-com",
  siteName: "ARK Web Services",
  tagline: "Web design and WordPress rescue for service businesses",
  url: "https://arkwebservices.com",
  description: "Web design, WordPress rescue, custom development, and SEO foundations for service businesses in Charlotte, NC.",
  contactEmail: "support@arkwebservices.com",
  nicheNoun: "website development and local search for service businesses",
  nicheContext: "ARK Web Services is based in Charlotte, North Carolina and offers WordPress rescue, website redesign, custom development, and one-time SEO foundations for service businesses. Do not imply a verified case study, ranking, performance result, certification, or customer outcome unless supported by the actual source material.",
  contentGuidelines: "Write practical, plain-language guidance. Separate official platform guidance from general recommendations. Link to the primary documentation for factual platform details; never invent statistics, performance outcomes, test results, credentials, client stories, pricing, timelines, or guarantees. Do not give access credentials or recommend unsafe changes. Mention that instructions and interfaces can change. Use a modest, relevant CTA to the existing ARK service or contact page without promising results. Avoid claims that ARK performed a particular task unless the source material verifies it.",
  author: {
    name: "ARK Web Services",
    bio: "Practical website guidance from ARK Web Services.",
    credentials: "",
    avatar: "",
    social: [],
  },
  ga4Id: "G-5QLHJDZ3ZH",
  silos: [
    {
      id: "wordpress-recovery",
      pillar: "/wordpress-recovery/",
      label: "WordPress Recovery & Care",
      color: "#111111",
      description: "Practical help for troubleshooting, restoring, and maintaining WordPress websites.",
      seoTitle: "WordPress Recovery & Maintenance | ARK Web Services",
      seoDescription: "Understand WordPress backups, update issues, plugin conflicts, recovery steps, and maintenance options for a small business website.",
      intro: [
        "Use this section to understand common WordPress site issues and the safer steps to take before making major changes.",
        "Platform-specific instructions are linked to official WordPress documentation. The right fix depends on your hosting setup, backups, and site configuration.",
      ],
      startHere: [
        { label: "WordPress rescue", href: "/services/wordpress-rescue/", note: "Help with a site that is broken, unstable, or hard to update." },
      ],
    },
    {
      id: "website-planning",
      pillar: "/website-planning/",
      label: "Website Planning & Development",
      color: "#111111",
      description: "Guidance for planning, improving, and maintaining a useful service-business website.",
      seoTitle: "Website Planning & Development | ARK Web Services",
      seoDescription: "Plan website content, redesigns, and custom features around your services, customers, and business requirements.",
      intro: [
        "These guides cover the decisions behind website redesigns, small-business website content, and custom development projects.",
        "Examples are general unless specifically identified as ARK client work. No results or project outcomes are implied.",
      ],
      startHere: [
        { label: "Website redesign", href: "/services/website-redesign/", note: "Review the scope and steps for reworking an existing site." },
        { label: "Custom development", href: "/services/custom-website-development/", note: "Explore a tailored site feature or web application." },
      ],
    },
    {
      id: "local-seo",
      pillar: "/local-seo/",
      label: "SEO Foundations & Search Visibility",
      color: "#111111",
      description: "Clear, source-led guidance on site structure, indexing, and local search basics.",
      seoTitle: "SEO Foundations for Service Businesses | ARK Web Services",
      seoDescription: "Learn how service pages, indexing, and local search basics work, with references to Google Search Central documentation.",
      intro: [
        "These guides explain foundational website and search concepts without promising rankings, traffic, or a particular business result.",
        "Google-specific details refer to current Search Central documentation, which should be checked again before acting on a time-sensitive recommendation.",
      ],
      startHere: [
        { label: "SEO foundations", href: "/services/seo-for-service-businesses/", note: "See the scope of ARK’s one-time SEO foundations project." },
      ],
    },
  ],
  primaryNav: [
    { title: "Services", url: "/services/" },
    { title: "Guides", url: "/articles/" },
    { title: "About", url: "/about/" },
    { title: "Contact", url: "/contact/" },
  ],
  footerNav: [
    { title: "Privacy notice", url: "/privacy/" },
    { title: "Services", url: "/services/" },
    { title: "Contact", url: "/contact/" },
  ],
  tools: businessTools.map(({ id, title, description }) => ({ id, title, description, icon: "" })),
  defaultProducts: [],
  pageProductMap: {},
  affiliateDisclaimer: "",
  redditSubreddits: [],
  communityForums: [],
  communityLinks: [],
  trustedSources: [
    { label: "WordPress Documentation", url: "https://wordpress.org/documentation/" },
    { label: "WordPress Developer Resources", url: "https://developer.wordpress.org/" },
    { label: "Google Search Central", url: "https://developers.google.com/search/docs" },
    { label: "Google Search Console Help", url: "https://support.google.com/webmasters/" },
  ],
  seedKeywords: [
    "wordpress site recovery checklist",
    "wordpress plugin conflict troubleshooting",
    "what to do after a wordpress site is hacked",
    "wordpress backup and restore planning",
    "wordpress maintenance for a small business website",
    "website redesign or rebuild decision",
    "small business website content planning",
    "custom website feature planning",
    "google search indexing basics for service businesses",
    "service page SEO foundations",
  ],
  competitors: [],
  cloudflareProjectName: "arkwebservices-com",
  d1DatabaseName: "arkwebservices-com-db",
});
