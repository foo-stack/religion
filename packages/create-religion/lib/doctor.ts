/**
 * Deterministic health checks.
 *
 * Everything here is decidable by reading files, which is why it belongs in a program
 * rather than in a skill. The skill's job is explaining what a failure means.
 */

import fs from "node:fs/promises";
import path from "node:path";

import { exists, readIfPresent, SKILL_TREES, STATE_DIR, statePath } from "./paths.js";
import { editedSinceInstall, isPlainFile } from "./install.js";
import { SETTINGS, settingProblems } from "./settings.js";
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
  "context/inbox.md",
  "history/features",
  "history/fixes",
  "history/rollbacks",
  "history/refactors",
  "history/spikes",
  "reference"
];

/** The values each enumerated setting accepts, as the surface record lists them. */
export const ALLOWED: Record<string, readonly string[]> = Object.fromEntries(
  Object.entries(SETTINGS).flatMap(([key, setting]) => (setting.kind === "enum" ? [[key, setting.values]] : []))
);

/** `changes` lets a caller that already compared the managed files share the result. */
export async function runDoctor(
  root: string,
  changes?: Awaited<ReturnType<typeof editedSinceInstall>>
): Promise<CheckResult[]> {
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
    const bad = settingProblems(state.config);
    results.push({
      name: "configuration",
      ok: bad.length === 0,
      detail: bad.length === 0 ? "valid" : bad.join("; "),
      blocks: "work"
    });
  }

  const trees = SKILL_TREES;
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

  results.push(managedFilesCheck(changes === undefined ? await editedSinceInstall(root) : changes));
  results.push(await readHooks(root));

  return results;
}

const SETTINGS_FILE = ".claude/settings.json";

/**
 * The hooks this version wires, held equal to the shipped settings template by verification.
 * Not the project's own copy of that template, which is seeded once and goes stale.
 */
export const HOOKS: readonly Hook[] = [
  { event: "PreToolUse", command: "node .claude/hooks/guard-rendered-output.mjs" },
  { event: "Stop", command: "node .claude/hooks/write-handoff.mjs" },
  { event: "PostToolUse", command: "node .claude/hooks/scan-untrusted-input.mjs" }
];

async function readHooks(root: string): Promise<CheckResult> {
  const settings = (await isPlainFile(root, SETTINGS_FILE))
    ? await readIfPresent(path.join(root, ...SETTINGS_FILE.split("/")))
    : (await fs.lstat(path.join(root, ...SETTINGS_FILE.split("/"))).catch(() => null))
      ? "link"
      : null;
  const files = new Set<string>();
  for (const { command } of HOOKS) {
    const file = hookFile(command);
    if (file && (await isPlainFile(root, file))) files.add(file);
  }
  return hooksCheck({ installed: await exists(path.join(root, ".claude", "skills")), wanted: HOOKS, settings, files });
}

export interface Hook {
  event: string;
  command: string;
}

/** Every `(event, command)` a settings file registers, or null when it does not parse. */
export function parseHooks(source: string | null): Hook[] | null {
  if (source === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    return null;
  }
  const hooks = parsed && typeof parsed === "object" ? (parsed as { hooks?: unknown }).hooks : undefined;
  if (!hooks || typeof hooks !== "object") return [];
  return Object.entries(hooks).flatMap(([event, groups]) =>
    (Array.isArray(groups) ? groups : []).flatMap((group: unknown) => {
      const inner = group && typeof group === "object" ? (group as { hooks?: unknown }).hooks : undefined;
      return (Array.isArray(inner) ? inner : []).flatMap((hook: unknown) => {
        const command = hook && typeof hook === "object" ? (hook as { command?: unknown }).command : undefined;
        return typeof command === "string" ? [{ event, command }] : [];
      });
    })
  );
}

function hookFile(command: string): string | null {
  return /^node\s+(\.claude\/hooks\/[\w.-]+\.mjs)$/.exec(command.trim())?.[1] ?? null;
}

/**
 * Whether Claude Code's settings register every hook the wiring template names, under the same
 * event, with each hook's file present. Matchers are not compared: a user may tune them.
 */
export function hooksCheck(input: {
  installed: boolean;
  wanted: readonly Hook[];
  settings: string | "link" | null;
  files: ReadonlySet<string>;
}): CheckResult {
  const result = (ok: boolean, detail: string): CheckResult => ({ name: "hooks", ok, detail, blocks: "nothing" });
  if (!input.installed) return result(true, "Claude Code is not installed here");
  if (input.settings === "link") return result(false, `${SETTINGS_FILE} is a link, so it was not read`);
  if (input.settings === null) return result(false, `${SETTINGS_FILE} is missing; a fresh install writes it`);
  const registered = parseHooks(input.settings);
  if (registered === null) return result(false, `${SETTINGS_FILE} does not parse`);

  const unwired = input.wanted.filter((w) => !registered.some((r) => r.event === w.event && r.command.trim() === w.command.trim()));
  const fileless = input.wanted.filter((w) => {
    const file = hookFile(w.command);
    return file !== null && !input.files.has(file);
  });
  if (unwired.length === 0 && fileless.length === 0) return result(true, `all ${input.wanted.length} wired`);

  const name = (hook: Hook) => `${hookFile(hook.command)?.split("/").pop() ?? hook.command} (${hook.event})`;
  const parts = [
    unwired.length ? `not registered in ${SETTINGS_FILE}: ${unwired.map(name).join(", ")}; copy them from a fresh install's settings` : "",
    fileless.length ? `missing hook file: ${fileless.map(name).join(", ")}; run update` : ""
  ].filter(Boolean);
  return result(false, parts.join("; "));
}

const LISTED = 5;

/** Advisory: an edited managed file is its owner's choice, and `update` keeps it rather than overwriting it. */
export function managedFilesCheck(changes: Awaited<ReturnType<typeof editedSinceInstall>>): CheckResult {
  const result = (detail: string): CheckResult => ({ name: "managed files", ok: true, detail, blocks: "nothing" });
  if (!changes) return result("no install record to compare with");
  const { edited, missing, total } = changes;
  if (edited.length === 0 && missing.length === 0) return result(`all ${total} unchanged since install`);

  const changed = [...edited, ...missing.map((file) => `${file} (missing)`)];
  const shown = changed.slice(0, LISTED).join(", ") + (changed.length > LISTED ? `, and ${changed.length - LISTED} more` : "");
  return result(`${edited.length} edited and ${missing.length} missing of ${total} since install: ${shown}`);
}

/** The `doctor --json` shape, versioned so it can gain fields without breaking readers. */
export interface DoctorReport {
  schemaVersion: 1;
  healthy: boolean;
  checks: CheckResult[];
}

export function doctorReport(checks: readonly CheckResult[]): DoctorReport {
  return { schemaVersion: 1, healthy: checks.every((check) => check.ok), checks: [...checks] };
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
