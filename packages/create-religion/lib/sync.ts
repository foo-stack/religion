import fs from "node:fs/promises";
import path from "node:path";

import { stateFiles } from "./export.js";
import type { BundleManifest } from "./export.js";
import { readBundle } from "./import.js";
import type { ExchangeBase } from "./import.js";
import { hash } from "./install.js";

/** How one file has moved since the two machines last exchanged. */
export type SyncState = "same" | "here" | "there" | "both" | "only-here" | "only-there" | "differs";

export type SyncReport = { ok: true; manifest: BundleManifest; files: { path: string; state: SyncState }[] } | { ok: false; reason: string };

/**
 * One file's state, from this machine's hash, the bundle's, and the last exchange.
 *
 * With no exchange at all a difference has no direction, so it is `differs`. A path the last
 * exchange did not hold appeared on both sides since, so a difference there is `both`.
 */
export function syncState(here: string | null, there: string | null, base: ExchangeBase, filePath: string): SyncState {
  if (here === null) return "only-there";
  if (there === null) return "only-here";
  if (here === there) return "same";
  if (base === null) return "differs";
  const was = base[filePath];
  if (was === here) return "there";
  if (was === there) return "here";
  return "both";
}

/** Compares this machine's state with a bundle, writing nothing. */
export async function compareState(root: string, bundle: Buffer): Promise<SyncReport> {
  const read = await readBundle(root, bundle);
  if (!read.ok) return read;
  const { files: local } = await stateFiles(root);
  const paths = [...new Set([...local, ...Object.keys(read.manifest.files)])].sort();
  const files: { path: string; state: SyncState }[] = [];
  for (const file of paths) {
    const here = local.includes(file) ? hash(await fs.readFile(path.join(root, ...file.split("/")))) : null;
    files.push({ path: file, state: syncState(here, read.manifest.files[file] ?? null, read.base, file) });
  }
  return { ok: true, manifest: read.manifest, files };
}
