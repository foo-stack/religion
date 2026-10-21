import { test } from "node:test";
import assert from "node:assert/strict";

import { changesSince } from "./changelog.js";

const CHANGELOG = [
  "# create-religion",
  "",
  "## 1.2.0",
  "",
  "### Minor Changes",
  "",
  "- 6097eb0: `auto fix` works through the findings ledger unattended, under the same grant. With",
  "  no class it takes every class.",
  "",
  "## 1.1.0",
  "",
  "### Minor Changes",
  "",
  "- 624001c: The dashboard is rebuilt as a console. It follows the theme.",
  "",
  "  `status --json` now reports the whole step name.",
  "",
  "### Patch Changes",
  "",
  "- abc1234: A fix with no full stop",
  "",
  "## 1.0.0",
  "",
  "### Major Changes",
  "",
  "- 0794c6e: Religion 1.0."
].join("\n");

test("changesSince returns the releases after the installed version, newest first", () => {
  assert.deepEqual(changesSince(CHANGELOG, "1.0.0", "1.2.0"), [
    { version: "1.2.0", changes: ["`auto fix` works through the findings ledger unattended, under the same grant."] },
    { version: "1.1.0", changes: ["The dashboard is rebuilt as a console.", "A fix with no full stop"] }
  ]);
  assert.deepEqual(changesSince(CHANGELOG, "1.1.0", "1.1.0"), [], "nothing newer than what is installed");
  assert.deepEqual(changesSince(CHANGELOG, "0.5.0", "1.1.0").map((r) => r.version), ["1.1.0", "1.0.0"], "never past this version");
});

test("changesSince gives nothing rather than guessing", () => {
  assert.deepEqual(changesSince(CHANGELOG, "1.3.0", "1.2.0"), [], "installed by a newer version");
  assert.deepEqual(changesSince(CHANGELOG, "not a version", "1.2.0"), []);
  assert.deepEqual(changesSince(CHANGELOG, undefined, "1.2.0"), []);
  assert.deepEqual(changesSince(null, "1.0.0", "1.2.0"), []);
  assert.deepEqual(changesSince("", "1.0.0", "1.2.0"), []);
});
