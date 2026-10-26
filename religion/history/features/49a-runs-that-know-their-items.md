# Runs that know their items

**Type:** Feature
**From build plan:** item 49a
**Status:** verified
**Approved:** 2026-10-26, e04137b058131184

## Goal

`auto` can be told exactly which plan items to run, as a list or a range (`1-5`, `6,7,8`). The
run records those items in its activity record, and `religion status`, the handoff and
`feature` read every worktree's record, so the items a run holds are visible and passed over
everywhere else, including the ones it has not reached yet, which no spec shows. This is the
groundwork for two sessions splitting the plan: until 49b gives each run its own worktree, two
runs in one checkout still share one spec and one record. Additive throughout, so it releases
as a minor version.

## In scope

- `auto` accepts a comma list (`1, 2, 3` or `6,7,8`) or a range (`1-5`) of plan numbers; a bare
  number keeps meaning a count
- The activity record gains an optional `items` list, written by an `auto` run given explicit
  items and read back by `auto resume`
- The project state parses it; `status --json` reports it under `activity` and under each
  `inFlight` entry, and a worktree whose run holds items but sits between specs is listed too
- `status` passes over a plan item held by a run in another worktree, as it does one in flight
- The handoff names the items a run elsewhere holds
- `feature`, picking with no argument, passes over held items
- The surface record, the stability statement, the activity section of the entry files, a
  routing case, and a changeset

## Out of scope

- Running in its own worktree, refusing held items at preflight, a uniquely named integration
  branch, and naming items that wait on another run's (49b)
- Bringing the default branch back in after another run lands (49c)
- Recording held items for count and `all` runs: which items those take is decided as they
  go, so there is no list to record ahead of time
- A single explicit item; a one-item range (`7-7`) covers it until someone asks for more
- Ranges over sub-item letters (`39a-39c`); list them instead (`39a, 39b, 39c`)
- A dashboard view of held items

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - parse the held items** - in `packages/create-religion/lib/state.ts`,
  `Activity` gains `items: string[]`; `parseActivity` fills it from the record's `items` only
  when `command` is `auto`, keeping entries that are strings matching a plan number
  (`/^\d+[a-z]?$/i`, stored lowercased), at most 100 of them, de-duplicated, order kept; any
  other shape gives `[]` and never makes the record unreadable. Tests in `state.test.ts`.
  *Done when:* tests pass for a valid list, `39A` stored as `39a`, a non-array, mixed bad
  entries dropped while good ones stay, duplicates, more than 100 entries, and `items` on a
  record whose command is not `auto`, and `npm test` exits 0.
- [x] **Step 2 - read held items across worktrees** - in the same file, `InFlight` gains
  `items: string[]`; `readInFlight` reads each worktree's `.state/run.json` (another
  worktree's through `readPlain`, as its spec is) with `parseActivity`, attaches the items,
  and also lists a worktree whose spec is idle but whose record holds items, with `item` and
  `title` null and zero steps. Tests with real worktrees. *Done when:* a worktree with a spec
  and a record holding `6, 7` reports both; an idle worktree whose record holds items is listed;
  an idle one whose record holds none, or whose record is a link, is not; existing cases are
  unchanged; and `npm test` exits 0.
- [x] **Step 3 - status passes over held items** - in `packages/create-religion/lib/status.ts`,
  an item held by a run in another worktree counts as busy, named in the existing warning with
  that worktree's branch; `renderStatus` prints the held items on that worktree's
  `In flight:` line, and a worktree between specs reads as `In flight: auto run holding items
  6, 7, 8 on <branch>`. Tests in `status.test.ts`. *Done when:* with items 1 to 5 held
  elsewhere, `next` offers item 6 and the warning names the holder's branch; items held by this
  worktree's own run are not passed over; with nothing held the output is byte-identical to
  before; and `npm test` exits 0.
- [x] **Step 4 - record the fields** - `packages/create-religion/surface.json` and the `status`
  list in `docs/stability.md` gain `activity.items` and `inFlight[].items`; a changeset marks
  `create-religion` minor. *Done when:* the surface and docs checks pass in `npm test`.
