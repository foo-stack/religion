import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { badEntryPath, crc32, writeZip } from "./bundle.js";

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
  for (const bad of ["other/x.md", "/religion/x.md", "religion\\x.md", "religion/../x.md", "religion/./x.md", "religion//x.md", "religion/"]) {
    assert.ok(badEntryPath(bad), bad);
    assert.throws(() => writeZip([{ path: bad, contents: Buffer.alloc(0) }], new Date()), /refused bundle entry/, bad);
  }
  assert.equal(badEntryPath("religion/a..b/x.md"), null, "a name containing .. is not a .. segment");
  assert.equal(badEntryPath("religion-bundle.json"), null);
});
