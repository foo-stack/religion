import { test } from "node:test";
import assert from "node:assert/strict";

import { doctorReport, managedFilesCheck } from "./doctor.js";
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

test("managedFilesCheck reports, never fails, and cuts a long list short", () => {
  assert.deepEqual(managedFilesCheck(null), { name: "managed files", ok: true, detail: "no install record to compare with", blocks: "nothing" });
  assert.equal(managedFilesCheck({ edited: [], missing: [], total: 30 }).detail, "all 30 unchanged since install");

  const long = managedFilesCheck({ edited: ["a", "b", "c", "d", "e", "f"], missing: ["g"], total: 30 });
  assert.equal(long.ok, true);
  assert.equal(long.detail, "6 edited and 1 missing of 30 since install: a, b, c, d, e, and 2 more");
  assert.equal(managedFilesCheck({ edited: [], missing: ["x"], total: 2 }).detail, "0 edited and 1 missing of 2 since install: x (missing)");
});
