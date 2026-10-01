import { test } from "node:test";
import assert from "node:assert/strict";

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  overviewHash,
  parseArchive,
  parseFindings,
  parseOpenQuestions,
  parsePlan,
  parseSpec,
  parseWork,
  readHistory,
  readProjectState
} from "./state.js";

test("parsePlan reads numbers, titles and tick state", () => {
  const plan = parsePlan(
    ["## Plan", "", "- [x] 1. **Done thing** - what it delivered", "- [ ] 2. **Next thing** - what it will"].join("\n")
  );

  assert.equal(plan.length, 2);
  assert.deepEqual(
    plan.map((i) => [i.number, i.title, i.done]),
    [
      ["1", "Done thing - what it delivered", true],
      ["2", "Next thing - what it will", false]
    ]
  );
});

test("parsePlan ignores the guidance above the Plan heading", () => {
  // The shipped template explains the format with worked examples, which are checkboxes
  // too. Counting them reported 0/3 complete on a fresh install where nothing existed.
  const withGuidance = [
    "# Build Plan",
    "",
    "Good:",
    "",
    "- [ ] 1. **Skill submission** - upload a package",
    "- [ ] 2. **Validation result** - run checks",
    "",
    "## Plan",
    "",
    "- [ ] 1. **The only real item** - what it delivers"
  ].join("\n");

  const plan = parsePlan(withGuidance);
  assert.equal(plan.length, 1, "only what follows the Plan heading counts");
  assert.equal(plan[0]?.title, "The only real item - what it delivers");
});

test("parsePlan drops the template's own placeholder items", () => {
  const plan = parsePlan(
    ["## Plan", "", "- [ ] 1. **Feature one** - what it delivers", "- [ ] 2. **Feature two** - what it delivers"].join("\n")
  );
  assert.deepEqual(plan, [], "a fresh install has no work, not two items");
});

test("parsePlan records nesting depth for sub-items", () => {
  const plan = parsePlan(["## Plan", "", "- [ ] 4. **Parent**", "  - [ ] 4a. **Child**"].join("\n"));
  assert.deepEqual(plan.map((i) => i.depth), [0, 1]);
});

test("parseWork reports the stub as nothing in progress", () => {
  assert.equal(parseWork("# Current Work\n\n_Nothing in progress. Run `feature` to start._").active, false);
  assert.equal(parseWork(null).active, false);
});

test("parseWork counts ticked steps and names the next one", () => {
  const spec = [
    "# Export reports",
    "",
    "**Type:** Feature",
    "**Status:** in progress",
    "",
    "- [x] **Step 1 - schema** - added the table. *Done when:* it migrates.",
    "- [x] **Step 2 - endpoint** - added the route. *Done when:* it returns 200.",
    "- [ ] **Step 3 - client** - wires the button. *Done when:* the file downloads."
  ].join("\n");

  const work = parseWork(spec);
  assert.equal(work.active, true);
  assert.equal(work.title, "Export reports");
  assert.equal(work.type, "Feature");
  assert.equal(work.status, "in progress");
  assert.equal(work.stepsDone, 2);
  assert.equal(work.stepsTotal, 3);
  // The bold name contains the template's own " - " separator, so it is taken whole.
  assert.equal(work.nextStep, "Step 3 - client", "resumption starts at the first unticked step");
});

test("parseWork names an unbolded step up to its first separator", () => {
  assert.equal(parseWork("# X\n\n- [ ] wire the button - so it downloads").nextStep, "wire the button");
});

test("parseSpec reads a spec in the template's shape", () => {
  const spec = parseSpec(
    [
      "# Export reports",
      "",
      "**Type:** Feature",
      "**From build plan:** item 4b",
      "**Status:** in progress",
      "",
      "## Goal",
      "",
      "Users can download a report",
      "as a file.",
      "",
      "**Done when** it downloads.",
      "",
      "## In scope",
      "",
      "- The download button",
      "- A CSV writer that quotes",
      "  embedded commas",
      "",
      "## Out of scope",
      "",
      "- **PDF.** A later item.",
      "",
      "## Build steps",
      "",
      "- [x] **Step 1 - schema** - added the table. *Done when:* it migrates.",
      "- [ ] **Step 2 - client - with retries** - wires the button,",
      "  and retries. *Done when:* the file downloads.",
      "- [ ] **Repair F-04 - quoting** - quote commas.",
      "",
      "## Files and areas",
      "",
      "- `src/report.ts` - the writer"
    ].join("\n")
  );

  assert.ok(spec);
  assert.deepEqual([spec.title, spec.type, spec.planItem, spec.status], ["Export reports", "Feature", "4b", "in progress"]);
  assert.deepEqual(spec.goal, ["Users can download a report as a file.", "**Done when** it downloads."]);
  assert.deepEqual(spec.inScope, ["The download button", "A CSV writer that quotes embedded commas"]);
  assert.deepEqual(spec.outOfScope, ["**PDF.** A later item."]);
  assert.deepEqual(spec.files, ["`src/report.ts` - the writer"]);
  assert.deepEqual(spec.steps, [
    { label: "Step 1", title: "schema", what: "added the table.", doneWhen: "it migrates.", done: true },
    {
      label: "Step 2",
      title: "client - with retries",
      what: "wires the button, and retries.",
      doneWhen: "the file downloads.",
      done: false
    },
    { label: "Repair F-04", title: "quoting", what: "quote commas.", doneWhen: null, done: false }
  ]);
});

