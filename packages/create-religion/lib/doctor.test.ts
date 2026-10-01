import { test } from "node:test";
import assert from "node:assert/strict";

import { doctorReport } from "./doctor.js";
import type { CheckResult } from "./doctor.js";

const pass: CheckResult = { name: "configuration", ok: true, detail: "valid", blocks: "work" };
const cosmetic: CheckResult = { name: "adapters", ok: false, detail: "trees differ", blocks: "nothing" };

test("doctorReport is versioned and carries every check unchanged", () => {
  const report = doctorReport([pass, cosmetic]);
  assert.equal(report.schemaVersion, 1);
  assert.deepEqual(report.checks, [pass, cosmetic]);
});

test("doctorReport is healthy only when every check passes, cosmetic ones included", () => {
  assert.equal(doctorReport([pass]).healthy, true);
  assert.equal(doctorReport([pass, cosmetic]).healthy, false);
});
