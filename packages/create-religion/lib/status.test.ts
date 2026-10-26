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
    spec: { hash: null, approved: null, drifted: false },
    inFlight: [],
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

test("status warns when the active spec drifted from its approval", () => {
  const drift = "the active spec changed since its approval stamp; record an amendment saying why and renew the stamp";
  assert.ok(computeStatus(state({ spec: { hash: "1111111111111111", approved: "2222222222222222", drifted: true } })).warnings.includes(drift));
  assert.ok(!computeStatus(state()).warnings.includes(drift));
});

test("status passes over a plan item in flight in another worktree and lists it", () => {
  const away = { worktree: "/elsewhere", branch: "feature/b", item: "2", title: "Second", stepsDone: 1, stepsTotal: 3, here: false, items: [] as string[] };
  const items = plan("- [x] 1. **Done** - x", "- [ ] 2. **Second** - x", "- [ ] 3. **Third** - x");

  const status = computeStatus(state({ plan: items, inFlight: [away] }));
  assert.equal(status.plan.nextItem, "Third - x");
  assert.ok(status.warnings.includes("passed over plan items in flight in another worktree: 2 (feature/b)"));
  assert.deepEqual(status.inFlight, [away]);
  assert.match(renderStatus(status), /^In flight: item 2 Second - step 1\/3 on feature\/b$/m);

  const here = computeStatus(state({ plan: items, inFlight: [{ ...away, here: true }] }));
  assert.equal(here.plan.nextItem, "Second - x", "this worktree's own item is not passed over");
  assert.doesNotMatch(renderStatus(here), /In flight/);

  const idle = state({ plan: items });
  assert.equal(renderStatus(computeStatus(idle)), renderStatus(computeStatus({ ...idle, inFlight: [] })));
  assert.doesNotMatch(renderStatus(computeStatus(idle)), /In flight/);

  const allBusy = computeStatus(state({ plan: plan("- [ ] 2. **Second** - x"), inFlight: [away] }));
  assert.equal(allBusy.next.command, "implement");
});

test("status passes over plan items an auto run in another worktree holds", () => {
  const items = plan(...[1, 2, 3, 4, 5, 6].map((n) => `- [ ] ${n}. **Item ${n}** - x`));
  const between = { worktree: "/run-a", branch: "auto/a", item: null, title: null, stepsDone: 0, stepsTotal: 0, here: false, items: ["1", "2", "3", "4", "5"] };

  const status = computeStatus(state({ plan: items, inFlight: [between] }));
  assert.equal(status.plan.nextItem, "Item 6 - x");
  assert.ok(status.warnings.includes("passed over plan items in flight in another worktree: 1 (auto/a); 2 (auto/a); 3 (auto/a); 4 (auto/a); 5 (auto/a)"));
  assert.match(renderStatus(status), /^In flight: auto run holding items 1, 2, 3, 4, 5 on auto\/a$/m);

  const building = { ...between, item: "2", title: "Item 2", stepsDone: 1, stepsTotal: 4 };
  assert.match(renderStatus(computeStatus(state({ plan: items, inFlight: [building] }))), /^In flight: item 2 Item 2 - step 1\/4, holding items 1, 2, 3, 4, 5 on auto\/a$/m);

  const split = plan("- [ ] 1. **One** - x", "- [ ] 2. **Two** - x", "  - [ ] 2a. **Two a** - x", "  - [ ] 2b. **Two b** - x", "- [ ] 3. **Three** - x");
  const parent = computeStatus(state({ plan: split, inFlight: [{ ...between, items: ["2"] }] }));
  assert.equal(parent.plan.nextItem, "One - x");
  const pastOne = computeStatus(state({ plan: split.map((i) => (i.number === "1" ? { ...i, done: true } : i)), inFlight: [{ ...between, items: ["2"] }] }));
  assert.equal(pastOne.plan.nextItem, "Three - x", "a held parent holds its sub-items");
  assert.ok(pastOne.warnings.includes("passed over plan items in flight in another worktree: 2a (auto/a); 2b (auto/a)"));

  const deep = plan("- [ ] 2. **Two** - x", "  - [ ] 2b. **Two b** - x", "    - [ ] **Unnumbered** - x", "    - [ ] 2b1. **Deep** - x", "- [ ] 3. **Three** - x");
  const nested = computeStatus(state({ plan: deep, inFlight: [{ ...between, items: ["2"] }] }));
  assert.equal(nested.plan.nextItem, "Three - x", "a held parent holds every level below it");
  assert.ok(nested.warnings.includes("passed over plan items in flight in another worktree: 2b1 (auto/a)"), "an unnumbered line is not named");
  const bare = computeStatus(state({ plan: plan("- [ ] 2. **Two** - x", "  - [ ] **Unnumbered** - x", "- [ ] 3. **Three** - x"), inFlight: [{ ...between, items: ["2"] }] }));
  assert.ok(!bare.warnings.some((w) => w.includes("in another worktree")), "nothing numbered to name, so no warning");

  const own = computeStatus(state({ plan: items, inFlight: [{ ...between, here: true }] }));
  assert.equal(own.plan.nextItem, "Item 1 - x", "this worktree's own run does not pass over its items");
});
