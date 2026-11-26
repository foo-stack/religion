import { test } from "node:test";
import type { TestContext } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { writeZip } from "./bundle.js";
import { bundleFor, EXCHANGE_PATH, planExport, writeExport } from "./export.js";
import { applyImport, classify, planImport } from "./import.js";
import { hash } from "./install.js";

const ORIGIN = "git@github.com:acme/app.git";

/** A project keeping its state out of git, with the given state files. */
async function project(t: TestContext, files: Record<string, string>, { origin = ORIGIN as string | null, ignored = true } = {}): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "religion-import-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const write = async (relative: string, contents: string) => {
    await fs.mkdir(path.dirname(path.join(root, relative)), { recursive: true });
    await fs.writeFile(path.join(root, relative), contents);
  };
  await write(".gitignore", ignored ? "religion/\n" : "");
  await write(".git/HEAD", "ref: refs/heads/main\n");
  await write(".git/config", origin ? `[remote "origin"]\n\turl = ${origin}\n` : "[core]\n");
  for (const [relative, contents] of Object.entries(files)) await write(relative, contents);
  return root;
}

/** The bundle a project with these files would export. */
async function bundleOf(t: TestContext, files: Record<string, string>, origin: string | null = ORIGIN): Promise<Buffer> {
  const source = await project(t, files, { origin });
  const plan = await planExport(source);
  assert.ok(plan.ok);
  return bundleFor(source, plan.manifest);
}

test("classify keeps local changes made since the last exchange", () => {
  const base = { "religion/a.md": "aaaaaaaaaaaaaaaa" };
  assert.equal(classify("bbbbbbbbbbbbbbbb", "bbbbbbbbbbbbbbbb", base, "religion/a.md"), "unchanged");
  assert.equal(classify(null, "bbbbbbbbbbbbbbbb", base, "religion/a.md"), "create");
  assert.equal(classify("aaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbb", base, "religion/a.md"), "overwrite");
  assert.equal(classify("cccccccccccccccc", "bbbbbbbbbbbbbbbb", base, "religion/a.md"), "conflict");
  assert.equal(classify("cccccccccccccccc", "bbbbbbbbbbbbbbbb", base, "religion/new.md"), "conflict", "made here since the exchange");
  assert.equal(classify("cccccccccccccccc", "bbbbbbbbbbbbbbbb", null, "religion/a.md"), "overwrite", "no exchange yet");
});

test("an import plan classifies every file against the exchange base", async (t) => {
  const bundle = await bundleOf(t, { "religion/config.json": "{}\n", "religion/plan.md": "# New plan\n", "religion/fresh.md": "new\n" });
  const fresh = await project(t, { "religion/config.json": "{}\n", "religion/plan.md": "# Seeded\n" });

  const first = await planImport(fresh, bundle);
  assert.ok(first.ok);
  const classes = Object.fromEntries(first.files.map((f) => [f.path, f.class]));
  assert.deepEqual(classes, { "religion/config.json": "unchanged", "religion/fresh.md": "create", "religion/plan.md": "overwrite" });

  const exported = await planExport(fresh);
  assert.ok(exported.ok);
  await writeExport(fresh, exported.manifest);
  const untouched = await planImport(fresh, bundle);
  assert.ok(untouched.ok);
  assert.equal(untouched.files.find((f) => f.path === "religion/plan.md")!.class, "overwrite", "untouched since the exchange");

  await fs.writeFile(path.join(fresh, "religion", "plan.md"), "# Edited here\n");
  const edited = await planImport(fresh, bundle);
  assert.ok(edited.ok);
  assert.equal(edited.files.find((f) => f.path === "religion/plan.md")!.class, "conflict");
});

test("an import refuses a bundle that is damaged, mismatched, or for another repository", async (t) => {
  const target = await project(t, { "religion/config.json": "{}\n" });
  const reason = async (bundle: Buffer, root = target) => {
    const plan = await planImport(root, bundle);
    return plan.ok ? "accepted" : plan.reason;
  };
  const manifest = (files: Record<string, string>, repository: string | null = ORIGIN) =>
    Buffer.from(JSON.stringify({ schemaVersion: 1, createdAt: "2026-11-26T00:00:00.000Z", host: "elsewhere", repository, files }));

  assert.match(await reason(Buffer.from("not a zip")), /the bundle is refused: no end-of-archive record/);
  assert.match(await reason(writeZip([{ path: "religion/a.md", contents: Buffer.from("a") }], new Date())), /no readable religion-bundle\.json/);
  assert.match(
    await reason(writeZip([{ path: "religion-bundle.json", contents: manifest({ "religion/a.md": hash("a") }) }, { path: "religion/b.md", contents: Buffer.from("b") }], new Date())),
    /manifest and contents disagree: religion\/b\.md, religion\/a\.md/
  );
  assert.match(
    await reason(writeZip([{ path: "religion-bundle.json", contents: manifest({ "religion/a.md": hash("not a") }) }, { path: "religion/a.md", contents: Buffer.from("a") }], new Date())),
    /do not match their recorded hashes: religion\/a\.md/
  );
  assert.match(await reason(await bundleOf(t, { "religion/a.md": "a" }, "git@github.com:acme/other.git")), /made for git@github\.com:acme\/other\.git, and this one is git@github\.com:acme\/app\.git/);
  assert.match(await reason(await bundleOf(t, { "religion/a.md": "a" }, null)), /made for a repository with no origin/);
  assert.match(await reason(await bundleOf(t, { "religion/a.md": "a" }), await project(t, { "religion/a.md": "a" }, { ignored: false })), /committed here/);

  await fs.mkdir(path.join(target, "religion", ".state"), { recursive: true });
  await fs.writeFile(path.join(target, ...EXCHANGE_PATH.split("/")), "{ not json");
  assert.match(await reason(await bundleOf(t, { "religion/a.md": "a" })), /cannot be read/);
});

