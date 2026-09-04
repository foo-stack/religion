#!/usr/bin/env node
/**
 * Blocks first-tier commands that were not approved in the conversation.
 *
 * This enforces nothing new. The Authority section of the project entry file already says
 * merging, pushing, deploying, publishing, deleting data, and rewriting history each need
 * a fresh yes. The hook exists because that rule is prose, and prose can be forgotten
 * mid-task. It is a safety net for one tool, never a rule of its own.
 */

import { readFileSync } from "node:fs";

const PATTERNS = [
  { re: /\bgit\s+push\b/, what: "pushing to a remote" },
  { re: /\bgit\s+merge\b/, what: "merging" },
  { re: /\bgit\s+(?:rebase|reset\s+--hard|filter-branch)\b/, what: "rewriting history" },
  { re: /\bgit\s+commit\b.*--amend\b/, what: "rewriting a commit" },
  { re: /\bnpm\s+publish\b|\bpnpm\s+publish\b|\byarn\s+publish\b/, what: "publishing" },
  { re: /\b(?:vercel|railway|render)\s+(?:deploy|up)\b/, what: "deploying" },
  { re: /\brm\s+-[a-z]*r[a-z]*f?\b/, what: "recursive deletion" }
];

let input = "";
try {
  input = readFileSync(0, "utf8");
} catch {
  process.exit(0);
}

let command = "";
try {
  const payload = JSON.parse(input);
  command = payload?.tool_input?.command ?? "";
} catch {
  process.exit(0);
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
