/**
 * Replace the upgrade check's fixture with a published release.
 *
 * Run once after each publish, as `npm run capture:release -- <version>`. The tarball is
 * fetched from the registry, which verifies it against the published integrity, so the
 * fixture is always what users installed rather than something rebuilt from source.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { SURFACE_RECORD } from "./surface-current.js";

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
  console.error("Usage: npm run capture:release -- <published version>");
  process.exit(2);
}

const fixtures = path.join(path.dirname(SURFACE_RECORD), "fixtures");
await fs.mkdir(fixtures, { recursive: true });

const packed = spawnSync("npm", ["pack", `create-religion@${version}`, "--pack-destination", fixtures, "--silent"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"]
});
if (packed.status !== 0) process.exit(packed.status ?? 1);

const kept = `create-religion-${version}.tgz`;
for (const file of await fs.readdir(fixtures)) {
  if (file.endsWith(".tgz") && file !== kept) await fs.rm(path.join(fixtures, file));
}

const record = JSON.parse(await fs.readFile(SURFACE_RECORD, "utf8")) as Record<string, unknown>;
record.lastRelease = version;
await fs.writeFile(SURFACE_RECORD, JSON.stringify(record, null, 2) + "\n");
console.log(`Fixture is now ${kept}.`);
