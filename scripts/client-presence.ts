import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import businessConfig from "../business.config";
import type { BusinessConfig } from "../business.config";

type QueueItem = { id: string; platform: "Instagram" | "TikTok"; week: number; serviceId: string; hook: string; captionOutline: string[]; shotList: string[]; callToAction: string; mediaRequirement: string; status: "draft" | "approved"; approval?: { approvedAt: string; source: string; contentHash: string; snapshot: Omit<QueueItem, "approval" | "status"> } };

const directories = [
  { id: "google-business-profile", name: "Google Business Profile" }, { id: "the-knot-weddingpro", name: "The Knot / WeddingPro" },
  { id: "zola", name: "Zola" }, { id: "eventective", name: "Eventective" },
  { id: "style-me-pretty", name: "Style Me Pretty" }, { id: "partyslate", name: "PartySlate" },
];
const platforms: QueueItem["platform"][] = ["Instagram", "TikTok"];
const mediaRule = "Attach human-supplied, permission-cleared footage from a real project before approval. No invented weddings, testimonials, client names, or substitute stock scenes.";

function hashContent(item: QueueItem) {
  const { approval: _approval, status: _status, ...content } = item;
  return createHash("sha256").update(JSON.stringify(content)).digest("hex");
}

export function hasCompleteBusinessFacts(config: BusinessConfig): boolean {
  const placeholder = /your studio|your city|template example|instructional|replace this|describe your|example\.com|\.example\b/i;
  const facts = [config.name, config.email, config.location, config.website || "", config.description, config.about || "", ...config.serviceAreas, ...config.socials.flatMap((social) => [social.label, social.url])];
  return config.enabled === true && Boolean(config.name && config.email && config.location && config.website)
    && !facts.some((value) => placeholder.test(value)) && config.services.length > 0
    && config.services.every((service) => !placeholder.test(`${service.title} ${service.description}`));
}

export function buildPresencePacket(config: BusinessConfig) {
  const facts = { name: config.name, email: config.email, location: config.location, serviceAreas: config.serviceAreas,
    services: config.services.map(({ id, title, description }) => ({ id, title, description })), website: config.website || "", socials: config.socials };
  const directoryProfiles = directories.map((directory) => ({
    ...directory,
    status: "draft" as const,
    businessFacts: facts,
    checklist: ["Confirm the correct account owner and profile access.", "Collect owner-approved logo, real project images, and usage permissions.", "Check the current public profile URL and service/category fields.", "Review every business fact against the approved website and source records.", "Owner publishes or updates the profile manually, then verifies the public listing."],
  }));
  const queue: QueueItem[] = [];
  for (let week = 1; config.services.length > 0 && week <= 4; week++) {
    const service = config.services[(week - 1) % config.services.length]!;
    for (const platform of platforms) {
      queue.push({
        id: `${platform.toLowerCase()}-week-${week}-${service.id}`,
        platform,
        week,
        serviceId: service.id,
        hook: `A useful question to answer about ${service.title.toLowerCase()}`,
        captionOutline: [`Introduce the topic: ${service.title}.`, "Add only owner-verified guidance and the limits or details that apply to this business.", "Do not add a client story, result, review, or claim unless the owner supplies and verifies it."],
        shotList: ["Owner records a short introduction or voiceover.", "Show permission-cleared footage from a real project related to this service.", "Add readable captions and check client, venue, and vendor permissions."],
        callToAction: "Invite viewers to visit the configured website or contact the business.",
        mediaRequirement: mediaRule,
        status: "draft",
      });
    }
  }
  return {
    version: 1,
    draftOnly: true,
    businessFactsReadyForReview: hasCompleteBusinessFacts(config),
    note: "Editable planning handoff. Nothing is published, submitted, messaged, or scheduled by this tool.",
    directoryProfiles,
    socialQueue: queue,
  };
}

