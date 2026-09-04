/**
 * Reading the authored skill sources.
 *
 * Skills carry three frontmatter fields. `name` is the invocation, `description` is the
 * long routing text a tool matches a request against, and `summary` is a short clause
 * used to build the roster in the shared entry file. Keeping `summary` separate means the
 * roster stays readable without shortening the routing text that makes matching work.
 */

import fs from "node:fs/promises";
import path from "node:path";

/**
 * Every skill the finished system will have.
 *
 * Skills are authored one at a time, so a skill written early legitimately refers to one
 * written later. This list is what makes that safe: a reference to a name on it is a
 * forward reference and fine, while a reference to anything else is a typo that would
 * otherwise ship as a broken instruction telling a user to run a command that does not
 * exist.
 */
export const PLANNED_SKILLS: readonly string[] = [
  "audit",
  "auto",
  "browser-tests",
  "capture",
  "check",
  "ci",
  "complete",
  "discovery",
  "distill",
  "debug",
  "doctor",
  "extend",
  "feature",
  "fix",
  "implement",
  "overview",
  "prototype",
  "refactor",
  "release",
  "rollback",
  "setup",
  "spike",
  "status",
  "tests",
  "try"
];

export interface Skill {
  name: string;
  summary: string;
  description: string;
  dir: string;
}

/** Reads every skill under `skillsRoot`, sorted by name. */
export async function readSkills(skillsRoot: string): Promise<Skill[]> {
  let entries;
  try {
    entries = await fs.readdir(skillsRoot, { withFileTypes: true });
  } catch {
    return [];
  }

  const skills: Skill[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

    const dir = path.join(skillsRoot, entry.name);
    const source = await fs.readFile(path.join(dir, "SKILL.md"), "utf8");
    const frontmatter = parseFrontmatter(source, entry.name);

    if (frontmatter.name !== entry.name) {
      throw new Error(
        `${entry.name}/SKILL.md: frontmatter name is "${frontmatter.name}" but the directory is "${entry.name}"`
      );
    }

    skills.push({ ...frontmatter, dir });
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

interface Frontmatter {
  name: string;
  summary: string;
  description: string;
}

/**
 * Minimal frontmatter reader for the three fields skills declare.
 *
 * Deliberately not a general YAML parser: skills are authored in this repo, the shape is
 * fixed, and a dependency here would ship into the build for no benefit. Anything it
 * cannot read is a build error rather than a silent default.
 */
function parseFrontmatter(source: string, skill: string): Frontmatter {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  if (!match?.[1]) throw new Error(`${skill}/SKILL.md: missing frontmatter block`);

  const fields = new Map<string, string>();
  for (const line of match[1].split(/\r?\n/)) {
    const field = /^([a-z]+):\s*(.*)$/.exec(line);
    if (!field?.[1]) continue;
    fields.set(field[1], unquote(field[2] ?? ""));
  }

  for (const required of ["name", "summary", "description"] as const) {
    if (!fields.get(required)) {
      throw new Error(`${skill}/SKILL.md: frontmatter is missing "${required}"`);
    }
  }

  return {
    name: fields.get("name") as string,
    summary: fields.get("summary") as string,
    description: fields.get("description") as string
  };
}

function unquote(value: string): string {
  const trimmed = value.trim();
  const quoted = /^(["'])([\s\S]*)\1$/.exec(trimmed);
  return quoted?.[2] ?? trimmed;
}
