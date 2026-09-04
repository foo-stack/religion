#!/usr/bin/env node
/**
 * The Religion command-line tool.
 *
 * Install and update the workflow files, and read project state. It never runs a workflow
 * command: deciding what to build is the agent's job, and reporting what is true is this
 * one's.
 */

import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

import { startDashboard } from "../lib/dashboard.js";
import { renderDoctor, runDoctor } from "../lib/doctor.js";
import {
  ADAPTERS,
  applyInstall,
  planInstall,
  readManifest,
  wireHooks,
  writeManifest
} from "../lib/install.js";
import type { Adapter } from "../lib/install.js";
import { findProjectRoot, STATE_DIR } from "../lib/paths.js";
import { readProjectState } from "../lib/state.js";
import { computeStatus, renderStatus } from "../lib/status.js";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Finds the installed package root by walking up for the template.
 *
 * The depth differs between running from source and running from the build: in the
 * repository this file sits at `bin/`, one level below the package, while a published
 * install puts it at `dist/bin/`, two levels below. A fixed `..` is correct in exactly one
 * of those, and gets the other silently wrong: the template resolves to a directory that
 * does not exist, the walk returns nothing, and the install reports success having written
 * no files.
 */
function findPackageRoot(from: string): string {
  let current = from;
  for (let depth = 0; depth < 5; depth += 1) {
    if (fsSync.existsSync(path.join(current, "template"))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error(
    "Could not find the template directory. This install of create-religion is incomplete; reinstall it."
  );
}

const packageRoot = findPackageRoot(here);
const templateRoot = path.join(packageRoot, "template");

interface Options {
  command: "install" | "update" | "status" | "doctor" | "dashboard" | "help";
  adapters: Adapter[] | null;
  json: boolean;
  dryRun: boolean;
  force: boolean;
  yes: boolean;
  target: string;
}

async function main(argv: readonly string[]): Promise<void> {
  const options = parse(argv);

  if (options.command === "help") return printHelp();
  if (options.command === "install" || options.command === "update") return runInstall(options);

  const root = await findProjectRoot(options.target);
  if (!root) {
    console.error("No Religion project found here or in any parent directory.");
    console.error("Run `religion install` from the project root to add one.");
    process.exit(1);
  }

  if (options.command === "status") {
    const status = computeStatus(await readProjectState(root));
    console.log(options.json ? JSON.stringify(status, null, 2) : renderStatus(status));
    return;
  }

  if (options.command === "doctor") {
    const results = await runDoctor(root);
    console.log(options.json ? JSON.stringify(results, null, 2) : renderDoctor(results));
    if (results.some((r) => !r.ok)) process.exitCode = 1;
    return;
  }

  const dashboard = await startDashboard(root);
  console.log(`Religion dashboard: ${dashboard.url}`);
  console.log("Read-only. Press Ctrl+C to stop.");
  process.on("SIGINT", () => {
    void dashboard.close().then(() => process.exit(0));
  });
}

async function runInstall(options: Options): Promise<void> {
  const target = path.resolve(options.target);
  const updating = options.command === "update";
  const previous = await readManifest(target);

  if (updating && !previous) {
    console.log("No manifest found. Files matching the template will be adopted; others are conflicts.");
  }

  const adapters = options.adapters ?? previous?.adapters ?? (await chooseAdapters(options.yes));
  const plan = await planInstall(templateRoot, target, adapters, previous);

  const counts = {
    create: plan.filter((p) => p.action === "create").length,
    update: plan.filter((p) => p.action === "update").length,
    conflict: plan.filter((p) => p.action === "conflict").length,
    kept: plan.filter((p) => p.action === "seed-skip").length,
    merge: plan.filter((p) => p.action === "merge").length,
    remerge: plan.filter((p) => p.action === "remerge").length
  };

  console.log(`\nAdapters: ${adapters.map((a) => ADAPTERS[a].label).join(", ")}`);
  console.log(`  create   ${counts.create}`);
  console.log(`  update   ${counts.update}`);
  console.log(`  keep     ${counts.kept}  (your files, never overwritten)`);
  console.log(`  conflict ${counts.conflict}`);
  if (counts.merge > 0) console.log(`  merge    ${counts.merge}  (your file, awaiting a decision)`);
  if (counts.remerge > 0) console.log(`  merged   ${counts.remerge}  (your sections kept)`);

  for (const entry of plan.filter((p) => p.action === "conflict")) {
    console.log(`    ${entry.relative}`);
  }

  const mergeable = plan.filter((p) => p.action === "merge").map((p) => p.relative);
  let merge = false;
  if (mergeable.length > 0) {
    console.log(`\nThese already exist and were written by you:`);
    for (const relative of mergeable) console.log(`    ${relative}`);
    console.log(
      "\nReligion can append its own sections to them inside markers, keeping everything" +
        "\nyou wrote exactly where it is. Later updates then replace only what is between" +
        "\nthose markers. The originals are backed up either way."
    );
    merge = await confirmMerge(options.yes);
  }

  if (options.dryRun) {
    console.log("\nDry run. Nothing written.");
    return;
  }

  if (plan.length === 0) {
    throw new Error(
      `No template files found under ${templateRoot}. Nothing would be installed, which is never correct.`
    );
  }

  const result = await applyInstall(templateRoot, target, plan, { force: options.force, merge });
  await writeManifest(target, await version(), adapters, templateRoot, previous, result.conflicts);

  console.log(`\nWrote ${result.written.length} file(s).`);
  if (result.merged.length > 0) {
    console.log(`Merged ${result.merged.length} entry file(s), keeping what you wrote.`);
  }
  if (result.backups.length > 0) console.log(`Backed up ${result.backups.length} conflicting file(s).`);
  if (result.conflicts.length > 0) {
    console.log(
      `\n${result.conflicts.length} file(s) were changed locally and left alone.` +
        `\nReview them, then re-run with --force to replace them (originals are backed up).`
    );
  }

  if (adapters.includes("claude")) {
    const wired = await wireHooks(target);
    if (wired === "written") {
      console.log("Wired the enforcement hooks into .claude/settings.json.");
    } else if (wired === "exists") {
      console.log(
        "\n.claude/settings.json already exists and was left alone." +
          `\nTo enable the hooks, merge ${path.join(STATE_DIR, ".state", "settings-template.json")} into it.`
      );
    }
  }

  if (!updating) {
    console.log("\nNext: run the setup skill in your AI tool, then fill in the two plans.");
  }
}

/**
 * Ask before rewriting a file the user wrote.
 *
 * Defaults to yes because the merge is additive and reversible: nothing of theirs moves and
 * the original is backed up first. Declining leaves the file untouched and reported as a
 * conflict, which is the old behaviour.
 */
async function confirmMerge(assumeYes: boolean): Promise<boolean> {
  if (assumeYes || !process.stdin.isTTY) return assumeYes;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question("\nMerge them? [Y/n] ")).trim().toLowerCase();
  rl.close();
  return answer === "" || answer === "y" || answer === "yes";
}

async function chooseAdapters(assumeYes: boolean): Promise<Adapter[]> {
  const all = Object.keys(ADAPTERS) as Adapter[];
  if (assumeYes || !process.stdin.isTTY) return all;

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("\nWhich AI tools should this install for?");
  all.forEach((a, i) => console.log(`  ${i + 1}. ${ADAPTERS[a].label}`));

  const answer = (await rl.question("\nNumbers separated by commas, or blank for all: ")).trim();
  rl.close();
  if (!answer) return all;

  const chosen = answer
    .split(",")
    .map((part) => all[Number(part.trim()) - 1])
    .filter((a): a is Adapter => a !== undefined);

  return chosen.length > 0 ? chosen : all;
}

async function version(): Promise<string> {
  try {
    const manifest = JSON.parse(await fs.readFile(path.join(packageRoot, "package.json"), "utf8")) as {
      version?: string;
    };
    return manifest.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function parse(argv: readonly string[]): Options {
  const options: Options = {
    command: "install",
    adapters: null,
    json: false,
    dryRun: false,
    force: false,
    yes: false,
    target: process.cwd()
  };

  const commands = new Set(["install", "update", "status", "doctor", "dashboard", "help"]);
  const adapters: Adapter[] = [];

  for (const arg of argv) {
    if (commands.has(arg)) options.command = arg as Options["command"];
    else if (arg === "--json") options.json = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--force") options.force = true;
    else if (arg === "--yes" || arg === "-y") options.yes = true;
    else if (arg === "--help" || arg === "-h") options.command = "help";
    else if (arg.startsWith("--") && arg.slice(2) in ADAPTERS) adapters.push(arg.slice(2) as Adapter);
    else if (!arg.startsWith("-")) options.target = arg;
  }

  if (adapters.length > 0) options.adapters = adapters;
  return options;
}

function printHelp(): void {
  console.log(`religion - a file-backed, spec-driven AI development workflow

Run as \`npx create-religion <command>\`, or as \`religion <command>\` when the package
is installed globally.

  install [dir]     add the workflow to a project
  update  [dir]     update the workflow files, preserving your own
  status            where the work stands, and what to do next
  doctor            check the setup is healthy
  dashboard         a local read-only view

Options
  --claude --codex --copilot --opencode   pick adapters (default: all)
  --dry-run     show what would change, write nothing
  --force       replace locally-changed managed files, backing them up first
  --json        machine-readable output for status and doctor
  --yes         no prompts
`);
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
