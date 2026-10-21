/**
 * Taking Religion back out of a project.
 *
 * Only what the install record names is touched, and only where `update` itself would be
 * allowed to retire it: the manifest is a file in someone's repository, so a recorded path
 * must not be able to steer a removal. Everything under the state directory except the
 * manifest is the project's own record and stays.
 */

import fs from "node:fs/promises";
import path from "node:path";

import { HOOKS, hookFile, parseHooks } from "./doctor.js";
import { ADAPTERS, BACKUPS, backUp, hash, isPlainFile, MANIFEST_PATH, readManifest, retiringTree, throughLink } from "./install.js";
import { hasDamagedMarkers, hasMarkers, MANAGED_END, MANAGED_START } from "./merge.js";
import { STATE_DIR } from "./paths.js";

export type UninstallAction =
  | "remove"
  | "keep-edited"
  | "keep-linked"
  | "cut-block"
  | "keep-entry"
  | "unwire"
  | "keep-settings"
  | "remove-manifest";

export interface UninstallEntry {
  relative: string;
  action: UninstallAction;
  why?: string;
}

export const SETTINGS = ".claude/settings.json";
const TEMPLATE = `${STATE_DIR}/.state/settings-template.json`;
const ENTRY_FILES = new Set(Object.values(ADAPTERS).flatMap((adapter) => adapter.entry));

/** What uninstalling would do, without doing any of it. Nothing when there is no install record. */
export async function planUninstall(target: string): Promise<UninstallEntry[]> {
  const managed = (await readManifest(target))?.managed;
  if (!managed || typeof managed !== "object") return [];

  const plan: UninstallEntry[] = [];
  for (const [relative, recorded] of Object.entries(managed).sort(([a], [b]) => a.localeCompare(b))) {
    const entry = ENTRY_FILES.has(relative);
    if (!entry && !retiringTree(relative)) continue;
    if (!(await fs.lstat(path.join(target, ...relative.split("/"))).catch(() => null))) continue;
    if (!(await isPlainFile(target, relative))) {
      plan.push({ relative, action: "keep-linked", why: "reached through a link, or not a plain file" });
      continue;
    }
    const contents = await fs.readFile(path.join(target, ...relative.split("/")), "utf8");
    const unedited = typeof recorded === "string" && hash(contents) === recorded;
    if (!entry) plan.push({ relative, action: unedited ? "remove" : "keep-edited" });
    else if (hasMarkers(contents) && !hasDamagedMarkers(contents)) plan.push({ relative, action: "cut-block" });
    else if (unedited && !hasMarkers(contents)) plan.push({ relative, action: "remove" });
    else plan.push({ relative, action: "keep-entry", why: hasDamagedMarkers(contents) ? "its markers are damaged" : "edited, with no markers to cut along" });
  }

  const settings = await settingsEntry(target);
  if (settings) plan.push(settings);
  plan.push({ relative: MANIFEST_PATH, action: "remove-manifest" });
  return plan;
}

async function settingsEntry(target: string): Promise<UninstallEntry | null> {
  if (!(await fs.lstat(path.join(target, ...SETTINGS.split("/"))).catch(() => null))) return null;
  if (!(await isPlainFile(target, SETTINGS))) return { relative: SETTINGS, action: "keep-settings", why: "reached through a link, or not a plain file" };
  const contents = await fs.readFile(path.join(target, ...SETTINGS.split("/")), "utf8");
  const registered = parseHooks(contents);
  if (registered === null) return { relative: SETTINGS, action: "keep-settings", why: "it does not parse" };

  const template = (await isPlainFile(target, TEMPLATE)) ? await fs.readFile(path.join(target, ...TEMPLATE.split("/")), "utf8") : null;
  if (template !== null && hash(template) === hash(contents)) return { relative: SETTINGS, action: "remove" };
  const ours = new Set(HOOKS.map((hook) => hookFile(hook.command)));
  return registered.some((hook) => ours.has(hookFile(hook.command))) ? { relative: SETTINGS, action: "unwire" } : null;
}

export interface UninstallResult {
  removed: string[];
  cut: string[];
  unwired: string[];
  kept: UninstallEntry[];
  backups: string[];
}

/**
 * Carry out a plan. Each removal is checked again just before it happens, since the plan may
 * be minutes old, and a directory is removed only once nothing is left in it.
 */
