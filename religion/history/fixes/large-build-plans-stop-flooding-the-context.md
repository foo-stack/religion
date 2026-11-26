# Large build plans stop flooding the context

**Type:** Fix
**Status:** verified
**Approved:** 2026-11-26, 639a06c6c3e4e0a5

## Goal

On a project with a long build plan, Religion pays for the whole queue in every session and
for the whole plan in every skill that needs one line of it. On a 1,252-item plan that is
about 33k tokens of Roadmap loaded every session, and about 56k tokens each time `feature`,
`complete`, `rollback` or `status` reads the plan. Afterwards, the always-loaded Roadmap has
a fixed upper size whatever the queue length, and skills that need one line find that line
rather than reading the file.

## Cause

Established by measuring a real install (`fishlang-dev/fish`) and reading the skill sources:

- **The Roadmap lists every unchecked item.** `src/skills/overview/SKILL.md` and
  `reference/project-overview-template.md` say to list "what is queued, in build-plan order",
  with no limit. The overview is loaded through the entry file's `@` include, so its size is
  paid at the start of every session. In `fish` the Roadmap is 132 KB of a 153 KB overview,
  for 856 unchecked lines.
- **Skills read the whole plan to find one line.** `feature` Step 1 says to "read the plan top
  to bottom" to find the next item. `complete` ticks one line, `rollback` matches one checked
  line, and the `status` fallback reads the plan for progress. In `fish` the plan is 223 KB.
- **The CLI already does the hard part but can't hand it over.** `religion status --json`
  applies the `after item N`, `spike first` and in-flight rules in code, but `plan.nextItem`
  is the title with its number stripped (`state.ts` line 181), so a skill still has to search
  the plan to learn which item that is.

## In scope

- Cap the overview's Roadmap at the first 20 unchecked items, with a count line for the rest.
- Add `plan.nextNumber` to `religion status --json`, recorded in the surface record and the
  stability doc.
- `feature`, `complete`, `rollback` and the `status` fallback find the lines they need
  instead of reading the whole plan.

## Out of scope

- **`overview` still reads both plans in full.** Validation needs all of them, and it only
  runs when the plans change.
- **`feature`'s new-work intake still scans the plan for near-duplicates.** It runs rarely,
  and a keyword search there could miss a reworded duplicate.
- **`auto` is not edited.** It takes its next item through `feature`, so it inherits that
  change.
- **The `findings.md` size in `fish`** (229 KB, read by `audit`, `fix` and `complete`). It
  looks like a pruning problem in that project, not something this fix covers.
- **Updating `fish` or any other install.** They pick this up through `religion update` and a
  regenerated overview after a release.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - cap the Roadmap** - `overview` and its template list the first 20 unchecked
  items in plan order, with their numbers, then one line saying how many more are queued in
  `build-plan.md`. A plan with 20 or fewer unchecked items lists them all, as today.
  *Done when:* this repository's regenerated overview still lists all 16 items with no count
  line, and the overview regenerated from a scratchpad copy of `fish`'s plans has a Roadmap
  under 10 KB that ends in a count line whose number equals that plan's unchecked lines minus the 20 listed.
- [x] **Step 2 - `plan.nextNumber` in status JSON** - `status.ts` reports the number of the
  item `nextItem` names, or null; `surface.json` and `docs/stability.md` list the field.
  *Done when:* a test in `status.test.ts` asserts `nextNumber` beside existing `nextItem`
  cases, including a sub-item number such as `49b` and null when nothing is next, and
  `npm test` passes with the surface check accepting the new field.
- [x] **Step 3 - skills find the line they need** - `feature` Step 1 with no argument takes
  `plan.nextNumber`, `nextItem` and the passed-over warnings from `religion status --json`.
  Without the command, it searches for the unchecked lines and looks up only the lines their
  `after` clauses name. `complete` and `rollback` find the target line by its number with a
  search. The `status` fallback counts boxes with a search. Rebuilt with
  `npm run build:skills:link`.
  *Done when:* no skill source still tells the agent to read the build plan top to bottom,
  the rendered trees match the sources (the drift check in `npm test`), and the routing
  corpus passes unchanged.

## Files and areas

- `src/skills/overview/SKILL.md`, `src/skills/overview/reference/project-overview-template.md`
- `packages/create-religion/lib/status.ts`, `status.test.ts`, `packages/create-religion/surface.json`,
  `docs/stability.md`
- `src/skills/feature/SKILL.md`, `src/skills/complete/SKILL.md`, `src/skills/rollback/SKILL.md`,
  `src/skills/status/SKILL.md`
- Rendered trees and `template/`, regenerated by the build, never edited by hand

## Data and contracts

- **`religion status --json`** gains `plan.nextNumber` (`string | null`), the plan number in
  lowercase as the parser stores it, for example `"22"` or `"49b"`. Adding a field is allowed
  in a 1.x minor release under `docs/stability.md`. **Load-bearing:** `feature` reads it, so
  it is never removed or renamed within 1.x.
- **The Roadmap's shape** changes for queues over 20: a count line replaces the tail. Nothing
  parses the Roadmap, since the handoff hook and the CLI read `build-plan.md` itself.

## Testing

- Step 1: by observation. The regenerated overviews and their measured Roadmap sizes, since
  the change is in skill prose.
- Step 2: a unit test in `status.test.ts`, which is in-scope logic for the declared test
  command. The surface check covers the JSON shape.
- Step 3: `npm test` for the drift check and the routing corpus, plus a search of the skill
  sources showing no remaining instruction to read the whole plan.

## Notes for the agent

- Edit skill sources under `src/skills/`, never a rendered tree. The skills are written in
  the token vocabulary (the state directory and command tokens from `src/lib/adapters.ts`).
- The release note is a minor changeset for `create-religion`, since a JSON field is added.
  `complete` drafts it.
- Only measure `fish` in a scratchpad copy. Never write into that project.

## Amendments

- 2026-11-26 - The agent note no longer quotes the template tokens literally. The verification check that rejects unrendered tokens reads this file.

## Findings

None raised or closed with this fix.