- [x] **Step 5 - the handoff names held items** - `src/hooks/write-handoff.mjs` reads each other
  worktree's `run.json` the same standalone way it reads specs, applying the same rule as
  Step 1 (command `auto`, plan numbers only, capped), and adds the held items to that
  worktree's line, or a line of its own when the worktree sits between specs. Cases in
  `scripts/hooks.test.ts`. *Done when:* another worktree's record holding `6, 7` appears in the
  handoff with its branch, an entry that is not a plan number is dropped, a record that does not
  parse leaves the handoff as before, and `npm test` exits 0.
- [x] **Step 6 - the skills use them** - in `src/skills/auto/SKILL.md`, Bounds gains the list
  and range forms: items run in plan order whatever order they were given, each completed as a
  count run completes it; a ticked item is named and passed over; a number the plan does not
  have stops the run before any work; the waiting rule still applies, and an item waiting on
  one outside the list is passed over and named. The run writes `items` into its activity
  record from the first write, and `resume` takes the remaining items from that record,
  stopping to ask for the list again when the record is gone rather than guessing. In
  `src/skills/feature/SKILL.md`, Step 1 passes over items `inFlight` lists under `items` for a
  worktree that is not `here`. `src/entry/partials/activity.md` gains the
  optional `items` field. A positive routing case in `evals/routing/auto.json` for running
  named items unattended. Then `npm run build:skills:link`. *Done when:* the rendered trees
  carry the change, the routing corpus and drift check pass, and `npm test` exits 0.
- [x] Repair 49a/F-1 - A range over a parent item does not hold its sub-items. `status` counts
  an item busy when it or any ancestor is held elsewhere; `auto` records a named parent's
  unticked sub-item labels in `items` beside it, so `feature` and the handoff see them too.
  *Done when:* with item 2 held elsewhere, its sub-items 2a and 2b are passed over in a test,
  and the skill says what a parent in a range or list means.
- [x] Repair 49a/F-2 - When a run stops holding its items is contradictory. `auto` and the
  activity partial say `items` stays on every write, a blocked stop included, and the final
  write of a run that ended keeps only the items it completed. *Done when:* both texts say so
  and the rendered trees match.
- [x] Repair 49a/F-3 - The resume rule catches count runs too. *Done when:* `auto` says a record
  with `items` resumes those, one without resumes as before, and only a named run whose record
  is gone stops to ask.
- [x] Repair 49a/F-4 - The 100-entry cap is asserted by length only. *Done when:* the test pins
  the kept entries and the de-duplicate-then-cap order, and fails when either changes.
- [x] Repair 49a/F-5 - The hook's copy of the record-validity rule is untested. *Done when:*
  hook cases cover a bad status, a missing summary and a `39A` entry, and removing the
  hook's validity check fails a test.
- [x] Repair 49a/F-14 - The passed-over warning can print "null". *Done when:* an unnumbered
  sub-item under a held parent is passed over but not named, asserted in a test.
- [x] Repair 49a/F-15 - What a completed run keeps of a held parent. *Done when:* `auto` and
  `activity.md` say the completed write drops a parent number unless all its sub-items completed.
- [x] Repair 49a/F-16 - Deeper nesting untested. *Done when:* a `2 > 2b > 2b1` case fails if only
  the direct parent is checked.
- [x] Repair 49a/F-17 - The hook's cap untested. *Done when:* removing the hook's cap fails a test.
- [x] Repair 49a/F-18 - The trim misses a run ending `ready`. *Done when:* `auto` and
  `activity.md` apply it to the final write of a run that ended, `completed` or `ready`.
- [x] Repair 49a/F-19 - The empty-warning guard untested. *Done when:* reverting the guard fails
  a test.
- [x] Repair 49a/F-20 - Releasing by status frees items a stopped run still means to build.
  *Done when:* `auto` and `activity.md` release items only when no named item is left to build,
  every other stop keeps them and writes `blocked`, and a completed record resumes nothing.

## Files and areas

- `packages/create-religion/lib/state.ts`, `state.test.ts`
- `packages/create-religion/lib/status.ts`, `status.test.ts`
- `packages/create-religion/surface.json`, `docs/stability.md`, `.changeset/`
- `src/hooks/write-handoff.mjs`, `scripts/hooks.test.ts`
- `src/skills/auto/SKILL.md`, `src/skills/feature/SKILL.md`, `src/entry/partials/activity.md`,
  `evals/routing/auto.json`
