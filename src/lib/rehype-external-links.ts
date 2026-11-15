// ═══════════════════════════════════════════════════════════════
// rehype plugin: qualify external links in markdown content
//
//   • Merchant/affiliate domains → rel="sponsored nofollow noopener"
//     (Google requires paid links to be qualified; see
//     https://developers.google.com/search/docs/essentials/link-spam)
//   • Other external links      → rel="noopener" (left followed on
//     purpose — outbound citations to authoritative sources are a
//     quality signal we want to keep)
//   • All external links open in a new tab.
//
// Zero-dependency tree walker so we don't add unified plugins to
// the dependency tree.
// ═══════════════════════════════════════════════════════════════

import type { Root, Element } from "hast";
import { getSiteDomain } from "../../niche.config";

const MERCHANT_HOSTS = [
  "amazon.com",
  "amzn.to",
  "petsmart.com",
  "petco.com",
  "chewy.com",
  "ebay.com",
  "aliexpress.com",
];

const INTERNAL_DOMAIN = getSiteDomain().toLowerCase();

function classify(href: string): "internal" | "merchant" | "external" {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return "internal"; // relative link
  }
  if (!/^https?:$/.test(url.protocol)) return "internal";
  const host = url.hostname.toLowerCase();
  if (host === INTERNAL_DOMAIN || host.endsWith(`.${INTERNAL_DOMAIN}`)) return "internal";
  if (MERCHANT_HOSTS.some((h) => host === h || host.endsWith(`.${h}`)))
    return "merchant";
  return "external";
}

function walk(node: Root | Element): void {
  if (node.type === "element" && node.tagName === "a") {
    const href = node.properties?.href;
    if (typeof href === "string") {
      const kind = classify(href);
      if (kind === "merchant") {
        node.properties.rel = ["sponsored", "nofollow", "noopener"];
        node.properties.target = "_blank";
      } else if (kind === "external") {
        node.properties.rel = ["noopener"];
        node.properties.target = "_blank";
      }
    }
  }
  for (const child of node.children ?? []) {
    if (child.type === "element") walk(child);
  }
}

export default function rehypeExternalLinks() {
  return (tree: Root) => {
    walk(tree);
  };
}
