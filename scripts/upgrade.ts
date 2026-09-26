/**
 * Upgrading a project the last published release installed.
 *
 * The fixture is that release's tarball, byte for byte, and its own installer writes the
 * project, so the starting point is what users actually have rather than an imitation of
 * it. The project is then edited the way setup edits one, and updated by the current code.
 */

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SURFACE_RECORD } from "./surface-current.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = path.join(repoRoot, "packages", "create-religion");
const ENTRY_FILES = ["CLAUDE.md", "AGENTS.md"];
const PLANS = ["religion/project-plan.md", "religion/build-plan.md"];

export async function upgradeProblems(): Promise<string[]> {
  const { lastRelease } = JSON.parse(await fs.readFile(SURFACE_RECORD, "utf8")) as { lastRelease?: string };
  if (!lastRelease) return ["surface.json has no lastRelease"];
  const fixture = path.join(packageRoot, "fixtures", `create-religion-${lastRelease}.tgz`);
  if (!(await exists(fixture))) return [`no fixture for the last release at ${path.relative(repoRoot, fixture)}`];
  if (!(await exists(path.join(packageRoot, "template")))) return ["the template is not built; run npm run build first"];

  const root = await fs.mkdtemp(path.join(os.tmpdir(), "religion-upgrade-"));
  try {
    return await upgrade(root, fixture, lastRelease);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function upgrade(root: string, fixture: string, lastRelease: string): Promise<string[]> {
  const extracted = spawnSync("tar", ["-xzf", fixture, "-C", root], { encoding: "utf8" });
  if (extracted.status !== 0) return [`could not extract the fixture: ${extracted.stderr.trim()}`];

  const project = path.join(root, "project");
  await fs.mkdir(project);
  const installed = run(project, process.execPath, [path.join(root, "package", "dist", "bin", "religion.js"), "--yes"]);
  if (installed.status !== 0) return [`${lastRelease} failed to install: ${installed.output}`];

  await editAsSetupWould(project);
  const plans = await snapshot(project, PLANS);

  const tsx = path.join(repoRoot, "node_modules", ".bin", "tsx");
  const cli = path.join(packageRoot, "bin", "religion.ts");
  const updated = run(project, tsx, [cli, "update", "--yes"]);
  if (updated.status !== 0) return [`update from ${lastRelease} exited ${updated.status}: ${updated.output}`];

  const problems: string[] = [];
  for (const entry of ENTRY_FILES) {
    const text = await fs.readFile(path.join(project, entry), "utf8");
    const headings = text.split("\n").filter((line) => line.startsWith("## "));
    const repeated = headings.filter((heading, index) => headings.indexOf(heading) !== index);
    if (repeated.length > 0) problems.push(`${entry} repeats ${[...new Set(repeated)].join(", ")} after the update`);
    for (const kept of ["make test", "Ship on Fridays."]) {
      if (!text.includes(kept)) problems.push(`${entry} lost "${kept}" in the update`);
    }
  }

  const after = await snapshot(project, PLANS);
  for (const plan of PLANS) if (plans[plan] !== after[plan]) problems.push(`${plan} changed in the update`);

  const manifest = JSON.parse(await fs.readFile(path.join(project, "religion", ".state", "manifest.json"), "utf8")) as {
    version: string;
  };
  const { version } = JSON.parse(await fs.readFile(path.join(packageRoot, "package.json"), "utf8")) as { version: string };
  if (manifest.version !== version) problems.push(`the manifest records ${manifest.version}, not ${version}`);

  const first = await snapshot(project, await walk(project));
  const again = run(project, tsx, [cli, "update", "--yes"]);
  if (again.status !== 0) problems.push(`a second update exited ${again.status}: ${again.output}`);
  const second = await snapshot(project, await walk(project));
  const changed = Object.keys({ ...first, ...second }).filter((file) => first[file] !== second[file]);
  if (changed.length > 0) problems.push(`a second update changed ${changed.join(", ")}`);

  return problems;
}

/** Fill in Commands, add a section of the owner's own, and write the plans, as setup leaves them. */
async function editAsSetupWould(project: string): Promise<void> {
  for (const entry of ENTRY_FILES) {
    const file = path.join(project, entry);
    const text = await fs.readFile(file, "utf8");
    const filled = text.replace("<!-- religion:setup-required -->", "- Test: `make test`");
    await fs.writeFile(file, `${filled.replace(/\n+$/, "")}\n\n## Deploying\n\nShip on Fridays.\n`, "utf8");
  }
  await fs.writeFile(path.join(project, PLANS[0]!), "# Project Plan\n\nA fixture's own plan.\n", "utf8");
  await fs.writeFile(path.join(project, PLANS[1]!), "# Build Plan\n\n## Plan\n\n- [ ] 1. **First** - queued\n", "utf8");
}

function run(cwd: string, command: string, args: string[]): { status: number | null; output: string } {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
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
