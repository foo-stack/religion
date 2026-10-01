/**
 * Running a network-check probe: a copy of what the check reads, edited, then checked.
 *
 * Shared by the committed test and by whoever adds a probe, so both apply edits the same way.
 */

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { networkProblems } from "./promises.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Everything the network check reads. */
const READ = [
  "packages/create-religion/bin",
  "packages/create-religion/lib",
  "packages/create-religion/package.json",
  "packages/create-religion/tsconfig.json",
  "src/hooks",
  "src/state/.state/settings-template.json"
];

export type Operation =
  | ["create", string, string]
  | ["append", string, string]
  | ["prepend", string, string]
  | ["replace", string, string, string]
  | ["symlink", string, string];

export interface Probe {
  id: string;
  desc: string;
  ops: Operation[];
  expect: "caught" | "clean";
}

/** The problems the check reports for the repository with a probe's edits applied. */
export async function runProbe(probe: Pick<Probe, "ops">): Promise<string[]> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "religion-probe-"));
  try {
    for (const relative of READ) {
      await fs.cp(path.join(repoRoot, relative), path.join(root, relative), { recursive: true });
    }
    for (const op of probe.ops) await apply(root, op);
    return await networkProblems(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function apply(root: string, op: Operation): Promise<void> {
  const file = path.join(root, op[1]);
  if (op[0] === "symlink") {
    await fs.symlink(op[2], file);
    return;
  }
  if (op[0] === "create") {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, op[2]);
    return;
  }
  const text = await fs.readFile(file, "utf8");
  if (op[0] === "append") await fs.writeFile(file, text + op[2]);
  else if (op[0] === "prepend") await fs.writeFile(file, op[2] + text);
  else {
    if (!text.includes(op[2])) throw new Error(`anchor not found in ${op[1]}: ${op[2].slice(0, 60)}`);
    await fs.writeFile(file, text.replace(op[2], op[3]));
  }
}
