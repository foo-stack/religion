import { test } from "node:test";
import assert from "node:assert/strict";

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { doctorReport, HOOKS, hooksCheck, managedFilesCheck, runDoctor } from "./doctor.js";
import type { CheckResult } from "./doctor.js";

const pass: CheckResult = { name: "configuration", ok: true, detail: "valid", blocks: "work" };
const cosmetic: CheckResult = { name: "adapters", ok: false, detail: "trees differ", blocks: "nothing" };

test("doctorReport is versioned and carries every check unchanged", () => {
  const report = doctorReport([pass, cosmetic]);
  assert.equal(report.schemaVersion, 1);
  assert.deepEqual(report.checks, [pass, cosmetic]);
});

test("doctorReport is healthy only when every check passes, cosmetic ones included", () => {
  assert.equal(doctorReport([pass]).healthy, true);
  assert.equal(doctorReport([pass, cosmetic]).healthy, false);
});

test("managedFilesCheck reports, never fails, and cuts a long list short", () => {
  assert.deepEqual(managedFilesCheck(null), { name: "managed files", ok: true, detail: "no install record to compare with", blocks: "nothing" });
  assert.equal(managedFilesCheck({ edited: [], missing: [], total: 30 }).detail, "all 30 unchanged since install");

  const long = managedFilesCheck({ edited: ["a", "b", "c", "d", "e", "f"], missing: ["g"], total: 30 });
  assert.equal(long.ok, true);
  assert.equal(long.detail, "6 edited and 1 missing of 30 since install: a, b, c, d, e, and 2 more");
  assert.equal(managedFilesCheck({ edited: [], missing: ["x"], total: 2 }).detail, "0 edited and 1 missing of 2 since install: x (missing)");
});

test("runDoctor includes the managed files check", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "religion-doctor-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const check = (await runDoctor(root)).find((c) => c.name === "managed files");
  assert.equal(check?.detail, "no install record to compare with");
});

const wired = JSON.stringify({
  hooks: Object.fromEntries(HOOKS.map((h) => [h.event, [{ matcher: "anything", hooks: [{ type: "command", command: h.command }] }]]))
});
const allFiles = new Set(HOOKS.map((h) => h.command.replace(/^node /, "")));

test("hooksCheck passes when every shipped hook is registered under its event and present", () => {
  assert.deepEqual(hooksCheck({ installed: true, wanted: HOOKS, settings: wired, files: allFiles }), {
    name: "hooks",
    ok: true,
    detail: "all 3 wired",
    blocks: "nothing"
  });
});

test("hooksCheck names an unregistered hook and a missing hook file", () => {
  const without = JSON.stringify({ hooks: { Stop: [{ hooks: [{ type: "command", command: "node .claude/hooks/write-handoff.mjs" }] }] } });
  const unwired = hooksCheck({ installed: true, wanted: HOOKS, settings: without, files: allFiles });
  assert.equal(unwired.ok, false);
  assert.match(unwired.detail, /guard-rendered-output\.mjs \(PreToolUse\), scan-untrusted-input\.mjs \(PostToolUse\)/);

  const elsewhere = JSON.stringify({ hooks: { Stop: [{ hooks: HOOKS.map((h) => ({ type: "command", command: h.command })) }] } });
  assert.equal(hooksCheck({ installed: true, wanted: HOOKS, settings: elsewhere, files: allFiles }).ok, false, "the right command under the wrong event");

  const fileless = hooksCheck({ installed: true, wanted: HOOKS, settings: wired, files: new Set() });
  assert.match(fileless.detail, /missing hook file: guard-rendered-output\.mjs/);
});

test("hooksCheck reports a settings file that is missing, unparseable or a link", () => {
  for (const settings of [null, "{ not json", "link"] as const) {
    const check = hooksCheck({ installed: true, wanted: HOOKS, settings, files: allFiles });
    assert.equal(check.ok, false, String(settings));
  }
});

test("hooksCheck stays out of the way where Claude Code is not installed", () => {
  assert.deepEqual(hooksCheck({ installed: false, wanted: HOOKS, settings: null, files: new Set() }).ok, true);
});

test("runDoctor reads the settings and the hook files from the project", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "religion-doctor-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, ".claude", "skills"), { recursive: true });
  await fs.mkdir(path.join(root, ".claude", "hooks"), { recursive: true });
  for (const file of allFiles) await fs.writeFile(path.join(root, file), "");
  await fs.writeFile(path.join(root, ".claude", "settings.json"), wired);
  assert.equal((await runDoctor(root)).find((c) => c.name === "hooks")?.detail, "all 3 wired");

  await fs.rm(path.join(root, ".claude", "settings.json"));
  await fs.symlink(path.join(root, "elsewhere.json"), path.join(root, ".claude", "settings.json"));
  assert.match((await runDoctor(root)).find((c) => c.name === "hooks")?.detail ?? "", /is a link/);
});
