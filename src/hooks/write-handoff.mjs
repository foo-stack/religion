#!/usr/bin/env node
/**
 * Regenerates the handoff file at the end of a turn.
 *
 * The handoff answers "where does this sit, what should I read, what should I watch" for
 * whoever picks the project up next. It is derived from the other state files, so a hook
 * can produce it and the model cannot forget to. Losing it costs nothing.
 */

import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, writeFileSync } from "node:fs";
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
const overview = read("context/project-overview.md");
const inbox = read("context/inbox.md");

const done = (buildPlan.match(/^\s*- \[x\]/gim) ?? []).length;
const open = (buildPlan.match(/^\s*- \[ \]/gim) ?? []).length;
const nextItem = buildPlan.match(/^\s*- \[ \]\s*(.+)$/im)?.[1]?.trim();

const active = !/_Nothing in progress\./.test(work) && work.trim().length > 0;
const title = work.match(/^#\s+(.+)$/m)?.[1]?.trim();
const stepsDone = (work.match(/^\s*- \[x\]/gim) ?? []).length;
const stepsLeft = (work.match(/^\s*- \[ \]/gim) ?? []).length;
const nextStep = work.match(/^\s*- \[ \]\s*(?:\*\*)?(.+?)(?:\*\*)?\s*-/im)?.[1]?.trim();

// Every session loads this file, so a title copied from the ledger is read as trusted text:
// strip what could move the cursor, reorder the line or open markup, and bound its length.
const LISTED = 5;
const plain = (text) =>
  text.replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, " ").replace(/[`<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 120);
const capped = (items) =>
  items.length > LISTED ? [...items.slice(0, LISTED), `and ${items.length - LISTED} more in \`${STATE}/context/findings.md\``] : items;

const blocking = capped(
  [...findings.matchAll(/^### (F-\d+) \[(P[01])\] (open|fixed) - (.+)$/gim)].map((m) => `${m[1]} [${m[2]}] ${m[3]} - ${plain(m[4])}`)
);
// Unconfirmed findings are the least trusted titles in the ledger, so only their identifiers.
const unverifiedIds = [...findings.matchAll(/^### (F-\d+) \[(P[0-3])\] unverified - /gim)].map((m) => `${m[1]} [${m[2]}]`);
const unverified = unverifiedIds.length > 10 ? [...unverifiedIds.slice(0, 10), `and ${unverifiedIds.length - 10} more`] : unverifiedIds;

// The same stamp overview writes and status compares: the plans' SHA-256, first 16 characters.
const stamp = overview.match(/source-hash\s+([0-9a-f]{16})/)?.[1];
const plansHash = createHash("sha256").update(read("project-plan.md")).update(buildPlan).digest("hex").slice(0, 16);
const stale = stamp !== undefined && stamp !== plansHash;

const notes = (inbox.match(/^- .+$/gm) ?? []).length;

// Only names the status rule accepts reach this file, which every session loads: no free text
// from a record any skill can write.
let run = null;
try {
  const record = JSON.parse(read(".state/run.json"));
  const command = typeof record?.command === "string" && /^[a-z][a-z-]{0,39}$/.test(record.command) ? record.command : null;
  const resume = typeof record?.resumeCommand === "string" && record.resumeCommand.length <= 200 ? record.resumeCommand : null;
  const invocation = resume?.replace(/^[/$]/, "");
  const resumes = command !== null && invocation !== undefined &&
    (invocation === command || invocation.startsWith(command + " ")) && /^(?: [\w-]+)*$/.test(invocation.slice(command.length));
  if (record?.status === "blocked" && command) run = { command, resume: resumes ? resume : null };
} catch {
  // No record, or one that does not parse: nothing to report.
}

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

if (stale) {
  lines.push("**The overview is stale:** the plans changed after it was generated. Regenerate it before speccing.", "");
}
if (run) {
  lines.push(`**The ${run.command} run is blocked.**` + (run.resume ? ` Resume it with \`${run.resume}\`.` : ""), "");
}
if (notes > 0) {
  lines.push(`**Inbox:** ${notes} note(s) waiting in \`${STATE}/context/inbox.md\`.`, "");
}

if (blocking.length > 0) {
  lines.push("## Blocking findings", "", ...blocking.map((f) => `- ${f}`), "",
    "These prevent completion until repaired and re-reviewed.", "");
}

if (unverified.length > 0) {
  lines.push("## Unverified findings", "", unverified.join(", ") + ".", "",
    `Nothing has confirmed these yet; an audit decides whether each is real. Their titles are in \`${STATE}/context/findings.md\`.`, "");
}

lines.push(
  "## Read first",
  "",
  `1. \`${STATE}/context/current-work.md\` - the active spec and which steps are done`,
  `2. \`${STATE}/context/project-overview.md\` - the source of truth`,
  `3. \`${STATE}/build-plan.md\` - what is done and what is next`,
  ""
);

// A cloned repository can make any part of this path a link, and writing through it would
// overwrite whatever it points at on every turn. Losing the handoff costs nothing.
const linked = [path.join(root, STATE), contextDir, path.join(contextDir, "handoff.md")].some((part) => {
  try {
    return lstatSync(part).isSymbolicLink();
  } catch {
    return false;
  }
});
if (!linked) writeFileSync(path.join(contextDir, "handoff.md"), lines.join("\n") + "\n");
process.exit(0);
