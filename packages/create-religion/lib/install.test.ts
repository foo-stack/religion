import { test } from "node:test";
import type { TestContext } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { applyInstall, hash, planInstall, writeManifest } from "./install.js";
import type { Manifest, PlanEntry } from "./install.js";
import { MANAGED_END, MANAGED_START } from "./merge.js";

/**
 * A template and a target, built on disk under the system temp directory.
 *
 * planInstall reads real files, so the fixtures are real files. Faking the filesystem here
 * would test the fake.
 */
async function fixture(t: TestContext): Promise<{ template: string; target: string }> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "religion-install-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const template = path.join(root, "template");
  const target = path.join(root, "project");
  await fs.mkdir(template, { recursive: true });
  await fs.mkdir(target, { recursive: true });
  return { template, target };
}

async function write(root: string, relative: string, contents: string): Promise<void> {
  const file = path.join(root, relative);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, contents, "utf8");
}

function actionFor(plan: readonly PlanEntry[], relative: string): string | undefined {
  return plan.find((entry) => entry.relative === relative)?.action;
}

const ENTRY = "# Project Name\n\n@religion/context/a.md\n\n## Workflow\n\nw\n\n## Commands\n\n- Dev: `<command>`\n";

test("planInstall: a file the project does not have is created", async (t) => {
  const { template, target } = await fixture(t);
  await write(template, ".claude/skills/feature/SKILL.md", "skill\n");

  const plan = await planInstall(template, target, ["claude"], null);
  assert.equal(actionFor(plan, ".claude/skills/feature/SKILL.md"), "create");
});

test("planInstall: an identical file is unchanged", async (t) => {
  const { template, target } = await fixture(t);
  await write(template, ".claude/skills/feature/SKILL.md", "skill\n");
  await write(target, ".claude/skills/feature/SKILL.md", "skill\n");

  const plan = await planInstall(template, target, ["claude"], null);
  assert.equal(actionFor(plan, ".claude/skills/feature/SKILL.md"), "unchanged");
});

test("planInstall: a state file that already exists is never rewritten", async (t) => {
  // Seed-once is what stops an update destroying a project's real plans.
  const { template, target } = await fixture(t);
  await write(template, "religion/project-plan.md", "# Project Plan\n\nplaceholder\n");
  await write(target, "religion/project-plan.md", "# Project Plan\n\nreal work nobody wants lost\n");

  const plan = await planInstall(template, target, ["claude"], null);
  assert.equal(actionFor(plan, "religion/project-plan.md"), "seed-skip");
});

test("planInstall: a managed file still matching the manifest is updated", async (t) => {
  const { template, target } = await fixture(t);
  await write(template, ".claude/skills/feature/SKILL.md", "new skill\n");
  await write(target, ".claude/skills/feature/SKILL.md", "old skill\n");

  const previous: Manifest = {
    schemaVersion: 1,
    version: "0.0.0",
    adapters: ["claude"],
    managed: { ".claude/skills/feature/SKILL.md": hash("old skill\n") }
  };

  const plan = await planInstall(template, target, ["claude"], previous);
  assert.equal(actionFor(plan, ".claude/skills/feature/SKILL.md"), "update");
});

test("planInstall: a locally edited managed file is a conflict", async (t) => {
  const { template, target } = await fixture(t);
  await write(template, ".claude/skills/feature/SKILL.md", "new skill\n");
  await write(target, ".claude/skills/feature/SKILL.md", "edited by hand\n");

  const previous: Manifest = {
    schemaVersion: 1,
    version: "0.0.0",
    adapters: ["claude"],
    managed: { ".claude/skills/feature/SKILL.md": hash("what shipped\n") }
  };

  const plan = await planInstall(template, target, ["claude"], previous);
  assert.equal(actionFor(plan, ".claude/skills/feature/SKILL.md"), "conflict");
});

test("planInstall: an existing entry file is offered as a merge, not a conflict", async (t) => {
  const { template, target } = await fixture(t);
  await write(template, "CLAUDE.md", ENTRY);
  await write(target, "CLAUDE.md", "# Acme\n\nmy own instructions\n");

  const plan = await planInstall(template, target, ["claude"], null);
  assert.equal(actionFor(plan, "CLAUDE.md"), "merge");
});

test("planInstall: an already merged entry file is remerged", async (t) => {
  const { template, target } = await fixture(t);
  await write(template, "CLAUDE.md", ENTRY);
  await write(target, "CLAUDE.md", `# Acme\n\nmine\n\n${MANAGED_START}\nold block\n${MANAGED_END}\n`);

  const plan = await planInstall(template, target, ["claude"], null);
  assert.equal(actionFor(plan, "CLAUDE.md"), "remerge");
});

test("planInstall: an entry file with a damaged marker pair is a conflict", async (t) => {
  // Splicing it would add a second block to a file that already has one, which is worse
  // than the damage being reacted to.
  const { template, target } = await fixture(t);
  await write(template, "CLAUDE.md", ENTRY);
  await write(target, "CLAUDE.md", `# Acme\n\nmine\n\n${MANAGED_START}\nno end marker\n`);

  const plan = await planInstall(template, target, ["claude"], null);
  assert.equal(actionFor(plan, "CLAUDE.md"), "conflict");
});

