# Each run in its own worktree

**Type:** Feature
**From build plan:** item 49b
**Status:** verified
**Approved:** 2026-10-26, 0da577f5cde4b71d

## Goal

With `workflow.parallelItems` on under `git.mode: pull-request`, an `auto` run starts in its own
git worktree beside the project, on an integration branch named from the date and the items it
was given, so two sessions can run `/auto 1-5` and `/auto 6-10` at once without sharing a spec,
an activity record or a branch. Before any work, a named run refuses items another run holds and
names the items that wait on another run's, rather than discovering either halfway through.

## In scope

- `implement/reference/item-worktree.md` gains a run mode: the same create and copy blocks, with
  no spec to move, so a run's worktree is made by the routine items already use
- `auto`, under `pull-request` with `workflow.parallelItems` on: the integration branch is made
  in its own worktree through that routine and the run works from there; a named run's branch is
  `<prefix><date>-<first>-<last>` (`-<item>` for one); `resume` from the main checkout names the
  run's worktree instead of starting a second copy
- `auto` preflight for a named run: stop on any named item, or one above or below it in the plan,
  that another worktree holds or is building, naming each with its branch; name each named item
  that waits on one held elsewhere, since it will be passed over
- `implement` and `docs/architecture/config.md` stop saying an automated run never uses a
  worktree
- Folded in from 49a's ledger, all in the same `auto` text: 49a/F-21 (the releasing write comes
  after the aggregate pull request), 49a/F-22 (already ticked items count toward release),
  49a/F-10 (preflight stops a named run with nothing unticked), 49a/F-6 (the routing description
  names the list and range forms)
- A changeset

## Out of scope

- `branch-per-item`: a run there merges each item into the default branch, which only one
  checkout can hold, so runs under it stay in the main checkout, one at a time
- Bringing the default branch back in after another run's aggregate lands (49c)
- Count, `all` and fix runs recording what they will take: they still pass over held items as
  `feature` does, but hold nothing ahead of time, so running two at once stays a named-run feature
- Removing a run's worktree once its aggregate pull request merges: deleting files, and asks
- 49a/F-7, F-8, F-11, F-12 (code-level P3s in `state.ts` and `status.ts`) and F-13

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - the routine's run mode** - in `src/skills/implement/reference/item-worktree.md`,
  block 2 takes `move='yes'` (the default, an item) or `move='no'` (a run): with `no` it skips
  the spec checks and the spec copy and still copies what git does not carry; block 3 runs only
  for an item; a short section says a run uses blocks 1 and 2 with its integration branch and
  `move='no'`. *Done when:* in a throwaway repository with an ignored state directory, blocks 1
  and 2 with `move='no'` leave a worktree on the run's branch holding the copied state files and
  the stub spec, with the main checkout's files untouched; the same blocks with `move='yes'`
  still move a spec as before; and `npm test` exits 0.
- [x] **Step 2 - auto starts in its worktree** - in `src/skills/auto/SKILL.md`, Step 1 under
  `pull-request` with `workflow.parallelItems` on: the main checkout must be on the default
  branch at the recorded commit; the integration branch is made through the routine's run mode
  and pushed from the worktree; the run works from there as `implement` describes for an item;
  a named run's branch name; `resume` in the main checkout names the run's worktree and stops.
  `src/skills/implement/SKILL.md` and `docs/architecture/config.md` say an automated run keeps
  plain item branches inside its own worktree. *Done when:* the rendered skills say so and
  `npm test` exits 0.
- [x] **Step 3 - preflight refuses and names** - in the same skill, a named run's preflight
  reads `religion status --json` (or the handoff without it) and stops on a named item that
  another worktree holds or is building, counting a parent and its sub-items as one, and names
  each named item that waits on an item held elsewhere. *Done when:* the rendered skill says so
  and `npm test` exits 0.
- [x] **Step 4 - fold in 49a's open findings** - in `src/skills/auto/SKILL.md` and
  `src/entry/partials/activity.md`: the releasing write is the run's last, after Step 3 opens the
  aggregate pull request, and a blocked record with every item ticked resumes at Step 3
  (49a/F-21); release counts items already ticked (49a/F-22); preflight stops a named run with no
  named item unticked (49a/F-10); the `description` names the list and range forms (49a/F-6). A
  changeset. *Done when:* the rendered trees match, the routing corpus passes, and
  `npm test` exits 0.
