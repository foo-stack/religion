/**
 * What changed between two versions, read from the changelog the package ships.
 *
 * The format is what Changesets writes: `## 1.2.0` per release, `### Minor Changes` groups,
 * and `- 6097eb0: text` entries that may run across several lines.
 */

import { isNewer } from "./install.js";

export interface Release {
  version: string;
  changes: string[];
}

/** Releases after `from`, up to and including `to`, newest first, each change as its first sentence. */
export function changesSince(changelog: string | null, from: unknown, to: string): Release[] {
  if (!changelog || typeof from !== "string") return [];
  return changelog.split(/^(?=## )/m).flatMap((section): Release[] => {
    const version = /^## (\S+)/.exec(section)?.[1];
    // A prerelease compares equal to its release, so its notes would be shown twice or never.
    if (!version || version.includes("-") || !isNewer(version, from) || isNewer(version, to)) return [];
    const changes = section
      .split(/^- /m)
      .slice(1)
      .map((entry) => firstSentence(entry.split(/\n\s*\n|\n(?=#)|\n\s+- /)[0]!.replace(/\s+/g, " ").replace(/^[0-9a-f]{7,40}: /, "")))
      .filter(Boolean);
    return [{ version, changes }];
  });
}

// A full stop ends the sentence only before a capital or a code span, so "e.g. `--yes`" does not.
function firstSentence(text: string): string {
  const end = text.search(/(?<!\b(?:e\.g|i\.e|etc|vs))\.(\s+[A-Z`]|$)/);
  return (end < 0 ? text : text.slice(0, end + 1)).trim();
}
