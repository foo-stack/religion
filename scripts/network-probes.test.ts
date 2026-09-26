import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runProbe } from "./network-probes.js";
import type { Probe } from "./network-probes.js";

const CORPUS = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "network-probes.json");

/**
 * Every probe reviewers have tried against the network check, each with the verdict it must
 * keep. A change that lets an evasion through, or starts flagging legitimate code, fails
 * here and has to change this file on purpose to pass.
 */
test("the network check keeps its verdict on every recorded probe", async () => {
  const probes = JSON.parse(await fs.readFile(CORPUS, "utf8")) as Probe[];
  assert.ok(probes.length > 0, "the corpus is not empty");

  const wrong: string[] = [];
  for (let start = 0; start < probes.length; start += 16) {
    await Promise.all(
      probes.slice(start, start + 16).map(async (probe) => {
        const problems = await runProbe(probe);
        const verdict = problems.length > 0 ? "caught" : "clean";
        if (verdict !== probe.expect) wrong.push(`${probe.id} ${probe.desc}: expected ${probe.expect}, was ${verdict}`);
      })
    );
  }
  assert.deepEqual(wrong, []);
});