- The rendered trees and entry files, by the build only

## Data and contracts

- **Load-bearing:** the activity record's optional `items`, an array of plan numbers as
  strings (`"6"`, `"39a"`), meaningful only when `command` is `auto`. 49b refuses items by it
  and 49c's catch-up reads it, so its shape is fixed here.
- **Load-bearing:** `Activity.items` and `InFlight.items`, both `string[]`, empty when nothing
  is held. Additive JSON fields, so a minor release under `docs/stability.md`.
- An `inFlight` entry may now have `item` null and zero steps while its `items` is non-empty:
  a run between specs. Consumers that assumed every entry has a spec must read `items` too.
- Plan numbers are compared lowercased, as the build plan's parser stores them.
- A record keeps holding its items until that worktree's next command replaces it. A ticked
  item stops mattering on its own; an abandoned run's unticked items stay visible in `status`,
  which is the point, rather than silently freed.

## Testing

- `npm test` is the declared test and Verify command, and it is the gate for every step.
- Parsing and reading are logic and ship tests in the same step: Step 1 in `state.test.ts`,
  Step 2 with real temporary worktrees, Step 3 in `status.test.ts`, Step 5 in
  `scripts/hooks.test.ts`.
- Step 4 is covered by the surface and docs checks already in `npm test`; Step 6 by the
  routing corpus and the rendered-tree drift check.

## Notes for the agent

- Another worktree's files are controlled by someone else's branch: read its `run.json`
  exactly as its spec is read, without following a link and capped in size, never through
  `readIfPresent`.
- The handoff hook is standalone and cannot import from `lib/`; repeat the rule there, as it
  already repeats the spec read.
- A record is local state that is overwritten freely; a malformed `items` must degrade to `[]`,
  never to an unreadable record, since `status` must keep working.
- Edit `src/`, never a rendered tree. No em dashes in anything written.

## Amendments

- 2026-10-26 - Repair steps added for 49a/F-1 (P1) and 49a/F-2 to 49a/F-5 (P2), raised by the
  audit of this item; the P2s ride along because they touch the same skill text and tests.
- 2026-10-26 - Repair steps added for 49a/F-14 to 49a/F-17, surfaced by the re-review of the
  first repairs and folded into this item, since each sits in code those repairs changed.
- 2026-10-26 - Repair steps added for 49a/F-18 and 49a/F-19, surfaced by the second re-review.
- 2026-10-26 - Repair step added for 49a/F-20, surfaced by the third re-review; the release
  rule moves from the run's status to what is left to build.

## Findings

### 49a/F-1 [P1] closed - A range over a parent item does not hold its sub-items

**File:** src/skills/auto/SKILL.md:136
**Found:** 2026-10-26 by audit (scope: current; lens: quality)
**Why it matters:** `auto 48-50` records `["48", "49", "50"]`, and 49 exists, so nothing stops it. But `computeStatus` marks only leaves busy (`status.ts:29-39`), so 49a to 49c stay on offer in other worktrees while this run may build them: two sessions building one item, which is what this item exists to prevent. The prose also never says whether 49 means its sub-items.
**Suggested fix:** Say a whole number with sub-items stands for all of them and record the sub-item labels in `items`, or that naming a parent stops the run before work, naming it.
**Resolution:** 2026-10-26 - `computeStatus` holds an item when it or any ancestor is held elsewhere (`status.ts`), tested with a held parent 2 passing over 2a and 2b; `auto` says a number with sub-items stands for its unticked sub-items and records their labels. Closed 2026-10-26 by a fresh-context re-review: `status.ts` checks every ancestor, tested with a held parent and a three-level case; narrowing to the item fails the test; 49a/F-14, F-15 and F-16, which it surfaced, are closed.

### 49a/F-2 [P2] closed - When a run stops holding its items is contradictory

