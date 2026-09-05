import { test } from "node:test";
import assert from "node:assert/strict";

import { overviewHash, parseFindings, parseOpenQuestions, parsePlan, parseWork } from "./state.js";

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
  // Pinning current behaviour, not endorsing it: nextStep truncates at the first " - ",
  // which is the separator the spec template uses inside the bold title, so the second half
  // of the step name is lost. Latent today because nothing reads the field. Noted in the
  // inbox rather than repaired here.
  assert.equal(work.nextStep, "Step 3", "resumption starts at the first unticked step");
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
