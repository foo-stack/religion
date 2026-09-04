/**
 * Deterministic health checks.
 *
 * Everything here is decidable by reading files, which is why it belongs in a program
 * rather than in a skill. The skill's job is explaining what a failure means.
 */

import fs from "node:fs/promises";
import path from "node:path";

import { exists, readIfPresent, STATE_DIR, statePath } from "./paths.js";
import { readProjectState } from "./state.js";

export interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
  blocks: "work" | "completion" | "nothing";
}

const REQUIRED = [
  "config.json",
  "project-plan.md",
  "build-plan.md",
  "context/project-overview.md",
  "context/coding-standards.md",
  "context/untrusted-input.md",
  "context/ai-interaction.md",
  "context/current-work.md",
  "context/findings.md",
  "history/features",
  "history/fixes",
  "history/rollbacks",
  "history/refactors",
  "reference"
];

const ALLOWED: Record<string, readonly string[]> = {
  "workflow.stepReview": ["every", "item"],
  "git.mode": ["trunk", "branch-per-item", "pull-request"],
  "git.checkpoints": ["none", "every-step", "squash"],
  "verification.logicTests": ["when-configured", "required"],
  "verification.uiEvidence": ["when-available", "required"],
  "qualityGates.audit": ["manual", "when-sensitive", "always"],
  "qualityGates.check": ["manual", "when-behavioral", "always"]
};

export async function runDoctor(root: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const state = await readProjectState(root);

  const missing: string[] = [];
  for (const relative of REQUIRED) {
    if (!(await exists(statePath(root, relative)))) missing.push(relative);
  }
  results.push({
    name: "required files",
    ok: missing.length === 0,
    detail: missing.length === 0 ? `all ${REQUIRED.length} present` : `missing: ${missing.join(", ")}`,
    blocks: missing.some((m) => m.startsWith("history/")) ? "completion" : "work"
  });

  if (!state.configValid) {
    results.push({ name: "configuration", ok: false, detail: "config.json does not parse", blocks: "work" });
  } else {
    const bad = invalidSettings(state.config);
    results.push({
      name: "configuration",
      ok: bad.length === 0,
      detail: bad.length === 0 ? "valid" : bad.join("; "),
      blocks: "work"
    });
  }

  const trees = [".claude/skills", ".agents/skills"];
  const present: Record<string, string[]> = {};
  for (const tree of trees) {
    const dir = path.join(root, tree);
    if (!(await exists(dir))) continue;
    present[tree] = (await fs.readdir(dir, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  }
  const installed = Object.keys(present);
  if (installed.length === 0) {
    results.push({ name: "adapters", ok: false, detail: "no skill tree installed", blocks: "work" });
  } else if (installed.length === 1) {
    results.push({
      name: "adapters",
      ok: true,
      detail: `${installed[0]} with ${present[installed[0] as string]?.length ?? 0} skills`,
      blocks: "nothing"
    });
  } else {
    const [a, b] = installed as [string, string];
    const same = JSON.stringify(present[a]) === JSON.stringify(present[b]);
    results.push({
      name: "adapters",
      ok: same,
      detail: same ? `${installed.length} trees, same skills` : `${a} and ${b} hold different skills`,
      blocks: "nothing"
    });
  }

  const entry = (await readIfPresent(path.join(root, "AGENTS.md"))) ??
    (await readIfPresent(path.join(root, "CLAUDE.md")));
  const placeholder = entry !== null && entry.includes(`${STATE_DIR}:setup-required`);
  results.push({
    name: "entry file commands",
    ok: entry !== null && !placeholder,
    detail:
      entry === null
        ? "no entry file found"
        : placeholder
          ? "still the shipped placeholder; setup has not run"
          : "filled in",
    blocks: "work"
  });

  results.push({
    name: "overview freshness",
    ok: state.overviewPresent && state.overviewFresh !== false,
    detail: !state.overviewPresent
      ? "not generated yet"
      : state.overviewFresh === false
        ? "the plans changed after it was generated"
        : "current",
    blocks: "work"
  });

  const gitignore = (await readIfPresent(path.join(root, ".gitignore"))) ?? "";
  const ignored = new RegExp(`^\\s*/?${STATE_DIR}/?\\s*$`, "m").test(gitignore);
  results.push({
    name: "visibility",
    ok: true,
    detail: ignored ? "state is local only" : "state is committed",
    blocks: "nothing"
  });

  results.push({
    name: "git",
    ok: await exists(path.join(root, ".git")),
    detail: (await exists(path.join(root, ".git"))) ? "repository present" : "not a git repository",
    blocks: "completion"
  });

  return results;
}

function invalidSettings(config: unknown): string[] {
  const problems: string[] = [];
  if (config === null || typeof config !== "object") return ["not an object"];

  for (const [key, allowed] of Object.entries(ALLOWED)) {
    const value = key.split(".").reduce<unknown>(
      (node, part) => (node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined),
      config
    );
    if (value === undefined) continue;
    if (!allowed.includes(String(value))) {
      problems.push(`${key} is "${String(value)}", expected one of ${allowed.join(", ")}`);
    }
  }
  return problems;
}

export function renderDoctor(results: readonly CheckResult[]): string {
  const failures = results.filter((r) => !r.ok);
  const order = { work: 0, completion: 1, nothing: 2 } as const;
  const sorted = [...failures].sort((a, b) => order[a.blocks] - order[b.blocks]);

  const out: string[] = [
    failures.length === 0 ? "Healthy." : `${failures.length} problem(s).`,
    ""
  ];

  for (const result of sorted) {
    const what = result.blocks === "nothing" ? "cosmetic" : `blocks ${result.blocks}`;
    out.push(`  FAIL  ${result.name} (${what})`, `          ${result.detail}`);
  }
  if (failures.length > 0) out.push("");

  for (const result of results.filter((r) => r.ok)) {
    out.push(`  ok    ${result.name}: ${result.detail}`);
  }

  return out.join("\n");
}
