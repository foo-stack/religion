import { test } from "node:test";
import assert from "node:assert/strict";

import { parseActivity as parse, parsePlan, parseWork, type ProjectState } from "./state.js";

const parseActivity = (source: string | null) => parse(source, new Set(["auto"]));
import { computeStatus, renderStatus } from "./status.js";

function state(overrides: Partial<ProjectState> = {}): ProjectState {
  return {
    root: "/project",
    config: {},
    configValid: true,
    plan: [{ number: "1", title: "Export reports", done: false, depth: 0, after: [], spikeFirst: false }],
    work: parseWork(null),
    findings: [],
    overviewPresent: true,
    overviewFresh: true,
    openQuestions: [],
    activity: parseActivity(null),
    inbox: [],
    learning: { lessons: [], journal: [], undecided: 0 },
    settledSpikes: [],
    ...overrides
  };
}

const blocked = (resumeCommand?: string) =>
  parseActivity(JSON.stringify({ command: "auto", status: "blocked", summary: "a check failed twice", resumeCommand }));

test("a blocked run with a resume command is the next action, ahead of active work", () => {
  const work = parseWork("# Spec\n\n**Status:** in progress\n\n- [ ] **Step 1 - one** - x\n");

  assert.deepEqual(computeStatus(state({ activity: blocked("/auto resume"), work })).next, {
    command: "auto resume",
    because: "the auto run is blocked: a check failed twice"
  });
  assert.equal(computeStatus(state({ activity: blocked("$auto resume") })).next.command, "auto resume");
});

test("a blocked run without a resume command, or a run that is not blocked, changes nothing", () => {
  assert.equal(computeStatus(state({ activity: blocked() })).next.command, "feature");

  const running = parseActivity(JSON.stringify({ command: "auto", status: "running", summary: "x", resumeCommand: "/auto resume" }));
  assert.equal(computeStatus(state({ activity: running })).next.command, "feature");
});

test("configuration and overview problems still come before a blocked run", () => {
  assert.equal(computeStatus(state({ activity: blocked("/auto resume"), configValid: false })).next.command, "doctor");
  assert.equal(computeStatus(state({ activity: blocked("/auto resume"), overviewFresh: false })).next.command, "overview");
});

test("the text output shows the recorded run and the inbox", () => {
  const busy = renderStatus(
    computeStatus(
      state({
        activity: parseActivity(
          JSON.stringify({ command: "auto", status: "blocked", summary: "a check failed", updatedAt: "2026-10-21T10:00:00Z" })
        ),
        inbox: [{ date: null, text: "one" }, { date: null, text: "two" }]
      })
    )
  );
  assert.match(busy, /^Run: +\/auto blocked - a check failed \(updated 2026-10-21T10:00:00Z\)$/m);
  assert.match(busy, /^Inbox: +2 note\(s\)$/m);

  const idle = renderStatus(computeStatus(state()));
  assert.match(idle, /^Run: +none recorded$/m);
  assert.match(idle, /^Inbox: +empty$/m);
});

test("status warns once five journal entries are waiting for distill", () => {
  const waiting = (undecided: number) =>
    computeStatus(state({ learning: { lessons: [], journal: [], undecided } })).warnings.filter((w) => /distill/.test(w));

  assert.deepEqual(waiting(4), []);
  assert.deepEqual(waiting(5), ["5 journal entries are waiting for distill"]);
});

const plan = (...lines: string[]) => parsePlan(["## Plan", "", ...lines].join("\n"));

test("status passes over items that are waiting and names them", () => {
  const status = computeStatus(
    state({
      plan: plan("- [x] 1. **Done** - x", "- [ ] 2. **Hooks** - spike first on blocking", "- [ ] 3. **Packet** - after item 1", "- [ ] 4. **Later** - x")
    })
  );
  assert.equal(status.plan.nextItem, "Packet - after item 1");
  assert.deepEqual(status.next, { command: "feature", because: "next in the plan: Packet - after item 1" });
  assert.ok(status.warnings.includes("passed over plan items that are waiting: 2 (a spike)"));

  const settled = computeStatus(state({ plan: plan("- [ ] 2. **Hooks** - spike first on blocking"), settledSpikes: ["2"] }));
  assert.equal(settled.plan.nextItem, "Hooks - spike first on blocking");
});

test("status points at a spike when every remaining item waits, and warns about the plan's own mistakes", () => {
  const blocked = computeStatus(state({ plan: plan("- [ ] 2. **Hooks** - spike first on blocking", "- [ ] 3. **After** - after item 2") }));
  assert.equal(blocked.plan.nextItem, null);
  assert.equal(blocked.next.command, "spike");

  const looped = computeStatus(state({ plan: plan("- [ ] 6. **A** - after item 7", "- [ ] 7. **B** - after item 6") }));
  assert.equal(looped.next.command, "overview");
  assert.ok(looped.warnings.includes("the build plan: items 6 -> 7 -> 6 wait on each other"));

  const unknown = computeStatus(state({ plan: plan("- [ ] 8. **C** - after item 99") }));
  assert.equal(unknown.next.command, "feature", "an unknown reference is reported, not waited on forever");
  assert.ok(unknown.warnings.includes("the build plan: item 8 comes after item 99, which the plan does not have"));
});

test("status points at a spike when any remaining item waits on one, even behind a forward reference", () => {
  const forward = computeStatus(state({ plan: plan("- [ ] 1. **First** - after item 2", "- [ ] 2. **Second** - spike first on it") }));
  assert.deepEqual(forward.next, { command: "spike", because: "every remaining item waits, and item 2 waits on a spike" });
});
