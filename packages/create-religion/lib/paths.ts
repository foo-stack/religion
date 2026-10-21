import fs from "node:fs/promises";
import path from "node:path";

export const STATE_DIR = "religion";

/** Where the adapters install their skills, one directory per skill. */
export const SKILL_TREES = [".claude/skills", ".agents/skills"];

/**
 * Walks up from `start` to the nearest directory holding the state directory.
 *
 * Commands are routinely run from a subdirectory, and a tool that only works from the
 * repository root is a tool people stop using.
 */
export async function findProjectRoot(start: string): Promise<string | null> {
  let current = path.resolve(start);

  for (;;) {
    if (await exists(path.join(current, STATE_DIR, "config.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

export function statePath(root: string, ...parts: string[]): string {
  return path.join(root, STATE_DIR, ...parts);
}

export async function exists(target: string): Promise<boolean> {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}

export async function readIfPresent(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, "utf8");
  } catch {
    return null;
  }
}

/** The skill names installed in any tree, read from the directories rather than trusted from a file. */
export async function installedSkills(root: string): Promise<Set<string>> {
  const names = new Set<string>();
  for (const tree of SKILL_TREES) {
    try {
      for (const entry of await fs.readdir(path.join(root, tree), { withFileTypes: true })) {
        if (entry.isDirectory()) names.add(entry.name);
      }
    } catch {
      // A tree that is not installed contributes nothing.
    }
  }
  return names;
}
