/**
 * Repository checks that must pass before rendered output is trusted.
 *
 * These exist because ad-hoc shell checks kept reporting success while real problems sat
 * unexamined: a pipeline's exit status comes from its last command, so `grep ... | head`
 * always succeeds. Each check here returns a count and a list, and the runner decides.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import fsSync from "node:fs";
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
  },
  {
    name: "every configuration key is documented",
    run: async () => {
      // A setting that ships without a row in the reference is invisible: nobody can set
      // what they cannot find, and the default becomes the only value anyone ever uses.
      const config = JSON.parse(
        await fs.readFile(path.join(repoRoot, "src", "state", "config.json"), "utf8")
      ) as Record<string, unknown>;
      const docs = await fs.readFile(path.join(repoRoot, "docs/architecture/config.md"), "utf8");

      const problems: string[] = [];
      for (const [section, value] of Object.entries(config)) {
        if (typeof value !== "object" || value === null) continue;
        for (const key of Object.keys(value as Record<string, unknown>)) {
          const setting = `${section}.${key}`;
          if (!docs.includes(`\`${setting}\``)) problems.push(`config.json: ${setting} has no row in config.md`);
        }
      }
      return problems;
    }
  },
  {
    name: "the command-line tool requires what the template ships",
    run: async () => {
      // doctor reports a missing state file as a problem, so its list and the seeded tree
      // have to agree. When they drift, doctor either misses a real gap or invents one.
      const doctorSource = await fs.readFile(
        path.join(repoRoot, "packages/create-religion/lib/doctor.ts"),
        "utf8"
      );
      const block = /const REQUIRED[^=]*=\s*\[([\s\S]*?)\];/.exec(doctorSource);
      if (!block?.[1]) return ["doctor.ts: could not find the REQUIRED list"];

      const required = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1] as string);
      const stateRoot = path.join(repoRoot, "src", "state");

      const problems: string[] = [];
      for (const relative of required) {
        if (!fsSync.existsSync(path.join(stateRoot, relative))) {
          problems.push(`doctor.ts requires ${relative}, which the template does not ship`);
        }
      }
      for (const entry of await fs.readdir(path.join(stateRoot, "history"), { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const relative = `history/${entry.name}`;
        if (!required.includes(relative)) {
          problems.push(`template ships ${relative}, which doctor.ts does not require`);
        }
      }
      return problems;
    }
  },
  {
    name: "shipped content carries no injection signatures or credentials",
    run: async () => {
      // Religion ships prompt text, not code that runs. Every skill and state file lands in
      // someone else's context as trusted, always-loaded instructions, in the one place the
      // untrusted-input rule explicitly does not apply. A poisoned line here would be read
      // as an instruction by every install, which is a sharper supply chain than a package
      // whose worst case is code executing.
      //
      // These patterns are deliberately not shared with the runtime hook. That hook scans
      // arbitrary content a project reads; this scans text this project is about to publish.
      // Different surfaces, different tuning, and the hook has to stay standalone because it
      // is copied into projects where this file does not exist.
      const INJECTION = [
        /ignore\s+(?:all\s+)?(?:previous|above|prior)\s+instructions/i,
        /disregard\s+(?:all\s+)?(?:previous|prior|the\s+above)/i,
        /forget\s+(?:all\s+)?(?:your\s+)?(?:previous\s+)?instructions/i,
        /override\s+(?:the\s+)?(?:system|previous)\s+(?:prompt|instructions)/i,
        /from\s+now\s+on,?\s+you\s+(?:are|will|should|must)/i,
        /(?:reveal|repeat|print)\s+(?:your\s+)?(?:system\s+)?(?:prompt|instructions)/i,
        /<<\s*SYS\s*>>/i,
        /\[(?:SYSTEM|INST)\]/
      ];
      const SECRETS = [
        { re: /\bnpm_[A-Za-z0-9]{36}\b/, what: "an npm token" },
        { re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/, what: "a GitHub token" },
        { re: /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/, what: "a private key" },
        { re: /\bAKIA[0-9A-Z]{16}\b/, what: "an AWS access key id" }
      ];

      // Two files quote these phrasings in order to describe them. A check that fires on
      // its own documentation is one people learn to skip.
      const EXEMPT = ["untrusted-input.md", "scan-untrusted-input.mjs"];

      const roots = [
        path.join(repoRoot, "src", "skills"),
        path.join(repoRoot, "src", "entry"),
        path.join(repoRoot, "src", "state"),
        path.join(repoRoot, "src", "hooks"),
        path.join(repoRoot, "template")
      ];

      const problems: string[] = [];
      for (const root of roots) {
        for (const file of await walkIfPresent(root)) {
          if (EXEMPT.some((name) => file.endsWith(name))) continue;
          const contents = await fs.readFile(file, "utf8");
          const where = path.relative(repoRoot, file);
          contents.split(/\r?\n/).forEach((line, index) => {
            // One report per line: a line matching two patterns is one problem, not two.
            const signatures = INJECTION.filter((re) => re.test(line)).length;
            if (signatures > 0) {
              problems.push(
                `${where}:${index + 1}: ${signatures} injection signature${signatures === 1 ? "" : "s"}: ` +
                line.trim().slice(0, 80)
              );
            }
            const secret = SECRETS.find(({ re }) => re.test(line));
            if (secret) problems.push(`${where}:${index + 1}: looks like ${secret.what}`);
          });
        }
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
