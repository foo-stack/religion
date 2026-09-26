/**
 * Upgrading a project the last published release installed.
 *
 * The fixture is that release's tarball, byte for byte, and its own installer writes the
 * project, so the starting point is what users actually have rather than an imitation of
 * it. The project is then edited the way setup edits one, and updated by the current code.
 * The update has to prove it did something: afterwards the project must hold the current
 * template, not merely still hold what setup wrote.
 */

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runDoctor } from "../packages/create-religion/lib/doctor.js";
import { hash } from "../packages/create-religion/lib/install.js";
import { MANAGED_END, MANAGED_START } from "../packages/create-religion/lib/merge.js";
import { SURFACE_RECORD } from "./surface-current.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = path.join(repoRoot, "packages", "create-religion");
const templateRoot = path.join(packageRoot, "template");
const ENTRY_FILES = ["CLAUDE.md", "AGENTS.md"];
const INSTALL_CHECKS = ["required files", "configuration", "adapters", "entry file commands"];
const TREES = [".claude/skills", ".claude/hooks", ".agents/skills"];
const RETIRED = [".claude/skills/try/SKILL.md", ".agents/skills/try/SKILL.md"];
const ADDED = [".claude/skills/upgrade-check/SKILL.md", ".agents/skills/upgrade-check/SKILL.md"];
/** Suffixed so it is no newer than the running version, yet never the release's own. */
const SENTINEL_SUFFIX = "-upgrade-check";

/** A published version, strictly: npm reads anything looser, such as an underscore, as a tag. */
export const VERSION = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