function renderMarkdown(packet: ReturnType<typeof buildPresencePacket>) {
  const lines = ["# Client presence handoff", "", `**Status:** Draft only · **Business:** ${packet.directoryProfiles[0]?.businessFacts.name || "Unconfigured"}`, "", packet.note, "", "## Directory profile checklist", ""];
  for (const profile of packet.directoryProfiles) {
    lines.push(`### ${profile.name}`, "", `Profile status: ${profile.status}`, "", `- Name to verify: ${profile.businessFacts.name}`, `- Email to verify: ${profile.businessFacts.email}`, `- Location to verify: ${profile.businessFacts.location}`, `- Website to verify: ${profile.businessFacts.website || "Add approved website"}`, `- Services to verify: ${profile.businessFacts.services.map((s) => s.title).join(", ") || "Add approved services"}`, `- Socials to verify: ${profile.businessFacts.socials.map((s) => `${s.label}: ${s.url}`).join("; ") || "Add approved links"}`, "", ...profile.checklist.map((item) => `- [ ] ${item}`), "");
  }
  lines.push("## Four-week Instagram and TikTok content queue", "", "Every item remains a draft until a human supplies real project media, checks permissions, edits the copy, and explicitly approves it.", "");
  for (const item of packet.socialQueue) lines.push(`### ${item.id} · Week ${item.week} · ${item.platform}`, "", `Status: ${item.status}`, `Service: ${item.serviceId}`, `Hook: ${item.hook}`, `Caption: ${item.captionOutline.join(" ")}`, `Shot list: ${item.shotList.join(" ")}`, `CTA: ${item.callToAction}`, `Media requirement: ${item.mediaRequirement}`, "");
  return `${lines.join("\n")}\n`;
}

function parseArgs(args: string[]) {
  const options: { out?: string; force: boolean; approve?: string; source?: string } = { force: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--out") {
      const value = args[++i];
      if (!value || value.startsWith("--")) throw new Error("--out requires a directory path.");
      options.out = value;
    }
    else if (args[i] === "--force") options.force = true;
    else if (args[i] === "--approve") {
      const value = args[++i];
      if (!value || value.startsWith("--")) throw new Error("--approve requires a draft id.");
      options.approve = value;
    }
    else if (args[i] === "--source") {
      const value = args[++i];
      if (!value || value.startsWith("--")) throw new Error("--source requires a human review note.");
      options.source = value;
    }
    else throw new Error(`Unknown argument: ${args[i]}`);
  }
  return options;
}

export async function writePresencePacket(outDir: string, force: boolean, config: BusinessConfig = businessConfig) {
  const jsonPath = resolve(outDir, "presence.json");
  const mdPath = resolve(outDir, "presence.md");
  if (!force) {
    for (const path of [jsonPath, mdPath]) {
      try { await readFile(path); throw new Error(`Refusing to overwrite ${path}; use --force to regenerate drafts and clear approvals.`); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    }
  }
  const packet = buildPresencePacket(config);
  await mkdir(outDir, { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  await writeFile(mdPath, renderMarkdown(packet), "utf8");
  return packet;
}

export function approveQueueItem(packet: ReturnType<typeof buildPresencePacket>, id: string, source: string, config: BusinessConfig, approvedAt = new Date().toISOString()) {
  if (!source?.trim()) throw new Error("Approval requires --source with the human review/source note.");
  if (!hasCompleteBusinessFacts(config)) throw new Error("Approval blocked: replace the instructional sample configuration with owner-approved business facts first.");
  const item = packet.socialQueue.find((entry) => entry.id === id);
  if (!item) throw new Error(`No social draft found with id ${id}.`);
  const currentHash = hashContent(item);
  if (item.approval && item.approval.contentHash !== currentHash) {
    item.status = "draft";
    delete item.approval;
    throw new Error("This draft changed after approval; stale approval was cleared. Review it again before re-approving.");
  }
  item.status = "approved";
  const { approval: _old, status: _status, ...snapshot } = item;
  item.approval = { approvedAt, source: source.trim(), contentHash: currentHash, snapshot };
  return packet;
}

async function approve(outDir: string, id: string, source?: string) {
  if (!source?.trim()) throw new Error("Approval requires --source with the human review/source note.");
  if (!hasCompleteBusinessFacts(businessConfig)) throw new Error("Approval blocked: replace the instructional sample configuration with owner-approved business facts first.");
  const jsonPath = resolve(outDir, "presence.json");
  const packet = JSON.parse(await readFile(jsonPath, "utf8")) as ReturnType<typeof buildPresencePacket>;
  try {
    approveQueueItem(packet, id, source, businessConfig);
  } catch (error) {
    if (error instanceof Error && error.message.includes("stale approval was cleared")) await writeFile(jsonPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
    throw error;
  }
  await writeFile(jsonPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  console.log(`Approved ${id}; content snapshot recorded. Nothing was published.`);
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const root = dirname(dirname(fileURLToPath(import.meta.url)));
    const outDir = options.out ? (isAbsolute(options.out) ? options.out : resolve(process.cwd(), options.out)) : resolve(root, "client/presence");
    if (options.approve) await approve(outDir, options.approve, options.source);
    else {
      await writePresencePacket(outDir, options.force);
      console.log(`Wrote draft handoff to ${outDir}`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) void main();
