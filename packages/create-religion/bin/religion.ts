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

import { EXIT_CODES, parseArgs } from "../lib/args.js";
import { changesSince } from "../lib/changelog.js";
import { applyUninstall, planUninstall } from "../lib/uninstall.js";
import type { UninstallEntry } from "../lib/uninstall.js";
import type { Options } from "../lib/args.js";
import { startDashboard } from "../lib/dashboard.js";
import { doctorReport, renderDoctor, runDoctor } from "../lib/doctor.js";
import {
  ADAPTERS,
  applyInstall,
  BACKUPS,
  manifestRefusal,
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

async function main(argv: readonly string[]): Promise<void> {
  const parsed = parseArgs(argv, { cwd: process.cwd(), isDirectory });
  if (!parsed.ok) {
    console.error(parsed.error);
    console.error("Run `religion help` for usage.");
    process.exitCode = 2;
    return;
  }
  const options = parsed.options;

  if (options.command === "help") return printHelp();
  if (options.command === "install" || options.command === "update") return runInstall(options);

  const root = await findProjectRoot(options.target);
  if (!root) {
    console.error("No Religion project found here or in any parent directory.");
    console.error("Run `religion install` from the project root to add one.");
    process.exit(1);
  }

  if (options.command === "uninstall") return runUninstall(root, options);

  if (options.command === "status") {
    const status = computeStatus(await readProjectState(root));
    console.log(options.json ? JSON.stringify(status, null, 2) : renderStatus(status));
    return;
  }

  if (options.command === "doctor") {
    const report = doctorReport(await runDoctor(root));
    console.log(options.json ? JSON.stringify(report, null, 2) : renderDoctor(report.checks));
    if (!report.healthy) process.exitCode = 1;
    return;
  }

  const dashboard = await startDashboard(root, await version());
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
  const packageVersion = await version();

  const refusal = manifestRefusal(previous, packageVersion);
  if (refusal) {
    console.error(refusal);
    process.exitCode = 1;
    return;
  }

  if (updating && !previous) {
    console.log("No manifest found. Files matching the template will be adopted; others are conflicts.");
  }
  if (updating && previous) await printChanges(previous.version, packageVersion);

  const adapters = options.adapters ?? previous?.adapters ?? (await chooseAdapters(options.yes));
  const plan = await planInstall(templateRoot, target, adapters, previous);

  const counts = {
    create: plan.filter((p) => p.action === "create").length,
    update: plan.filter((p) => p.action === "update").length,
    conflict: plan.filter((p) => p.action === "conflict").length,
    kept: plan.filter((p) => p.action === "seed-skip").length,
    merge: plan.filter((p) => p.action === "merge").length,
    remerge: plan.filter((p) => p.action === "remerge").length,
    rebuild: plan.filter((p) => p.action === "rebuild").length,
    remove: plan.filter((p) => p.action === "remove").length,
    release: plan.filter((p) => p.action === "release").length,
    linked: plan.filter((p) => p.action === "linked").length
  };

  console.log(`\nAdapters: ${adapters.map((a) => ADAPTERS[a].label).join(", ")}`);
  console.log(`  create   ${counts.create}`);
  console.log(`  update   ${counts.update}`);
  console.log(`  keep     ${counts.kept}  (your files, never overwritten)`);
  console.log(`  conflict ${counts.conflict}`);
  for (const entry of plan.filter((p) => p.action === "conflict")) console.log(`    ${entry.relative}`);
  if (counts.merge > 0) console.log(`  merge    ${counts.merge}  (your file, awaiting a decision)`);
  if (counts.remerge > 0) console.log(`  merged   ${counts.remerge}  (your sections kept)`);
  if (counts.rebuild > 0) console.log(`  rebuilt  ${counts.rebuild}  (your sections kept, original backed up)`);
  if (counts.remove > 0) console.log(`  remove   ${counts.remove}  (no longer shipped)`);
  if (counts.release > 0) console.log(`  release  ${counts.release}  (no longer shipped, but edited by you, so left alone)`);
  for (const entry of plan.filter((p) => p.action === "release")) console.log(`    ${entry.relative}`);
  if (counts.linked > 0) console.log(`  linked   ${counts.linked}  (reached through a symbolic link, never written)`);
  for (const entry of plan.filter((p) => p.action === "linked")) console.log(`    ${entry.relative}`);

  const mergeable = plan.filter((p) => p.action === "merge").map((p) => p.relative);
  let merge = false;
  if (mergeable.length > 0) {
    console.log(`\nThese already exist and were written by you:`);
    for (const relative of mergeable) console.log(`    ${relative}`);
    console.log(
      "\nReligion can append its own sections to them inside markers, keeping everything" +
        "\nyou wrote exactly where it is. Later updates then replace only what is between" +
        "\nthose markers. The originals are backed up first."
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
  await writeManifest(target, packageVersion, adapters, templateRoot, previous, [
    ...result.conflicts,
    ...result.declined,
    ...result.linked
  ]);

  console.log(`\nWrote ${result.written.length} file(s).`);
  if (result.merged.length > 0) {
    console.log(`Merged ${result.merged.length} entry file(s), keeping what you wrote.`);
  }
  if (result.rebuilt.length > 0) {
    console.log(
      `Rebuilt ${result.rebuilt.length} entry file(s) around the sections you wrote. The originals are in ` +
        `${BACKUPS}.`
    );
  }
  if (result.removed.length > 0) console.log(`Removed ${result.removed.length} file(s) this version no longer ships.`);
  if (result.released.length > 0) {
    console.log(`Left ${result.released.length} file(s) this version no longer ships, because you edited them. They are yours now.`);
  }
  if (result.backups.length > 0) {
    console.log(`Backed up ${result.backups.length} file(s) to ${BACKUPS} before changing them.`);
  }
  if (result.linked.length > 0) {
    process.exitCode = 1;
    console.log(
      `\n${result.linked.length} file(s) are reached through a symbolic link and were left alone, since writing` +
        `\nthem would write wherever the link points. Replace the links with real files and run again.`
    );
  }
  if (result.declined.length > 0) {
    process.exitCode = 1;
    console.log(
      `\n${result.declined.length} file(s) of yours were not merged, so Religion's instructions are not in them.` +
        `\nRun update again and accept the merge, or pass --yes, to add them.`
    );
  }
  if (result.conflicts.length > 0) {
    process.exitCode = 1;
    console.log(
      `\n${result.conflicts.length} file(s) were changed locally and left alone.` +
        `\nReview them, then re-run with --force to replace them (originals are backed up).`
    );
  }

  if (adapters.includes("claude")) {
    const wired = await wireHooks(target);
    if (wired === "written") {
      console.log("Wired the enforcement hooks into .claude/settings.json.");
    } else if (wired === "linked") {
      process.exitCode = 1;
      console.log(
        "\n.claude/settings.json is a symbolic link and was left alone." +
          "\nIf a hook is missing, compare the file it points to with a fresh install's .claude/settings.json."
      );
    } else if (wired === "exists") {
      console.log(
        "\n.claude/settings.json already exists and was left alone." +
          "\nIf a hook is missing, compare it with a fresh install's .claude/settings.json."
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

const UNINSTALL_LABELS: Record<UninstallEntry["action"], string> = {
  remove: "remove",
  "remove-manifest": "remove",
  "cut-block": "cut Religion's block from",
  unwire: "take Religion's hooks out of",
  "keep-edited": "keep, edited since install:",
  "keep-linked": "keep, not a plain file:",
  "keep-entry": "keep, cannot be split safely:",
  "keep-settings": "keep, could not be read:"
};

/** Show the plan, then carry it out only with `--yes` or a yes at the prompt. */
async function runUninstall(root: string, options: Options): Promise<void> {
  const plan = await planUninstall(root);
  if (plan.length === 0) {
    console.error("No install record found, so there is nothing Religion knows it installed here.");
    process.exitCode = 1;
    return;
  }

  console.log(`\nUninstalling Religion from ${root}. The plans, history and the rest of ${STATE_DIR}/ stay.\n`);
  for (const entry of plan) {
    console.log(`  ${UNINSTALL_LABELS[entry.action]} ${entry.relative}${entry.why ? ` (${entry.why})` : ""}`);
  }

  if (options.dryRun) {
    console.log("\nDry run. Nothing removed.");
    return;
  }
  if (!(await confirmUninstall(options.yes))) {
    console.log("\nNothing removed. Run with --yes to remove what is listed.");
    return;
  }

  const result = await applyUninstall(root, plan);
  console.log(`\nRemoved ${result.removed.length} file(s).`);
  if (result.cut.length > 0) console.log(`Cut Religion's block from ${result.cut.join(", ")}, keeping what you wrote.`);
  if (result.unwired.length > 0) console.log(`Took Religion's hooks out of ${result.unwired.join(", ")}, keeping your own settings.`);
  if (result.backups.length > 0) console.log(`Backed up ${result.backups.length} file(s) to ${BACKUPS} before changing them.`);
  const kept = result.kept.filter((entry) => entry.action !== "keep-edited");
  if (result.kept.length > 0) console.log(`Kept ${result.kept.length} file(s), listed above, for you to remove or keep.`);
  if (kept.length > 0) process.exitCode = 1;
}

/** Defaults to no: removing files is the one thing this tool does that cannot be redone by running it again. */
async function confirmUninstall(assumeYes: boolean): Promise<boolean> {
  if (assumeYes || !process.stdin.isTTY) return assumeYes;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question("\nRemove what is listed? [y/N] ")).trim().toLowerCase();
  rl.close();
  return answer === "y" || answer === "yes";
}

/** What changed since the installed version, from the changelog the package ships. */
async function printChanges(installed: unknown, current: string): Promise<void> {
  const file = path.join(packageRoot, "CHANGELOG.md");
  const releases = changesSince(await fs.readFile(file, "utf8").catch(() => null), installed, current);
  if (releases.length === 0) return;
  console.log(`\nWhat changed since ${String(installed)}:`);
  for (const release of releases) {
    console.log(`  ${release.version}`);
    for (const change of release.changes) console.log(`    - ${change}`);
  }
  console.log(`  The whole changelog: ${file}`);
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

function isDirectory(candidate: string): boolean {
  try {
    return fsSync.statSync(path.resolve(candidate)).isDirectory();
  } catch {
    return false;
  }
}

function printHelp(): void {
  console.log(`religion - a file-backed, spec-driven AI development workflow

Run as \`npx create-religion <command>\`, or as \`religion <command>\` when the package
is installed globally.

  install [dir]     add the workflow to a project
  update  [dir]     update the workflow files, preserving your own
  uninstall [dir]   take the workflow back out, keeping the plans and history
  status            where the work stands, and what to do next
  doctor            check the setup is healthy
  dashboard         a local read-only view

Options
  --claude --codex --copilot --opencode   pick adapters (default: all)
  --dry-run     show what would change, write nothing
  --force       replace locally-changed managed files, backing them up first
  --json        machine-readable output for status and doctor
  --yes         no prompts

Exit codes
${Object.entries(EXIT_CODES)
  .map(([code, meaning]) => `  ${code.padEnd(4)}${meaning.replace(/\n/g, "\n      ")}`)
  .join("\n")}
`);
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
