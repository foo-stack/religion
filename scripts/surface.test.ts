import { test } from "node:test";
import assert from "node:assert/strict";

import { compareSurface, shapeProblems } from "./surface.js";

const RECORD = {
  commands: { status: ["--json"], install: ["--yes", "--force"] },
  skills: ["audit", "check"],
  config: { "git.mode": ["trunk", "pull-request"], "auto.maxItems": "null" }
};

test("compareSurface finds nothing when the surface matches, whatever the order", () => {
  const current = {
    config: { "auto.maxItems": "null", "git.mode": ["pull-request", "trunk"] },
    skills: ["check", "audit"],
    commands: { install: ["--force", "--yes"], status: ["--json"] }
  };
  assert.deepEqual(compareSurface(RECORD, current), []);
});

test("compareSurface calls a removal breaking", () => {
  const current = { ...RECORD, skills: ["audit"], commands: { install: ["--yes", "--force"] } };
  assert.deepEqual(compareSurface(RECORD, current), [
    "breaking: commands.status was removed",
    "breaking: skills no longer includes check"
  ]);
});

test("compareSurface reports a rename as one removal and one addition", () => {
  assert.deepEqual(compareSurface(RECORD, { ...RECORD, skills: ["audit", "verify"] }), [
    "breaking: skills no longer includes check",
    "unrecorded: skills now includes verify"
  ]);
});

test("compareSurface calls an addition unrecorded", () => {
  const current = { ...RECORD, commands: { ...RECORD.commands, dashboard: [] } };
  assert.deepEqual(compareSurface(RECORD, current), ["unrecorded: commands.dashboard was added"]);
});

test("compareSurface calls a narrowed value list and a changed type breaking", () => {
  const current = { ...RECORD, config: { "git.mode": ["trunk"], "auto.maxItems": "number" } };
  assert.deepEqual(compareSurface(RECORD, current), [
    "breaking: config.git.mode no longer includes pull-request",
    'breaking: config.auto.maxItems changed from "null" to "number"'
  ]);
});

test("shapeProblems accepts each primitive and a union", () => {
  assert.deepEqual(shapeProblems("x", "string"), []);
  assert.deepEqual(shapeProblems(3, "number"), []);
  assert.deepEqual(shapeProblems(false, "boolean"), []);
  assert.deepEqual(shapeProblems(null, "null"), []);
  assert.deepEqual(shapeProblems(null, "string|null"), []);
  assert.deepEqual(shapeProblems(3, "string|null"), ["breaking: $ should be string|null, is number"]);
});

test("shapeProblems checks every element of an array", () => {
  assert.deepEqual(shapeProblems(["a", "b"], ["string"]), []);
  assert.deepEqual(shapeProblems(["a", 2], ["string"]), ["breaking: $[1] should be string, is number"]);
  assert.deepEqual(shapeProblems("a", ["string"]), ["breaking: $ should be an array, is string"]);
});

test("shapeProblems holds an object to exactly its keys", () => {
  const shape = { name: "string", ok: "boolean" };
  assert.deepEqual(shapeProblems({ name: "x", ok: true }, shape), []);
  assert.deepEqual(shapeProblems({ name: "x" }, shape), ["breaking: $.ok is missing"]);
  assert.deepEqual(shapeProblems({ name: "x", ok: true, extra: 1 }, shape), ["unrecorded: $.extra is not in the record"]);
  assert.deepEqual(shapeProblems([], shape), ["breaking: $ should be an object, is array"]);
});

test("shapeProblems lets a record have any keys but checks every value", () => {
  assert.deepEqual(shapeProblems({ open: 2, fixed: 1 }, { "*": "number" }), []);
  assert.deepEqual(shapeProblems({}, { "*": "number" }), []);
  assert.deepEqual(shapeProblems({ open: "2" }, { "*": "number" }), ["breaking: $.open should be number, is string"]);
});

test("shapeProblems reports nested problems with their path", () => {
  const shape = { work: { title: "string|null", steps: [{ done: "boolean" }] } };
  assert.deepEqual(shapeProblems({ work: { title: null, steps: [{ done: true }, {}] } }, shape), [
    "breaking: $.work.steps[1].done is missing"
  ]);
});
