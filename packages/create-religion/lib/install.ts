/**
 * Installing and updating the workflow files.
 *
 * The rule that shapes all of this: files the project owns are seeded once and never
 * touched again, while files the workflow owns are managed and can be updated. Getting
 * that backwards destroys someone's plans on an update, so the two sets are kept explicit
 * rather than inferred from paths at the point of use.
 */

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { exists, STATE_DIR } from "./paths.js";
import { hasDamagedMarkers, hasMarkers, replaceManagedBlock, spliceEntry } from "./merge.js";

export type Adapter = "claude" | "codex" | "copilot" | "opencode";

export const ADAPTERS: Record<Adapter, { label: string; trees: string[]; entry: string[] }> = {
  claude: { label: "Claude Code", trees: [".claude/skills", ".claude/hooks"], entry: ["CLAUDE.md"] },
  codex: { label: "Codex", trees: [".agents/skills"], entry: ["AGENTS.md"] },
  copilot: { label: "GitHub Copilot", trees: [".agents/skills"], entry: ["AGENTS.md"] },
  opencode: { label: "OpenCode", trees: [".agents/skills"], entry: ["AGENTS.md"] }
};

export interface Manifest {
  schemaVersion: 1;
  version: string;
  adapters: Adapter[];
  managed: Record<string, string>;
}

export interface PlanEntry {
  relative: string;
  action: "create" | "update" | "seed-skip" | "conflict" | "unchanged" | "merge" | "remerge";
}

const MANIFEST = path.join(STATE_DIR, ".state", "manifest.json");

export function hash(contents: Buffer | string): string {
  return crypto.createHash("sha256").update(contents).digest("hex").slice(0, 16);
}

/** Managed files are the workflow's own; everything under the state directory is the project's. */
export function isManaged(relative: string): boolean {
  return !relative.startsWith(`${STATE_DIR}/`);
}

/** The entry files for the chosen adapters, which are the only files merging applies to. */
function entryFiles(adapters: readonly Adapter[]): Set<string> {
  return new Set(adapters.flatMap((a) => ADAPTERS[a].entry));
}

export async function planInstall(
  templateRoot: string,
  target: string,
  adapters: readonly Adapter[],
  previous: Manifest | null
): Promise<PlanEntry[]> {
  const wanted = wantedPaths(adapters);
  const entries = entryFiles(adapters);
  const plan: PlanEntry[] = [];

  for (const relative of await walk(templateRoot)) {
    if (!wanted(relative)) continue;

    const destination = path.join(target, relative);
    const source = await fs.readFile(path.join(templateRoot, relative));

    if (!(await exists(destination))) {
      plan.push({ relative, action: "create" });
      continue;
    }

    // State files hold the project's real work. Once present they are never rewritten.
    if (!isManaged(relative)) {
      plan.push({ relative, action: "seed-skip" });
      continue;
    }

    const current = await fs.readFile(destination);
    if (hash(current) === hash(source)) {
      plan.push({ relative, action: "unchanged" });
      continue;
    }

    // A managed file that differs is only safe to replace when it still matches what was
    // installed. Anything else is a local edit, and overwriting it silently is the failure
    // this manifest exists to prevent.
    const recorded = previous?.managed[relative];
    if (recorded && recorded === hash(current)) {
      plan.push({ relative, action: "update" });
      continue;
    }

    // An entry file is the one place where "differs from the template" is the normal case
    // rather than a problem: a repository that already tells agents how to work has one, and
    // it is usually the most carefully written file in the project.
    if (entries.has(relative)) {
      const text = current.toString("utf8");
      // A damaged marker pair is a conflict, never a fresh merge: splicing a second block
      // into a file that already has one is worse than the damage.
      const action = hasMarkers(text) ? "remerge" : hasDamagedMarkers(text) ? "conflict" : "merge";
      plan.push({ relative, action });
      continue;
    }

    plan.push({ relative, action: "conflict" });
  }

  return plan;
}

