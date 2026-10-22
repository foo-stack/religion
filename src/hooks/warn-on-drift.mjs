#!/usr/bin/env node
/**
 * Asks before an edit to a file the active spec does not name.
 *
 * Backs the rule that implementation builds only what the spec says. A file is named when it
 * appears in backticks in the current step or in the spec's Files and areas; the workflow's own
 * state, changesets and rendered skill trees are always allowed. Anything else stops for a
 * person: either the spec needs an amendment, or the edit is drifting from it.
 */

import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";

const STATE = "religion";
const ALWAYS = [`${STATE}/`, ".changeset/", ".claude/skills/", ".agents/skills/"];

// This hook only advises, so anything it cannot read leaves the edit alone rather than failing a turn.
process.on("uncaughtException", () => process.exit(0));

// Real paths on both sides: a temp or symlinked directory can reach here under two names.
const real = (target) => {
  try {
    return realpathSync(target);
  } catch {
    const parent = path.dirname(target);
    return parent === target ? target : path.join(real(parent), path.basename(target));
  }
};
const root = real(process.cwd());
let spec = "";
try {
  spec = readFileSync(path.join(root, STATE, "context", "current-work.md"), "utf8");
} catch {
  process.exit(0);
}
if (!spec.trim() || /_Nothing in progress\./.test(spec)) process.exit(0);

const input = JSON.parse(readFileSync(0, "utf8"))?.tool_input;
const file = input?.file_path ?? input?.notebook_path;
if (typeof file !== "string" || !file) process.exit(0);
const relative = path.relative(root, real(path.resolve(root, file))).split(path.sep).join("/");
if (!relative || relative === ".." || relative.startsWith("../") || path.isAbsolute(relative)) process.exit(0);
if (ALWAYS.some((prefix) => relative.startsWith(prefix))) process.exit(0);

const section = (heading) => spec.split(/^(?=## )/m).find((part) => new RegExp(`^## ${heading}\\s*$`, "im").test(part.split("\n", 1)[0])) ?? "";
// Split on top-level steps only, so a step keeps its own sub-steps; [ \t]* rather than \s* keeps
// the pattern from scanning across blank lines, which made a large spec take seconds per edit.
const steps = section("Build steps").split(/^(?=- \[[ xX]\])/m);
const current = steps.find((step) => /^- \[ \]/.test(step)) ?? "";
const spans = (text) => [...text.matchAll(/`([^`\s]+)`/g)].map((m) => m[1].replace(/^\.\//, "").replace(/(:\d+){1,2}$|#L\d+(-L?\d+)?$/, ""));
// A step's spans include commands and values, so only path-like ones count there; Files and
// areas lists nothing but files, `Makefile` included.
const names = [...spans(current).filter((name) => name.includes("/") || name.includes(".")), ...spans(section("Files and areas"))]
  .filter((name) => name && !/^[./*]+$/.test(name));
const named = names.some((name) =>
  relative === name ||
  // A bare name is one file at the root; only a path with a directory may stand for a deeper one.
  (name.includes("/") && relative.endsWith("/" + name)) ||
  relative.startsWith(name.endsWith("/") ? name : name + "/")
);
if (named) process.exit(0);

const shown = relative.replace(/[\p{Cc}\p{Cf}]/gu, "");
process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "ask",
    permissionDecisionReason:
      `${shown} is not named in the current step or in the spec's Files and areas.\n\n` +
      `If the work needs it, amend the spec with the reason and renew its stamp. If it does not, ` +
      `this edit is drifting from the spec.`
  }
}));
process.exit(0);