- [x] **Step 5 - two runs side by side** - no new code: in a throwaway Religion project with
  `parallelItems` on, make two run worktrees with the routine, write a named record in each, and
  observe `religion status` from the main checkout and from each worktree. *Done when:* the main
  checkout lists both runs and their items, each worktree lists only the other's, and `doctor`
  inside each passes its configuration and git checks.
- [x] Repair 49b/F-1 - The run's first record stays in the main checkout as a phantom run.
  *Done when:* `auto` says a run in its own worktree writes `items` only there and rewrites the
  main checkout's record as `ready` holding none.
- [x] Repair 49b/F-2 - A named run that completes nothing never releases. *Done when:* `auto`
  and `activity.md` say such a run releases at once, and only an aggregate Step 3 should have
  opened and did not blocks.
- [x] Repair 49b/F-15 to F-17 - surfaced by the re-review of the first two repairs: the first
  write holds no items, the main checkout's record is rewritten `completed` with no resume
  command, and the partial's release clause is scoped. *Done when:* `auto` and `activity.md` say
  so and the rendered trees match.

## Files and areas

- `src/skills/implement/reference/item-worktree.md`, `src/skills/implement/SKILL.md`
- `src/skills/auto/SKILL.md`, `src/entry/partials/activity.md`
- `docs/architecture/config.md`, `.changeset/`
- `religion/context/findings.md` for the folded 49a findings
- The rendered trees and entry files, by the build only

## Data and contracts

- **Load-bearing:** a run's worktree path follows the item rule: the project's directory name, a
  dot, and the branch with each `/` as `-`, in the project's parent directory
  (`religion.auto-2026-10-26-6-10`). 49c and any cleanup find it there.
- **Load-bearing:** a named run's integration branch is
  `<integrationBranchPrefix><date>-<first>-<last>`, or `-<item>` for one item, with item labels as
  the plan writes them. `resume` finds the run by it.
- The activity record is unchanged: each worktree keeps its own `run.json`, which is what makes
  the items each run holds visible to the other (49a).

## Testing

- `npm test` is the gate: verify, unit tests, routing corpus. This item changes prose and a
  shell routine, not `lib/`, so it adds no unit tests.
- The routine is proved by running it by hand in a throwaway repository (Steps 1 and 5), as 39c
  proved it, each block in a fresh shell.

## Notes for the agent

- Each block runs as one command in its own subshell and sets what it needs; nothing carries
  between blocks.
- Never remove a worktree or branch the steps create outside the throwaway repository; the
  throwaway one lives in the scratchpad.
- Edit `src/`, never a rendered tree. No em dashes.

## Amendments

- 2026-10-26 - Repair steps added for 49b/F-1 and 49b/F-2 (P1), raised by this item's audit; its
  P2 and P3 findings stay in the ledger, since an automated run repairs P0 and P1 only.
- 2026-10-26 - Repair step added for 49b/F-15 to F-17, surfaced by the re-review of 49b/F-1
  and F-2, folded in since they sit in the sentences those repairs changed.

## Findings

### 49b/F-1 [P1] closed - The run's first record stays in the main checkout as a phantom run

**File:** src/skills/auto/SKILL.md:93
**Found:** 2026-10-26 by audit (scope: current; lens: quality)
**Why it matters:** The run writes `run.json`, with `items`, as its first action, in the main checkout, before its worktree exists, and nothing clears it. `readInFlight` lists the main checkout and keeps a record holding items with no spec, so from the run's worktree `status`, the handoff and `feature` see another run holding its items, and a resume refuses its own items.
**Suggested fix:** Once the worktree exists, write the run's record there and rewrite the main checkout's to one holding no items that names the worktree.
**Resolution:** 2026-10-26 - `auto` Hold them: a run in its own worktree writes `items` only there, and rewrites the main checkout's record as `ready`, holding none, naming the worktree; `activity.md` says items are written where the run runs. Closed 2026-10-26 by a fresh-context re-review: from the run's worktree the main checkout's record holds no items and is not listed (`state.ts` readInFlight); 49b/F-15, which it surfaced, is closed.

