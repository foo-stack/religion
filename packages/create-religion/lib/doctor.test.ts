import { test } from "node:test";
import assert from "node:assert/strict";

import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { doctorReport, HOOKS, hooksCheck, managedFilesCheck, runDoctor } from "./doctor.js";
import type { CheckResult } from "./doctor.js";

/** Settings registering each shipped hook under its event, several to an event where they share one. */
function byEvent(group: (hook: (typeof HOOKS)[number]) => unknown): Record<string, unknown[]> {
  const events: Record<string, unknown[]> = {};
  for (const hook of HOOKS) (events[hook.event] ??= []).push(group(hook));
  return events;
}

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
  hooks: byEvent((h) => ({ matcher: "anything", hooks: [{ type: "command", command: h.command }] }))
});
const allFiles = new Set(HOOKS.map((h) => h.command.replace(/^node /, "")));

test("hooksCheck passes when every shipped hook is registered under its event and present", () => {
  assert.deepEqual(hooksCheck({ installed: true, wanted: HOOKS, settings: wired, files: allFiles }), {
    name: "hooks",
    ok: true,
    detail: "all 4 wired",
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
  assert.equal((await runDoctor(root)).find((c) => c.name === "hooks")?.detail, "all 4 wired");

  await fs.rm(path.join(root, ".claude", "settings.json"));
  await fs.symlink(path.join(root, "elsewhere.json"), path.join(root, ".claude", "settings.json"));
  assert.match((await runDoctor(root)).find((c) => c.name === "hooks")?.detail ?? "", /reached through a link/);
});

test("hooksCheck matches a hook by its file, in the forms Claude Code documents", () => {
  const command = (file: string) => [
    `node "$CLAUDE_PROJECT_DIR"/${file}`,
    `node  ${file}`,
    `node "\${CLAUDE_PROJECT_DIR}/${file}" --quiet`
  ];
  for (const form of [0, 1, 2]) {
    const settings = JSON.stringify({
      hooks: byEvent((h) => ({ hooks: [{ type: "command", command: command(h.command.replace(/^node /, ""))[form] }] }))
    });
    assert.equal(hooksCheck({ installed: true, wanted: HOOKS, settings, files: allFiles }).ok, true, `form ${form}`);
  }
});

test("hooksCheck counts settings.local.json, and fails when every hook is disabled", () => {
  assert.equal(hooksCheck({ installed: true, wanted: HOOKS, settings: null, local: wired, files: allFiles }).ok, true);
  const disabled = JSON.stringify({ ...JSON.parse(wired), disableAllHooks: true });
  assert.equal(hooksCheck({ installed: true, wanted: HOOKS, settings: disabled, files: allFiles }).detail, "disableAllHooks is on, so no hook runs");
  assert.equal(hooksCheck({ installed: true, wanted: HOOKS, settings: wired, local: JSON.stringify({ disableAllHooks: true }), files: allFiles }).ok, false);
  assert.equal(hooksCheck({ installed: true, wanted: HOOKS, settings: JSON.stringify({ hooks: [] }), files: allFiles }).ok, false, "hooks as an array");
});

test("runDoctor tells a linked .claude, a directory at the settings path and linked hook files apart", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "religion-doctor-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const hooks = async () => (await runDoctor(root)).find((c) => c.name === "hooks")?.detail ?? "";

  await fs.mkdir(path.join(root, "real", "skills"), { recursive: true });
  await fs.symlink(path.join(root, "real"), path.join(root, ".claude"));
  assert.match(await hooks(), /reached through a link/);

  await fs.rm(path.join(root, ".claude"));
  await fs.mkdir(path.join(root, ".claude", "skills"), { recursive: true });
  await fs.mkdir(path.join(root, ".claude", "settings.json"));
  assert.match(await hooks(), /not a regular file/);

  await fs.rm(path.join(root, ".claude", "settings.json"), { recursive: true });
  await fs.writeFile(path.join(root, ".claude", "settings.json"), wired);
  await fs.mkdir(path.join(root, "hookfiles"));
  for (const file of allFiles) await fs.writeFile(path.join(root, "hookfiles", path.basename(file)), "");
  await fs.symlink(path.join(root, "hookfiles"), path.join(root, ".claude", "hooks"));
  assert.equal(await hooks(), "all 4 wired");
});

const GIT_ENV = {
  ...Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith("GIT_"))),
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_NOSYSTEM: "1"
};

test("runDoctor refuses parallel items under trunk and names a linked worktree's main checkout", async (t) => {
  const base = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "religion-doctor-")));
  t.after(() => fs.rm(base, { recursive: true, force: true }));
  const main = path.join(base, "main");
  const linked = path.join(base, "main.feature-x");
  const git = (...args: string[]) => execFileSync("git", ["-C", main, ...args], { stdio: "pipe", env: GIT_ENV });
  await fs.mkdir(path.join(main, "religion"), { recursive: true });
  await fs.mkdir(path.join(main, ".claude", "skills"), { recursive: true });
  const config = (body: object) => fs.writeFile(path.join(main, "religion", "config.json"), JSON.stringify(body));
  const check = async (root: string, name: string) => (await runDoctor(root)).find((c) => c.name === name);

  await config({ workflow: { parallelItems: true } });
  assert.equal((await check(main, "configuration"))?.detail, "workflow.parallelItems needs a branch per item, which git.mode trunk never makes");
  await config({ workflow: { parallelItems: true }, git: { mode: "pull-request" } });
  assert.equal((await check(main, "configuration"))?.ok, true);

  git("init", "-q", "-b", "main");
  git("add", "-A");
  git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "base");
  assert.equal((await check(main, "git"))?.detail, "repository present");
  assert.equal((await check(main, "hooks"))?.detail, ".claude/settings.json is missing; a fresh install writes it");

  git("worktree", "add", "-q", "-b", "feature/x", linked);
  await fs.mkdir(path.join(linked, ".claude", "skills"), { recursive: true });
  assert.equal((await check(linked, "git"))?.detail, `linked worktree of ${main}`);
  assert.equal(
    (await check(linked, "hooks"))?.detail,
    `.claude/settings.json is missing in this linked worktree; copy the main checkout's from ${main}`
  );
});
