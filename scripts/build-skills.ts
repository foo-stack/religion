/**
 * Renders the authored sources into every adapter tree.
 *
 * Skills live once at `src/skills/<name>/SKILL.md`, with optional supporting files
 * under `src/skills/<name>/reference/`. Entry files live at `src/entry/`, sharing prose
 * through `src/entry/partials/`. This script renders both per adapter and writes the
 * result to `template/`, which the installer ships.
 *
 * Modes:
 *   (default)  write template/
 *   --link     also write the repo's own .claude/ and .agents/ trees, so this repo
 *              runs the workflow it defines
 *   --check    render and compare without writing; non-zero exit on drift. Checks
 *              template/ plus any repo tree that already exists, so a linked tree
 *              cannot drift unnoticed.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SHARED, TREES, render } from "../src/lib/adapters.js";
import type { RenderContext, Tree } from "../src/lib/adapters.js";
import { readSkills } from "../src/lib/skills.js";
import type { Skill } from "../src/lib/skills.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillsRoot = path.join(repoRoot, "src", "skills");
const entryRoot = path.join(repoRoot, "src", "entry");
const stateRoot = path.join(repoRoot, "src", "state");
const partialsRoot = path.join(entryRoot, "partials");
const templateRoot = path.join(repoRoot, "template");

interface Options {
  check: boolean;
  link: boolean;
}

interface RenderedFile {
  /** Absolute destination path. */
  target: string;
  contents: string;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const skills = await readSkills(skillsRoot);
  const partials = await readPartials();

  // A check must cover every tree that exists, not only the ones it would write.
  // Otherwise a stale linked tree in this repo passes CI unnoticed.
  const roots = options.check
    ? [templateRoot, ...((await hasLinkedOutput()) ? [repoRoot] : [])]
    : [templateRoot, ...(options.link ? [repoRoot] : [])];
  const files: RenderedFile[] = [];

  for (const skill of skills) {
    for (const tree of TREES) {
      for (const root of roots) {
        files.push(...(await renderSkill(skill.name, tree, root)));
      }
    }
  }

  for (const tree of TREES) {
    for (const root of roots) {
      const entry = await renderEntry(tree, root, skills, partials);
      if (entry) files.push(entry);
    }
  }

  // State files are rendered once, not per tree: a project has one state directory
  // regardless of how many adapters it installed.
  //
  // They are also *seeded*, not maintained. Once a project starts using them the plans,
  // specs, ledger, and handoff hold real work, so re-rendering would destroy it and
  // drift-checking would flag every real edit. Only `template/` carries the pristine copy;
  // a state file already present anywhere else is left exactly as it is.
  for (const root of roots) {
    const seedOnly = root !== templateRoot;
    for (const file of await renderState(root)) {
      if (seedOnly && (await exists(file.target))) continue;
      files.push(file);
    }
  }

  if (files.length === 0) {
    console.log("Nothing to render: src/skills and src/entry are both empty.");
    return;
  }

  if (options.check) {
    const drifted = await findDrift(files);
    if (drifted.length > 0) {
      console.error(`Rendered output is stale for ${drifted.length} file(s):`);
      for (const file of drifted) console.error(`  ${path.relative(repoRoot, file)}`);
      console.error("\nRun `npm run build:skills` to regenerate.");
      process.exitCode = 1;
      return;
    }
    console.log(`In sync: ${files.length} file(s) across ${skills.length} skill(s).`);
    return;
  }

  for (const file of files) {
    await fs.mkdir(path.dirname(file.target), { recursive: true });
    await fs.writeFile(file.target, file.contents, "utf8");
  }

  const scope = options.link ? "template + repo" : "template";
  console.log(`Rendered ${files.length} file(s) from ${skills.length} skill(s), ${TREES.length} entry file(s), and the state templates (${scope}).`);
}

/** Renders the state file templates into `<root>/religion/`. */
async function renderState(root: string): Promise<RenderedFile[]> {
  const out: RenderedFile[] = [];

  for (const relative of await walkIfPresent(stateRoot)) {
    const source = await fs.readFile(path.join(stateRoot, relative), "utf8");
    try {
      out.push({
        target: path.join(root, SHARED.dir, relative),
        contents: render(source, { tree: SHARED, skill: "" })
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`src/state/${relative}: ${reason}`);
    }
  }

  return out;
}

/**
 * Renders one tree's entry file. Each tree names its own source, so Claude Code's entry
 * can rely on auto-discovered skills while the shared file spells the roster out.
 */
async function renderEntry(
  tree: Tree,
  root: string,
  skills: readonly Skill[],
  partials: ReadonlyMap<string, string>
): Promise<RenderedFile | null> {
  const source = await readIfPresent(path.join(entryRoot, tree.entryFile));
  if (source === null) return null;

  const ctx: RenderContext = {
    tree,
    skill: "",
    include: (name) => {
      const partial = partials.get(name);
      if (partial === undefined) {
        throw new Error(`unknown partial "${name}"; expected src/entry/partials/${name}.md`);
      }
      return partial;
    },
    roster: () => rosterFor(skills)
  };

  try {
    return { target: path.join(root, tree.entryFile), contents: render(source, ctx) };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`src/entry/${tree.entryFile}: ${reason}`);
  }
}

