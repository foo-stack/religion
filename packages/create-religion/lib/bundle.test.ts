import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { badEntryPath, crc32, readZip, writeZip } from "./bundle.js";

test("crc32 matches the published check value", () => {
  assert.equal(crc32(Buffer.from("123456789")), 0xcbf43926);
});

test("a written zip passes unzip's own test and returns each entry byte for byte", async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "religion-bundle-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const entries = [
    { path: "religion-bundle.json", contents: Buffer.from('{"schemaVersion":1}\n') },
    { path: "religion/context/deep/notes.md", contents: Buffer.from("# Notes\n\nnon-ASCII: café\n") },
    { path: "religion/empty.md", contents: Buffer.alloc(0) }
  ];
  const zip = path.join(dir, "bundle.zip");
  await fs.writeFile(zip, writeZip(entries, new Date(2026, 10, 26, 9, 30, 0)));

  assert.match(execFileSync("unzip", ["-t", zip], { encoding: "utf8" }), /No errors detected/);
  for (const entry of entries) {
    assert.deepEqual(execFileSync("unzip", ["-p", zip, entry.path]), entry.contents, entry.path);
  }
});

test("entry paths outside religion/ or able to escape it are refused", () => {
  for (const bad of ["religion/.state/run.json", "other/x.md", "/religion/x.md", "religion\\x.md", "religion/../x.md", "religion/./x.md", "religion//x.md", "religion/"]) {
    assert.ok(badEntryPath(bad), bad);
    assert.throws(() => writeZip([{ path: bad, contents: Buffer.alloc(0) }], new Date()), /refused bundle entry/, bad);
  }
  assert.equal(badEntryPath("religion/a..b/x.md"), null, "a name containing .. is not a .. segment");
  assert.equal(badEntryPath("religion-bundle.json"), null);
});

const sample = () => [
  { path: "religion-bundle.json", contents: Buffer.from("{}\n") },
  { path: "religion/aa/notes.md", contents: Buffer.from("# Notes\n") },
  { path: "religion/empty.md", contents: Buffer.alloc(0) }
];

test("readZip returns exactly what writeZip wrote", () => {
  const read = readZip(writeZip(sample(), new Date()));
  assert.ok(read.ok);
  assert.deepEqual(read.entries, sample());
});

test("readZip refuses damaged, escaping, private, compressed and truncated archives", async (t) => {
  const reason = (zip: Buffer) => {
    const read = readZip(zip);
    return read.ok ? "accepted" : read.reason;
  };
  const zip = writeZip(sample(), new Date());

  const flipped = Buffer.from(zip);
  const at = flipped.indexOf("# Notes");
  flipped[at] = flipped[at]! ^ 0x01;
  assert.match(reason(flipped), /fails its CRC check/);

  const escaping = Buffer.from(zip.toString("latin1").replaceAll("religion/aa/", "religion/../"), "latin1");
  assert.match(reason(escaping), /'religion\/\.\.\/notes\.md' has an empty, \. or \.\. segment/);

  const hidden = writeZip([{ path: "religion/xxxxxx/run.json", contents: Buffer.from("{}") }], new Date());
  const intoState = Buffer.from(hidden.toString("latin1").replaceAll("religion/xxxxxx/", "religion/.state/"), "latin1");
  assert.match(reason(intoState), /inside religion\/\.state\//);

  assert.match(reason(zip.subarray(0, zip.length - 10)), /no end-of-archive record/);
  assert.match(reason(zip.subarray(0, 40)), /no end-of-archive record/);

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "religion-zip-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await fs.mkdir(path.join(dir, "religion"));
  await fs.writeFile(path.join(dir, "religion", "plan.md"), "compress me ".repeat(50));
  execFileSync("zip", ["-q", "-r", "deflated.zip", "religion/plan.md"], { cwd: dir });
  assert.match(reason(await fs.readFile(path.join(dir, "deflated.zip"))), /is compressed/);
});

test("names that one filesystem would treat as the same file are refused", () => {
  const reason = (paths: string[]) => {
    const read = readZip(writeZipUnchecked(paths));
    return read.ok ? "accepted" : read.reason;
  };
  assert.match(reason(["religion/.STATE/run.json"]), /inside religion\/\.state\//);
  assert.match(reason(["religion/.state"]), /inside religion\/\.state\//);
  assert.match(reason(["religion/context/a.md", "religion/context/A.md"]), /appears twice, allowing for case/);
  assert.match(reason(["religion/café.md", "religion/café.md"]), /appears twice, allowing for case/);
  assert.match(reason(["religion/x", "religion/x/y.md"]), /'religion\/x' is both a file and a folder/);
  assert.match(reason(["religion/X", "religion/x/y.md"]), /'religion\/x' is both a file and a folder/);
  assert.match(reason(["religion/bad\u0000name.md"]), /control character/);
  assert.match(reason(["religion/.\u017ftate/run.json"]), /non-ASCII character in its first folder/, "a long s folds onto .state on APFS");
  assert.match(reason(["religion/s.md", "religion/\u017f.md"]), /appears twice, allowing for case/);
  assert.match(reason(["religion/.\u017ftate"]), /inside religion\/\.state\//, "a file spelled onto .state is caught by folding");
  assert.equal(reason(["religion/caf\u00e9.md", "religion/notes/caf\u00e9.md"]), "accepted", "non-ASCII file names stay allowed");
  assert.match(reason(["religion/a/s", "religion/a/\u017f/y.md"]), /'religion\/a\/s' is both a file and a folder/);
  assert.equal(reason(["religion/x-a.md", "religion/x/y.md", "religion/notes/.state/kept.md"]), "accepted", "only religion/.state itself is private");
});

/** A zip holding these names, written past writeZip's own refusals, as a hostile bundle would be. */
function writeZipUnchecked(paths: string[]): Buffer {
  // Each placeholder has its real name's byte length, so swapping one for the other moves no offset.
  const reals = paths.map((p) => Buffer.from(p, "utf8").toString("latin1"));
  const placeholders = reals.map((real, i) => `religion/${i.toString(36)}`.padEnd(real.length, "q"));
  for (const [i, placeholder] of placeholders.entries()) assert.equal(placeholder.length, reals[i]!.length, "a placeholder must fit");
  let zip = writeZip(placeholders.map((p) => ({ path: p, contents: Buffer.from("x") })), new Date()).toString("latin1");
  for (const [i, placeholder] of placeholders.entries()) zip = zip.replaceAll(placeholder, reals[i]!);
  return Buffer.from(zip, "latin1");
}
