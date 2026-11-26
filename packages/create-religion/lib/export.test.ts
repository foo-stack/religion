import { test } from "node:test";
import type { TestContext } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { BUNDLE_PATH, EXCHANGE_PATH, planExport, writeExport } from "./export.js";
import { hash } from "./install.js";

/** A project keeping its state out of git, with a few state files and the given extras. */
async function localProject(t: TestContext, { ignored = true, origin = true } = {}): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "religion-export-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const write = async (relative: string, contents: string) => {
    await fs.mkdir(path.dirname(path.join(root, relative)), { recursive: true });
    await fs.writeFile(path.join(root, relative), contents);
  };
  await write(".gitignore", ignored ? "node_modules/\nreligion/\n" : "node_modules/\n");
  await write(".git/HEAD", "ref: refs/heads/main\n");
  await write(".git/config", origin ? '[core]\n\tbare = false\n[remote "origin"]\n\turl = git@github.com:acme/app.git\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n' : "[core]\n\tbare = false\n");
  await write("religion/config.json", "{}\n");
  await write("religion/build-plan.md", "# Build Plan\n");
  await write("religion/context/current-work.md", "# Current Work\n");
  await write("religion/.state/run.json", "{}\n");
  await write("religion/.state/export/religion-bundle.zip", "old");
  return root;
}

test("export bundles every state file but .state/, hashed, with the repository's origin", async (t) => {
  const root = await localProject(t);
  await fs.symlink(path.join(root, "religion", "config.json"), path.join(root, "religion", "linked.json"));

  const plan = await planExport(root, new Date("2026-11-26T10:00:00Z"));
  assert.ok(plan.ok);
  assert.deepEqual(plan.files, ["religion/build-plan.md", "religion/config.json", "religion/context/current-work.md"]);
  assert.deepEqual(plan.skipped, ["religion/linked.json"], "a link is reported, not followed");
  assert.equal(plan.manifest.files["religion/build-plan.md"], hash("# Build Plan\n"));
  assert.equal(plan.manifest.repository, "git@github.com:acme/app.git");
  assert.equal(plan.manifest.createdAt, "2026-11-26T10:00:00.000Z");
  assert.equal(plan.manifest.host, os.hostname());
});

test("export refuses committed state and an empty state directory", async (t) => {
  const committed = await planExport(await localProject(t, { ignored: false }));
  assert.ok(!committed.ok);
  assert.match(committed.reason, /committed, so git already carries it/);

  const empty = await localProject(t);
  for (const file of ["config.json", "build-plan.md", "context/current-work.md"]) await fs.rm(path.join(empty, "religion", file));
  const nothing = await planExport(empty);
  assert.ok(!nothing.ok);
  assert.match(nothing.reason, /nothing to export/);
});

test("a repository with no origin records null", async (t) => {
  const plan = await planExport(await localProject(t, { origin: false }));
  assert.ok(plan.ok);
  assert.equal(plan.manifest.repository, null);
});

test("writing an export leaves a bundle unzip accepts, matching hashes, and the exchange base", async (t) => {
  const root = await localProject(t);
  const first = await planExport(root);
  assert.ok(first.ok);
  await writeExport(root, first.manifest);

  const bundle = path.join(root, ...BUNDLE_PATH.split("/"));
  assert.match(execFileSync("unzip", ["-t", bundle], { encoding: "utf8" }), /No errors detected/);
  const listed = execFileSync("unzip", ["-Z1", bundle], { encoding: "utf8" }).trim().split("\n");
  assert.deepEqual(listed, ["religion-bundle.json", ...first.files]);
  const manifest = JSON.parse(execFileSync("unzip", ["-p", bundle, "religion-bundle.json"], { encoding: "utf8" }));
  for (const file of first.files) {
    assert.equal(manifest.files[file], hash(await fs.readFile(path.join(root, ...file.split("/")))), file);
  }
  const exchange = JSON.parse(await fs.readFile(path.join(root, ...EXCHANGE_PATH.split("/")), "utf8"));
  assert.deepEqual(exchange.last, { direction: "export", createdAt: first.manifest.createdAt, files: first.manifest.files });

  await fs.writeFile(path.join(root, "religion", "build-plan.md"), "# Build Plan\n\n- [ ] 1. **More**\n");
  const second = await planExport(root);
  assert.ok(second.ok);
  await writeExport(root, second.manifest);
  const replaced = JSON.parse(execFileSync("unzip", ["-p", bundle, "religion-bundle.json"], { encoding: "utf8" }));
  assert.equal(replaced.files["religion/build-plan.md"], hash("# Build Plan\n\n- [ ] 1. **More**\n"));
  const folder = await fs.readdir(path.dirname(bundle));
  assert.deepEqual(folder, ["religion-bundle.zip"], "no temporary file is left behind");
});

test("a failed write removes its temporary file and leaves the previous bundle alone", async (t) => {
  const root = await localProject(t);
  const bundle = path.join(root, ...BUNDLE_PATH.split("/"));
  await fs.rm(bundle);
  await fs.mkdir(path.join(bundle, "in-the-way"), { recursive: true });
  const plan = await planExport(root);
  assert.ok(plan.ok);

  await assert.rejects(writeExport(root, plan.manifest));
  assert.deepEqual(await fs.readdir(path.dirname(bundle)), ["religion-bundle.zip"]);
  assert.deepEqual(await fs.readdir(bundle), ["in-the-way"]);
  assert.equal(await fs.stat(path.join(root, ...EXCHANGE_PATH.split("/"))).catch(() => null), null, "no exchange base without a bundle");
});
