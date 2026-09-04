#!/usr/bin/env node
/**
 * Regenerates the handoff file at the end of a turn.
 *
 * The handoff answers "where does this sit, what should I read, what should I watch" for
 * whoever picks the project up next. It is derived from the other state files, so a hook
 * can produce it and the model cannot forget to. Losing it costs nothing.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const STATE = "religion";
const root = process.cwd();
const contextDir = path.join(root, STATE, "context");
if (!existsSync(contextDir)) process.exit(0);

const read = (file) => {
  try {
    return readFileSync(path.join(root, STATE, file), "utf8");
  } catch {
    return "";
  }
};

const buildPlan = read("build-plan.md");
const work = read("context/current-work.md");
const findings = read("context/findings.md");

const done = (buildPlan.match(/^\s*- \[x\]/gim) ?? []).length;
const open = (buildPlan.match(/^\s*- \[ \]/gim) ?? []).length;
const nextItem = buildPlan.match(/^\s*- \[ \]\s*(.+)$/im)?.[1]?.trim();

const active = !/_Nothing in progress\./.test(work) && work.trim().length > 0;
const title = work.match(/^#\s+(.+)$/m)?.[1]?.trim();
const stepsDone = (work.match(/^\s*- \[x\]/gim) ?? []).length;
const stepsLeft = (work.match(/^\s*- \[ \]/gim) ?? []).length;
const nextStep = work.match(/^\s*- \[ \]\s*(?:\*\*)?(.+?)(?:\*\*)?\s*-/im)?.[1]?.trim();

const blocking = [...findings.matchAll(/^### (F-\d+) \[(P[01])\] (open|fixed) - (.+)$/gim)]
  .map((m) => `${m[1]} [${m[2]}] ${m[3]} - ${m[4]}`);

const lines = [
  "# Handoff",
  "",
  "> **Generated file.** Rewritten at the end of each turn from the other state files.",
  "> Nothing reads it to make a decision; it is how a person or a fresh session catches up.",
  "",
  "## Where the work sits",
  ""
];

if (active) {
  lines.push(
    `**${title ?? "Active work"}** is in progress: ${stepsDone} step(s) done, ${stepsLeft} to go.`,
    ...(nextStep ? [`Next step: ${nextStep}.`] : []),
    ""
  );
} else {
  lines.push("Nothing in progress.", "");
}

lines.push(
  `Plan: ${done} of ${done + open} item(s) complete.` + (nextItem ? ` Next up: ${nextItem}` : ""),
  ""
);

if (blocking.length > 0) {
  lines.push("## Blocking findings", "", ...blocking.map((f) => `- ${f}`), "",
    "These prevent completion until repaired and re-reviewed.", "");
}

lines.push(
  "## Read first",
  "",
  `1. \`${STATE}/context/current-work.md\` - the active spec and which steps are done`,
  `2. \`${STATE}/context/project-overview.md\` - the source of truth`,
  `3. \`${STATE}/build-plan.md\` - what is done and what is next`,
  ""
);

writeFileSync(path.join(contextDir, "handoff.md"), lines.join("\n") + "\n");
process.exit(0);
