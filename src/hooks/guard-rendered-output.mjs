#!/usr/bin/env node
/**
 * Blocks edits to rendered adapter trees inside a source checkout.
 *
 * Rendered output is overwritten by the next build, so an edit made there is lost without
 * warning and the real source stays wrong. Applies only where `src/skills/` exists, which
 * is what distinguishes a source checkout from an installed project.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Degrade to a prompt when this guard cannot do its job.
 *
 * A guard that fails open becomes the exact outcome it exists to prevent: the command runs
 * and nobody was asked. Failing closed is no better, because one malformed payload from a
 * runtime change would block every edit to a rendered tree until somebody edits a hook. Asking is the
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
        `The rendered-output guard hook could not run, so this command was not checked.\n\n` +
        `Reason: ${detail}\n\n` +
        `Approve it only if you would have approved it anyway. The guard is not covering ` +
        `you right now, and that is worth reporting.`
    }
  }));
  process.exit(0);
}

// Covers the whole hook, not only the reads below: any throw reaches this and still asks.
process.on("uncaughtException", askBecauseGuardFailed);


if (!existsSync(path.join(process.cwd(), "src", "skills"))) process.exit(0);

let input = "";
try {
  input = readFileSync(0, "utf8");
} catch (error) {
  askBecauseGuardFailed(error);
}

let file = "";
try {
  const payload = JSON.parse(input);
  file = payload?.tool_input?.file_path ?? "";
} catch (error) {
  askBecauseGuardFailed(error);
}

if (!file) process.exit(0);

const relative = path.relative(process.cwd(), file);
const rendered = [".claude/skills", ".agents/skills", "template/"];

if (rendered.some((prefix) => relative.startsWith(prefix))) {
  const source = relative.replace(/^template\//, "").replace(/^\.(claude|agents)\/skills/, "src/skills");
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason:
        `Blocked: ${relative} is generated output and the next build overwrites it.\n\n` +
        `Edit the source instead (likely ${source}), then run \`npm run build:skills\`.`
    }
  }));
  process.exit(0);
}

process.exit(0);
