import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { BUNDLE_MANIFEST, writeZip } from "./bundle.js";
import { hash } from "./install.js";
import { STATE_DIR, stateIgnored } from "./paths.js";
import { originUrl } from "./state.js";

/** Where the bundle is written, relative to the project. Users point a sync client at its folder. */
export const BUNDLE_PATH = `${STATE_DIR}/.state/export/religion-bundle.zip`;
export const EXCHANGE_PATH = `${STATE_DIR}/.state/exchange.json`;

export interface BundleManifest {
  schemaVersion: 1;
  createdAt: string;
  host: string;
  repository: string | null;
  files: Record<string, string>;
}

export type ExportPlan =
  | { ok: true; files: string[]; skipped: string[]; manifest: BundleManifest }
  | { ok: false; reason: string };

/** Every plain file under the state directory except `.state/`, as `/`-separated project paths. */
async function collect(root: string): Promise<{ files: string[]; skipped: string[] }> {
  const files: string[] = [];
  const skipped: string[] = [];
  const walk = async (relative: string): Promise<void> => {
    const entries = await fs.readdir(path.join(root, ...relative.split("/")), { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const child = `${relative}/${entry.name}`;
      if (child === `${STATE_DIR}/.state`) continue;
      if (entry.isDirectory()) await walk(child);
      else if (entry.isFile()) files.push(child);
      else skipped.push(child);
    }
  };
  await walk(STATE_DIR);
  return { files, skipped };
}

export async function planExport(root: string, at = new Date()): Promise<ExportPlan> {
  if (!(await stateIgnored(root))) {
    return { ok: false, reason: `${STATE_DIR}/ is committed, so git already carries it; export is for state kept out of git` };
  }
  const { files, skipped } = await collect(root);
  if (files.length === 0) return { ok: false, reason: `nothing to export: ${STATE_DIR}/ holds no files outside .state/` };

  const hashes: Record<string, string> = {};
  for (const file of files) hashes[file] = hash(await fs.readFile(path.join(root, ...file.split("/"))));

  return {
    ok: true,
    files,
    skipped,
    manifest: { schemaVersion: 1, createdAt: at.toISOString(), host: os.hostname(), repository: await originUrl(root), files: hashes }
  };
}

/** The zip for a plan, its manifest first. */
export async function bundleFor(root: string, manifest: BundleManifest): Promise<Buffer> {
  const entries = [{ path: BUNDLE_MANIFEST, contents: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) }];
  for (const file of Object.keys(manifest.files)) {
    entries.push({ path: file, contents: await fs.readFile(path.join(root, ...file.split("/"))) });
  }
  return writeZip(entries, new Date(manifest.createdAt));
}

/**
 * Writes the bundle, replacing the last one, then records what it holds as the exchange base.
 *
 * The zip goes to a hidden temporary file beside the bundle and is renamed into place, so a
 * sync client watching the folder never sees half a bundle. On any failure the temporary
 * file is removed and the previous bundle is left as it was.
 */
export async function writeExport(root: string, manifest: BundleManifest): Promise<void> {
  const bundle = path.join(root, ...BUNDLE_PATH.split("/"));
  await fs.mkdir(path.dirname(bundle), { recursive: true });
  const temporary = path.join(path.dirname(bundle), `.${path.basename(bundle)}.${crypto.randomBytes(4).toString("hex")}.tmp`);
  try {
    await fs.writeFile(temporary, await bundleFor(root, manifest), { flag: "wx" });
    await fs.rename(temporary, bundle);
  } catch (error) {
    await fs.rm(temporary, { force: true });
    throw error;
  }
  const exchange = { schemaVersion: 1, last: { direction: "export", createdAt: manifest.createdAt, files: manifest.files } };
  await fs.writeFile(path.join(root, ...EXCHANGE_PATH.split("/")), `${JSON.stringify(exchange, null, 2)}\n`);
}
