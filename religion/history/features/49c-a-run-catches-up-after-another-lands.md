# A run catches up after another lands

**Type:** Feature
**From build plan:** item 49c
**Status:** verified
**Approved:** 2026-10-26, 47a7cd3e7b69fe25

## Goal

When two runs go at once and one's aggregate pull request merges first, the other's aggregate
conflicts with the default branch on the shared state files: the plan, the ledger, the journal.
`auto refresh` brings the default branch into the run's integration branch with a merge commit,
takes the landed copy of each shared file and redoes the run's own share on top, as an item
already does when it lands on top of another, then pushes the branch and updates the aggregate
pull request. Nothing is rebased or force-pushed, and nothing is merged into the default branch.

## In scope

- `complete/reference/land-on-top.md` gains a section for a run catching up: the target is the
  default branch, the checkout is the run's integration branch, and the share redone is every
  item the run completed, row by row as the table lists it; the `## Landed` step does not apply
- `auto refresh`: a bound, a section stating when it applies (an aggregate pull request open,
  the run between items or ended, the default branch moved), its remote budget asked up front
  (push the integration branch, update the aggregate's body), the routine, `Verify`, the push,
  a line in the aggregate's body saying what was brought in, and its stops
- The `description` names `refresh`; a routing case; `docs/architecture/config.md` mentions it;
  a changeset

## Out of scope

- Refreshing a run whose state directory is ignored beyond the code merge: its shared files are
  not in git, so nothing conflicts there, and copying them back is 49b/F-9's
- Refreshing automatically, or watching for the other aggregate to merge
- Item branches inside a run: they land into the integration branch, which the run refreshes
- The open 49b P2s

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - the routine for a run** - in `src/skills/complete/reference/land-on-top.md`, a
  section "A run catching up": run blocks 1 to 3 from the run's integration branch with the
  default branch's remote-tracking name as the target; block 2's share is every item the run
  completed, each row as the table gives it, the ledger's entries taken as `HEAD` holds them
  beyond the merge base, the journal's those whose `**Archive:**` names one of the run's
  archives; block 4 is skipped, since each item's record already names its own commits.
  *Done when:* in a throwaway repository where `main` and an integration branch both changed
  the plan, ledger and journal after they split, blocks 1 to 3 run from the integration branch
  leave a merge with `main`'s copies plus the run's ticks, open entries and journal entries,
  no conflict markers, and `npm test` exits 0.
- [x] **Step 2 - `auto refresh`** - in `src/skills/auto/SKILL.md`: the bound, a Refresh section
  with its preconditions, its budget printed and waited on, the routine, the full `Verify`, the
  push, the aggregate's body updated with a line naming the default branch commit brought in,
  and its stops (no aggregate open, mid-item, nothing landed since, a conflict outside the
  shared files, a failing `Verify`); the `description`; a routing case in
  `evals/routing/auto.json`; a sentence in `docs/architecture/config.md`; a changeset. Then
  `npm run build:skills:link`. *Done when:* the rendered trees match, the routing corpus passes,
  and `npm test` exits 0.
- [x] Repair 49c/F-1, F-2 (P1), with F-3, F-5, F-8 in the same precondition list - a refresh
  writes no activity record; the integration branch is fetched and must match its remote; the
  branch identity and the run's record are checked; a rejected push stops. *Done when:* `auto`
  and `activity.md` say so and `npm test` exits 0.
- [x] Repair 49c/F-2, third attempt, with 49c/F-18 - a waiting merge on a branch also behind its
  remote is a named stop whose way out, a reset, is the person's; the fast-forward and the
  waiting-merge push are separate sentences. *Done when:* `auto` says so and `npm test` exits 0.

## Files and areas

- `src/skills/complete/reference/land-on-top.md`
- `src/skills/auto/SKILL.md`, `evals/routing/auto.json`
- `docs/architecture/config.md`, `.changeset/`
- The rendered trees and entry files, by the build only

## Data and contracts

- The integration branch stays append-only: a refresh adds one merge commit, never a rebase,
  reset or force-push. The abandon block resets an uncommitted merge only.
- A refresh's push and pull request edit are its whole remote budget, asked for in full before
  it starts, as a run's is.

## Testing

- `npm test` is the gate. Prose and a shell routine, no `lib/` change, so no unit tests.
- Step 1 is proved by running the routine by hand in a throwaway repository.

## Notes for the agent

- Each block runs as one command in its own subshell.
- Throwaway repositories live in the scratchpad.
- Edit `src/`, never a rendered tree. No em dashes.

## Amendments

- 2026-10-26 - Repair step added for 49c/F-1 and F-2 (P1), raised by this item's audit, with
  F-3, F-5 and F-8, which sit in the precondition list that repair rewrites.
- 2026-10-26 - Second repair of 49c/F-2: a refresh pushes an earlier refresh's waiting merge
  rather than stopping on it, and fast-forwards only after the budget is agreed.
- 2026-10-26 - The run stopped here: 49c/F-2 stays `fixed` after two repair attempts, so this item
  is not complete. Its steps and repair are committed on this branch as a checkpoint.
- 2026-10-26 - Third repair of 49c/F-2 at the user's request, outside the run, with 49c/F-18 in the
  same sentence.

## Findings

### 49c/F-1 [P1] closed - The refresh overwrites the run's activity record and frees its items

**File:** src/skills/auto/SKILL.md:216
**Found:** 2026-10-26 by audit (scope: current; lens: quality)
**Why it matters:** Every changing skill writes `run.json` first, and an `auto` first write holds no `items`, so a refresh in a blocked run's worktree drops the items and the resume command before reaching the line saying the record is left alone; other worktrees can then take them.
**Suggested fix:** Say a refresh writes no activity record, since the record is the run's; add the exception to `activity.md`.
**Resolution:** 2026-10-26 - Refresh writes no activity record, stated in `auto` and as the one exception in `activity.md`. Closed 2026-10-26 by a fresh-context re-review: the exception is stated in `auto` and under the first-write rule in `activity.md`; the run's record is read where the refresh runs.

### 49c/F-2 [P1] closed - The refresh merges into a stale local integration branch

**File:** src/skills/auto/SKILL.md:207
**Found:** 2026-10-26 by audit (scope: current; lens: quality)
**Why it matters:** Item pull requests merge on the host and nothing fast-forwards the local branch, so `HEAD` can lack the last item; the share is redone without it, the merge is committed, and the push is rejected with no stop and no way back under the never-reset rule.
**Suggested fix:** Fetch the integration branch too and stop unless `HEAD` equals its remote-tracking copy; name a rejected push as a stop that keeps the local commit.
**Resolution:** 2026-10-26 - the integration branch is fetched and must be at its remote-tracking copy, fast-forwarded first or a stop; a rejected push is a stop that keeps the merge commit. Second repair 2026-10-26: a branch ahead of its remote only by an earlier refresh's own merge is pushed as it is, and a refresh retries a rejected push; the fast-forward moved after the budget. Re-review 2026-10-26: the stale branch and a retry after a rejected push with the remote unchanged are repaired; a rejected push where the remote also moved still stops with no stated way forward. Left `fixed` after two repair attempts, the run's limit: the way out is for the person to drop the stale local merge, a first-tier action, then refresh again, and the skill should say so. Third repair 2026-10-26, outside the run: a waiting merge on a branch that is also behind its remote is named as a stop, with the reset to drop it left to the person as a first-tier action, and a refresh starting again from the remote copy. Closed 2026-10-26 by a fresh-context re-review: a stale branch, a retried rejected push, a push refused because the branch moved, and a retry after the person's reset each have a stated way forward; the agent never rebases, resets or force-pushes; 49c/F-18, which it surfaced, is closed.

### 49c/F-3 [P2] closed - Nothing checks which branch a refresh pushes

**File:** src/skills/auto/SKILL.md:191
**Found:** 2026-10-26 by audit (scope: current; lens: security)
**Why it matters:** "The run's integration branch" is whatever is checked out: from another run's worktree it refreshes and pushes that run's branch, and from the main checkout on the default branch block 1 would merge into it.
**Suggested fix:** Require the checked-out branch to start with the integration prefix and not be the default branch, and the aggregate pull request's head to be it and its base the default branch; push it by name, never forced.
**Resolution:** 2026-10-26 - preconditions: the branch carries the integration prefix, is not the default branch, and is the aggregate's head with the default branch as base; pushed by name, never forced. Closed 2026-10-26 by a fresh-context re-review: prefix, not the default branch, and the aggregate's head and base are all checked; pushed by name.

### 49c/F-5 [P2] closed - The commit a run recorded is saved nowhere

**File:** src/skills/auto/SKILL.md:196
**Found:** 2026-10-26 by audit (scope: current; lens: quality)
**Why it matters:** The precondition that the default branch moved past it cannot be checked in a later session, and is checked before the fetch.
**Suggested fix:** Drop it and rely on block 1's `nothing landed since` after fetching.
**Resolution:** 2026-10-26 - the recorded-commit precondition is gone; block 1's `nothing landed since` after the fetch ends a refresh with nothing to do. Closed 2026-10-26 by a fresh-context re-review: the recorded-commit precondition is gone; `nothing landed since` decides after the fetch.

### 49c/F-8 [P2] closed - Nothing stops a refresh while the run is running

**File:** src/skills/auto/SKILL.md:195
**Found:** 2026-10-26 by audit (scope: current; lens: quality)
**Why it matters:** "Or it has ended" skips the between-items checks and is always true read from the main checkout's `completed` record, so two sessions can work one worktree.
**Suggested fix:** Require the run's own record to be `blocked` or `completed`, never `running`.
**Resolution:** 2026-10-26 - the run's own record must be `blocked` or `completed`, never `running`. Closed 2026-10-26 by a fresh-context re-review: the run's own record must not be `running`.

### 49c/F-18 [P3] closed - "Otherwise" skips the catch-up after a fast-forward

**File:** src/skills/auto/SKILL.md:217
**Found:** 2026-10-26 by audit (scope: current; lens: quality)
**Surfaced by:** 49c/F-2
**Why it matters:** Read literally, a branch that was behind fast-forwards and the refresh ends without bringing in the default branch; the next refresh proceeds.
**Suggested fix:** Split the sentence: fast-forward when behind; push a waiting merge and end; otherwise catch up.
**Resolution:** 2026-10-26 - split into three sentences: fast-forward when behind; push a waiting merge and end; otherwise catch up. Closed 2026-10-26 by a fresh-context re-review: three separate sentences; a behind branch fast-forwards and then catches up.

## Landed

**Base:** c370b208fa38e2add139fce1da66e835fb088335
**Commits:** 97d8ea32925174ddccf8d32540d9232bed440f29
**Product paths:** .changeset/runs-catch-up.md, docs/architecture/config.md, evals/routing/auto.json, src/entry/partials/activity.md, src/skills/auto/SKILL.md, src/skills/complete/reference/land-on-top.md
