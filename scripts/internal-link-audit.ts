// ═══════════════════════════════════════════════════════════════
// INTERNAL LINK AUDIT — Build-time checker
// Run: npm run link-audit
// Ensures every article meets the "Rule of 3-5" and has no orphans
// ═══════════════════════════════════════════════════════════════

import { readdir, readFile } from "fs/promises";
import { join } from "path";

const CONTENT_DIR = join(process.cwd(), "src/content/posts");
const MIN_INTERNAL_LINKS = 3;

interface AuditResult {
  file: string;
  internalLinks: number;
  hasCategory: boolean;
  hasPillarSlug: boolean;
  issues: string[];
}

async function audit() {
  console.log("\n🔍 SEO Internal Link Audit\n");
  console.log("═".repeat(60));

  const files = await readdir(CONTENT_DIR);
  const mdxFiles = files.filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));

  const results: AuditResult[] = [];
  let totalIssues = 0;

  for (const file of mdxFiles) {
    const content = await readFile(join(CONTENT_DIR, file), "utf-8");
    const issues: string[] = [];

    // Count internal links (markdown links starting with /)
    const internalLinks = (content.match(/\[.*?\]\(\/.*?\)/g) || []).length;

    // Check for category in frontmatter
    const hasCategory = /^category:/m.test(content);

    // Check for pillarSlug
    const hasPillarSlug = /^pillarSlug:/m.test(content);

    // Rule of 3-5
    if (internalLinks < MIN_INTERNAL_LINKS) {
      issues.push(
        `⚠️  Only ${internalLinks} internal links (minimum: ${MIN_INTERNAL_LINKS})`
      );
    }

    // Orphan check
    if (!hasCategory) {
      issues.push("🔴 No category — orphan page (not in any silo)");
    }

    if (!hasPillarSlug) {
      issues.push("🟡 No pillarSlug — consider linking to pillar page");
    }

    // Check for atomicAnswer (AIO)
    const hasAtomicAnswer = /^atomicAnswer:/m.test(content);
    if (!hasAtomicAnswer) {
      issues.push("🟡 No atomicAnswer — add for AI Agent Optimization");
    }

    // Check for FAQ
    const hasFaq = /^faq:/m.test(content);
    if (!hasFaq) {
      issues.push("🟡 No FAQ section — add for rich snippets");
    }

    totalIssues += issues.length;
    results.push({ file, internalLinks, hasCategory, hasPillarSlug, issues });
  }

  // Print results
  for (const r of results) {
    const status = r.issues.length === 0 ? "✅" : "⚠️ ";
    console.log(`\n${status} ${r.file}`);
    console.log(`   Internal links: ${r.internalLinks}`);
    console.log(`   Category: ${r.hasCategory ? "✓" : "✗"}`);
    console.log(`   Pillar slug: ${r.hasPillarSlug ? "✓" : "✗"}`);

    if (r.issues.length > 0) {
      for (const issue of r.issues) {
        console.log(`   ${issue}`);
      }
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log(`\n📊 Summary: ${mdxFiles.length} files, ${totalIssues} issues\n`);

  if (totalIssues > 0) {
    console.log(
      "💡 Fix issues above to maximize internal link equity and SEO performance.\n"
    );
  } else {
    console.log("🎉 All files pass the internal link audit!\n");
  }
}

audit().catch(console.error);