**File:** src/skills/auto/SKILL.md:130
**Found:** 2026-10-26 by audit (scope: current; lenses: quality, security)
**Why it matters:** "until the run ends" (also `src/entry/partials/activity.md:30`) can read as clearing `items` on a blocked stop, which breaks resume and frees the items to other worktrees. Read the other way, a completed run that passed over items it could not start leaves them held, so other worktrees keep skipping them indefinitely.
**Suggested fix:** Keep `items` on every write including a blocked stop; leave it out of the final write of a run that ended `completed`.
**Resolution:** 2026-10-26 - `auto` and `activity.md` keep `items` on every write including a blocked stop; the final write of a completed run keeps only the items it completed. Closed 2026-10-26 by a fresh-context re-review: a blocked stop keeps every item, a finished run frees what it passed over; 49a/F-15 and 49a/F-18, which it surfaced, are closed.

### 49a/F-3 [P2] closed - The resume rule catches count runs too

**File:** src/skills/auto/SKILL.md:133
**Found:** 2026-10-26 by audit (scope: current; lens: quality)
**Why it matters:** "When the record is gone or holds no items, stop and ask for the list again" is true of every count and `all` run, which never write `items`, so read literally `auto resume` after one now stops to ask for a list.
**Suggested fix:** A record with `items` resumes those; one without resumes as before; only a named run whose record is gone stops and asks.
**Resolution:** 2026-10-26 - `auto` resume: a record with `items` resumes those, one without resumes as a count, `all` or fix run, and only a named run with no record stops to ask. Closed 2026-10-26 by a fresh-context re-review: `auto/SKILL.md` Named items resume rule now separates named, count, `all` and fix runs.

### 49a/F-4 [P2] closed - The 100-entry cap is asserted by length only

**File:** packages/create-religion/lib/state.test.ts:489
**Found:** 2026-10-26 by audit (scope: current; lens: tests)
**Why it matters:** `slice(-100)` or slicing before de-duplicating also passes, and the kept prefix is the contract 49b and 49c read.
**Suggested fix:** Assert the full 150-entry result equals 1 to 100, and that 100 copies of "1" then "2" give `["1", "2"]`.
**Resolution:** 2026-10-26 - `state.test.ts` asserts the 150-entry case keeps exactly 1 to 100, and 100 copies of "1" then "2" give ["1", "2"]. Closed 2026-10-26 by a fresh-context re-review: mutations `slice(-100)` and slice-before-dedupe each fail a test.

### 49a/F-5 [P2] closed - The hook's copy of the record-validity rule is untested

**File:** scripts/hooks.test.ts:271
**Found:** 2026-10-26 by audit (scope: current; lens: tests)
**Why it matters:** Deleting the hook's status and summary check (`write-handoff.mjs`, `heldItems`) leaves every test green, and the rule is duplicated by design, so drift from `parseActivity` goes unnoticed. Lowercasing and the cap are untested there too.
**Suggested fix:** Add records with a bad status and with no summary, each giving no "holding" text, and a `39A` entry rendered as `39a`.
**Resolution:** 2026-10-26 - `hooks.test.ts` covers a bad status, a missing summary and a `39A` entry; removing the hook's validity check fails the test (checked by mutation, file restored). Closed 2026-10-26 by a fresh-context re-review: removing the hook's validity check fails `hooks.test.ts`; `39A` and the cap are covered, and 49a/F-17, which it surfaced, is closed.

### 49a/F-9 [P3] closed - The maxItems sentence is duplicated

**File:** src/skills/auto/SKILL.md:137
**Found:** 2026-10-26 by audit (scope: current; lens: quality)
**Why it matters:** It repeats Bounds word for word.
**Suggested fix:** Delete it.
**Resolution:** 2026-10-26 - the duplicated sentence was replaced while repairing 49a/F-1. Closed 2026-10-26 by a fresh-context re-review: the sentence appears once, in Bounds.

### 49a/F-14 [P3] closed - The passed-over warning can print "null" for an unnumbered sub-item

**File:** packages/create-religion/lib/status.ts:68
**Found:** 2026-10-26 by audit (scope: current; lens: quality)
**Surfaced by:** 49a/F-1
**Why it matters:** An unnumbered child of a held parent now counts as busy, and the warning names it `null (auto/a)`. Reproduced.
**Suggested fix:** Leave unnumbered items out of the named list, with one assertion.
**Resolution:** 2026-10-26 - the warning names only numbered items (`status.ts`); a test asserts an unnumbered line under a held parent is passed over and not named. Closed 2026-10-26 by a fresh-context re-review: removing the numbered-only filter fails `status.test.ts`; 49a/F-19, which it surfaced, is closed.