### 49b/F-2 [P1] closed - A named run that completes nothing never releases its items

**File:** src/skills/auto/SKILL.md:160
**Found:** 2026-10-26 by audit (scope: current; lens: quality)
**Why it matters:** Release waits on the aggregate pull request, an aggregate not opened at all is a `blocked` stop, and Step 3 opens nothing when no item completed. A run whose every item waits writes `blocked`, and each resume does the same, holding the items indefinitely; the activity partial says the opposite.
**Suggested fix:** Only an aggregate that Step 3 should have opened and did not blocks; a run that completed nothing releases straight to `completed`.
**Resolution:** 2026-10-26 - `auto` and `activity.md`: a run that completed nothing releases at once; only an aggregate Step 3 should have opened and did not is a `blocked` stop. Closed 2026-10-26 by a fresh-context re-review: a run that completed nothing releases at once; only an aggregate Step 3 should have opened blocks; 49b/F-17, which it surfaced, is closed.

### 49b/F-13 [P3] closed - An unwrapped line in Named items

**File:** src/skills/auto/SKILL.md:170
**Found:** 2026-10-26 by audit (scope: current; lens: quality)
**Why it matters:** About 140 characters after the edit.
**Suggested fix:** Rewrap.
**Resolution:** 2026-10-26 - rewrapped. Closed 2026-10-26 by a fresh-context re-review: rewrapped, meaning unchanged.

### 49b/F-15 [P2] closed - The first write cannot know whether the run will move

**File:** src/skills/auto/SKILL.md:156
**Found:** 2026-10-26 by audit (scope: current; lens: quality)
**Surfaced by:** 49b/F-1
**Why it matters:** The record is written before the configuration is read, so "from its first write" puts `items` in the main checkout; a stop between block 2 and the rewrite leaves them held there, and a resume refuses its own items.
**Suggested fix:** The first write holds no items; add them once preflight knows where the run will run.
**Resolution:** 2026-10-26 - `auto` Hold them: the first write holds no `items`; they are written once preflight knows where the run runs, only in the worktree when it has one. Closed 2026-10-26 by a fresh-context re-review: the first write holds no items; every stop window checked; 49b/F-19, which it surfaced, is closed.

### 49b/F-16 [P2] closed - The main checkout's leftover record can resume as a count run

**File:** src/skills/auto/SKILL.md:160
**Found:** 2026-10-26 by audit (scope: current; lens: quality)
**Surfaced by:** 49b/F-1
**Why it matters:** Rewritten as `ready` with no items, it reads as a count run's record once the worktree is gone, and `auto resume` there would start an unbounded count run.
**Suggested fix:** Write it `completed`, with no resume command.
**Resolution:** 2026-10-26 - the main checkout's record is rewritten as `completed`, holding none, with no resume command, its summary naming the worktree. Closed 2026-10-26 by a fresh-context re-review: nothing resumes a `completed` record without a resume command (`status.ts` next action, the handoff hook, Resume).

### 49b/F-17 [P3] closed - The release clause in the activity partial reads as unconditional

**File:** src/entry/partials/activity.md:33
**Found:** 2026-10-26 by audit (scope: current; lens: quality)
**Surfaced by:** 49b/F-1, 49b/F-2
**Why it matters:** "a run that completed nothing releases at once" can be read to cover a run stopped by a failure.
**Suggested fix:** Scope it: "when none is left, a run that completed nothing releases at once".
**Resolution:** 2026-10-26 - scoped to "when none is left". Closed 2026-10-26 by a fresh-context re-review: the clause is scoped to a run with none left.

### 49b/F-19 [P3] closed - The partial's new sentence is hard to read and unwrapped

**File:** src/entry/partials/activity.md:29
**Found:** 2026-10-26 by audit (scope: current; lens: quality)
**Surfaced by:** 49b/F-15
**Why it matters:** "on every write where it runs once preflight knows where that is" parses badly, and the line was not rewrapped.
**Suggested fix:** "on every write in the checkout it runs from, starting once preflight knows which that is", rewrapped.
**Resolution:** 2026-10-26 - reworded as suggested and rewrapped. Closed 2026-10-26 by a fresh-context re-review: reworded and rewrapped, meaning unchanged, agrees with `auto`.
