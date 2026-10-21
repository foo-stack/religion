import { test } from "node:test";
import type { TestContext } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { HOOKS } from "./doctor.js";
import { applyInstall, planInstall, wireHooks, writeManifest } from "./install.js";
import { MANAGED_END, MANAGED_START } from "./merge.js";
import { planUninstall } from "./uninstall.js";

const SETTINGS_TEMPLATE = JSON.stringify(
  { hooks: Object.fromEntries(HOOKS.map((h) => [h.event, [{ hooks: [{ type: "command", command: h.command }] }]])) },
  null,
  2
);

/** A project installed the real way, from a small template, with its hooks wired. */
export async function installed(t: TestContext): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "religion-uninstall-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const template = path.join(root, "template");
  const target = path.join(root, "project");
  const files: Record<string, string> = {
    ".claude/skills/feature/SKILL.md": "feature\n",
    ".claude/skills/fix/SKILL.md": "fix\n",
    ".claude/skills/audit/SKILL.md": "audit\n",
    ".claude/hooks/guard-rendered-output.mjs": "guard\n",
    "CLAUDE.md": "# Project\n\n## Workflow\n\nw\n",
    "religion/config.json": "{}\n",
    "religion/build-plan.md": "## Plan\n",
    "religion/.state/settings-template.json": SETTINGS_TEMPLATE
  };
  for (const [relative, contents] of Object.entries(files)) await write(template, relative, contents);
  await fs.mkdir(target, { recursive: true });
  const plan = await planInstall(template, target, ["claude"], null);
  await applyInstall(template, target, plan, { force: false });
  await writeManifest(target, "1.2.0", ["claude"], template, null, []);
  await wireHooks(target);
  return target;
}

export async function write(root: string, relative: string, contents: string): Promise<void> {
  const file = path.join(root, relative);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, contents, "utf8");
}

const actions = async (target: string) => Object.fromEntries((await planUninstall(target)).map((e) => [e.relative, e.action]));

test("planUninstall removes what nobody edited and keeps what someone did", async (t) => {
  const target = await installed(t);
  await write(target, ".claude/skills/fix/SKILL.md", "edited by hand\n");
  await fs.rm(path.join(target, ".claude/skills/audit/SKILL.md"));
  await fs.symlink(path.join(target, "religion/config.json"), path.join(target, ".claude/skills/audit/SKILL.md"));

  assert.deepEqual(await actions(target), {
    ".claude/hooks/guard-rendered-output.mjs": "remove",
    ".claude/skills/audit/SKILL.md": "keep-linked",
    ".claude/skills/feature/SKILL.md": "remove",
    ".claude/skills/fix/SKILL.md": "keep-edited",
    "CLAUDE.md": "remove",
    ".claude/settings.json": "remove",
    "religion/.state/manifest.json": "remove-manifest"
  });
});

test("planUninstall cuts a marked entry file and keeps an edited unmarked one", async (t) => {
  const target = await installed(t);
  await write(target, "CLAUDE.md", `# Mine\n\nMy notes.\n\n${MANAGED_START}\nours\n${MANAGED_END}\n`);
  assert.equal((await actions(target))["CLAUDE.md"], "cut-block");

  await write(target, "CLAUDE.md", "# Project\n\n## Workflow\n\nw, edited\n");
  assert.equal((await actions(target))["CLAUDE.md"], "keep-entry");

  await write(target, "CLAUDE.md", `# Mine\n\n${MANAGED_END}\nours\n${MANAGED_START}\n`);
  assert.equal((await actions(target))["CLAUDE.md"], "keep-entry", "damaged markers");
});

test("planUninstall unwires settings that hold more than Religion's hooks, and keeps unreadable ones", async (t) => {
  const target = await installed(t);
  const settings = JSON.parse(SETTINGS_TEMPLATE);
  settings.permissions = { allow: ["Bash(npm test)"] };
  await write(target, ".claude/settings.json", JSON.stringify(settings));
  assert.equal((await actions(target))[".claude/settings.json"], "unwire");

  await write(target, ".claude/settings.json", "{ not json");
  assert.equal((await actions(target))[".claude/settings.json"], "keep-settings");

  await write(target, ".claude/settings.json", JSON.stringify({ permissions: {} }));
  assert.equal((await actions(target))[".claude/settings.json"], undefined, "nothing of Religion's in it");
});

test("planUninstall ignores a recorded path outside the trees, and plans nothing without an install record", async (t) => {
  const target = await installed(t);
  const manifestPath = path.join(target, "religion/.state/manifest.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  manifest.managed["religion/build-plan.md"] = manifest.managed[".claude/skills/feature/SKILL.md"];
  manifest.managed["../outside.md"] = "0000000000000000";
  await fs.writeFile(manifestPath, JSON.stringify(manifest));
  const planned = await actions(target);
  assert.equal(planned["religion/build-plan.md"], undefined);
  assert.equal(planned["../outside.md"], undefined);

  await fs.rm(manifestPath);
  assert.deepEqual(await planUninstall(target), []);
});
