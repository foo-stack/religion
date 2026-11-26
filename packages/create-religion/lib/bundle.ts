/**
 * A minimal zip writer and reader for the export bundle.
 *
 * Entries are stored, not compressed: shipped code may not import `zlib`, and state is small
 * text. The format is the plain one every unzip tool reads, with no ZIP64, so a bundle is
 * limited to 4 GB and 65,535 entries.
 */

export const BUNDLE_MANIFEST = "religion-bundle.json";

export interface Entry {
  path: string;
  contents: Buffer;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

export function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** Why a bundle entry path is refused, or null when it is allowed. Import applies the same rule. */
export function badEntryPath(entry: string): string | null {
  if (entry === BUNDLE_MANIFEST) return null;
  if (entry.includes("\\")) return "uses a backslash";
  if (entry.startsWith("/")) return "is absolute";
  if (/[\u0000-\u001f\u007f]/.test(entry)) return "has a control character";
  if (!entry.startsWith("religion/")) return "is outside religion/";
  if (entry.split("/").some((part) => part === ".." || part === "." || part === "")) return "has an empty, . or .. segment";
  // The folder under religion/ decides whether a path is private, so it must not depend on a
  // folding table: ASCII only there, which no filesystem folds into something else.
  const parts = entry.split("/");
  if (parts.length > 2 && /[^\x20-\x7e]/.test(parts[1]!)) return "has a non-ASCII character in its first folder under religion/";
  if (folded(entry).split("/")[1] === ".state") return "is inside religion/.state/, which never travels";
  return null;
}

/**
 * A name as a case-insensitive, normalising filesystem sees it.
 *
 * The default macOS filesystem treats `.STATE` and `.ſtate` as `.state`, and an NFD name as its
 * NFC form, so checks that compare names must compare this, or a variant spelling walks past
 * them. Upper then lower case approximates full case folding, which JavaScript lacks.
 */
export function folded(name: string): string {
  return name.normalize("NFC").toUpperCase().toLowerCase();
}

/** MS-DOS date and time, the only timestamp the base format carries, at two-second resolution. */
function dosStamp(at: Date): { time: number; date: number } {
  const year = Math.max(at.getFullYear(), 1980);
  return {
    time: (at.getHours() << 11) | (at.getMinutes() << 5) | Math.floor(at.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((at.getMonth() + 1) << 5) | at.getDate()
  };
}

export function writeZip(entries: readonly Entry[], at: Date): Buffer {
  for (const entry of entries) {
    const problem = badEntryPath(entry.path);
    if (problem) throw new Error(`refused bundle entry '${entry.path}': it ${problem}`);
  }

  const { time, date } = dosStamp(at);
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.path, "utf8");
    const crc = crc32(entry.contents);
    const size = entry.contents.length;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // names are UTF-8
    local.writeUInt16LE(0, 8); // stored
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(size, 18);
    local.writeUInt32LE(size, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, name, entry.contents);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(size, 20);
    central.writeUInt32LE(size, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);

    offset += local.length + name.length + size;
  }

  const directory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...locals, directory, end]);
}

export type ReadResult = { ok: true; entries: Entry[] } | { ok: false; reason: string };

/**
 * Reads a zip of the kind `writeZip` produces, and nothing looser.
 *
 * The bundle comes from outside the project, so every offset is checked against the buffer
 * before it is read, and anything not fully understood is refused rather than skipped:
 * a split or ZIP64 archive, encryption, compression, a CRC or size that does not match, a
 * duplicate name, or a path that could land anywhere but inside `religion/`.
 */
export function readZip(zip: Buffer): ReadResult {
  const fail = (reason: string): ReadResult => ({ ok: false, reason });
  const fits = (offset: number, length: number) => offset >= 0 && length >= 0 && offset + length <= zip.length;

  let end = -1;
  for (let at = zip.length - 22; at >= Math.max(0, zip.length - 22 - 0xffff); at -= 1) {
    if (zip.readUInt32LE(at) === 0x06054b50) {
      end = at;
      break;
    }
  }
  if (end < 0) return fail("no end-of-archive record, so it is not a complete zip");
  const count = zip.readUInt16LE(end + 10);
  const directorySize = zip.readUInt32LE(end + 12);
  const directoryAt = zip.readUInt32LE(end + 16);
  if (zip.readUInt16LE(end + 4) !== 0 || zip.readUInt16LE(end + 6) !== 0 || zip.readUInt16LE(end + 8) !== count) {
    return fail("it is split across several files");
  }
  if (count === 0xffff || directoryAt === 0xffffffff || directorySize === 0xffffffff) return fail("it uses ZIP64");
  if (!fits(directoryAt, directorySize) || directoryAt + directorySize > end) return fail("its directory lies outside the file");

  const entries: Entry[] = [];
  const seen = new Set<string>();
  let at = directoryAt;
  for (let index = 0; index < count; index += 1) {
    if (!fits(at, 46) || zip.readUInt32LE(at) !== 0x02014b50) return fail(`directory entry ${index + 1} is damaged`);
    const flags = zip.readUInt16LE(at + 8);
    const method = zip.readUInt16LE(at + 10);
    const crc = zip.readUInt32LE(at + 16);
    const stored = zip.readUInt32LE(at + 20);
    const size = zip.readUInt32LE(at + 24);
    const nameLength = zip.readUInt16LE(at + 28);
    const extraLength = zip.readUInt16LE(at + 30);
    const commentLength = zip.readUInt16LE(at + 32);
    const localAt = zip.readUInt32LE(at + 42);
    if (!fits(at + 46, nameLength + extraLength + commentLength)) return fail(`directory entry ${index + 1} is damaged`);
    const name = zip.subarray(at + 46, at + 46 + nameLength).toString("utf8");
    at += 46 + nameLength + extraLength + commentLength;

    if (flags & 0x0001) return fail(`'${name}' is encrypted`);
    if (method !== 0) return fail(`'${name}' is compressed, and bundles store their files uncompressed`);
    if (stored !== size) return fail(`'${name}' has mismatched sizes`);
    const problem = badEntryPath(name);
    if (problem) return fail(`'${name}' ${problem}`);
    if (seen.has(folded(name))) return fail(`'${name}' appears twice, allowing for case and Unicode form`);
    seen.add(folded(name));

    if (!fits(localAt, 30) || zip.readUInt32LE(localAt) !== 0x04034b50) return fail(`'${name}' has no local header where the directory says`);
    const localNameLength = zip.readUInt16LE(localAt + 26);
    const dataAt = localAt + 30 + localNameLength + zip.readUInt16LE(localAt + 28);
    if (!fits(localAt + 30, localNameLength) || zip.subarray(localAt + 30, localAt + 30 + localNameLength).toString("utf8") !== name) {
      return fail(`'${name}' is named differently in its local header`);
    }
    if (!fits(dataAt, size) || dataAt + size > directoryAt) return fail(`'${name}' runs past the end of its data`);
    const contents = Buffer.from(zip.subarray(dataAt, dataAt + size));
    if (crc32(contents) !== crc) return fail(`'${name}' fails its CRC check, so it was damaged after it was written`);
    entries.push({ path: name, contents });
  }
  const folders = new Set([...seen].flatMap((name) => name.split("/").slice(1, -1).map((_, i, parts) => `religion/${parts.slice(0, i + 1).join("/")}`)));
  const clash = [...seen].find((name) => folders.has(name));
  if (clash) return fail(`'${clash}' is both a file and a folder in the bundle`);
  return { ok: true, entries };
}