export async function applyUninstall(target: string, plan: readonly UninstallEntry[]): Promise<UninstallResult> {
  for (const relative of [MANIFEST_PATH, BACKUPS]) {
    if (await throughLink(target, relative)) {
      throw new Error(`${relative} is reached through a symbolic link. Nothing was removed.`);
    }
  }

  const result: UninstallResult = { removed: [], cut: [], unwired: [], kept: [], backups: [] };
  const file = (relative: string) => path.join(target, ...relative.split("/"));
  for (const entry of plan) {
    if (entry.action === "remove" || entry.action === "remove-manifest") {
      if (!(await isPlainFile(target, entry.relative))) {
        if (entry.action === "remove") result.kept.push({ ...entry, action: "keep-linked", why: "changed since the plan was made" });
        continue;
      }
      await fs.rm(file(entry.relative));
      result.removed.push(entry.relative);
      await removeEmptyParents(target, entry.relative);
    } else if (entry.action === "cut-block" || entry.action === "unwire") {
      if (!(await isPlainFile(target, entry.relative))) {
        result.kept.push({ ...entry, action: entry.action === "cut-block" ? "keep-entry" : "keep-settings", why: "changed since the plan was made" });
        continue;
      }
      const before = await fs.readFile(file(entry.relative), "utf8");
      const after = entry.action === "cut-block" ? cutBlock(before) : unwire(before);
      if (after === null) {
        result.kept.push({ ...entry, action: entry.action === "cut-block" ? "keep-entry" : "keep-settings", why: "changed since the plan was made" });
        continue;
      }
      await backUp(target, entry.relative);
      result.backups.push(`${BACKUPS}/${entry.relative}`);
      await fs.writeFile(file(entry.relative), after, "utf8");
      (entry.action === "cut-block" ? result.cut : result.unwired).push(entry.relative);
    } else {
      result.kept.push(entry);
    }
  }
  return result;
}

/** The entry file without Religion's block, everything around it as it was. Null if the markers moved. */
export function cutBlock(contents: string): string | null {
  const start = contents.indexOf(MANAGED_START);
  const end = contents.indexOf(MANAGED_END);
  if (start < 0 || end < start) return null;
  const joined = contents.slice(0, start).replace(/\n+$/, "") + "\n\n" + contents.slice(end + MANAGED_END.length).replace(/^\n+/, "");
  return joined.replace(/^\n+/, "").replace(/\n+$/, "") + "\n";
}

/** The settings with Religion's hook entries taken out, and every other setting and hook left. */
export function unwire(contents: string): string | null {
  let settings: unknown;
  try {
    settings = JSON.parse(contents);
  } catch {
    return null;
  }
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  const root = settings as Record<string, unknown>;
  const hooks = root.hooks;
  if (!hooks || typeof hooks !== "object" || Array.isArray(hooks)) return null;

  const ours = new Set(HOOKS.map((hook) => hookFile(hook.command)));
  const kept: Record<string, unknown> = {};
  for (const [event, groups] of Object.entries(hooks)) {
    if (!Array.isArray(groups)) {
      kept[event] = groups;
      continue;
    }
    const left = groups.flatMap((group: unknown) => {
      const inner = group && typeof group === "object" ? (group as { hooks?: unknown }).hooks : undefined;
      if (!Array.isArray(inner)) return [group];
      const remaining = inner.filter((hook: unknown) => {
        const command = hook && typeof hook === "object" ? (hook as { command?: unknown }).command : undefined;
        return !(typeof command === "string" && ours.has(hookFile(command)));
      });
      return remaining.length ? [{ ...(group as object), hooks: remaining }] : [];
    });
    if (left.length) kept[event] = left;
  }
  if (Object.keys(kept).length) root.hooks = kept;
  else delete root.hooks;
  return JSON.stringify(root, null, 2) + "\n";
}

/** Remove each directory a removal left empty, walking up, never the project or the state directory. */
async function removeEmptyParents(target: string, relative: string): Promise<void> {
  let dir = path.posix.dirname(relative);
  while (dir !== "." && dir !== STATE_DIR && !dir.startsWith(`${STATE_DIR}/`)) {
    const absolute = path.join(target, ...dir.split("/"));
    const stat = await fs.lstat(absolute).catch(() => null);
    if (!stat?.isDirectory() || (await fs.readdir(absolute)).length > 0) return;
    await fs.rmdir(absolute);
    dir = path.posix.dirname(dir);
  }
}
