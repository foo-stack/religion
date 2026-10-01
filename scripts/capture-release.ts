/**
 * Replace the upgrade check's fixture with a published release.
 *
 * Run once after each publish, as `npm run capture:release -- <version>`. The tarball comes
 * from the registry, which verifies it against the published integrity, and that integrity
 * is recorded beside the version so the check refuses to run a tarball that differs from it.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { SURFACE_RECORD } from "./surface-current.js";
import { VERSION } from "./upgrade.js";

const version = process.argv[2];
if (!version || !VERSION.test(version)) {
  console.error("Usage: npm run capture:release -- <published version>");
  process.exit(2);
}

const fixtures = path.join(path.dirname(SURFACE_RECORD), "fixtures");
await fs.mkdir(fixtures, { recursive: true });

const packed = spawnSync("npm", ["pack", `create-religion@${version}`, "--pack-destination", fixtures, "--json"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"]
});
if (packed.status !== 0) process.exit(packed.status ?? 1);

const [result] = JSON.parse(packed.stdout) as { filename: string; integrity: string; version: string }[];
if (!result || result.version !== version) {
  console.error(`npm packed ${result?.version ?? "nothing"}, not ${version}; the fixture was not changed.`);
  process.exit(1);
}

for (const file of await fs.readdir(fixtures)) {
  if (file.endsWith(".tgz") && file !== result.filename) await fs.rm(path.join(fixtures, file));
}

const record = JSON.parse(await fs.readFile(SURFACE_RECORD, "utf8")) as Record<string, unknown>;
const updated = { ...record, lastRelease: version, lastReleaseIntegrity: result.integrity };
await fs.writeFile(SURFACE_RECORD, JSON.stringify(updated, null, 2) + "\n");
console.log(`Fixture is now ${result.filename}, integrity ${result.integrity}.`);
