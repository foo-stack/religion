import { test } from "node:test";
import type { TestContext } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { bundleFor, planExport, writeExport } from "./export.js";
import { applyImport, planImport } from "./import.js";
import { compareState } from "./sync.js";

async function project(t: TestContext, files: Record<string, string>): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "religion-sync-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const write = async (relative: string, contents: string) => {
    await fs.mkdir(path.dirname(path.join(root, relative)), { recursive: true });
    await fs.writeFile(path.join(root, relative), contents);
  };
  await write(".gitignore", "religion/\n");
  await write(".git/HEAD", "ref: refs/heads/main\n");
  await write(".git/config", '[remote "origin"]\n\turl = git@github.com:acme/app.git\n');
  for (const [relative, contents] of Object.entries(files)) await write(relative, contents);
  return root;
}

async function bundle(root: string): Promise<Buffer> {
  const plan = await planExport(root);
  assert.ok(plan.ok);
  return bundleFor(root, plan.manifest);
}

test("sync names each way a file moved since the last exchange", async (t) => {
  const shared = { "religion/same.md": "s\n", "religion/here.md": "h\n", "religion/there.md": "t\n", "religion/both.md": "b\n", "religion/gone.md": "g\n" };
  const first = await project(t, shared);
  const exported = await planExport(first);
  assert.ok(exported.ok);
  await writeExport(first, exported.manifest);
  const second = await project(t, { "religion/config.json": "{}\n" });
  const imported = await planImport(second, await bundle(first));
  assert.ok(imported.ok);
  await applyImport(second, imported);

  await fs.writeFile(path.join(second, "religion", "here.md"), "edited on the second machine\n");
  await fs.writeFile(path.join(second, "religion", "both.md"), "second\n");
  await fs.writeFile(path.join(second, "religion", "new-here.md"), "new\n");
  await fs.writeFile(path.join(first, "religion", "there.md"), "edited on the first machine\n");
  await fs.writeFile(path.join(first, "religion", "both.md"), "first\n");
  await fs.writeFile(path.join(first, "religion", "new-there.md"), "new\n");
  await fs.rm(path.join(second, "religion", "gone.md"));

  const report = await compareState(second, await bundle(first));
  assert.ok(report.ok);
  assert.deepEqual(Object.fromEntries(report.files.map((f) => [f.path, f.state])), {
    "religion/both.md": "both",
    "religion/config.json": "only-here",
    "religion/gone.md": "only-there",
    "religion/here.md": "here",
    "religion/new-here.md": "only-here",
    "religion/new-there.md": "only-there",
    "religion/same.md": "same",
    "religion/there.md": "there"
  });
});

test("without an exchange a difference has no direction, and a refused bundle gives import's reason", async (t) => {
  const first = await project(t, { "religion/plan.md": "one\n" });
  const second = await project(t, { "religion/plan.md": "two\n" });
  const report = await compareState(second, await bundle(first));
  assert.ok(report.ok);
  assert.deepEqual(report.files, [{ path: "religion/plan.md", state: "differs" }]);

  const refused = await compareState(second, Buffer.from("not a zip"));
  assert.ok(!refused.ok);
  assert.match(refused.reason, /the bundle is refused: no end-of-archive record/);
});
