import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import business from "../business.config";
import nicheConfig from "../niche.config";
import { REVIEW_TEMPLATES, reviewWork } from "../agents/reviewer";
import { assertLlmReady, callModel, printLlmError } from "./lib/llm";

interface QueueItem {
  id: string;
  service: string;
  targetKeyword: string;
  audience: string;
  purpose: string;
  sources: Array<{ label: string; url: string; use: string }>;
  status: "queued" | "drafted" | "published" | "rejected";
  generatedAt?: string;
  note?: string;
}

interface QueueFile { version: 1; items: QueueItem[] }
interface LeadPageDraft { title: string; description: string; markdown: string }

const QUEUE_PATH = join(process.cwd(), "data/lead-pages/queue.json");
const OUTPUT_DIR = join(process.cwd(), "src/content/lead-pages");
const FORBIDDEN_PAID = process.env.LLM_ALLOW_PAID === "1";
const businessRouting = business as typeof business & { landingPageOnly?: boolean; customHomeContactHref?: string };
const contactPath = business.customHome || businessRouting.landingPageOnly ? businessRouting.customHomeContactHref || "/#contact" : "/contact/";

function readQueue(): QueueFile {
  if (!existsSync(QUEUE_PATH)) throw new Error(`Lead-page queue is missing: ${QUEUE_PATH}`);
  const value = JSON.parse(readFileSync(QUEUE_PATH, "utf8")) as QueueFile;
  if (value.version !== 1 || !Array.isArray(value.items)) throw new Error("Lead-page queue must use version 1 and contain an items array.");
  return value;
}

