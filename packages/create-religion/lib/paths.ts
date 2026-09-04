import fs from "node:fs/promises";
import path from "node:path";

export const STATE_DIR = "religion";

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