test("an export imported elsewhere arrives byte for byte, and a later local edit blocks the next import", async (t) => {
  const files = { "religion/config.json": '{"a":1}\n', "religion/build-plan.md": "# Plan\n", "religion/context/current-work.md": "# Work\n" };
  const source = await project(t, files);
  const exported = await planExport(source);
  assert.ok(exported.ok);
  await writeExport(source, exported.manifest);
  const bundle = await fs.readFile(path.join(source, "religion", ".state", "export", "religion-bundle.zip"));

  const target = await project(t, { "religion/config.json": "{}\n", "religion/build-plan.md": "# Seeded\n" });
  const plan = await planImport(target, bundle);
  assert.ok(plan.ok);
  assert.deepEqual((await applyImport(target, plan)).written.sort(), ["religion/build-plan.md", "religion/config.json", "religion/context/current-work.md"]);
  for (const [relative, contents] of Object.entries(files)) assert.equal(await fs.readFile(path.join(target, relative), "utf8"), contents, relative);
  const exchange = JSON.parse(await fs.readFile(path.join(target, ...EXCHANGE_PATH.split("/")), "utf8"));
  assert.equal(exchange.last.direction, "import");
  assert.equal(exchange.last.host, exported.manifest.host);
  assert.deepEqual(exchange.last.files, exported.manifest.files);
  assert.deepEqual((await fs.readdir(path.join(target, "religion"))).filter((n) => n.endsWith(".tmp")), []);

  await fs.writeFile(path.join(target, "religion", "build-plan.md"), "# Edited on the second machine\n");
  await fs.writeFile(path.join(source, "religion", "build-plan.md"), "# Edited on the first machine\n");
  const again = await planExport(source);
  assert.ok(again.ok);
  const conflicted = await planImport(target, await bundleFor(source, again.manifest));
  assert.ok(conflicted.ok);
  assert.equal(conflicted.files.find((f) => f.path === "religion/build-plan.md")!.class, "conflict");
  await assert.rejects(applyImport(target, conflicted), /conflicts/);
  assert.equal(await fs.readFile(path.join(target, "religion", "build-plan.md"), "utf8"), "# Edited on the second machine\n");
});

test("an import whose target folder is a link writes nothing", async (t) => {
  const bundle = await bundleOf(t, { "religion/config.json": "{}\n", "religion/context/current-work.md": "# Work\n", "religion/plan.md": "# Plan\n" });
  const target = await project(t, { "religion/config.json": "{}\n" });
  const elsewhere = await fs.mkdtemp(path.join(os.tmpdir(), "religion-elsewhere-"));
  t.after(() => fs.rm(elsewhere, { recursive: true, force: true }));
  await fs.symlink(elsewhere, path.join(target, "religion", "context"));

  const plan = await planImport(target, bundle);
  assert.ok(plan.ok);
  await assert.rejects(applyImport(target, plan), /religion\/context is a link/);
  assert.deepEqual(await fs.readdir(elsewhere), []);
  assert.equal(await fs.stat(path.join(target, "religion", "plan.md")).catch(() => null), null, "nothing else was written either");
});

test("a write that the filesystem would resolve into religion/.state is refused, however it is spelled", async (t) => {
  const target = await project(t, { "religion/config.json": "{}\n", "religion/.state/run.json": "original\n", "religion/sub/keep.md": "x" });
  const manifest = { schemaVersion: 1 as const, createdAt: "2026-11-26T00:00:00.000Z", host: "elsewhere", repository: ORIGIN, files: {} };
  const sneaking = { ok: true as const, manifest, files: [{ path: "religion/sub/../.state/run.json", class: "overwrite" as const, contents: Buffer.from("pwned\n") }] };
  await assert.rejects(applyImport(target, sneaking), /resolves to religion\/\.state/);
  assert.equal(await fs.readFile(path.join(target, "religion", ".state", "run.json"), "utf8"), "original\n");
});