function validateDraft(value: unknown, item: QueueItem): value is LeadPageDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Record<string, unknown>;
  if (typeof draft.title !== "string" || draft.title.length < 15 || draft.title.length > 80) return false;
  if (typeof draft.description !== "string" || draft.description.length < 100 || draft.description.length > 170) return false;
  if (typeof draft.markdown !== "string" || draft.markdown.trim().length < 4000) return false;
  const body = draft.markdown as string;
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 650 || wordCount > 1300 || (body.match(/^##\s+/gm) ?? []).length < 4) return false;
  const requiredLinks = [`/services/${item.service}/`, contactPath];
  return requiredLinks.every((href) => body.includes(`](${href})`))
    && item.sources.every((source) => body.includes(source.url))
    && !/^#\s/m.test(body);
}

function makeFrontmatter(item: QueueItem, draft: LeadPageDraft): string {
  return [
    "---",
    `title: ${JSON.stringify(draft.title)}`,
    `description: ${JSON.stringify(draft.description)}`,
    `service: ${JSON.stringify(item.service)}`,
    'status: "draft"',
    'ctaLabel: "Request a site review"',
    `updated: ${new Date().toISOString().slice(0, 10)}`,
    "---",
    "",
  ].join("\n");
}

async function writeLeadPage(): Promise<void> {
  if (!business.enabled || !business.contentEnabled) throw new Error("Enable business content before drafting lead pages.");
  if (FORBIDDEN_PAID) throw new Error("This job refuses paid LLM routing. Unset LLM_ALLOW_PAID and choose Ollama or the Codex/Claude subscription CLI.");
  const queue = readQueue();
  const item = queue.items.find((candidate) => candidate.status === "queued");
  if (!item) { console.log("No queued lead-page briefs."); return; }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)) throw new Error(`Invalid lead-page id: ${item.id}`);
  const service = business.services.find((candidate) => candidate.id === item.service);
  if (!service) throw new Error(`Lead-page brief references an unconfigured service: ${item.service}`);
  if (!item.targetKeyword.trim() || !item.audience.trim() || !item.purpose.trim()) throw new Error(`Lead-page brief is missing its keyword, audience, or purpose: ${item.id}`);
  if (item.sources.length < 2 || item.sources.some((source) => !/^https:\/\//.test(source.url))) throw new Error(`Lead-page brief needs at least two HTTPS sources: ${item.id}`);

  const outputPath = join(OUTPUT_DIR, `${item.id}.md`);
  if (existsSync(outputPath)) throw new Error(`Refusing to overwrite an existing lead page: ${item.id}`);
  await assertLlmReady();
  const draft = await callModel<LeadPageDraft>({
    tier: "heavy",
    task: "write",
    json: true,
    maxTokens: 5000,
    temperature: 0.35,
    validate: (value): value is LeadPageDraft => validateDraft(value, item),
    system: `You write evidence-led, genuinely useful service-topic pages for ${nicheConfig.siteName}. Follow this site's explicit content rules: ${nicheConfig.contentGuidelines}. This is a reviewable draft, not a claim that the company has completed work. It must answer the reader's topic before it mentions the business: provide a practical, source-grounded explanation or process that is useful even if the reader never contacts the company. Do not make the page an intake form, sales pitch, or series of questions to the reader. At least 80% of the page should address the reader's task; use one short, modest closing CTA only. Do not invent availability, prices, guarantees, client results, testimonials, credentials, turnaround times, or service features. Use only the supplied business facts, service description, and source URLs. Distinguish official documentation from general advice. Include links to all supplied sources. Return only JSON with title, description, and markdown. Markdown starts with a level-2 heading, has at least four descriptive sections, and is 700-1,100 words.`,
    prompt: `Draft one focused, practical page that answers the reader's task.\n\nPAGE ID: ${item.id}\nTARGET QUERY: ${item.targetKeyword}\nAUDIENCE: ${item.audience}\nPURPOSE: ${item.purpose}\nSERVICE: ${service.title} — ${service.description}\nVERIFIED BUSINESS FACTS (these are the only allowed company-specific claims): ${business.name}; location ${business.location}; service areas ${business.serviceAreas.join(", ")}; email ${business.email}; phone ${business.phone ?? "not configured"}. Service description: ${service.description}.\nEXISTING INTERNAL LINKS (include both exactly, but use them sparingly): [${service.title}](/services/${service.id}/) and [Contact](${contactPath}).\nVERIFIED SOURCE REFERENCES (cite every source inline where relevant; do not imply endorsement):\n${item.sources.map((source) => `- ${source.label}: ${source.url} — ${source.use}`).join("\n")}\n\nSTRUCTURE: Open with a direct answer, then explain what the issue/process means, a safe step-by-step approach, what the reader should avoid, what evidence to record, and when a specialist may be appropriate. Use clear sections and concrete steps tied to the supplied sources. Keep business details to one small closing section; do not repeat the location, phone, or service areas as filler. Include exactly one restrained closing CTA with the supplied contact link. Never describe a local office, emergency availability, a guaranteed result, or a technical intervention unless verified by the supplied facts. Avoid false urgency, invented statistics, generic filler, and unsupported competitor claims. The page must stand on its own as useful guidance, not primarily collect a lead.`,
  });

  const review = await reviewWork(REVIEW_TEMPLATES.writer, draft.markdown, `Review this for factual accuracy and reader value as a page about ${item.targetKeyword}, for audience ${item.audience} and purpose ${item.purpose}. Its first duty is to answer that task; it should not read like an intake page. Allowed company facts only: ${business.name}; location ${business.location}; service areas ${business.serviceAreas.join(", ")}; email ${business.email}; phone ${business.phone ?? "not configured"}; this configured service: ${service.title} — ${service.description}. Do not accept any other company-specific claim unless supported by these sources: ${item.sources.map((source) => `${source.label}: ${source.url} (${source.use})`).join("; ")}.`, 1);
  if (!review.passed) throw new Error(`Lead-page quality review failed (${review.score}/10); nothing was written. ${review.feedback}`);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(outputPath, makeFrontmatter(item, draft) + draft.markdown.trim() + "\n", { flag: "wx" });
  item.status = "drafted";
  item.generatedAt = new Date().toISOString();
  item.note = "Quality-reviewed draft; human approval is required before status can change to published.";
  writeFileSync(QUEUE_PATH, `${JSON.stringify(queue, null, 2)}\n`);
  console.log(`Lead-page draft created for review: ${item.id}. It remains unpublished until its frontmatter status is explicitly changed.`);
}

if (process.argv[1]?.endsWith("write-lead-page.ts")) {
  writeLeadPage().catch((error) => { printLlmError(error); process.exitCode = 1; });
}