test("parseSpec returns null for the stub and degrades on a mangled spec", () => {
  assert.equal(parseSpec("# Current Work\n\n_Nothing in progress. Run `feature` to start._"), null);
  assert.equal(parseSpec(null), null);

  const mangled = parseSpec("no title\n\n## Build steps\n\n- [x] just words\nstray paragraph\n- not a step");
  assert.ok(mangled);
  assert.equal(mangled.title, null);
  assert.deepEqual(mangled.goal, []);
  assert.deepEqual(mangled.steps, [{ label: "", title: "just words", what: "", doneWhen: null, done: true }]);
});

test("parseFindings reads identifier, severity and status", () => {
  const ledger = [
    "# Findings",
    "",
    "### F-01 [P0] open - Auth volume carries the run label",
    "",
    "**File:** ops/compose.yaml:86",
    "",
    "### F-02 [P2] closed - Duplicated slug helper",
    "",
    "### F-03 [P1] fixed - Missing ownership check"
  ].join("\n");

  const findings = parseFindings(ledger);
  assert.deepEqual(
    findings.map((f) => [f.id, f.severity, f.status]),
    [
      ["F-01", "P0", "open"],
      ["F-02", "P2", "closed"],
      ["F-03", "P1", "fixed"]
    ]
  );

  // What completion actually gates on: fixed still blocks, because nothing has reviewed
  // the repair yet.
  const blocking = findings.filter(
    (f) => (f.severity === "P0" || f.severity === "P1") && (f.status === "open" || f.status === "fixed")
  );
  assert.deepEqual(blocking.map((f) => f.id), ["F-01", "F-03"]);
});

test("parseFindings reads each finding's details, and tolerates a bare heading and a finding without a lens", () => {
  const ledger = [
    "### F-02 [P2] open - The upper edge is not pinned",
    "",
    "**File:** lib/args.test.ts:46",
    "**Found:** 2026-09-26 by audit (scope: current; lens: tests, quality)",
    "**Why it matters:** `stauts` pins distance 2.",
    "**Suggested fix:** Assert `sta`.",
    "**Resolution:**",
    "",
    "### F-03 [P3] fixed - Bare",
    "",
    "### F-79 [P3] open - Raised while building",
    "",
    "**File:** bin/religion.ts:217",
    "**Found:** 2026-09-26 while writing the upgrade guide from runs",
    "**Resolution:** Repaired 2026-09-26: the hint is gone."
  ].join("\n");

  const [full, bare, building] = parseFindings(ledger);
  assert.deepEqual(full, {
    id: "F-02",
    severity: "P2",
    status: "open",
    title: "The upper edge is not pinned",
    file: "lib/args.test.ts:46",
    found: "2026-09-26 by audit",
    lens: "tests, quality",
    why: "`stauts` pins distance 2.",
    fix: "Assert `sta`.",
    resolution: null
  });
  assert.deepEqual([bare?.id, bare?.file, bare?.found, bare?.why], ["F-03", null, null, null]);
  assert.deepEqual(
    [building?.found, building?.lens, building?.resolution],
    ["2026-09-26 while writing the upgrade guide from runs", null, "Repaired 2026-09-26: the hint is gone."]
  );
});

