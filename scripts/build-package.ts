/**
 * Stages the rendered template inside the publishable package.
 *
 * `template/` at the repository root is build output. The package needs its own copy to
 * ship, and copying it at build time rather than committing a duplicate means the two can
 * never disagree about what a fresh install contains.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(repoRoot, "template");
const destination = path.join(repoRoot, "packages", "create-religion", "template");

async function main(): Promise<void> {
  try {
    await fs.stat(source);
  } catch {
    throw new Error("No template/ found. Run `npm run build:skills` first.");
  }

  await fs.rm(destination, { recursive: true, force: true });
  await fs.cp(source, destination, { recursive: true });

  const hooks = path.join(repoRoot, "src", "hooks");
  await fs.cp(hooks, path.join(destination, ".claude", "hooks"), { recursive: true });

  const count = await countFiles(destination);
  console.log(`Staged ${count} file(s) into packages/create-religion/template.`);
}

async function countFiles(dir: string): Promise<number> {
  let total = 0;
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    total += entry.isDirectory() ? await countFiles(path.join(dir, entry.name)) : 1;
  }
  return total;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
