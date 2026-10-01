import { test } from "node:test";
import assert from "node:assert/strict";

import {
  MANAGED_END,
  MANAGED_START,
  hasDamagedMarkers,
  hasMarkers,
  managedBlock,
  rebuildEntry,
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

/** The template as setup leaves it: a real title, filled Commands, and a section of their own. */
const SET_UP = TEMPLATE.replace("# Project Name", "# Acme")
  .replace("- Dev server: `<command>`", "- Dev server: `make dev`")
  .replace("## Commands", "## Deploying\n\nShip on Fridays.\n\n## Commands");

const NEWER = TEMPLATE.replace("Build one thing at a time.", "Build one thing at a time, behind review gates.");

function headings(text: string): string[] {
  return text.split("\n").filter((line) => line.startsWith("## "));
}

test("rebuildEntry keeps one copy of every section", () => {
  const rebuilt = rebuildEntry(SET_UP, NEWER);
  const found = headings(rebuilt);
  assert.deepEqual([...found].sort(), [...new Set(found)].sort());
  assert.deepEqual([...found].sort(), ["## Commands", "## Deploying", "## What this is", "## Workflow"]);
});

test("rebuildEntry keeps what the owner wrote and takes Religion's sections from the template", () => {
  const rebuilt = rebuildEntry(SET_UP, NEWER);
  assert.ok(rebuilt.startsWith("# Acme\n"));
  assert.match(rebuilt, /- Dev server: `make dev`/);
  assert.match(rebuilt, /behind review gates/);
  assert.doesNotMatch(rebuilt, /Build one thing at a time\.\n/);
});

test("rebuildEntry puts the owner's sections outside the block and the imports inside it", () => {
  const rebuilt = rebuildEntry(SET_UP, NEWER);
  const start = rebuilt.indexOf(MANAGED_START);
  const end = rebuilt.indexOf(MANAGED_END);
  assert.ok(start > 0 && end > start);
  assert.ok(rebuilt.indexOf("## Deploying") < start);
  assert.ok(rebuilt.indexOf("## What this is") < start);
  assert.ok(rebuilt.indexOf("## Commands") > end);
  const imports = [...rebuilt.matchAll(/^@religion\/context\/coding-standards\.md$/gm)].map((m) => m.index ?? -1);
  assert.equal(imports.length, 1);
  assert.ok(imports[0]! > start && imports[0]! < end);
});

test("rebuildEntry changes nothing the second time", () => {
  const once = rebuildEntry(SET_UP, NEWER);
  assert.equal(rebuildEntry(once, NEWER), once);
});