### 49a/F-15 [P2] closed - Trimming on completion does not say what happens to a held parent number

**File:** src/skills/auto/SKILL.md:132
**Found:** 2026-10-26 by audit (scope: current; lens: quality)
**Surfaced by:** 49a/F-1, 49a/F-2
**Why it matters:** A run over `2` that completes 2a and passes over 2b may keep `2` in its final write, and `status` then holds 2b everywhere through the parent: the indefinite hold 49a/F-2 removed.
**Suggested fix:** The completed write keeps the labels it completed and drops a parent number unless every sub-item under it was completed.
**Resolution:** 2026-10-26 - `auto` and `activity.md` say a completed write keeps a parent number only when every sub-item under it completed. Closed 2026-10-26 by a fresh-context re-review: `auto` and `activity.md` keep a parent number only when every sub-item under it completed.

### 49a/F-16 [P3] closed - Nesting deeper than one level is untested

**File:** packages/create-religion/lib/status.test.ts:157
**Found:** 2026-10-26 by audit (scope: current; lens: tests)
**Surfaced by:** 49a/F-1
**Why it matters:** Checking only the direct parent passes every test, though the code is correct today.
**Suggested fix:** A `2 > 2b > 2b1` case holding `2`, asserting 2b1 is passed over.
**Resolution:** 2026-10-26 - a `2 > 2b > 2b1` case; checking only the direct parent fails it (mutation, file restored). Closed 2026-10-26 by a fresh-context re-review: checking only the direct parent fails `status.test.ts`.

### 49a/F-17 [P3] closed - The hook's 100-item cap is still untested

**File:** scripts/hooks.test.ts:284
**Found:** 2026-10-26 by audit (scope: current; lens: tests)
**Surfaced by:** 49a/F-5
**Why it matters:** The 200 duplicate entries collapse to one before the cap applies, so removing the hook's cap leaves every test green. Checked by mutation.
**Suggested fix:** 150 distinct numbers, asserting the line ends at 100.
**Resolution:** 2026-10-26 - 150 distinct entries must render exactly 1 to 100; removing the hook's cap fails it (mutation, file restored). Closed 2026-10-26 by a fresh-context re-review: removing the hook's `.slice(0, 100)` fails `hooks.test.ts`.

### 49a/F-18 [P2] closed - The completed-run trim misses a run that ends waiting for review

**File:** src/skills/auto/SKILL.md:132
**Found:** 2026-10-26 by audit (scope: current; lens: quality)
**Surfaced by:** 49a/F-2, 49a/F-15
**Why it matters:** The trim applies to a run that ended `completed`, but `activity.md` says an unattended run waiting for review writes `ready`, which is how a named run under `pull-request` ends. Then the trim never fires and passed-over items stay held indefinitely.
**Suggested fix:** Apply it to the final write of a run that ended, `completed` or `ready`.
**Resolution:** 2026-10-26 - `auto` and `activity.md` apply the trim to the final write of a run that ended, `completed` or `ready`. Closed 2026-10-26 by a fresh-context re-review: a named run whose items all landed releases on its `completed` write, whatever a waiting-for-review status would have been.

### 49a/F-19 [P3] closed - The guard against an empty in-flight warning is untested

**File:** packages/create-religion/lib/status.ts:67
**Found:** 2026-10-26 by audit (scope: current; lens: tests)
**Surfaced by:** 49a/F-14
**Why it matters:** Reverting it to `building.length > 0` passes every test, though it would print an empty warning when every passed-over item is unnumbered.
**Suggested fix:** A held parent whose only unticked child is unnumbered, asserting no in-flight warning.
**Resolution:** 2026-10-26 - a held parent whose only child is unnumbered gives no in-flight warning; reverting the guard fails it (mutation, file restored). Closed 2026-10-26 by a fresh-context re-review: reverting the guard fails `status.test.ts`.