/**
 * The skill roster, derived from the authored sources so it cannot drift from the skills
 * that actually exist. Hand-maintained rosters go stale the first time a skill is renamed.
 */
function rosterFor(skills: readonly Skill[]): string {
  if (skills.length === 0) return "_No skills authored yet._";
  const width = Math.max(...skills.map((skill) => skill.name.length));
  return skills
    .map((skill) => `- \`${skill.name}\`${" ".repeat(width - skill.name.length)} - ${skill.summary}`)
    .join("\n");
}

async function exists(file: string): Promise<boolean> {
  try {
    await fs.stat(file);
    return true;
  } catch {
    return false;
  }
}

async function walkIfPresent(dir: string): Promise<string[]> {
  try {
    await fs.stat(dir);
  } catch {
    return [];
  }
  return walk(dir);
}

async function readPartials(): Promise<Map<string, string>> {
  const partials = new Map<string, string>();
  let entries;
  try {
    entries = await fs.readdir(partialsRoot, { withFileTypes: true });
  } catch {
    return partials;
  }
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const name = entry.name.replace(/\.md$/, "");
    partials.set(name, await fs.readFile(path.join(partialsRoot, entry.name), "utf8"));
  }
  return partials;
}

async function readIfPresent(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, "utf8");
  } catch {
    return null;
  }
}

async function renderSkill(skill: string, tree: Tree, root: string): Promise<RenderedFile[]> {
  const sourceDir = path.join(skillsRoot, skill);
  const targetDir = path.join(root, tree.dir, skill);
  const out: RenderedFile[] = [];

  for (const relative of await walk(sourceDir)) {
    const source = await fs.readFile(path.join(sourceDir, relative), "utf8");
    const isText = /\.(md|txt|json|ya?ml|css)$/.test(relative);
    let contents = source;

    if (isText) {
      try {
        contents = render(source, { tree, skill });
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`${skill}/${relative}: ${reason}`);
      }
    }

    out.push({ target: path.join(targetDir, relative), contents });
  }

  return out;
}

async function findDrift(files: readonly RenderedFile[]): Promise<string[]> {
  const drifted: string[] = [];
  for (const file of files) {
    let current: string | null = null;
    try {
      current = await fs.readFile(file.target, "utf8");
    } catch {
      current = null;
    }
    if (current !== file.contents) drifted.push(file.target);
  }
  return drifted;
}

/**
 * True when this repo carries rendered output of its own, from a prior `--link`.
 *
 * Checks every kind of rendered output, not just the skill trees: before any skill is
 * authored those directories do not exist, and a check that looked only for them would
 * report "in sync" without having inspected the entry files or state templates at all.
 */
async function hasLinkedOutput(): Promise<boolean> {
  const candidates = [
    ...TREES.map((tree) => tree.dir),
    ...TREES.map((tree) => tree.entryFile),
    SHARED.dir
  ];

  for (const candidate of candidates) {
    try {
      await fs.stat(path.join(repoRoot, candidate));
      return true;
    } catch {
      // absent, keep looking
    }
  }
  return false;
}

/** Directories that are never part of a rendered tree, whatever they contain. */
const SKIP = new Set([".git", ".DS_Store", "node_modules"]);

/**
 * Every file under `dir`, as paths relative to it.
 *
 * Dot-entries are included. The state templates ship a `.state/` directory holding the
 * settings template, and skipping every dot-entry silently dropped it: the files existed in
 * source, rendered without error, and were simply absent from every install.
 */
async function walk(dir: string, prefix = ""): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out: string[] = [];

  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(path.join(dir, entry.name), relative)));
    } else {
      out.push(relative);
    }
  }

  return out.sort();
}

function parseArgs(args: readonly string[]): Options {
  const options: Options = { check: false, link: false };
  for (const arg of args) {
    if (arg === "--check") options.check = true;
    else if (arg === "--link") options.link = true;
    else throw new Error(`unknown argument: ${arg}`);
  }
  return options;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
