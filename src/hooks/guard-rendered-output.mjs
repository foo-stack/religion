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

if (!existsSync(path.join(process.cwd(), "src", "skills"))) process.exit(0);

let input = "";
try {
  input = readFileSync(0, "utf8");
} catch {
  process.exit(0);
}

let file = "";
try {
  const payload = JSON.parse(input);
  file = payload?.tool_input?.file_path ?? "";
} catch {
  process.exit(0);
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
