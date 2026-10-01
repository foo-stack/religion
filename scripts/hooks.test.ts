import { test } from "node:test";
import type { TestContext } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HOOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "hooks", "write-handoff.mjs");

/** A project with the state the hook reads, and a directory beside it standing in for anywhere else. */
async function project(t: TestContext): Promise<{ root: string; outside: string }> {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), "religion-hook-"));
  t.after(() => fs.rm(base, { recursive: true, force: true }));
  const root = path.join(base, "project");
  const outside = path.join(base, "outside");
  await fs.mkdir(path.join(root, "religion", "context"), { recursive: true });
  await fs.mkdir(outside);
  await fs.writeFile(path.join(root, "religion", "build-plan.md"), "## Plan\n\n- [ ] 1. **First** - queued\n");
  await fs.writeFile(path.join(outside, "victim.md"), "theirs\n");
  return { root, outside };
}

function runHook(cwd: string): number | null {
  return spawnSync(process.execPath, [HOOK], { cwd, input: "{}", encoding: "utf8" }).status;
}

test("write-handoff writes the handoff in a normal project", async (t) => {
  const { root } = await project(t);
  assert.equal(runHook(root), 0);
  assert.match(await fs.readFile(path.join(root, "religion", "context", "handoff.md"), "utf8"), /^# Handoff/);
});

test("write-handoff never writes through a linked handoff file", async (t) => {
  const { root, outside } = await project(t);
  await fs.symlink(path.join(outside, "victim.md"), path.join(root, "religion", "context", "handoff.md"));
  assert.equal(runHook(root), 0);
  assert.equal(await fs.readFile(path.join(outside, "victim.md"), "utf8"), "theirs\n");
});

test("write-handoff never writes through a linked context or state directory", async (t) => {
  for (const linked of ["religion/context", "religion"]) {
    const { root, outside } = await project(t);
    const target = path.join(outside, "elsewhere");
    await fs.cp(path.join(root, linked), target, { recursive: true });
    await fs.rm(path.join(root, linked), { recursive: true });
    await fs.symlink(target, path.join(root, linked));

    assert.equal(runHook(root), 0);
    const written = await fs.readdir(linked === "religion" ? path.join(target, "context") : target);
    assert.ok(!written.includes("handoff.md"), `${linked} linked: nothing written through it`);
  }
});
