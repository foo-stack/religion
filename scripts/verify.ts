/**
 * Repository checks that must pass before rendered output is trusted.
 *
 * These exist because ad-hoc shell checks kept reporting success while real problems sat
 * unexamined: a pipeline's exit status comes from its last command, so `grep ... | head`
 * always succeeds. Each check here returns a count and a list, and the runner decides.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SHARED, TREES } from "../src/lib/adapters.js";
import { PLANNED_SKILLS, readSkills } from "../src/lib/skills.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

interface Check {
  name: string;
  run: () => Promise<string[]>;
}

const checks: Check[] = [
  {
    name: "every skill reference names a real skill",
    run: async () => {
      // A skill authored early may legitimately reference one authored later, so a
      // reference to a planned name passes. Anything else is a typo that would ship as an
      // instruction to run a command that does not exist.
      const known = new Set(PLANNED_SKILLS);
      const problems: string[] = [];
      const sources = [
        path.join(repoRoot, "src", "skills"),
        path.join(repoRoot, "src", "entry"),
        path.join(repoRoot, "src", "state")
      ];

      for (const root of sources) {
        for (const file of await walkIfPresent(root)) {
          const contents = await fs.readFile(file, "utf8");
          contents.split(/\r?\n/).forEach((line, index) => {
            for (const match of line.matchAll(/\{\{\s*cmd:([A-Za-z0-9_-]+)\s*\}\}/g)) {
              const name = match[1];
              if (name && !known.has(name)) {
                problems.push(
                  `${path.relative(repoRoot, file)}:${index + 1}: unknown skill "${name}"`
                );
              }
            }
          });
        }
      }
      return problems;
    }
  },
  {
    name: "authored skills are all planned",
    run: async () => {
      const known = new Set(PLANNED_SKILLS);
      const authored = await readSkills(path.join(repoRoot, "src", "skills"));
      return authored
        .filter((skill) => !known.has(skill.name))
        .map((skill) => `${skill.name} is authored but not in the planned roster`);
    }
  },
  {
    name: "no unrendered tokens in output",
    run: async () => {
      const problems: string[] = [];
      for (const file of await renderedFiles()) {
        const contents = await fs.readFile(file, "utf8");
        contents.split(/\r?\n/).forEach((line, index) => {
          if (line.includes("{{")) {
            problems.push(`${path.relative(repoRoot, file)}:${index + 1}: ${line.trim()}`);
          }
        });
      }
      return problems;
    }
  },
  {
    name: "rendered output matches its source",
    run: async () => {
      const result = spawnSync("npx", ["tsx", "scripts/build-skills.ts", "--check"], {
        cwd: repoRoot,
        encoding: "utf8"
      });
      return result.status === 0 ? [] : [(result.stdout + result.stderr).trim()];
    }
  },
  {
    name: "typecheck",
    run: async () => {
      const result = spawnSync("npx", ["tsc", "--noEmit"], { cwd: repoRoot, encoding: "utf8" });
      return result.status === 0 ? [] : [(result.stdout + result.stderr).trim()];
    }
  },
  {
    name: "state templates carry no tool-specific invocation",
    run: async () => {
      // One state directory serves every installed adapter, so a `/name` or `$name` there
      // would be wrong for at least one of them.
      const problems: string[] = [];
      const stateDir = path.join(repoRoot, SHARED.dir);
      for (const file of await walkIfPresent(stateDir)) {
        const contents = await fs.readFile(file, "utf8");
        contents.split(/\r?\n/).forEach((line, index) => {
          if (/(?:^|\s)[/$][a-z][a-z-]{2,}\b/.test(line)) {
            problems.push(`${path.relative(repoRoot, file)}:${index + 1}: ${line.trim()}`);
          }
        });
      }
      return problems;
    }
  }
];

async function main(): Promise<void> {
  let failed = 0;

  for (const check of checks) {
    const problems = await check.run();
    if (problems.length === 0) {
      console.log(`  ok    ${check.name}`);
      continue;
    }
    failed += 1;
    console.log(`  FAIL  ${check.name}`);
    for (const problem of problems.slice(0, 10)) console.log(`          ${problem}`);
    if (problems.length > 10) console.log(`          ... and ${problems.length - 10} more`);
  }

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll checks passed.");
}

async function renderedFiles(): Promise<string[]> {
  const roots = [
    ...TREES.map((tree) => path.join(repoRoot, tree.dir)),
    ...TREES.map((tree) => path.join(repoRoot, tree.entryFile)),
    path.join(repoRoot, SHARED.dir),
    path.join(repoRoot, "template")
  ];

  const files: string[] = [];
  for (const root of roots) {
    let stat;
    try {
      stat = await fs.stat(root);
    } catch {
      continue;
    }
    if (stat.isFile()) files.push(root);
    else files.push(...(await walkIfPresent(root)));
  }
  return files;
}

async function walkIfPresent(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".claude" && entry.name !== ".agents") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walkIfPresent(full)));
    else files.push(full);
  }
  return files;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
