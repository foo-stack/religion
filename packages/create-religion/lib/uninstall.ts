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
import { ADAPTERS, hash, isPlainFile, MANIFEST_PATH, readManifest, retiringTree } from "./install.js";
import { hasDamagedMarkers, hasMarkers } from "./merge.js";
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
