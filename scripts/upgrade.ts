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
import { SURFACE_RECORD } from "./surface-current.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = path.join(repoRoot, "packages", "create-religion");
const templateRoot = path.join(packageRoot, "template");
const ENTRY_FILES = ["CLAUDE.md", "AGENTS.md"];
const OWNED = [
  "religion/project-plan.md",
  "religion/build-plan.md",
  "religion/context/coding-standards.md",
  "religion/config.json"
];
const INSTALL_CHECKS = ["required files", "configuration", "adapters", "entry file commands"];

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

  const project = path.join(root, "project");
  await fs.mkdir(project);
  const installed = run(root, project, process.execPath, [path.join(root, "package", "dist", "bin", "religion.js"), "--yes"]);
  if (installed.status !== 0) return [`${lastRelease} failed to install: ${installed.output}`];
  for (const entry of ENTRY_FILES) {
    if (!(await exists(path.join(project, entry)))) return [`${lastRelease} installed no ${entry}, so there is nothing to upgrade`];
  }

  await editAsSetupWould(project);
  const owned = await snapshot(project, OWNED);

  const tsx = path.join(repoRoot, "node_modules", ".bin", "tsx");
  const cli = path.join(packageRoot, "bin", "religion.ts");
  const updated = run(root, project, tsx, [cli, "update", "--yes"]);
  if (updated.status !== 0) return [`update from ${lastRelease} exited ${updated.status}: ${updated.output}`];

  const problems = [...(await templateProblems(project)), ...(await entryProblems(project))];

  const after = await snapshot(project, OWNED);
  for (const file of OWNED) if (owned[file] !== after[file]) problems.push(`${file} changed in the update`);

  for (const check of await runDoctor(project)) {
    if (INSTALL_CHECKS.includes(check.name) && !check.ok) problems.push(`doctor after the update: ${check.name}: ${check.detail}`);
  }

  const manifest = JSON.parse(await fs.readFile(path.join(project, "religion", ".state", "manifest.json"), "utf8")) as {
    version: string;
  };
  const { version } = JSON.parse(await fs.readFile(path.join(packageRoot, "package.json"), "utf8")) as { version: string };
  if (manifest.version !== version) problems.push(`the manifest records ${manifest.version}, not ${version}`);

  const first = await snapshot(project, await walk(project));
  const again = run(root, project, tsx, [cli, "update", "--yes"]);
  if (again.status !== 0) problems.push(`a second update exited ${again.status}: ${again.output}`);
  const second = await snapshot(project, await walk(project));
  const changed = Object.keys({ ...first, ...second }).filter((file) => first[file] !== second[file]);
  if (changed.length > 0) problems.push(`a second update changed ${changed.join(", ")}`);

  return problems;
}

/** Every file the template manages, other than the entry files, must now be the current one. */
async function templateProblems(project: string): Promise<string[]> {
  const managed = (await walk(templateRoot)).filter(
    (file) => !file.startsWith("religion/") && !ENTRY_FILES.includes(file)
  );
  const shipped = await snapshot(templateRoot, managed);
  const installed = await snapshot(project, managed);
  const stale = managed.filter((file) => shipped[file] !== installed[file]);
  return stale.length === 0
    ? []
    : [`${stale.length} managed file(s) are not the current template after the update, e.g. ${stale.slice(0, 3).join(", ")}`];
}

/** Each entry file keeps the owner's edits and holds every template heading exactly once. */
async function entryProblems(project: string): Promise<string[]> {
  const problems: string[] = [];
  for (const entry of ENTRY_FILES) {
    const text = await fs.readFile(path.join(project, entry), "utf8");
    const template = await fs.readFile(path.join(templateRoot, entry), "utf8");
    const headings = text.split("\n").filter((line) => line.startsWith("## "));
    for (const heading of template.split("\n").filter((line) => line.startsWith("## "))) {
      const count = headings.filter((line) => line === heading).length;
      if (count !== 1) problems.push(`${entry} has ${heading} ${count} time(s) after the update`);
    }
    for (const kept of ["make test", "Ship on Fridays."]) {
      if (!text.includes(kept)) problems.push(`${entry} lost "${kept}" in the update`);
    }
  }
  return problems;
}

/** Fill in Commands and the stack conventions, add a section and a setting, and write the plans. */
async function editAsSetupWould(project: string): Promise<void> {
  for (const entry of ENTRY_FILES) {
    const file = path.join(project, entry);
    const text = await fs.readFile(file, "utf8");
    const filled = text.replace("<!-- religion:setup-required -->", "- Test: `make test`");
    await fs.writeFile(file, `${filled.replace(/\n+$/, "")}\n\n## Deploying\n\nShip on Fridays.\n`, "utf8");
  }

  const standards = path.join(project, "religion", "context", "coding-standards.md");
  await fs.appendFile(standards, "\n- Use tabs.\n", "utf8");

  const configFile = path.join(project, "religion", "config.json");
  const config = JSON.parse(await fs.readFile(configFile, "utf8")) as { git?: Record<string, unknown> };
  config.git = { ...config.git, mode: "branch-per-item" };
  await fs.writeFile(configFile, JSON.stringify(config, null, 2) + "\n", "utf8");

  await fs.writeFile(path.join(project, OWNED[0]!), "# Project Plan\n\nA fixture's own plan.\n", "utf8");
  await fs.writeFile(path.join(project, OWNED[1]!), "# Build Plan\n\n## Plan\n\n- [ ] 1. **First** - queued\n", "utf8");
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
    timeout: 60_000
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