test("parseArchive reads what an item cost and what it taught", () => {
  const archive = parseArchive(
    "features",
    "04d-the-statement.md",
    [
      "# The statement",
      "",
      "**Type:** Feature",
      "**Status:** verified",
      "",
      "## Build steps",
      "",
      "- [x] **Step 1 - write it** - the document.",
      "- [x] **Step 2 - check it** - the check.",
      "- [x] **Repair F-80 - links** - leave it unwritten.",
      "",
      "## Outcome",
      "",
      "### What went wrong on the way",
      "",
      "**The check took six rounds.** A denylist",
      "was evaded.",
      "",
      "- A harness truncated files.",
      "",
      "### Deferred",
      "",
      "- **F-97 (P2):** a symlinked directory.",
      "",
      "## Landed",
      "",
      "**Base:** fd5fbbe3b031b1bf4006049b6d718aa5c9bb5075",
      "**Commits:** a4744a4bf0058c7674395a4b74a75bb5d7def639, 72177e746f7697ee1a934bba3642e4066d9cd59e",
      "",
      "## Findings",
      "",
      "### 4d/F-80 [P1] closed - The hook writes through links",
      "",
      "**File:** src/hooks/write-handoff.mjs:82"
    ].join("\n")
  );

  assert.deepEqual(archive, {
    kind: "features",
    file: "04d-the-statement.md",
    number: "4d",
    title: "The statement",
    type: "Feature",
    status: "verified",
    steps: 2,
    repairs: 1,
    commits: ["a4744a4bf0058c7674395a4b74a75bb5d7def639", "72177e746f7697ee1a934bba3642e4066d9cd59e"],
    findings: [{ id: "F-80", severity: "P1", status: "closed", title: "The hook writes through links" }],
    wentWrong: ["**The check took six rounds.** A denylist was evaded.", "A harness truncated files."],
    deferred: ["**F-97 (P2):** a symlinked directory."]
  });
});

test("parseArchive degrades on an archive with no Landed, Findings or lessons", () => {
  const archive = parseArchive("fixes", "notes.md", "# Quick fix\n\nNo sections at all.");
  assert.deepEqual(
    [archive.number, archive.title, archive.steps, archive.commits, archive.findings, archive.wentWrong],
    [null, "Quick fix", 0, [], [], []]
  );
});

test("readHistory reads every kind's archives and skips each folder's README", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "religion-history-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "religion", "history", "features"), { recursive: true });
  await fs.mkdir(path.join(root, "religion", "history", "fixes"), { recursive: true });
  await fs.writeFile(path.join(root, "religion", "history", "features", "README.md"), "# Completed features");
  await fs.writeFile(path.join(root, "religion", "history", "features", "01-first.md"), "# First");
  await fs.writeFile(path.join(root, "religion", "history", "features", "02-second.md"), "# Second");
  await fs.writeFile(path.join(root, "religion", "history", "fixes", "01-a-fix.md"), "# A fix");

  const history = await readHistory(root);
  assert.deepEqual(
    history.map((a) => [a.kind, a.number, a.title]),
    [
      ["features", "2", "Second"],
      ["features", "1", "First"],
      ["fixes", "1", "A fix"]
    ]
  );
});

test("parseFindings returns nothing for an empty ledger", () => {
  assert.deepEqual(parseFindings("# Findings\n\n_No findings recorded._"), []);
  assert.deepEqual(parseFindings(null), []);
});

test("parseOpenQuestions takes the titles and stops at the next heading", () => {
  const overview = [
    "## Open questions",
    "",
    "- **Storage engine** (affects: data model) - the plans disagree.",
    "- **Auth provider** (affects: features 3 and 7) - not decided.",
    "",
    "## Something else",
    "",
    "- **Not a question** - should not appear."
  ].join("\n");

  assert.deepEqual(parseOpenQuestions(overview), ["Storage engine", "Auth provider"]);
  assert.deepEqual(parseOpenQuestions("# Overview\n\nno such section"), []);
});

test("overviewHash changes when either plan changes", () => {
  const base = overviewHash("project", "build");
  assert.equal(overviewHash("project", "build"), base, "same input, same stamp");
  assert.notEqual(overviewHash("project edited", "build"), base);
  assert.notEqual(overviewHash("project", "build edited"), base);
  assert.equal(base.length, 16, "the stamp is 16 hex characters");
});

test("readProjectState reads the overview's stamp to decide whether it is fresh", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "religion-state-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "religion", "context"), { recursive: true });
  await fs.writeFile(path.join(root, "religion", "project-plan.md"), "project");
  await fs.writeFile(path.join(root, "religion", "build-plan.md"), "build");
  const overview = (stamp: string) =>
    fs.writeFile(path.join(root, "religion", "context", "project-overview.md"), `# Overview\n\n${stamp}\n`);

  await overview(`<!-- religion:source-hash ${overviewHash("project", "build")} -->`);
  assert.equal((await readProjectState(root)).overviewFresh, true, "a matching stamp is fresh");

  await overview(`<!-- religion:source-hash ${overviewHash("project edited", "build")} -->`);
  assert.equal((await readProjectState(root)).overviewFresh, false, "a stamp from other plans is stale");

  await overview("no stamp at all");
  assert.equal((await readProjectState(root)).overviewFresh, null, "a missing stamp is unknown, not fresh");
});