test("planInstall: files for adapters that were not chosen are skipped entirely", async (t) => {
  const { template, target } = await fixture(t);
  await write(template, ".claude/skills/feature/SKILL.md", "skill\n");
  await write(template, ".agents/skills/feature/SKILL.md", "skill\n");

  const plan = await planInstall(template, target, ["claude"], null);
  assert.equal(actionFor(plan, ".agents/skills/feature/SKILL.md"), undefined);
  assert.equal(plan.length, 1);
});

test("applyInstall: a conflict is left alone unless forced", async (t) => {
  const { template, target } = await fixture(t);
  await write(template, ".claude/skills/feature/SKILL.md", "new skill\n");
  await write(target, ".claude/skills/feature/SKILL.md", "edited by hand\n");

  const previous: Manifest = {
    schemaVersion: 1,
    version: "0.0.0",
    adapters: ["claude"],
    managed: { ".claude/skills/feature/SKILL.md": hash("what shipped\n") }
  };

  const plan = await planInstall(template, target, ["claude"], previous);
  const result = await applyInstall(template, target, plan, { force: false });

  assert.deepEqual(result.conflicts, [".claude/skills/feature/SKILL.md"]);
  assert.deepEqual(result.written, []);
  const onDisk = await fs.readFile(path.join(target, ".claude/skills/feature/SKILL.md"), "utf8");
  assert.equal(onDisk, "edited by hand\n", "their edit survives untouched");
});

test("applyInstall: forcing a conflict backs the original up first", async (t) => {
  const { template, target } = await fixture(t);
  await write(template, ".claude/skills/feature/SKILL.md", "new skill\n");
  await write(target, ".claude/skills/feature/SKILL.md", "edited by hand\n");

  const previous: Manifest = {
    schemaVersion: 1,
    version: "0.0.0",
    adapters: ["claude"],
    managed: { ".claude/skills/feature/SKILL.md": hash("what shipped\n") }
  };

  const plan = await planInstall(template, target, ["claude"], previous);
  const result = await applyInstall(template, target, plan, { force: true });

  assert.deepEqual(result.backups, [".claude/skills/feature/SKILL.md"]);
  const backup = await fs.readFile(
    path.join(target, "religion", ".state", "backups", ".claude/skills/feature/SKILL.md"),
    "utf8"
  );
  assert.equal(backup, "edited by hand\n", "the backup is what was there before");
  const onDisk = await fs.readFile(path.join(target, ".claude/skills/feature/SKILL.md"), "utf8");
  assert.equal(onDisk, "new skill\n", "and the template replaced it");
});

test("writeManifest: a skipped conflict keeps the hash of what was installed", async (t) => {
  // Recording the working copy instead would write the user's edit into the manifest as
  // though Religion had shipped it, so the next update would see no difference and
  // overwrite it. The protection would appear to work, once.
  const { template, target } = await fixture(t);
  const relative = ".claude/skills/feature/SKILL.md";
  await write(template, relative, "new skill\n");
  await write(target, relative, "edited by hand\n");

  const shipped = hash("what shipped\n");
  const previous: Manifest = { schemaVersion: 1, version: "0.0.0", adapters: ["claude"], managed: { [relative]: shipped } };

  await writeManifest(target, "1.0.0", ["claude"], template, previous, [relative]);

  const written = JSON.parse(
    await fs.readFile(path.join(target, "religion", ".state", "manifest.json"), "utf8")
  ) as Manifest;
  assert.equal(written.managed[relative], shipped, "the previous entry is preserved");
  assert.notEqual(written.managed[relative], hash("edited by hand\n"), "not the local edit");
});

test("a local edit survives three consecutive updates", async (t) => {
  // The regression this whole mechanism exists to prevent. Doing it once proves nothing:
  // the original defect passed a single update and failed on the second.
  const { template, target } = await fixture(t);
  const relative = ".claude/skills/feature/SKILL.md";

  await write(template, relative, "version one\n");
  let manifest: Manifest | null = null;

  // Install cleanly, so the manifest records what shipped.
  let plan = await planInstall(template, target, ["claude"], manifest);
  await applyInstall(template, target, plan, { force: false });
  await writeManifest(target, "1.0.0", ["claude"], template, manifest, []);
  manifest = JSON.parse(
    await fs.readFile(path.join(target, "religion", ".state", "manifest.json"), "utf8")
  ) as Manifest;

  // The user edits the installed file.
  await write(target, relative, "MINE\n");

  for (let round = 1; round <= 3; round += 1) {
    await write(template, relative, `version ${round + 1}\n`);
    plan = await planInstall(template, target, ["claude"], manifest);
    const result = await applyInstall(template, target, plan, { force: false });

    assert.deepEqual(result.conflicts, [relative], `round ${round}: still reported as a conflict`);
    const onDisk = await fs.readFile(path.join(target, relative), "utf8");
    assert.equal(onDisk, "MINE\n", `round ${round}: their edit is still there`);

    await writeManifest(target, "1.0.0", ["claude"], template, manifest, result.conflicts);
    manifest = JSON.parse(
      await fs.readFile(path.join(target, "religion", ".state", "manifest.json"), "utf8")
    ) as Manifest;
  }
});
