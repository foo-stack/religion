import { test } from "node:test";
import assert from "node:assert/strict";

import { settingProblems } from "./settings.js";

test("settingProblems accepts the shipped defaults and an empty file", () => {
  assert.deepEqual(settingProblems({}), []);
  assert.deepEqual(
    settingProblems({
      schemaVersion: 1,
      workflow: { stepReview: "item", parallelSteps: true },
      git: { mode: "pull-request", featureBranchPrefix: "feat/", integrationBranchPrefix: "auto/runs/" },
      auto: { maxItems: null, maxRepairAttempts: 0, finalAudit: true },
      refactor: { maxFileLines: 400 }
    }),
    []
  );
});

test("settingProblems names the key, the value and what would work, for each kind", () => {
  assert.deepEqual(settingProblems({ git: { mode: "trunkk" } }), ['git.mode is "trunkk", expected one of trunk, branch-per-item, pull-request']);
  assert.deepEqual(settingProblems({ workflow: { parallelSteps: "yes" } }), ['workflow.parallelSteps is "yes", expected true or false']);
  assert.deepEqual(settingProblems({ git: { fixBranchPrefix: "Fix" } }), ['git.fixBranchPrefix is "Fix", expected a lowercase prefix ending in /']);
  assert.deepEqual(settingProblems({ auto: { maxRepairAttempts: 11 } }), ["auto.maxRepairAttempts is 11, expected an integer from 0 through 10"]);
  assert.deepEqual(settingProblems({ auto: { maxItems: 0 } }), ["auto.maxItems is 0, expected an integer 1 or more, or null"]);
  assert.deepEqual(settingProblems({ refactor: { maxFileLines: 1.5 } }), ["refactor.maxFileLines is 1.5, expected an integer 1 or more"]);
  assert.deepEqual(settingProblems({ refactor: { maxFunctionLines: null } }), ["refactor.maxFunctionLines is null, expected an integer 1 or more"]);
  assert.deepEqual(settingProblems({ schemaVersion: 2 }), ["schemaVersion is 2, expected an integer 1"]);
});

test("settingProblems reports a section or a file that is not an object", () => {
  assert.deepEqual(settingProblems([]), ["not an object"]);
  assert.deepEqual(settingProblems(null), ["not an object"]);
  assert.deepEqual(settingProblems({ git: "trunk" }), ['git is "trunk", expected an object of settings']);
  assert.deepEqual(settingProblems({ auto: [] }), ["auto is [], expected an object of settings"]);
});

test("settingProblems ignores keys the reference does not name", () => {
  assert.deepEqual(settingProblems({ notes: "mine", git: { mode: "trunk", colour: "blue" } }), []);
});

test("settingProblems refuses a prefix git would refuse as a branch name", () => {
  for (const prefix of ["a..b/", "feature//", "a/.x/", "x.lock/", ".hidden/"]) {
    assert.equal(settingProblems({ git: { featureBranchPrefix: prefix } }).length, 1, prefix);
  }
  assert.deepEqual(settingProblems({ git: { featureBranchPrefix: "team.a/feature/" } }), []);
});
