import { test } from "node:test";
import assert from "node:assert/strict";

import {
  MANAGED_END,
  MANAGED_START,
  hasDamagedMarkers,
  hasMarkers,
  managedBlock,
  replaceManagedBlock,
  spliceEntry
} from "./merge.js";

/** A stand-in for a rendered entry file, with the shape the real ones have. */
const TEMPLATE = [
  "# Project Name",
  "",
  "Agent instructions for this project.",
  "",
  "@religion/context/coding-standards.md",
  "@religion/context/ai-interaction.md",
  "",
  "## What this is",
  "",
  "A description of your project.",
  "",
  "## Workflow",
  "",
  "Build one thing at a time.",
  "",
  "## Commands",
  "",
  "- Dev server: `<command>`",
  ""
].join("\n");

test("hasMarkers requires both markers, not either", () => {
  assert.equal(hasMarkers(`${MANAGED_START}\nx\n${MANAGED_END}`), true);
  assert.equal(hasMarkers(`${MANAGED_START}\nx`), false);
  assert.equal(hasMarkers("nothing here"), false);
});

test("hasDamagedMarkers tells a half-marked file from an unmarked one", () => {
  // The distinction that matters: an unmarked file gets spliced, a damaged one must not,
  // because splicing it adds a second block to a file that already has one.
  assert.equal(hasDamagedMarkers("nothing here"), false);
  assert.equal(hasDamagedMarkers(`${MANAGED_START}\nx\n${MANAGED_END}`), false);
  assert.equal(hasDamagedMarkers(`${MANAGED_START}\nx`), true, "start without end");
  assert.equal(hasDamagedMarkers(`${MANAGED_END}\nx`), true, "end without start");
  assert.equal(hasDamagedMarkers(`${MANAGED_END}\nx\n${MANAGED_START}`), true, "reversed pair");
});

test("managedBlock carries the imports and drops the sections the user owns", () => {
  const block = managedBlock(TEMPLATE);
  assert.ok(block.includes("@religion/context/coding-standards.md"), "imports are inside the block");
  assert.ok(block.includes("## Workflow"), "Religion's own sections are inside");
  assert.ok(!block.includes("## What this is"), "their description is not");
  assert.ok(!block.includes("## Commands"), "their commands are not");
});

test("spliceEntry leaves their content byte-identical at the head", () => {
  const existing = "# Acme\n\nmy instructions\n\n## House rules\n\n- always pnpm\n";
  const merged = spliceEntry(existing, TEMPLATE);
  const head = merged.slice(0, existing.replace(/\n+$/, "").length);
  assert.equal(head, existing.replace(/\n+$/, ""));
  assert.ok(hasMarkers(merged), "and the block was added");
});

test("spliceEntry does not add a second Commands section", () => {
  const withCommands = "# Acme\n\n## Commands\n\n- Dev: `pnpm dev`\n";
  const merged = spliceEntry(withCommands, TEMPLATE);
  const headings = merged.split("\n").filter((line) => line.trim() === "## Commands");
  assert.equal(headings.length, 1, "theirs is kept and the placeholder is skipped");
  assert.ok(merged.includes("pnpm dev"), "and it is still theirs");
});

test("spliceEntry adds Commands when their file has none", () => {
  const merged = spliceEntry("# Acme\n\nnothing else\n", TEMPLATE);
  assert.ok(merged.includes("## Commands"), "the placeholder gives setup something to fill");
});

test("replaceManagedBlock rewrites inside the markers and nothing outside", () => {
  const merged = spliceEntry("# Acme\n\nkeep me\n", TEMPLATE);
  const edited = merged.replace("Build one thing at a time.", "STALE");
  const next = replaceManagedBlock(edited, TEMPLATE);

  assert.ok(next !== null);
  assert.ok(next.includes("keep me"), "their prose survives");
  assert.ok(!next.includes("STALE"), "and the block was replaced");
});

test("replaceManagedBlock returns null rather than guessing at a damaged pair", () => {
  // Refusing is the point: repairing a file whose markers someone edited would be acting on
  // a guess about what they meant.
  assert.equal(replaceManagedBlock("no markers at all", TEMPLATE), null);
  assert.equal(replaceManagedBlock(`${MANAGED_START}\nonly a start`, TEMPLATE), null);
  assert.equal(replaceManagedBlock(`${MANAGED_END}\nx\n${MANAGED_START}`, TEMPLATE), null);
});
