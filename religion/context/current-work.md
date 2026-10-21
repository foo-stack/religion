# Plan lines that know what they wait on

**Type:** Feature
**From build plan:** item 29
**Status:** in progress

## Goal

A build-plan line that says `after item N` (or `after items N, M and K`) or `spike first`
waits until that is met, and `status`, `feature` with no argument, and `auto` pass over it to
the first item that is ready, saying which they skipped and why. A reference to an item that
does not exist, or items that wait on each other, is reported rather than silently skipped.
Today the plan states these in prose and nothing reads them.

## In scope

- `parsePlan` in `lib/state.ts` reads `after` and `spikeFirst` from each line.
- A spike archive records which item it answers and whether it settled the question, as
  `**For:** item N` and `**Settled:** yes` or `no`, and the project state reads which items
  have a settled spike.
- `waiting(plan, settled)` in `lib/state.ts`: for each unticked item, what it waits on, plus
  any reference to an unknown item and any cycle.
- `status`: the next item is the first unticked one that waits on nothing, the JSON shape
  unchanged, with a warning naming what was passed over and any unknown reference or cycle.
- The skills: `feature` with no argument, `auto`'s plan order, `spike`'s archive, and the
  `status` skill's fallback read the same rule.
- A minor changeset.

## Out of scope

- Rewriting the plan's lines, which stay in their own words; the parser reads the phrasing
  they already use.
- The dashboard marking waiting items, which follows from `status.plan.nextItem` already.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - read the prerequisites** - `after` and `spikeFirst` on `PlanItem`, settled
  spikes on the project state, and `waiting` in `lib/state.ts`. *Done when:* unit tests read
  every phrasing this plan uses, mark an item waiting on an unticked one or on an unsettled
  spike and ready once that is met, and report an unknown item and a two-item cycle.
- [x] **Step 2 - `status` takes the first ready item** - `computeStatus` in `lib/status.ts`.
  *Done when:* unit tests show the next item skipping a waiting one with a warning naming it,
  warnings for an unknown reference and a cycle, `surface.json` unchanged, and `religion status`
  on this repository giving item 29 as the next plan item, with 21 to 23 and 25 to 27 passed
  over in its warning.
- [ ] **Step 3 - the skills read the same rule** - `feature`, `auto`, `spike` and `status`.
  *Done when:* each rendered skill states the rule in its place, and `npm test` exits 0.
- [ ] **Step 4 - the release note** - a minor changeset. *Done when:* `npm test` exits 0.

## Files and areas

- `packages/create-religion/lib/state.ts`, `lib/state.test.ts`
- `packages/create-religion/lib/status.ts`, `lib/status.test.ts`
- `src/skills/feature/SKILL.md`, `src/skills/auto/SKILL.md`, `src/skills/spike/SKILL.md`,
  `src/skills/status/SKILL.md`, and their rendered copies
- `.changeset/`

## Data and contracts

**Load-bearing**, because `status`, `feature` and `auto` all decide from it:

```ts
PlanItem { number; title; done; depth; after: string[]; spikeFirst: boolean }
waiting(plan: PlanItem[], settled: ReadonlySet<string>): {
  waits: Map<string, string[]>;   // item number -> what it waits on, in words
  problems: string[];             // unknown references and cycles
}
```

`after items 20, 24, and 33` gives `["20", "24", "33"]`. A spike archive's `**For:** item 21`
and `**Settled:** yes` mark item 21's spike done; `no`, or no archive, leaves it waiting. An
item that waits on an item in a cycle waits; the cycle itself is a problem, reported once.
`status --json` keeps its shape: `plan.nextItem` becomes the first ready item, and the
explanations go in `warnings`.

## Testing

- `npm test` is declared, so the gate is on. Parsing the lines, reading spike archives, and the
  waiting rule are logic and get unit tests.
- The real plan is the integration case: `religion status` on this repository.

## Notes for the agent

- While this item is being built it is the first ready unticked item, so `status` names it;
  check against the plan as it stands.
- Parsers stay tolerant: a line with no prerequisites, or wording they do not recognise, waits
  on nothing.
