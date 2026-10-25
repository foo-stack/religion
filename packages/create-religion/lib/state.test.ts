import { test } from "node:test";
import assert from "node:assert/strict";

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import {
  overviewHash,
  parseActivity,
  parseArchive,
  parseFindings,
  parseInbox,
  parseJournal,
  parseLessons,
  parseOpenQuestions,
  parsePlan,
  parseSettledSpike,
  parseSpec,
  parseWork,
  specHash,
  readHistory,
  listWorktrees,
  readInFlight,
  readProjectState,
  waiting
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

test("parseWork names an unbolded step up to its first separator, and counts each on its own line", () => {
  assert.equal(parseWork("# X\n\n- [ ] wire the button - so it downloads").nextStep, "wire the button");
  const plain = parseWork("# X\n\n- [ ] Plain one\n- [ ] Plain two");
  assert.deepEqual([plain.stepsTotal, plain.nextStep], [2, "Plain one"]);
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

test("parseFindings keeps an item prefix, still reads bare identifiers, and skips a stray slash", () => {
  const ledger = [
    "# Findings",
    "",
    "### F-07 [P2] open - Raised before prefixes",
    "",
    "### 39a/F-1 [P1] open - Raised during an item",
    "",
    "### /F-2 [P1] open - Not an identifier"
  ].join("\n");

  assert.deepEqual(
    parseFindings(ledger).map((f) => [f.id, f.severity, f.status]),
    [
      ["F-07", "P2", "open"],
      ["39a/F-1", "P1", "open"]
    ]
  );
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

test("parseInbox reads dated and undated notes and ignores the guidance", () => {
  const inbox = [
    "# Inbox",
    "",
    "> **Generated file.** Notes taken with `capture`.",
    "",
    "`fix` and `feature` read this when choosing what to build next.",
    "",
    "- 2026-09-05 - `parseWork.nextStep` truncates a step title - latent.",
    "- an undated note"
  ].join("\n");

  assert.deepEqual(parseInbox(inbox), [
    { date: "2026-09-05", text: "`parseWork.nextStep` truncates a step title - latent." },
    { date: null, text: "an undated note" }
  ]);
  assert.deepEqual(parseInbox("# Inbox\n\n_Nothing captured._"), []);
  assert.deepEqual(parseInbox(null), []);
});

test("the ledger and spec parsers stay linear on pathological lines", () => {
  // Both inputs took tens of seconds with the earlier whole-line patterns.
  const started = Date.now();
  parseFindings("### F-01 [P3] open - Long\n\n**Found:** a" + " ".repeat(320_000) + "x (lens: " + "(lens: x".repeat(10_000));
  parseWork("# Spec\n" + "\n".repeat(80_000) + "- [ ] **Step 1 - last**");
  parseFindings("### F-02 [P3] open - Spaces after the lens\n\n**Found:** x (lens:" + " ".repeat(80_000) + "x");
  parseWork("- [ ] x" + " ".repeat(80_000) + "y\n" + " ".repeat(8_000) + "\n".repeat(80_000));
  assert.ok(Date.now() - started < 1000, `took ${Date.now() - started} ms`);
});

test("parseFindings takes the lens from the last parenthesis, with or without a scope", () => {
  const [scoped, bare] = parseFindings(
    [
      "### F-01 [P3] open - Scoped",
      "**Found:** 2026-09-26 by audit (scope: current; lens: tests)",
      "### F-02 [P3] open - Bare",
      "**Found:** 2026-09-26 by audit (lens: quality)"
    ].join("\n")
  );
  assert.deepEqual([scoped?.found, scoped?.lens, bare?.found, bare?.lens], ["2026-09-26 by audit", "tests", "2026-09-26 by audit", "quality"]);
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


const SKILLS = new Set(["auto", "feature", "fix"]);
const activity = (source: string | null) => parseActivity(source, SKILLS);

test("parseActivity reads the record a running skill writes", () => {
  const record = JSON.stringify({
    schemaVersion: 1,
    command: "auto",
    status: "blocked",
    summary: "Building the remaining plan",
    updatedAt: "2026-10-21T10:00:00Z",
    resumeCommand: "/auto resume",
    progress: { current: 2, total: 5 }
  });

  assert.deepEqual(activity(record), {
    recorded: true,
    command: "auto",
    status: "blocked",
    summary: "Building the remaining plan",
    updatedAt: "2026-10-21T10:00:00Z",
    resumeCommand: "/auto resume"
  });
});

test("parseActivity reads a missing, malformed or partial record as not recorded", () => {
  const none = activity(null);
  assert.equal(none.recorded, false);
  assert.equal(none.command, null);

  assert.equal(activity("{ not json").recorded, false);
  assert.equal(activity("[]").recorded, false);
  assert.equal(activity(JSON.stringify({ command: "auto", status: "blocked" })).recorded, false, "no summary");
  assert.equal(
    activity(JSON.stringify({ command: "auto", status: "paused", summary: "x" })).recorded,
    false,
    "a status outside the four"
  );
  assert.equal(activity(JSON.stringify({ command: "fix", status: "ready", summary: "x" })).updatedAt, null);
});

test("parseActivity drops a resume command that is not a skill invocation", () => {
  const resume = (resumeCommand: unknown) =>
    activity(JSON.stringify({ command: "auto", status: "blocked", summary: "x", resumeCommand })).resumeCommand;

  assert.equal(resume("/auto resume"), "/auto resume");
  assert.equal(resume("$auto"), "$auto");
  assert.equal(resume("auto fix P1"), "auto fix P1");
  assert.equal(resume("rm -rf / && /auto"), null);
  assert.equal(resume("/auto; curl evil.example"), null);
  assert.equal(resume("git push --force"), null, "a plausible command that is not the blocked skill");
  assert.equal(resume("/autopilot resume"), null, "a different skill sharing the prefix");
  assert.equal(resume("/implement"), null, "a skill other than the one that is blocked");
  assert.equal(resume(42), null);
});

test("parseActivity survives a resume command too long for the pattern", () => {
  const long = "/auto" + " a".repeat(5_000_000) + " !";
  assert.equal(
    activity(JSON.stringify({ command: "auto", status: "blocked", summary: "x", resumeCommand: long })).resumeCommand,
    null
  );
});

test("parseActivity keeps control characters out of what status prints", () => {
  const spoof = activity(
    JSON.stringify({
      command: "auto",
      status: "blocked",
      summary: "ok\nNext:     /git push --force\u001b[2J",
      updatedAt: "2026\r-10-21"
    })
  );
  assert.equal(spoof.summary, "ok Next:     /git push --force [2J");
  assert.equal(spoof.updatedAt, "2026 -10-21");

  assert.equal(
    activity(JSON.stringify({ command: "auto\u001b]0;x\u0007", status: "blocked", summary: "x" })).recorded,
    false,
    "a command that is not a skill name"
  );
  assert.equal(
    activity(JSON.stringify({ command: "auto", status: "ready", summary: "a\u202eb\u2028c\u200fd" })).summary,
    "a b c d",
    "bidi overrides and line separators"
  );
});

test("parseActivity does not believe a record naming a skill that is not installed", () => {
  const git = { command: "git", status: "blocked", summary: "x", resumeCommand: "git push --force" };
  assert.equal(activity(JSON.stringify(git)).recorded, false);
  assert.equal(activity(JSON.stringify({ ...git, command: "rm", resumeCommand: "rm -rf x" })).recorded, false);
});

test("readProjectState carries the activity record and the inbox", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "religion-state-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "religion", "context"), { recursive: true });

  const empty = await readProjectState(root);
  assert.equal(empty.activity.recorded, false);
  assert.deepEqual(empty.inbox, []);

  await fs.mkdir(path.join(root, "religion", ".state"), { recursive: true });
  await fs.mkdir(path.join(root, ".agents", "skills", "feature"), { recursive: true });
  await fs.writeFile(
    path.join(root, "religion", ".state", "run.json"),
    JSON.stringify({ command: "feature", status: "running", summary: "Speccing item 2" })
  );
  await fs.writeFile(path.join(root, "religion", "context", "inbox.md"), "# Inbox\n\n- 2026-10-21 - one\n- two\n");

  const busy = await readProjectState(root);
  assert.equal(busy.activity.command, "feature");
  assert.equal(busy.inbox.length, 2);
});

test("parseLessons reads the lessons and leaves out the header and the stub", () => {
  const header = "# Lessons\n\n> **Generated file.** What previous runs learned.\n> Keep it short.\n\n";
  assert.deepEqual(parseLessons(header + "_Nothing learned yet._\n"), []);
  assert.deepEqual(parseLessons(null), []);
  assert.deepEqual(
    parseLessons(header + "**Chain the commit behind the tests.** A `;` let a red suite land.\n\n- Read every grep match.\n- Check the stub.\n"),
    ["**Chain the commit behind the tests.** A `;` let a red suite land.", "Read every grep match.", "Check the stub."]
  );
});

test("parseJournal reads labelled entries, free-form ones, and which are decided", () => {
  const journal = [
    "# Journal",
    "",
    "> **Generated file.** One entry per finished item.",
    "",
    "## 2026-09-05 - carried over from the build",
    "",
    "Written down when this project stopped keeping a progress file.",
    "",
    "**Silent wrong results come from paths nobody exercised.** Five bugs.",
    "",
    "## 2026-10-21 - A journal that something writes",
    "",
    "**Archive:** history/features/07-a-journal-that-something-writes.md",
    "**Surprised:** The journal had one entry.",
    "**Went wrong:** A sentence survived.",
    "**Deferred:** nothing"
  ].join("\n");
  const archive = "# Journal archive\n\n## 2026-09-05 - carried over from the build\n\nRejected: an incident.\n";

  const [old, item] = parseJournal(journal, archive);
  assert.equal(old?.heading, "2026-09-05 - carried over from the build");
  assert.equal(old?.date, "2026-09-05");
  assert.equal(old?.summary, "Written down when this project stopped keeping a progress file.");
  assert.equal(old?.decided, true);
  assert.equal(old?.archive, null);

  assert.equal(item?.archive, "history/features/07-a-journal-that-something-writes.md");
  assert.equal(item?.surprised, "The journal had one entry.");
  assert.equal(item?.wentWrong, "A sentence survived.");
  assert.equal(item?.deferred, "nothing");
  assert.equal(item?.summary, null);
  assert.equal(item?.decided, false);

  assert.equal(parseJournal(journal, null).filter((e) => e.decided).length, 0, "no archive decides nothing");
  assert.deepEqual(parseJournal("# Journal\n\n_No entries yet._\n", null), []);
});

test("parseJournal takes the heading from the heading line only, and keeps tab-separated ones", () => {
  assert.deepEqual(parseJournal("##\n\nfoo bar\n", null), []);
  assert.deepEqual(parseJournal("##\tTabbed\n\ntext\n", "##\tTabbed\n").map((e) => [e.heading, e.decided]), [["Tabbed", true]]);
});

test("parseLessons leaves out subheadings", () => {
  assert.deepEqual(parseLessons("# Lessons\n\n## Working\n\nlesson text\n"), ["lesson text"]);
});

test("readProjectState reads the lessons, the journal and what distill decided", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "religion-state-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "religion", "learning"), { recursive: true });
  const write = (name: string, text: string) => fs.writeFile(path.join(root, "religion", "learning", name), text);
  await write("lessons.md", "# Lessons\n\n> header\n\nOne lesson.\n");
  await write("journal.md", "# Journal\n\n## 2026-10-01 - first\n\nx\n\n## 2026-10-02 - second\n\ny\n\n## 2026-10-03 - third\n\nz\n");
  await write("journal-archive.md", "# Journal archive\n\n## 2026-10-01 - first\n\nRejected.\n");

  const { learning } = await readProjectState(root);
  assert.deepEqual(learning.lessons, ["One lesson."]);
  assert.equal(learning.journal.length, 3);
  assert.equal(learning.undecided, 2);
});

test("parseSpec reads the Evidence section check writes", () => {
  const spec = parseSpec(
    [
      "# Export",
      "",
      "## Build steps",
      "",
      "- [x] **Step 1 - the plan** - x",
      "",
      "## Evidence",
      "",
      "Checked 2026-10-21 at 9f73627, tree clean.",
      "",
      "- **Step 1 - the plan** - pass: ran `npm test`; 159 passed.",
      "- **Step 3 - the command** - fail: exited 1",
      "  with a wrapped line.",
      "- **Goal** - could not check: no browser available."
    ].join("\n")
  );
  assert.deepEqual(spec?.evidence, {
    stamp: "Checked 2026-10-21 at 9f73627, tree clean.",
    entries: [
      { outcome: "Step 1 - the plan", verdict: "pass", detail: "ran `npm test`; 159 passed." },
      { outcome: "Step 3 - the command", verdict: "fail", detail: "exited 1 with a wrapped line." },
      { outcome: "Goal", verdict: "could not check", detail: "no browser available." }
    ]
  });
  assert.equal(parseSpec("# Export\n\n## Build steps\n\n- [ ] **Step 1 - a** - x\n")?.evidence, null);
});

test("parsePlan reads every way this plan says an item waits", () => {
  const plan = parsePlan(
    [
      "## Plan",
      "",
      "- [x] 17. **Evidence** - done",
      "- [ ] 24. **Packet** - shown; after item 17",
      "- [ ] 39. **Several** - a major version; after item 27, spike first on whether it helps",
      "- [ ] 40. **CI** - needs a grant; after items 20, 24, and 33, spike first on headless runs",
      "- [ ] 46. **Lessons** - opt in; after items 7 and 31, spike first on how many are general",
      "- [ ] 50. **Plain** - nothing to wait for",
      "- [ ] 29. **Plan lines** - a line can say `after item N` or `spike first`, and status skips it"
    ].join("\n")
  );
  assert.deepEqual(plan.map((i) => [i.number, i.after, i.spikeFirst]), [
    ["17", [], false],
    ["24", ["17"], false],
    ["39", ["27"], true],
    ["40", ["20", "24", "33"], true],
    ["46", ["7", "31"], true],
    ["50", [], false],
    ["29", [], false]
  ]);
});

test("parseSettledSpike reads which item a spike settled", () => {
  assert.equal(parseSettledSpike("# Can hooks block?\n\n**For:** item 21\n**Settled:** yes\n"), "21");
  assert.equal(parseSettledSpike("**For:** item 21\n**Settled:** no\n"), null);
  assert.equal(parseSettledSpike("**Settled:** yes\n"), null, "a spike for no plan item");
});

test("waiting holds an item until what it waits on is met, and names what can never be", () => {
  const plan = parsePlan(
    [
      "## Plan",
      "",
      "- [x] 1. **Done** - x",
      "- [ ] 2. **After one** - after item 1",
      "- [ ] 3. **After two** - after item 2",
      "- [ ] 4. **Spike** - spike first on something",
      "- [ ] 5. **Nowhere** - after item 99",
      "- [ ] 6. **Loop a** - after item 7",
      "- [ ] 7. **Loop b** - after item 6"
    ].join("\n")
  );
  const { waits, problems } = waiting(plan, new Set());
  assert.equal(waits.has("2"), false, "its prerequisite is ticked");
  assert.deepEqual(waits.get("3"), ["item 2"]);
  assert.deepEqual(waits.get("4"), ["a spike"]);
  assert.equal(waiting(plan, new Set(["4"])).waits.has("4"), false, "a settled spike frees it");
  assert.deepEqual(problems, ["item 5 comes after item 99, which the plan does not have", "items 6 -> 7 -> 6 wait on each other"]);
});

test("waiting carries a parent's wait to its sub-items, and reports duplicate numbers", () => {
  const plan = parsePlan(
    ["## Plan", "", "- [ ] 21. **Hooks** - one sub-item per tool; spike first on blocking", "  - [ ] 21a. **Codex** - x", "  - [ ] 21b. **OpenCode** - after item 21a", "- [x] 1. **One** - x", "- [ ] 1. **One again** - x"].join("\n")
  );
  const { waits, problems } = waiting(plan, new Set());
  assert.deepEqual(waits.get("21a"), ["a spike"]);
  assert.deepEqual(waits.get("21b"), ["a spike", "item 21a"]);
  assert.deepEqual(waiting(plan, new Set(["21"])).waits.get("21a"), undefined, "the parent's spike settled");
  assert.ok(problems.includes("item 1 appears more than once"));
});

test("parsePlan reads every after phrase on a line, in any case, and spike lines with trailing words", () => {
  const [item] = parsePlan("## Plan\n\n- [ ] 9. **X** - after item 2; also after items 4A and 5\n");
  assert.deepEqual(item?.after, ["2", "4a", "5"]);
  assert.equal(parseSettledSpike("**For:** item 21 (hooks)\n**Settled:** yes\n"), "21");
});

test("specHash ignores what changes as work proceeds, and nothing else", () => {
  const spec = [
    "# Export",
    "",
    "**Type:** Feature",
    "**Status:** in progress",
    "",
    "## Build steps",
    "",
    "- [ ] **Step 1 - the plan** - x",
    "- [ ] **Step 2 - the command** - y",
    ""
  ].join("\n");
  const base = specHash(spec);
  const progressed = spec
    .replace("**Status:** in progress", "**Status:** verified\n**Approved:** 2026-10-21, 0123456789abcdef")
    .replace("- [ ] **Step 1", "- [x] **Step 1") +
    "\n## Evidence\n\nChecked 2026-10-21 at abc1234, tree clean.\n\n## Amendments\n\n- 2026-10-21 - a note - a reason\n";
  assert.equal(specHash(progressed), base);
  assert.notEqual(specHash(spec.replace("- y", "- y, and more")), base);
});

test("parseSpec reads the stamp and the amendments, and calls a spec drifted only against a stamp", () => {
  const body = "# Export\n\n**Type:** Feature\n\n## Build steps\n\n- [ ] **Step 1 - a** - x\n";
  const stamped = (hash: string) => body.replace("**Type:** Feature", `**Type:** Feature\n**Approved:** 2026-10-21, ${hash}`) +
    "\n## Amendments\n\n- 2026-10-21 - Step 1 narrowed - the first version was too big.\n";

  const fresh = parseSpec(stamped(specHash(body)));
  assert.deepEqual(fresh?.approved, { date: "2026-10-21", hash: specHash(body) });
  assert.deepEqual(fresh?.amendments, ["2026-10-21 - Step 1 narrowed - the first version was too big."]);
  assert.equal(fresh?.drifted, false);

  assert.equal(parseSpec(stamped(specHash(body)).replace("- x", "- x, quietly widened"))?.drifted, true);
  assert.equal(parseSpec(body)?.drifted, false, "no stamp, no drift");
});

test("parseSpec and specHash leave examples inside code fences alone", () => {
  const spec = [
    "# Export",
    "",
    "**Type:** Feature",
    "",
    "## Data and contracts",
    "",
    "```markdown",
    "**Approved:** 2026-10-21, 0123456789abcdef",
    "",
    "## Amendments",
    "",
    "- 2026-10-21 - an example - not a real amendment",
    "```",
    "",
    "## Build steps",
    "",
    "- [ ] **Step 1 - a** - x",
    ""
  ].join("\n");
  const parsed = parseSpec(spec);
  assert.equal(parsed?.approved, null, "the example stamp is not the stamp");
  assert.deepEqual(parsed?.amendments, []);
  assert.notEqual(specHash(spec), specHash(spec.replace("an example", "a changed example")), "fenced text is part of what was approved");
});

test("specHash and the stamp hold against whitespace, heading case, tilde fences and malformed stamps", () => {
  const body = "# Export\n\n**Type:** Feature\n\n## Build steps\n\n- [ ] **Step 1 - a** - x\n";
  const base = specHash(body);
  assert.equal(specHash(body.replace("## Build steps", "## Build steps   ")), base, "trailing spaces on a line");
  assert.equal(specHash(body + "\n##  evidence\n\nChecked.\n"), base, "an evidence heading in another case");
  const tilde = body.replace("**Type:** Feature", "**Type:** Feature\n\n~~~\n**Approved:** 2026-01-01, aaaaaaaaaaaaaaaa\n~~~");
  assert.equal(parseSpec(tilde)?.approved, null, "a stamp inside a tilde fence is an example");
  const upper = body.replace("**Type:** Feature", `**Type:** Feature\n**Approved:** 2026-10-21 , ${base.toUpperCase()}`);
  assert.deepEqual(parseSpec(upper)?.approved, { date: "2026-10-21", hash: base });
  assert.equal(parseSpec(upper)?.drifted, false);
  assert.equal(parseSpec(body.replace("**Type:** Feature", "**Type:** Feature\n**Approved:** soon"))?.drifted, true, "an unreadable stamp is drift");
  const hidden = body + "\n## Evidence\n\n```\n## Build steps\n\n- [ ] **Step 1 - a** - x\n- [ ] **Step 2 - b** - y\n```\n";
  assert.equal(parseSpec(hidden)?.steps.length, 1, "a fenced heading does not replace the real steps");
});

test("listWorktrees reads git's worktree records, resolved, without running git", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "religion-trees-"));
  const dir = await fs.realpath(tmp);
  const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { stdio: "pipe" });
  const commit = (cwd: string) => git(cwd, "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "--allow-empty", "-m", "base");
  try {
    const main = path.join(dir, "main");
    await fs.mkdir(path.join(main, "app"), { recursive: true });
    git(main, "init", "-q", "-b", "main");
    commit(main);
    git(main, "worktree", "add", "-q", "-b", "feature/b", path.join(dir, "item b"));
    git(main, "worktree", "add", "-q", "--detach", path.join(dir, "detached"));
    git(main, "worktree", "add", "-q", "-b", "gone", path.join(dir, "gone"));
    await fs.rm(path.join(dir, "gone"), { recursive: true });

    const expected = [
      { path: main, branch: "main" },
      { path: path.join(dir, "detached"), branch: null },
      { path: path.join(dir, "item b"), branch: "feature/b" }
    ];
    const sorted = (trees: { path: string }[]) => [...trees].sort((a, b) => a.path.localeCompare(b.path));
    const fromSub = await listWorktrees(path.join(tmp, "main", "app"));
    assert.equal(fromSub?.home, main);
    assert.deepEqual(sorted(fromSub?.trees ?? []), sorted(expected));
    assert.equal((await listWorktrees(path.join(dir, "item b")))?.home, path.join(dir, "item b"));

    const bare = path.join(dir, "bare.git");
    execFileSync("git", ["init", "-q", "--bare", "-b", "main", bare]);
    git(main, "push", "-q", bare, "main");
    git(bare, "worktree", "add", "-q", path.join(dir, "from-bare"), "main");
    assert.deepEqual((await listWorktrees(path.join(dir, "from-bare")))?.trees, [{ path: path.join(dir, "from-bare"), branch: "main" }]);

    await fs.mkdir(path.join(dir, "plain"));
    assert.equal(await listWorktrees(path.join(dir, "plain")), null);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("readInFlight lists active specs across worktrees, skipping wave steps and idle checkouts", async () => {
  const dir = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "religion-inflight-")));
  const git = (...args: string[]) => execFileSync("git", ["-C", path.join(dir, "main"), ...args], { stdio: "pipe" });
  const spec = async (tree: string, body: string) => {
    await fs.mkdir(path.join(dir, tree, "religion", "context"), { recursive: true });
    await fs.writeFile(path.join(dir, tree, "religion", "context", "current-work.md"), body);
  };
  try {
    await fs.mkdir(path.join(dir, "main"));
    git("init", "-q", "-b", "main");
    git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "--allow-empty", "-m", "base");
    git("worktree", "add", "-q", "-b", "feature/b", path.join(dir, "item b"));
    git("worktree", "add", "-q", "--detach", path.join(dir, "item-c"));
    await fs.mkdir(path.join(dir, "wave"));
    await fs.writeFile(path.join(dir, "wave", "base"), "");
    git("worktree", "add", "-q", "--detach", path.join(dir, "wave", "step-2"));
    await spec("main", "# Current work\n\n_Nothing in progress._\n");
    await spec("item b", "# Second\n\n**Type:** Feature\n**From build plan:** item 2\n\n- [x] **one**\n- [ ] **two**\n");
    await spec("item-c", "# Unplanned\n\n**Type:** Fix\n\n- [ ] **only**\n");
    await spec(path.join("wave", "step-2"), "# Second\n\n**From build plan:** item 2\n\n- [ ] **two**\n");

    const fromB = await readInFlight(path.join(dir, "item b"));
    assert.deepEqual(fromB, [
      { worktree: path.join(dir, "item b"), branch: "feature/b", item: "2", title: "Second", stepsDone: 1, stepsTotal: 2, here: true },
      { worktree: path.join(dir, "item-c"), branch: null, item: null, title: "Unplanned", stepsDone: 0, stepsTotal: 1, here: false }
    ]);
    assert.deepEqual((await readInFlight(path.join(dir, "main"))).map((i) => i.here), [false, false]);
    assert.deepEqual((await readProjectState(path.join(dir, "main"))).inFlight, await readInFlight(path.join(dir, "main")));

    await fs.mkdir(path.join(dir, "plain"));
    assert.deepEqual(await readInFlight(path.join(dir, "plain")), []);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
