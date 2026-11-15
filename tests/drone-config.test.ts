import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const yaml = require("js-yaml") as {
  loadAll: (input: string) => unknown[];
  load: (input: string) => unknown;
};

type PipelineStep = { name: string; environment?: Record<string, unknown> };
type Pipeline = {
  name: string;
  steps?: PipelineStep[];
  trigger?: { event?: string[]; cron?: string[] };
};

const documents = yaml.loadAll(readFileSync(".drone.yml", "utf8")) as Pipeline[];

test("Drone YAML rejects duplicate mapping keys", () => {
  assert.throws(() => yaml.load("name: first\nname: second\n"), /duplicated mapping key/i);
});

test("one four-step weekly pipeline keeps branch, providers, and credentials scoped", () => {
  const weekly = documents.filter((doc) => doc.name === "weekly-content");
  assert.equal(weekly.length, 1, "exactly one weekly-content mapping must load");
  const pipeline = weekly[0];
  assert.deepEqual(pipeline.trigger?.event, ["cron"]);
  assert.deepEqual(pipeline.trigger?.cron, ["weekly-content"]);
  const steps = pipeline.steps ?? [];
  assert.deepEqual(steps.map((step) => step.name), [
    "install",
    "publication-sync-preflight",
    "generate-promote-and-validate",
    "persist-published-content",
  ]);

  const preflight = steps[1].environment ?? {};
  const generator = steps[2].environment ?? {};
  const persist = steps[3].environment ?? {};
  const isArk = preflight.GITHUB_PUBLICATION_URL === "git@github.com:Ark-Web-Services/ark.git";
  const expectedBranch = isArk ? "master" : "main";
  const expectedProviders = isArk ? ["codex-cli"] : ["codex-cli", "ollama"];
  assert.equal(
    preflight.GITHUB_PUBLICATION_URL,
    isArk ? "git@github.com:Ark-Web-Services/ark.git" : "git@github.com:Arkaaron/overflow-sites.git",
  );
  for (const environment of [preflight, generator, persist]) {
    assert.equal(environment.PROMOTION_BRANCH, expectedBranch);
  }
  assert.deepEqual(String(generator.LLM_PROVIDER_ORDER ?? "").split(","), expectedProviders);
  assert.deepEqual(String(generator.LLM_PROVIDER_ORDER_LIGHT ?? "").split(","), expectedProviders);
  assert.equal(generator.LLM_PROVIDER_ORDER_HEAVY, "codex-cli");
  assert.equal(generator.LLM_ALLOW_PAID, "0");
  assert.equal("GITHUB_PUBLICATION_SSH_KEY" in generator, false);
  assert.equal(preflight.GITHUB_PUBLICATION_SSH_KEY && typeof preflight.GITHUB_PUBLICATION_SSH_KEY === "object", true);
  assert.equal(persist.GITHUB_PUBLICATION_SSH_KEY && typeof persist.GITHUB_PUBLICATION_SSH_KEY === "object", true);
});
