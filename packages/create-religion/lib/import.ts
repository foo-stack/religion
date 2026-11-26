import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { BUNDLE_MANIFEST, readZip } from "./bundle.js";
import type { Entry } from "./bundle.js";
import { EXCHANGE_PATH } from "./export.js";
import type { BundleManifest } from "./export.js";
import { hash } from "./install.js";
import { readIfPresent, STATE_DIR, stateIgnored } from "./paths.js";
import { originUrl } from "./state.js";

/** What importing does to one file. Sync reports divergence in the same terms. */
export type FileClass = "create" | "overwrite" | "unchanged" | "conflict";

export interface ImportFile {
  path: string;
  class: FileClass;
  contents: Buffer;
}

export type ImportPlan = { ok: true; manifest: BundleManifest; files: ImportFile[] } | { ok: false; reason: string };

/** The files and hashes of the last export or import, or null when there has been none. */
export type ExchangeBase = Record<string, string> | null;

/**
 * Compares this machine's copy of a file with the bundle's, against the last exchange.
 *
 * A local copy that differs from the bundle is only safe to replace when it is still what the
 * last exchange left. Anything else was changed here since, and replacing it would lose that.
 * With no exchange at all there is nothing to have changed since, so the bundle wins.
 */
export function classify(local: string | null, there: string, base: ExchangeBase, filePath: string): FileClass {
  if (local === there) return "unchanged";
  if (local === null) return "create";
  if (base === null || base[filePath] === local) return "overwrite";
  return "conflict";
}

const HASH = /^[0-9a-f]{16}$/;

function parseManifest(source: string): BundleManifest | null {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    return null;
  }
  const m = value as Partial<BundleManifest> | null;
  if (!m || typeof m !== "object" || m.schemaVersion !== 1) return null;
  if (typeof m.createdAt !== "string" || typeof m.host !== "string") return null;
  if (m.repository !== null && typeof m.repository !== "string") return null;
  if (!m.files || typeof m.files !== "object" || Array.isArray(m.files)) return null;
  if (!Object.values(m.files).every((h) => typeof h === "string" && HASH.test(h))) return null;
  return m as BundleManifest;
}

/** The exchange base, null when none was recorded, or undefined when the record cannot be read. */
export async function readExchangeBase(root: string): Promise<ExchangeBase | undefined> {
  const source = await readIfPresent(path.join(root, ...EXCHANGE_PATH.split("/")));
  if (source === null) return null;
  try {
    const files = (JSON.parse(source) as { last?: { files?: unknown } }).last?.files;
    if (files && typeof files === "object" && !Array.isArray(files)) return files as Record<string, string>;
  } catch {
    // An unreadable record is reported by the caller, never treated as no record.
  }
  return undefined;
}

export type BundleRead =
  | { ok: true; manifest: BundleManifest; entries: Entry[]; base: ExchangeBase }
  | { ok: false; reason: string };

/**
 * Every check a bundle must pass before anything acts on it, shared by import and sync so the
 * two never disagree about which bundles are acceptable.
 */
export async function readBundle(root: string, bundle: Buffer): Promise<BundleRead> {
  const fail = (reason: string): BundleRead => ({ ok: false, reason });
  if (!(await stateIgnored(root))) return fail(`${STATE_DIR}/ is committed here, so git carries it; import is for state kept out of git`);

  const zip = readZip(bundle);
  if (!zip.ok) return fail(`the bundle is refused: ${zip.reason}`);
  const manifestEntry = zip.entries.find((e) => e.path === BUNDLE_MANIFEST);
  const manifest = manifestEntry ? parseManifest(manifestEntry.contents.toString("utf8")) : null;
  if (!manifest) return fail(`the bundle has no readable ${BUNDLE_MANIFEST}`);

  const entries = zip.entries.filter((e) => e.path !== BUNDLE_MANIFEST);
  const named = new Set(Object.keys(manifest.files));
  const unlisted = entries.filter((e) => !named.has(e.path)).map((e) => e.path);
  const missing = [...named].filter((p) => !entries.some((e) => e.path === p));
  if (unlisted.length > 0 || missing.length > 0) {
    return fail(`the bundle's manifest and contents disagree: ${[...unlisted, ...missing].join(", ")}`);
  }
  const damaged = entries.filter((e) => hash(e.contents) !== manifest.files[e.path]).map((e) => e.path);
  if (damaged.length > 0) return fail(`these files do not match their recorded hashes: ${damaged.join(", ")}`);

  const here = await originUrl(root);
  if (manifest.repository !== here) {
    return fail(`the bundle was made for ${manifest.repository ?? "a repository with no origin"}, and this one is ${here ?? "a repository with no origin"}`);
  }

  const base = await readExchangeBase(root);
  if (base === undefined) return fail(`${EXCHANGE_PATH} cannot be read, so changes made here cannot be told apart`);
  return { ok: true, manifest, entries, base };
}

