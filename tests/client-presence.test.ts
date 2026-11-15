import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import businessConfig from "../business.config";
import { approveQueueItem, buildPresencePacket, hasCompleteBusinessFacts, writePresencePacket } from "../scripts/client-presence";

function ownerConfig() {
  return {
    ...structuredClone(businessConfig),
    enabled: true,
    name: "Harbor Event Studio",
    description: "Event planning and design in Providence.",
    about: "An owner-approved introduction to Harbor Event Studio.",
    email: "hello@harborevents.test",
    location: "Providence, Rhode Island",
    website: "https://harborevents.test",
    services: [{ id: "planning", title: "Wedding planning", description: "Planning support for weddings." }],
  };
}

function starterConfig() {
  return {
    ...structuredClone(businessConfig),
    name: "Your Studio",
    description: "An instructional example. Replace this description with accurate information about your business.",
    email: "hello@example.com",
    location: "Your city and region",
    website: "https://your-studio.example",
    about: "Replace this instructional example with an owner-approved introduction.",
    services: [{ id: "planning", title: "Wedding planning", description: "Template example: describe the support your studio offers." }],
  };
}

test("builds a draft-only directory handoff and four-week social queue from configured services", () => {
  const packet = buildPresencePacket(starterConfig());
  assert.equal(packet.draftOnly, true);
  assert.equal(packet.directoryProfiles.length, 6);
  assert.equal(packet.socialQueue.length, 8);
  assert.ok(packet.socialQueue.every((item) => item.status === "draft" && starterConfig().services.some((service) => service.id === item.serviceId)));
  assert.match(packet.socialQueue[0].mediaRequirement, /real project/);
  assert.equal(packet.businessFactsReadyForReview, false);
});

test("writes once and refuses to overwrite an existing handoff without force", async () => {
  const dir = await mkdtemp(join(tmpdir(), "client-presence-"));
  try {
    await writePresencePacket(dir, false, businessConfig);
    const saved = await readFile(join(dir, "presence.json"), "utf8");
    await assert.rejects(writePresencePacket(dir, false, businessConfig), /Refusing to overwrite/);
    assert.equal(await readFile(join(dir, "presence.json"), "utf8"), saved);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("blocks fictional sample approval and snapshots an explicitly reviewed draft for real config", () => {
  const starter = starterConfig();
  const draft = buildPresencePacket(starter);
  assert.equal(hasCompleteBusinessFacts(starter), false);
  assert.throws(() => approveQueueItem(draft, draft.socialQueue[0].id, "owner review", starter), /Approval blocked/);

  const config = ownerConfig();
  const packet = buildPresencePacket(config);
  assert.equal(hasCompleteBusinessFacts(config), true);
  approveQueueItem(packet, packet.socialQueue[0].id, "Owner reviewed copy and media permissions", config, "2026-10-23T12:00:00.000Z");
  assert.equal(packet.socialQueue[0].status, "approved");
  assert.equal(packet.socialQueue[0].approval?.approvedAt, "2026-10-23T12:00:00.000Z");
  assert.equal(packet.socialQueue[0].approval?.snapshot.serviceId, "planning");
});