export async function applyInstall(
  templateRoot: string,
  target: string,
  plan: readonly PlanEntry[],
  options: { force: boolean; merge?: boolean }
): Promise<{ written: string[]; conflicts: string[]; backups: string[]; merged: string[] }> {
  const written: string[] = [];
  const conflicts: string[] = [];
  const backups: string[] = [];
  const merged: string[] = [];

  for (const entry of plan) {
    if (entry.action === "unchanged" || entry.action === "seed-skip") continue;

    if (entry.action === "conflict" && !options.force) {
      conflicts.push(entry.relative);
      continue;
    }

    // Replacing only what is between the markers is the whole point of having merged: the
    // user's own prose sits outside them and is never read, let alone rewritten.
    if (entry.action === "remerge" || (entry.action === "merge" && options.merge)) {
      const destination = path.join(target, entry.relative);
      const template = await fs.readFile(path.join(templateRoot, entry.relative), "utf8");
      const current = await fs.readFile(destination, "utf8");

      if (entry.action === "merge") {
        const backup = path.join(target, STATE_DIR, ".state", "backups", entry.relative);
        await fs.mkdir(path.dirname(backup), { recursive: true });
        await fs.copyFile(destination, backup);
        backups.push(entry.relative);
      }

      const next = entry.action === "merge" ? spliceEntry(current, template) : replaceManagedBlock(current, template);
      if (next === null) {
        // Markers went missing between planning and writing, or were edited into an order
        // this cannot reason about. Leaving it alone is the only safe answer.
        conflicts.push(entry.relative);
        continue;
      }

      await fs.writeFile(destination, next, "utf8");
      merged.push(entry.relative);
      continue;
    }

    if (entry.action === "merge") {
      conflicts.push(entry.relative);
      continue;
    }

    const destination = path.join(target, entry.relative);
    if (entry.action === "conflict") {
      const backup = path.join(target, STATE_DIR, ".state", "backups", entry.relative);
      await fs.mkdir(path.dirname(backup), { recursive: true });
      await fs.copyFile(destination, backup);
      backups.push(entry.relative);
    }

    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(path.join(templateRoot, entry.relative), destination);
    written.push(entry.relative);
  }

  return { written, conflicts, backups, merged };
}

/**
 * Records what was *installed*, not what is currently on disk.
 *
 * This distinction is the whole mechanism. The manifest answers "is this file still the one
 * we shipped, or did someone edit it", so it must hold the template's hash. Hashing the
 * working copy instead records a local edit as though it were the installed version, and
 * the next update then treats that edit as stale and overwrites it. The protection would
 * work exactly once.
 *
 * A file left alone as a conflict keeps its previous entry, since that is still the last
 * version actually installed there.
 */
export async function writeManifest(
  target: string,
  version: string,
  adapters: readonly Adapter[],
  templateRoot: string,
  previous: Manifest | null,
  skipped: readonly string[]
): Promise<void> {
  const managed: Record<string, string> = {};
  const untouched = new Set(skipped);

  for (const relative of await walk(templateRoot, wantedPaths(adapters))) {
    if (!isManaged(relative)) continue;

    if (untouched.has(relative)) {
      const recorded = previous?.managed[relative];
      if (recorded) managed[relative] = recorded;
      continue;
    }

    managed[relative] = hash(await fs.readFile(path.join(templateRoot, relative)));
  }

  const manifest: Manifest = { schemaVersion: 1, version, adapters: [...adapters], managed };
  const file = path.join(target, MANIFEST);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(manifest, null, 2) + "\n");
}

/**
 * Wires the hooks into Claude Code's settings.
 *
 * Only when there are no settings yet. A project's existing settings are its own, and
 * merging into them blind is how a tool destroys configuration it did not write. When they
 * exist, the caller is told to wire it manually and shown where the template is.
 */
export async function wireHooks(target: string): Promise<"written" | "exists" | "no-template"> {
  const template = path.join(target, STATE_DIR, ".state", "settings-template.json");
  const settings = path.join(target, ".claude", "settings.json");

  if (!(await exists(template))) return "no-template";
  if (await exists(settings)) return "exists";

  await fs.mkdir(path.dirname(settings), { recursive: true });
  await fs.copyFile(template, settings);
  return "written";
}

export async function readManifest(target: string): Promise<Manifest | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(target, MANIFEST), "utf8")) as Manifest;
  } catch {
    return null;
  }
}

function wantedPaths(adapters: readonly Adapter[]): (relative: string) => boolean {
  const prefixes = new Set<string>();
  for (const adapter of adapters) {
    for (const tree of ADAPTERS[adapter].trees) prefixes.add(tree);
    for (const entry of ADAPTERS[adapter].entry) prefixes.add(entry);
  }
  prefixes.add(STATE_DIR);

  return (relative) => [...prefixes].some((p) => relative === p || relative.startsWith(`${p}/`));
}

async function walk(dir: string, filter?: (relative: string) => boolean, prefix = ""): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await walk(path.join(dir, entry.name), filter, relative)));
    } else if (!filter || filter(relative)) {
      files.push(relative);
    }
  }
  return files.sort();
}
