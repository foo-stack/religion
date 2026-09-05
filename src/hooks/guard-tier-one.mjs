#!/usr/bin/env node
/**
 * Blocks first-tier commands that were not approved in the conversation.
 *
 * This enforces nothing new. The Authority section of the project entry file already says
 * merging, pushing, deploying, publishing, deleting data, and rewriting history each need
 * a fresh yes. The hook exists because that rule is prose, and prose can be forgotten
 * mid-task. It is a safety net for one tool, never a rule of its own.
 *
 * These patterns match how a command is usually written, not what it does. A script, or the
 * same effect spelled another way, passes silently. Deletion is deliberately not here: it
 * has more everyday spellings than the others put together, so a pattern for it caught the
 * common one while `find -delete` and a one-line script went straight past, which is worse
 * than not guarding it, because the gap is invisible. Deleting data remains first tier in
 * the prose, where it applies to every tool rather than to one spelling.
 */

import { readFileSync } from "node:fs";

const PATTERNS = [
  { re: /\bgit\s+push\b/, what: "pushing to a remote" },
  { re: /\bgit\s+merge\b/, what: "merging" },
  { re: /\bgit\s+(?:rebase|reset\s+--hard|filter-branch)\b/, what: "rewriting history" },
  { re: /\bgit\s+commit\b.*--amend\b/, what: "rewriting a commit" },
  { re: /\bnpm\s+publish\b|\bpnpm\s+publish\b|\byarn\s+publish\b/, what: "publishing" },
  { re: /\b(?:vercel|railway|render)\s+(?:deploy|up)\b/, what: "deploying" }
];

/**
 * Degrade to a prompt when this guard cannot do its job.
 *
 * A guard that fails open becomes the exact outcome it exists to prevent: the command runs
 * and nobody was asked. Failing closed is no better, because one malformed payload from a
 * runtime change would block every push, merge, publish or deploy until somebody edits a hook. Asking is the
 * honest middle: the user sees the command and decides, and the cost of a bug here is one
 * extra prompt rather than a silent pass.
 */
function askBecauseGuardFailed(error) {
  const detail = error instanceof Error ? error.message : String(error);
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason:
        `The first-tier guard hook could not run, so this command was not checked.\n\n` +
        `Reason: ${detail}\n\n` +
        `Approve it only if you would have approved it anyway. The guard is not covering ` +
        `you right now, and that is worth reporting.`
    }
  }));
  process.exit(0);
}

// Covers the whole hook, not only the reads below: any throw reaches this and still asks.
process.on("uncaughtException", askBecauseGuardFailed);


let input = "";
try {
  input = readFileSync(0, "utf8");
} catch (error) {
  askBecauseGuardFailed(error);
}

let command = "";
try {
  const payload = JSON.parse(input);
  command = payload?.tool_input?.command ?? "";
} catch (error) {
  askBecauseGuardFailed(error);
}

if (!command) process.exit(0);

// A force flag makes an otherwise ordinary command destructive, so it is always first tier.
const forced = /--force\b|(?:^|\s)-f(?:\s|$)/.test(command) && /\bgit\s+push\b/.test(command);

for (const { re, what } of PATTERNS) {
  if (!re.test(command)) continue;

  const reason =
    `Blocked: ${what}${forced ? " (forced)" : ""} is a first-tier action.\n\n` +
    `The Authority section of this project's entry file requires an explicit yes for it, ` +
    `in this conversation. The one narrow exception is an automated run under ` +
    `git.mode pull-request, which may push branches it created after enumerating exactly ` +
    `that at invocation. This prompt is a net, not a second opinion: if that grant was ` +
    `given, confirm and continue.\n\n` +
    `If the user has already approved this exact action, say so and ask them to confirm ` +
    `once more, then proceed. Do not edit or disable this hook to get past it.`;

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: reason
    }
  }));
  process.exit(0);
}

process.exit(0);
