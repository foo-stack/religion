import { test } from "node:test";
import assert from "node:assert/strict";

import { docsProblems } from "./docs.js";

const RECORD = {
  commands: { install: ["--dry-run", "--claude"], status: ["--json"], update: ["--force"] },
  exitCodes: [0, 1, 2]
};
const disk = (files: Record<string, string>, dirs: string[] = []) => ({
  exists: (relative: string) => relative in files || dirs.includes(relative),
  read: (relative: string) => files[relative] ?? null
});

test("docsProblems reports commands, options and exit codes the record lacks", () => {
  const doc = [
    "Run `religion stauts` to see where things stand.",
    "Or `npx create-religion@latest status --verbose`.",
    "",
    "```bash",
    "religion update --force --yes   # keep going",
    "```",
    "",
    "It exits 3 when the moon is full."
  ].join("\n");

  assert.deepEqual(docsProblems({ "docs/a.md": doc }, RECORD, disk({ "docs/a.md": doc })), [
    "docs/a.md:1: `stauts` is not a recorded command",
    "docs/a.md:2: `--verbose` is not a recorded option of status",
    "docs/a.md:5: `--yes` is not a recorded option of update",
    "docs/a.md:8: exit code 3 is not recorded"
  ]);
});

test("docsProblems accepts install's directory, comments, paths and output blocks", () => {
  const doc = [
    "`npx create-religion my-app --claude` installs, and `religion` alone does too.",
    "State lives in `religion/config.json`; `religion <command>` is the shape.",
    "",
    "```text",
    "religion stauts --nope",
    "Unknown command 'stauts'. It exits 2.",
    "```",
    "",
    "```bash",
    "religion status --json | jq .next   # --verbose here is a comment",
    "```",
    "",
    "It exits 1 when doctor fails, and exit code `0` otherwise."
  ].join("\n");

  assert.deepEqual(docsProblems({ "docs/a.md": doc }, RECORD, disk({ "docs/a.md": doc })), []);
});

test("docsProblems checks relative links and their anchors, and leaves external ones alone", () => {
  const files = {
    "docs/a.md": [
      "# Getting started",
      "",
      "## Exit codes",
      "",
      "See [the codes](#exit-codes), [stability](stability.md#settings), [the code](../src/skills/), and [npm](https://www.npmjs.com).",
      "Broken: [gone](missing.md), [no anchor](stability.md#nowhere), [here](#not-a-heading)."
    ].join("\n"),
    "docs/stability.md": "# Stability\n\n### Settings\n"
  };

  assert.deepEqual(docsProblems({ "docs/a.md": files["docs/a.md"] }, RECORD, disk(files, ["src/skills"])), [
    "docs/a.md:6: link to missing.md leads nowhere",
    "docs/a.md:6: link to stability.md#nowhere names an anchor docs/stability.md does not have",
    "docs/a.md:6: link to #not-a-heading names an anchor docs/a.md does not have"
  ]);
});