export async function planImport(root: string, bundle: Buffer): Promise<ImportPlan> {
  const read = await readBundle(root, bundle);
  if (!read.ok) return read;
  const { manifest, entries, base } = read;

  const files: ImportFile[] = [];
  for (const entry of entries) {
    const local = await fs.readFile(path.join(root, ...entry.path.split("/"))).catch(() => null);
    files.push({ path: entry.path, class: classify(local ? hash(local) : null, manifest.files[entry.path]!, base, entry.path), contents: entry.contents });
  }
  return { ok: true, manifest, files };
}

/**
 * Why a file cannot be written where the bundle puts it, or null when it can.
 *
 * `privateDir` is where `religion/.state` really resolves. Asking the filesystem, rather than
 * comparing names, catches every spelling it folds onto that folder, whatever its rules.
 */
async function unsafeTarget(root: string, relative: string, privateDir: string | null): Promise<string | null> {
  let current = root;
  const parts = relative.split("/");
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part);
    const stat = await fs.lstat(current).catch(() => null);
    if (!stat) return null;
    if (stat.isSymbolicLink()) return `${parts.slice(0, index + 1).join("/")} is a link`;
    if (privateDir && stat.isDirectory() && (await fs.realpath(current)) === privateDir) {
      return `${parts.slice(0, index + 1).join("/")} resolves to ${STATE_DIR}/.state, which never travels`;
    }
    const last = index === parts.length - 1;
    if (last ? !stat.isFile() : !stat.isDirectory()) return `${parts.slice(0, index + 1).join("/")} is not a plain ${last ? "file" : "folder"}`;
  }
  return null;
}

/**
 * Writes the plan's new and replaced files, then records the import as the exchange base.
 *
 * Every target is checked before anything is written, so a link or a folder in the way stops
 * the import with the project untouched. Each file then goes through a temporary file and a
 * rename, so none is ever left half written.
 */
export async function applyImport(root: string, plan: Extract<ImportPlan, { ok: true }>): Promise<{ written: string[] }> {
  const writes = plan.files.filter((f) => f.class === "create" || f.class === "overwrite");
  if (plan.files.some((f) => f.class === "conflict")) throw new Error("the plan holds conflicts, so nothing is written");
  const privateDir = await fs.realpath(path.join(root, STATE_DIR, ".state")).catch(() => null);
  for (const file of writes) {
    const problem = await unsafeTarget(root, file.path, privateDir);
    if (problem) throw new Error(`nothing imported: ${problem}`);
  }
  for (const file of writes) {
    const target = path.join(root, ...file.path.split("/"));
    await fs.mkdir(path.dirname(target), { recursive: true });
    const temporary = path.join(path.dirname(target), `.${path.basename(target)}.${crypto.randomBytes(4).toString("hex")}.tmp`);
    try {
      await fs.writeFile(temporary, file.contents, { flag: "wx" });
      await fs.rename(temporary, target);
    } catch (error) {
      await fs.rm(temporary, { force: true });
      throw error;
    }
  }
  const { createdAt, host, files } = plan.manifest;
  const exchange = { schemaVersion: 1, last: { direction: "import", createdAt, host, files } };
  const record = path.join(root, ...EXCHANGE_PATH.split("/"));
  await fs.mkdir(path.dirname(record), { recursive: true });
  await fs.writeFile(record, `${JSON.stringify(exchange, null, 2)}\n`);
  return { written: writes.map((f) => f.path) };
}