export async function upgradeProblems(): Promise<string[]> {
  const record = JSON.parse(await fs.readFile(SURFACE_RECORD, "utf8")) as {
    lastRelease?: string;
    lastReleaseIntegrity?: string;
  };
  const { lastRelease, lastReleaseIntegrity } = record;
  if (!lastRelease || !VERSION.test(lastRelease)) return [`surface.json: lastRelease ${lastRelease} is not a version`];

  const fixture = path.join(packageRoot, "fixtures", `create-religion-${lastRelease}.tgz`);
  const bytes = await fs.readFile(fixture).catch(() => null);
  if (!bytes) return [`no fixture for the last release at ${path.relative(repoRoot, fixture)}`];

  // The fixture is executed, so it must be exactly what the registry published.
  const integrity = `sha512-${crypto.createHash("sha512").update(bytes).digest("base64")}`;
  if (integrity !== lastReleaseIntegrity) {
    return [`the fixture's integrity ${integrity} is not the recorded ${lastReleaseIntegrity}; refusing to run it`];
  }
  if (!(await exists(templateRoot))) return ["the template is not built; run npm run build first"];

  const root = await fs.mkdtemp(path.join(os.tmpdir(), "religion-upgrade-"));
  try {
    return await upgrade(root, fixture, lastRelease);
  } catch (error) {
    return [`the upgrade could not be checked: ${error instanceof Error ? error.message : String(error)}`];
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function upgrade(root: string, fixture: string, lastRelease: string): Promise<string[]> {
  const extracted = run(root, root, "tar", ["-xzf", fixture, "-C", root]);
  if (extracted.status !== 0) return [`could not extract the fixture: ${extracted.output}`];
  const packed = JSON.parse(await fs.readFile(path.join(root, "package", "package.json"), "utf8")) as { version?: string };
  if (packed.version !== lastRelease) return [`the fixture holds ${packed.version}, not ${lastRelease}`];

  const project = path.join(root, "project");
  await fs.mkdir(project);
  const installed = run(root, project, process.execPath, [path.join(root, "package", "dist", "bin", "religion.js"), "--yes"]);
  if (installed.status !== 0) return [`${lastRelease} failed to install: ${installed.output}`];
  for (const entry of ENTRY_FILES) {
    if (!(await exists(path.join(project, entry)))) return [`${lastRelease} installed no ${entry}, so there is nothing to upgrade`];
  }

  await editAsSetupWould(project);
  const entries = Object.fromEntries(
    await Promise.all(ENTRY_FILES.map(async (entry) => [entry, await fs.readFile(path.join(project, entry), "utf8")]))
  );
  const state = await snapshot(project, await stateFiles(project));

  // The update runs against a copy of the current tool whose template differs from the
  // release in every managed file, adds a skill and retires one, so it always has real work
  // to do, however little the template changed since the last release.
  const { current, version } = await perturbedCopy(root);
  const tsx = path.join(repoRoot, "node_modules", ".bin", "tsx");
  const cli = path.join(current, "bin", "religion.ts");
  const updated = run(root, project, tsx, [cli, "update", "--yes"]);
  if (updated.status !== 0) return [`update from ${lastRelease} exited ${updated.status}: ${updated.output}`];

  const template = path.join(current, "template");
  const problems = [
    ...(await templateProblems(project, template)),
    ...(await entryProblems(project, template, entries)),
    ...(await manifestProblems(project, template, version))
  ];

  const after = await snapshot(project, await stateFiles(project));
  const changed = Object.keys({ ...state, ...after }).filter((file) => state[file] !== after[file]);
  if (changed.length > 0) problems.push(`the update changed the project's own files: ${changed.join(", ")}`);

  const checks = await runDoctor(project);
  for (const name of INSTALL_CHECKS) {
    const found = checks.filter((check) => check.name === name);
    if (found.length === 0) problems.push(`doctor has no check named "${name}" to confirm the install with`);
    for (const check of found) if (!check.ok) problems.push(`doctor after the update: ${name}: ${check.detail}`);
  }

  const first = await snapshot(project, await walk(project));
  const again = run(root, project, tsx, [cli, "update", "--yes"]);
  if (again.status !== 0) problems.push(`a second update exited ${again.status}: ${again.output}`);
  const second = await snapshot(project, await walk(project));
  const moved = Object.keys({ ...first, ...second }).filter((file) => first[file] !== second[file]);
  if (moved.length > 0) problems.push(`a second update changed ${moved.join(", ")}`);

  return problems;
}

/** A copy of the current tool whose template gives the update something to do in every file. */
async function perturbedCopy(root: string): Promise<{ current: string; version: string }> {
  const current = path.join(root, "current");
  for (const part of ["bin", "lib", "template"]) {
    await fs.cp(path.join(packageRoot, part), path.join(current, part), { recursive: true });
  }
  const manifest = JSON.parse(await fs.readFile(path.join(packageRoot, "package.json"), "utf8")) as Record<string, unknown>;
  const version = `${String(manifest.version)}${SENTINEL_SUFFIX}`;
  await fs.writeFile(path.join(current, "package.json"), JSON.stringify({ ...manifest, version }), "utf8");

  const template = path.join(current, "template");
  for (const file of await walk(template)) {
    if (file.startsWith("religion/")) continue;
    const target = path.join(template, file);
    if (ENTRY_FILES.includes(file)) {
      const text = await fs.readFile(target, "utf8");
      await fs.writeFile(target, text.replace("\n## Workflow\n", "\n## Workflow\n\nChanged since the last release.\n"), "utf8");
    } else {
      await fs.appendFile(target, "\n<!-- changed since the last release -->\n", "utf8");
    }
  }
  for (const file of RETIRED) await fs.rm(path.join(template, file));
  for (const file of ADDED) {
    await fs.mkdir(path.dirname(path.join(template, file)), { recursive: true });
    await fs.writeFile(path.join(template, file), "---\nname: upgrade-check\n---\n", "utf8");
  }
  return { current, version };
}

/** Every managed file is the template's, and nothing the template no longer ships is left behind. */
async function templateProblems(project: string, template: string): Promise<string[]> {
  const shipped = (await walk(template)).filter((file) => TREES.some((tree) => file.startsWith(`${tree}/`)));
  const expected = await snapshot(template, shipped);
  const actual = await snapshot(project, shipped);
  const stale = shipped.filter((file) => expected[file] !== actual[file]);

  const onDisk = (await walk(project)).filter((file) => TREES.some((tree) => file.startsWith(`${tree}/`)));
  const leftover = onDisk.filter((file) => !shipped.includes(file));

  return [
    ...(stale.length > 0 ? [`${stale.length} managed file(s) are not the current template, e.g. ${stale.slice(0, 3).join(", ")}`] : []),
    ...(leftover.length > 0 ? [`files the template no longer ships were left behind: ${leftover.join(", ")}`] : [])
  ];
}

/** Each entry file holds the current managed block exactly, and everything its owner wrote. */
async function entryProblems(project: string, template: string, before: Record<string, string>): Promise<string[]> {
  const problems: string[] = [];
  for (const entry of ENTRY_FILES) {
    const text = await fs.readFile(path.join(project, entry), "utf8");
    const shipped = await fs.readFile(path.join(template, entry), "utf8");

    // Expected from the template's own text, never from the code under test, which would
    // otherwise agree with itself however it was broken.
    const start = text.indexOf(MANAGED_START);
    const end = text.indexOf(MANAGED_END);
    const block = start >= 0 && end > start ? text.slice(start, end) : "";
    if (!block) problems.push(`${entry} has no managed block`);
    for (const line of shipped.split("\n").filter((line) => line.startsWith("@"))) {
      if (!block.split("\n").includes(line)) problems.push(`${entry} lost the import ${line}`);
    }
    for (const section of managedSections(shipped)) {
      if (!block.includes(section)) problems.push(`${entry} does not hold the current ${section.split("\n")[0]} section`);
    }

    const headings = text.split("\n").filter((line) => line.startsWith("## "));
    for (const heading of new Set([...shipped.split("\n").filter((line) => line.startsWith("## ")), "## Deploying"])) {
      const count = headings.filter((line) => line === heading).length;
      if (count !== 1) problems.push(`${entry} has ${heading} ${count} time(s)`);
    }
    for (const kept of ["# Upgrade Fixture\n", "Owned text about this project.", "make test", "Ship on Fridays."]) {
      if (!text.includes(kept)) problems.push(`${entry} lost "${kept.trim()}" in the update`);
    }

    const backup = await fs.readFile(path.join(project, "religion", ".state", "backups", entry), "utf8").catch(() => null);
    if (backup !== before[entry]) problems.push(`${entry} was rebuilt without its original backed up`);
  }
  return problems;
}

/** Each section of an entry template that Religion manages, as its exact text. */
function managedSections(template: string): string[] {
  return template
    .split(/^(?=## )/m)
    .filter((part) => part.startsWith("## ") && !/^## (What this is|Commands)\s*$/m.test(part.split("\n")[0]!))
    .map((part) => part.replace(/\s+$/, ""));
}

/** The manifest records the new version, every adapter, and exactly the template's hashes. */
async function manifestProblems(project: string, template: string, version: string): Promise<string[]> {
  const manifest = JSON.parse(await fs.readFile(path.join(project, "religion", ".state", "manifest.json"), "utf8")) as {
    version?: string;
    adapters?: string[];
    managed?: Record<string, string>;
  };
  const problems: string[] = [];
  if (manifest.version !== version) problems.push(`the manifest records ${manifest.version}, not the running ${version}`);
  if ([...(manifest.adapters ?? [])].sort().join() !== "claude,codex,copilot,opencode") {
    problems.push(`the manifest records adapters ${manifest.adapters?.join(", ")}`);
  }

  const expected: Record<string, string> = {};
  for (const file of await walk(template)) {
    if (!file.startsWith("religion/")) expected[file] = hash(await fs.readFile(path.join(template, file)));
  }
  const recorded = manifest.managed ?? {};
  const wrong = Object.keys({ ...expected, ...recorded }).filter((file) => expected[file] !== recorded[file]);
  if (wrong.length > 0) problems.push(`the manifest's record differs from the template for ${wrong.slice(0, 3).join(", ")}`);
  return problems;
}

/** The project's own files: everything under the state directory except the tool's machine state. */
async function stateFiles(project: string): Promise<string[]> {
  return (await walk(path.join(project, "religion"))).filter((file) => !file.startsWith(".state/")).map((file) => `religion/${file}`);
}

/** Fill in Commands and the stack conventions, add a section and a setting, and write the plans. */
async function editAsSetupWould(project: string): Promise<void> {
  for (const entry of ENTRY_FILES) {
    const file = path.join(project, entry);
    const text = await fs.readFile(file, "utf8");
    const filled = text
      .replace(/^# .*$/m, "# Upgrade Fixture")
      .replace("\n## What this is\n", "\n## What this is\n\nOwned text about this project.\n")
      .replace("<!-- religion:setup-required -->", "- Test: `make test`");
    await fs.writeFile(file, `${filled.replace(/\n+$/, "")}\n\n## Deploying\n\nShip on Fridays.\n`, "utf8");
  }

  const standards = path.join(project, "religion", "context", "coding-standards.md");
  await fs.appendFile(standards, "\n- Use tabs.\n", "utf8");

  const configFile = path.join(project, "religion", "config.json");
  const config = JSON.parse(await fs.readFile(configFile, "utf8")) as { git?: Record<string, unknown> };
  config.git = { ...config.git, mode: "branch-per-item" };
  await fs.writeFile(configFile, JSON.stringify(config, null, 2) + "\n", "utf8");

  // Every file the project owns carries an edit, so an update that overwrote any of them,
  // even with identical template text, is caught.
  for (const file of await stateFiles(project)) {
    if (file.endsWith(".md")) await fs.appendFile(path.join(project, file), "\n<!-- the project's own edit -->\n", "utf8");
  }
  await fs.writeFile(path.join(project, "religion", "project-plan.md"), "# Project Plan\n\nA fixture's own plan.\n", "utf8");
  await fs.writeFile(path.join(project, "religion", "build-plan.md"), "# Build Plan\n\n## Plan\n\n- [ ] 1. **First** - queued\n", "utf8");
}

/**
 * Run a command with only what it needs: a path to find its tools, a home and temp inside
 * the scratch directory, and a time limit. The release under test is executed code, and
 * nothing else in the environment is its business.
 */
function run(root: string, cwd: string, command: string, args: string[]): { status: number | null; output: string } {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { PATH: process.env.PATH ?? "", HOME: root, TMPDIR: root },
    timeout: 60_000,
    killSignal: "SIGKILL"
  });
  if (result.error) return { status: null, output: result.error.message };
  return { status: result.status, output: `${result.stdout}${result.stderr}`.trim().split("\n").slice(-3).join(" | ") };
}

async function snapshot(root: string, files: readonly string[]): Promise<Record<string, string>> {
  const hashes: Record<string, string> = {};
  for (const file of files) {
    const contents = await fs.readFile(path.join(root, file)).catch(() => null);
    hashes[file] = contents ? crypto.createHash("sha256").update(contents).digest("hex") : "missing";
  }
  return hashes;
}

async function walk(dir: string, prefix = ""): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await fs.readdir(path.join(dir, prefix), { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...(await walk(dir, relative)));
    else files.push(relative);
  }
  return files;
}

async function exists(file: string): Promise<boolean> {
  return fs.access(file).then(
    () => true,
    () => false
  );
}
