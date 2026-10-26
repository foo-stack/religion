# Items land one at a time

**Type:** Feature
**From build plan:** item 39d
**Status:** verified
**Approved:** 2026-10-25, b6aab305722612c3

## Goal

When an item built in its own worktree lands after another item already has, `complete` brings
in what landed and redoes this item's share of the state files on top of it: the plan tick, its
unresolved findings and its journal entry. The plan, overview, ledger, journal and handoff are never merged as text. A conflict
anywhere else stops for review. ADR 9 is marked reversed, and the statements that one work item
exists at a time say one per worktree.

Grounded in `religion/history/spikes/does-resuming-two-items-cost-less-than-finishing-one.md`:
the second item to land conflicted in `build-plan.md`, `project-overview.md`, `findings.md` and
`journal.md` every time, all bookkeeping that can be derived again, while each archive merged
cleanly.

## In scope

- A reference routine for `complete`: find whether the target moved, merge it without
  committing, take the landed copy of each shared state file, redo this item's share, stop on
  any other conflict, then run the full `Verify` again before committing the merge
- `complete` follows it before merging or pushing, and says that removing an item's worktree
  after it lands asks
- ADR 9 marked reversed, the state model's invariant and the entry file's one-item paragraph
  saying one per worktree

## Out of scope

- Resolving conflicts in product code: they stop, as they do today
- Removing an item's worktree without asking
- An automated run building items in worktrees: it keeps the plain branch
- The seeded `ai-interaction.md` and the `capture` skill: one item at a time still holds in
  each worktree, so their wording stays true

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - the routine** - `src/skills/complete/reference/land-on-top.md`: the target is
  the branch the item lands in, the default branch or an automated run's integration branch;
  when it has commits the item's merge base lacks, merge it without committing; for each shared
  state file take the target's copy, then redo this item's share from the item's own copy, as
  the contract below lists; any other conflict aborts the merge and stops; the full `Verify`
  runs on the result before the merge is committed. *Done when:* in a throwaway repository with
  two items finished in two worktrees, landing the first and then the second through the routine
  leaves both ticks, both journal entries, the second item's open findings and no conflict
  markers, and a conflict in a product file stops with the branch as it was.
- [x] **Step 2 - complete uses it** - in `src/skills/complete/SKILL.md`, Step 4 under
  `branch-per-item` and `pull-request` follows the routine before the squash merge or the
  push, and records the `## Landed` commits after it; the branch cleanup after a merge says
  that an item built in its own worktree is cleaned up from the main checkout, and that
  removing the worktree is deleting files, which asks. *Done when:* the rendered skill says so,
  the routing corpus passes unchanged, and `npm test` exits 0.
- [x] **Step 3 - the record** - `docs/architecture/decisions/09-one-work-item-at-a-time.md`
  marked reversed with what replaced it, its row in the decisions index, the invariant in
  `docs/architecture/state-model.md`, the one-item paragraph in `src/entry/partials/workflow.md`,
  and the "Parallel items" section of `docs/architecture/config.md` naming how items land.
  *Done when:* the rendered entry files carry the new paragraph and `npm test` exits 0.
- [x] **Step 4 - Repair 39d/F-1 to 39d/F-10** - block 3 stages the redone files so the merge can
  be abandoned; the Landed record after a merge starts from what it brought in, and rollback
  accepts that base; ignored state is redone in the main checkout before a worktree goes; the
  share covers every kind of item; only files the target changed are taken, the overview left as
  landed; a target's untracked shared file is dropped; only hand-edited files are searched for
  markers; and the routine names the way forward, the tier of its merge, and committing the
  record. *Done when:* in throwaway projects, an abort after the redo returns to the work commit,
  the diff from the recorded base names only this item's product files, a target that changed no
  state file takes none, an untracked handoff and a sample conflict in a document do not stop the
  landing, and `npm test` exits 0.
- [x] **Step 5 - Repair 39d/F-11 to 39d/F-16** - a shared file the target deleted is removed so
  the merge can still be abandoned; a colliding bare identifier takes its prefixed form; the
  routine names the way out of a stop and stages the handoff before any abort; ignored state
  keeps a ledger baseline saved when the worktree is made; a fix after a failed Verify records
  the shared range in both archives; rollback requires the merge's second parent as base; and the
  summaries say only changed files are taken. *Done when:* the abort after a target deleted a
  shared file exits 0, an ignored-state worktree holds the saved ledger, and `npm test` exits 0.
- [x] **Step 6 - Repair 39d/F-13, F-17, F-18 and F-19** - an abandon block that stages each
  tracked shared file and removes an untracked copy `HEAD` holds before aborting; the fix after a
  failed Verify redoes both items' shares; staging never puts back a file the target removed;
  and with ignored state, changed or removed ledger entries are carried or reported. *Done when:*
  a stop during block 2 after the hook ran, and a target that deleted the handoff, both return to
  the work commit in bash and zsh, and `npm test` exits 0.
- [x] **Step 7 - Repair 39d/F-20, F-21 and F-22** - the abandon block does nothing with no merge
  open and sets back anything `Verify` rewrote before aborting, and with ignored state the fix's
  landing after a failed `Verify` carries both items' shares and archives. *Done when:* abandoning
  after `Verify` rewrote a tracked file returns to the work commit, the block with no merge open
  stages nothing and block 1 then merges, in bash and zsh, and `npm test` exits 0.
- [x] **Step 8 - Repair 39d/F-21, F-24 and F-25** - the abandon block names and sets back every
  change since the staging, skipping paths in conflict, and clears and names any path the merge
  removed that something wrote again. *Done when:* abandoning after a regenerated untracked file,
  with conflicts left in the index, after a hand edit, and with no merge open each return to the
  work commit with no difference from it, in bash and zsh, and `npm test` exits 0.
- [x] **Step 9 - Repair 39d/F-21, F-25, F-26 and F-27** - the abandon block resets to the work
  commit, naming each path it sets back or removes, untracked and ignored files among them, and
  each untracked file it leaves. *Done when:* abandoning after a target's rename with the old path
  written again, after edits to shared and product files, with a directory the target put where
  a file was, with conflicts in the index, after an edit removed from the index, and with no
  merge open each return to the work commit with every discarded path named, in bash and zsh, and
  `npm test` exits 0.
- [x] **Step 10 - Repair 39d/F-28, F-29 and F-30** - the abandon block reads each name exactly,
  names an untracked file as discarded only when it is gone after the reset, prints with `printf`,
  and lists a wholly untracked directory as one line. *Done when:* abandoning with files written
  into a directory the merge made, with backslash, space and non-ASCII names, and with hundreds of
  untracked files in one directory each return to the work commit with every name printed once
  and exactly, the earlier cases still pass, in bash and zsh, and `npm test` exits 0.
- [x] **Step 11 - Repair 39d/F-32, F-33 and F-34** - the abandon block lists by file an untracked
  directory standing where `HEAD` has a path, tests each untracked name exactly in its directory,
  and after a failed reset still names what it removed, then says the merge is still open.
  *Done when:* a target that deleted a file with files then written under that path, a case-only
  twin of a removed file, and a reset failing on a read-only directory each name every removed
  file, the failed one leaving the merge open and a rerun after fixing it returning to the work
  commit, the earlier cases still pass, in bash and zsh, and `npm test` exits 0.
- [x] **Step 12 - Repair 39d/F-35 to F-38** - the abandon block lists every untracked and ignored
  file with git before the reset and after it, and names once, after the reset, each tracked path
  that differed and each listed file gone, as git prints the names. *Done when:* an untracked file
  where the work commit has a directory, a case-only directory twin, a decomposed name, and 3000
  untracked files in a tracked directory are each named correctly and quickly, every earlier case
  still passes with each name once, bash and zsh print the same, and `npm test` exits 0.
- [x] **Step 13 - Repair 39d/F-39** - the abandon block also names each path whose staged copy
  differs from the work commit. *Done when:* a change staged with its working copy set back to the
  work commit's is named once as discarded, every earlier case still passes, bash and zsh print the
  same, and `npm test` exits 0.

## Files and areas

- `src/skills/complete/SKILL.md`, `src/skills/complete/reference/land-on-top.md`, rendered by
  `npm run build:skills:link`
- `docs/architecture/decisions/09-one-work-item-at-a-time.md`, `docs/architecture/decisions/README.md`
- `docs/architecture/state-model.md`, `docs/architecture/config.md`
- `src/entry/partials/workflow.md`, rendered into `CLAUDE.md` and `AGENTS.md`

## Data and contracts

**The shared state files (load-bearing).** Each one the other item changed is taken from what
landed and this item's share is redone, never merged as text:

| File | This item's share |
| --- | --- |
| `build-plan.md` | a feature's line ticked, and its parent once every sub-item is; a rollback's target unticked with its note; none for a fix or refactor campaign |
| `context/findings.md` | the entries it added since the merge base, still `open`, `fixed` or `unverified`, appended; a colliding bare identifier takes its prefixed form |
| `learning/journal.md` | its entry, appended |
| `context/project-overview.md` | none: left as landed, stale until `overview` runs, as after any completion |
| `context/handoff.md` | none: rewritten at the end of the turn |

A change this item made to another item's ledger entry is reported, not carried. Everything
else, the item's archive included, merges as git merges it.

## Testing

- The gate is `npm test`: the verification checks, the unit tests and the routing corpus.
- No logic in shipped code changes; the steps are prose and records, held by the drift, docs
  and routing checks.
- `check` proves the routine in a throwaway repository: two items in two worktrees, landed in
  turn, and a product-file conflict that stops.

## Notes for the agent

- Fetching the target is a network read, which asks outside an automated run.
- The merge commit's message describes what was brought in, never a plan number.
- No em dashes, en dashes or ellipsis characters, and no plan or item numbers in source
  comments or commit messages.

## Amendments

- 2026-10-25 - Step 4 added to repair 39d/F-1 to 39d/F-10, raised by the audit of this item; the
  overview is now left as landed rather than regenerated, since every landing re-ticks the plan
  and a normal completion leaves it stale too, and `src/skills/rollback/SKILL.md` gains the base
  rule the Landed record now follows.
- 2026-10-25 - Step 5 added to repair 39d/F-11 to 39d/F-16, surfaced by the re-review of step 4;
  it also touches `src/skills/implement/reference/item-worktree.md`, which saves the ledger
  baseline, and the contract table now covers each kind of item and only changed files.
- 2026-10-25 - Step 6 added, on resuming the stopped run, to repair 39d/F-13, F-17, F-18 and
  F-19, found by the re-review of step 5.
- 2026-10-25 - Step 7 added to repair 39d/F-20 to F-22, surfaced by the re-review of step 6.
- 2026-10-25 - Step 8 added, by the user's choice of one more round, to repair 39d/F-21, F-24 and
  F-25, found by the re-review of step 7.
- 2026-10-25 - Step 9 added, by the user's choice to replace the abandon block with a reset, to
  repair 39d/F-21, F-25, F-26 and F-27, found by the re-review of step 8.
- 2026-10-25 - Step 10 added, by the user's choice to fix the output, to repair 39d/F-28 to F-30,
  found by the re-review of step 9.
- 2026-10-25 - Step 11 added, on resuming the stopped run, to repair 39d/F-32 to F-34, found by
  the re-review of step 10.
- 2026-10-26 - Step 12 added, by the user's choice of one more round, to repair 39d/F-35 to F-38,
  found by the re-review of step 11.
- 2026-10-26 - Step 13 added, by the user's choice to fix it, to repair 39d/F-39, found by the
  re-review of step 12.

## Evidence

Checked 2026-10-26 at 03912db, tree clean apart from the workflow's state files.

- **Step 1 - the routine** - pass: in a throwaway project with `alpha` and `beta` finished in two worktrees from `main`, a plain merge of `beta` after `alpha` landed conflicted in `build-plan.md`, `findings.md`, `project-overview.md` and `journal.md`; the rendered block 1 printed `taken as landed` for each and `merged; redo this item's share`, the share was redone from `HEAD`, block 3 printed `ready for Verify`, and the merge commit held both ticks, both open findings, both journal entries and both archives, with no conflict markers; `beta` then fast-forwarded onto `main`. A third item editing `app.txt` like `main` stopped with `conflicts outside the shared state files: app.txt`, no merge open and `HEAD` unchanged. The same in bash and zsh.
- **Step 2 - complete uses it** - pass: the rendered `complete` skill names the routine in Step 4, the Landed record after it, and the worktree cleanup that asks; routing corpus 26 skills, 184 cases, no structural problems.
- **Step 3 - the record** - pass: ADR 9 reads reversed in part, and `CLAUDE.md` and `AGENTS.md` carry the per-worktree paragraph.
- **Step 4 - the record after a merge** - pass: in the run above the merge's second parent equals `main`, and the diff from it outside the state directory names only `beta.txt`.
- **Steps 5 to 13 - repairs** - pass: 39d/F-1 to F-39 but F-23 and F-31 closed by independent re-reviews; abandoning after a failed Verify in the run above named each discarded path and returned to the work commit, and seventeen abandon cases, from a hook-rewritten handoff to a reset failing on a read-only directory, returned to the work commit with every discarded path named once, bash and zsh printing the same.
- **Goal** - pass: the runs above, and `npm test` exit 0 with 190 unit tests.

## Findings

### 39d/F-1 [P1] closed - Abandoning the merge fails once the share has been redone

**File:** src/skills/complete/reference/land-on-top.md:84
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Why it matters:** The redo leaves unstaged edits over staged ones, so after a failed Verify `git merge --abort` printed `Entry 'religion/build-plan.md' not uptodate` and exited 128 with the merge still open, inviting a hard reset; a hook rewriting the handoff mid-merge does the same. Reproduced.
**Suggested fix:** Stage the shared files before Verify, so the abort returns to the work commit.
**Resolution:** 2026-10-25, block 3 stages the redone files and the routine says to stage a handoff a hook rewrote; after a redo and a staged handoff change, `git merge --abort` exited 0 and returned to the work commit. Re-reviewed 2026-10-25: the defect is gone; it stays fixed while 39d/F-13, surfaced by this repair, is unresolved. Re-reviewed again 2026-10-25: still waiting on 39d/F-13. Re-reviewed 2026-10-25: still waiting on 39d/F-13. Re-reviewed 2026-10-25: its defect is gone; still waiting on 39d/F-13. Re-reviewed 2026-10-25 at fc5d6ec: its own scenario returns to the work commit; still waiting on 39d/F-13. Re-reviewed 2026-10-25 at efd71eb: its own scenario passes; still waiting on 39d/F-13. Re-reviewed 2026-10-25 at 5f413a2: still waiting on 39d/F-13. Re-reviewed 2026-10-26 at 7f0c40f: still waiting on 39d/F-13. Re-reviewed 2026-10-26 at 03912db: after block 3 staged the redone files and Verify failed, the abandon block returned to the work commit naming every path once, in bash and zsh; nothing it surfaced is unresolved.

### 39d/F-2 [P1] closed - The Landed record after a merge covers the other item's work

**File:** src/skills/complete/SKILL.md:205
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Why it matters:** With the merge in the branch, the fork point as base and the merge among the commits, rollback's diff printed both items' product files, so rolling this item back would remove the other too. Reproduced.
**Suggested fix:** Record the merged target as the base and the merge commit onward as the commits, and let rollback accept a base that is a parent of the earliest commit.
**Resolution:** 2026-10-25, with a merge the record names its second parent as Base and the merge onward as Commits, and rollback accepts a base that is a parent of the earliest commit; the diff from that base listed only the item's own product file. Re-reviewed 2026-10-25: for squash and merge-commit landings the recorded base passes rollback's checks and its diff lists only the item's product file.

### 39d/F-3 [P1] closed - With local-only state the item's record goes when its worktree is removed

**File:** src/skills/complete/SKILL.md:257
**Found:** 2026-10-25 by audit (scope: current; lens: security)
**Why it matters:** When the state directory is ignored, the archive, plan tick, journal entry and ledger exist only in the worktree's copy, nothing in git carries them, and `git worktree remove` deletes ignored files without force. Reproduced.
**Suggested fix:** Redo the share in the main checkout's state, archive included, before the worktree can be removed.
**Resolution:** 2026-10-25, the routine's last section has the share and the archive redone in the main checkout's ignored state before the worktree can be removed, and complete says so when asking to remove it. Re-reviewed 2026-10-25: the defect is gone; it stays fixed while 39d/F-14, surfaced by this repair, is unresolved. Re-reviewed again 2026-10-25: still waiting on 39d/F-14. Closed 2026-10-25: with the state directory ignored, block 1 and the abandon block left every state file and the item's finding in place, and 39d/F-14 is closed.

### 39d/F-4 [P2] closed - The share table covers only planned features

**File:** src/skills/complete/reference/land-on-top.md:59
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Why it matters:** A rollback's untick is lost to a no-op tick, and a fix or refactor raises bare identifiers, so the prefix rule drops its open findings.
**Suggested fix:** Take findings by what the item added since the merge base, and give the plan row per kind.
**Resolution:** 2026-10-25, findings are taken by what the item added since the merge base, and the plan row covers features, rollbacks, fixes and refactor campaigns. Re-reviewed 2026-10-25: the defect is gone; it stays fixed while 39d/F-12, surfaced by this repair, is unresolved. Closed 2026-10-25: 39d/F-12 is closed.

### 39d/F-5 [P2] closed - A shared file the target stopped tracking aborts as a conflict

**File:** src/skills/complete/reference/land-on-top.md:29
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Why it matters:** When the target deleted or untracked a shared file the item changed, the routine reported it as a product conflict and stopped. Reproduced with the handoff.
**Suggested fix:** Take the target's side, removing it from the index.
**Resolution:** 2026-10-25, a shared file the target no longer tracks is dropped from the index; reproduced with the handoff, which no longer stops the landing. Re-reviewed 2026-10-25: the defect is gone; it stays fixed while 39d/F-11, surfaced by this repair, is unresolved. Re-reviewed again 2026-10-25: still waiting on 39d/F-18. Closed 2026-10-25: 39d/F-18 is closed.

### 39d/F-6 [P2] closed - Legitimate conflict markers anywhere block the landing

**File:** src/skills/complete/reference/land-on-top.md:76
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Why it matters:** Block 3 greps the whole tree, so a tracked document showing a sample conflict makes landing impossible. Reproduced.
**Suggested fix:** Search only the shared files, the ones edited by hand.
**Resolution:** 2026-10-25, block 3 searches only the plan, ledger and journal; a tracked document holding a sample conflict no longer blocks it. Re-reviewed 2026-10-25: a tracked document with sample markers no longer stops block 3.

### 39d/F-7 [P2] closed - The overview is regenerated on every landing, and every shared file is reset when the target moved at all

**File:** src/skills/complete/reference/land-on-top.md:62
**Found:** 2026-10-25 by audit (scope: current; lens: performance)
**Why it matters:** The redo always re-ticks the plan, so the stamp never matches and the overview is regenerated inside an open merge each time, which a normal completion never does; and a target that touched no state file still forces the whole redo.
**Suggested fix:** Take the target's copy only of files it changed, and leave the overview as landed, stale until overview runs, as any completion does.
**Resolution:** 2026-10-25, only shared files the target changed since the merge base are taken, and the overview is left as landed; a target that changed no state file took none. Re-reviewed 2026-10-25: the defect is gone; it stays fixed while 39d/F-16, surfaced by this repair, is unresolved. Closed 2026-10-25: 39d/F-16 is closed.

### 39d/F-8 [P2] closed - No way forward after the merged result fails Verify

**File:** src/skills/complete/reference/land-on-top.md:84
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Why it matters:** By then the spec is archived and reset, so "goes through the loop" has nothing active to work from.
**Suggested fix:** Name the path: a fix on this branch, then completing it lands both.
**Resolution:** 2026-10-25, the routine names the way forward after a failed Verify: a fix on the same branch, whose completion lands both. Re-reviewed 2026-10-25: the defect is gone; it stays fixed while 39d/F-15, surfaced by this repair, is unresolved. Re-reviewed again 2026-10-25: still waiting on 39d/F-15. Closed 2026-10-25: the finding it waited on is closed.

### 39d/F-9 [P3] closed - Three small gaps in block 1 and the ledger redo

**File:** src/skills/complete/reference/land-on-top.md:22
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Why it matters:** The merge's own output is hidden, the handoff is discarded even when the block then stops, and appending to a stub ledger leaves its placeholder line above real entries.
**Suggested fix:** Show the merge's output, discard the handoff only once the tree is clean, and drop the placeholder.
**Resolution:** 2026-10-25, block 1 shows the merge's output, discards the handoff only once the tree is otherwise clean, and the ledger row says to replace a stub's placeholder. Re-reviewed 2026-10-25: the merge output shows, the handoff survives a stop, and the stub placeholder rule is there.

### 39d/F-10 [P3] closed - The routine does not say which tier its merge commit sits in, or that the Landed record is committed

**File:** src/skills/complete/reference/land-on-top.md:86
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Why it matters:** The merge commit writes only the item's branch, a commit like the work commit, and an uncommitted Landed record in a worktree goes with it.
**Suggested fix:** Say both.
**Resolution:** 2026-10-25, the routine says its merge is a commit on the item's branch covered by the work commit's yes, and to commit the Landed record. Re-reviewed 2026-10-25: the tier and committing the record are both stated.

### 39d/F-11 [P2] closed - Abort fails when the target deleted a shared file the item changed

**File:** src/skills/complete/reference/land-on-top.md:40
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-5
**Why it matters:** Dropping the file only from the index left the item's copy untracked, so `git merge --abort` refused to overwrite it and the merge stayed open. Reproduced.
**Suggested fix:** Remove it from the working tree too; `HEAD` keeps the item's copy.
**Resolution:** 2026-10-25, the routine removes it with `git rm -f`; after a target deleted the overview the item changed, the abort exited 0 and the item's overview was back. Re-reviewed 2026-10-25: after the target deleted a shared file the item changed, the abort exited 0 with the item's copy back, in bash and zsh.

### 39d/F-12 [P2] closed - Carried bare findings can duplicate an identifier

**File:** src/skills/complete/reference/land-on-top.md:40
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-4
**Why it matters:** Two fixes in separate worktrees each raise a bare `F-1`, and landing the second appended a second `### F-1`, reusing an identifier. Reproduced.
**Suggested fix:** Give a colliding identifier its permanent prefixed form and report it.
**Resolution:** 2026-10-25, the ledger row has a colliding identifier take the archive's prefix, as completion would archive it, and the rename reported. Re-reviewed 2026-10-25: two fixes' bare identifiers landed as `F-1` and `b-thing/F-1`, with both open.

### 39d/F-13 [P3] closed - A stop after block 1 leaves the merge open with no way out named

**File:** src/skills/complete/reference/land-on-top.md:40
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-1
**Why it matters:** The next turn's hook rewrites the handoff and a later abort refuses, while rerunning block 1 points at committing a half-merge. Reproduced with the real hook.
**Suggested fix:** Name both ways out and stage the handoff before any abort.
**Resolution:** 2026-10-25, the routine says to put right what a block named and rerun it, or stage the handoff and abort, and the failed-Verify path stages it first. Reopened 2026-10-25: the way out works for a stop in block 3, but a stop during block 2 leaves the redone ledger unstaged, so after the hook ran, staging the handoff alone left `git merge --abort` refusing on `findings.md`. Suggested: abandon by staging every shared file block 1 took, as block 3's first loop does, then abort. Repaired again 2026-10-25: an "Abandoning the merge" block stages each shared file the index tracks and removes an untracked copy `HEAD` holds, then aborts; a stop during block 2 with the ledger unstaged and the real hook run returned to the work commit in bash and zsh, where a bare abort refused. Re-reviewed 2026-10-25: a stop mid-block-2 after the hook ran returned to the work commit where a bare abort refused; it stays fixed while 39d/F-21 and 39d/F-22, surfaced by this repair, are unresolved. Re-reviewed 2026-10-25: still waiting on 39d/F-21, F-24 and F-25. Re-reviewed 2026-10-25: its own scenario passes; still waiting on 39d/F-21 and F-25. Re-reviewed 2026-10-25 at fc5d6ec: its own scenario returns to the work commit; still waiting on 39d/F-21. Re-reviewed 2026-10-25 at efd71eb: its own scenario passes; still waiting on 39d/F-21. Re-reviewed 2026-10-25 at 5f413a2: still waiting on 39d/F-21. Re-reviewed 2026-10-26 at 7f0c40f: still waiting on 39d/F-21. Re-reviewed 2026-10-26 at 03912db: a stop during block 2 with the ledger unstaged and the handoff rewritten, where a bare abort refused, returned to the work commit naming both, in bash and zsh; nothing it surfaced is unresolved.

### 39d/F-14 [P3] closed - With ignored state the share has no base to tell this item's findings from older ones

**File:** src/skills/complete/reference/land-on-top.md:40
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-3
**Why it matters:** `git show HEAD:` has nothing when the state directory is ignored, so a finding open before the item began could be carried as this item's.
**Suggested fix:** Save the ledger when the worktree is made and use it as the base.
**Resolution:** 2026-10-25, the item worktree routine saves `findings-at-start.md` in the worktree's own state, and landing uses it; a run with ignored state saved a copy identical to the main checkout's ledger. Re-reviewed 2026-10-25: the saved ledger matched the main checkout's byte for byte; it stays fixed while 39d/F-19, surfaced by this repair, is open. Closed 2026-10-25: 39d/F-19 is closed.

### 39d/F-15 [P3] closed - After a failed Verify the item is left without a Landed record of its own

**File:** src/skills/complete/reference/land-on-top.md:40
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-8
**Why it matters:** The abort comes before the record, and the later fix's record covers both items' work.
**Suggested fix:** Have the fix's completion write the shared range into both archives.
**Resolution:** 2026-10-25, the routine says completing the fix writes the one shared range into both archives, each saying it is shared. Re-reviewed 2026-10-25: the shared Landed range is described; it stays fixed while 39d/F-17, surfaced by this repair, is open. Closed 2026-10-25: the finding it waited on is closed.

### 39d/F-16 [P3] closed - Summaries still say every shared file is taken

**File:** src/skills/complete/reference/land-on-top.md:40
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-7
**Why it matters:** The complete skill, the configuration reference and the spec contract described the earlier behaviour.
**Suggested fix:** Say only the files the other item changed are taken.
**Resolution:** 2026-10-25, all three now say so, and the spec's table covers each kind of item. Re-reviewed 2026-10-25: the complete skill, the configuration reference and the spec contract all say only changed files are taken.

### 39d/F-17 [P2] closed - Landing the fix after a failed Verify drops the original item's plan tick and journal entry

**File:** src/skills/complete/reference/land-on-top.md:113
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-15
**Why it matters:** Block 1 takes the plan and journal as landed, and the table redoes only the fix's share, which has no plan line, so the feature lands unticked and its journal entry is lost; `feature` would spec it again. Reproduced.
**Suggested fix:** Say that this landing redoes the share of both the item and the fix, every row, each taken from `HEAD`.
**Resolution:** 2026-10-25, the routine says the fix's landing redoes the share of both the item and the fix, every row, each from `HEAD`. Re-reviewed 2026-10-25: block 2's wording is right; it stays fixed while 39d/F-20, surfaced by this repair, is unresolved. Closed 2026-10-25: the finding it waited on is closed.

### 39d/F-18 [P3] closed - Restaging the handoff can put back a file the target deleted

**File:** src/skills/complete/reference/land-on-top.md:107
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-13
**Why it matters:** When the target removed the handoff, staging the hook's rewrite tracks it again in the merge; when the target ignores it, the add fails. Reproduced.
**Suggested fix:** Stage it only while the index still tracks it, as block 3 checks.
**Resolution:** 2026-10-25, staging goes through block 3 and the abandon block, which stage only what the index tracks; with the target having deleted the handoff and the hook recreating it, abandoning returned to the work commit with the item's handoff and nothing put back. Re-reviewed 2026-10-25: with the handoff deleted or ignored by the target and recreated by the hook, block 3 put nothing back and abandoning returned to the work commit, in bash and zsh.

### 39d/F-19 [P3] closed - With ignored state, changes to entries the item did not add are dropped unreported

**File:** src/skills/complete/reference/land-on-top.md:132
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-14
**Why it matters:** The ignored-state section carries only entries the saved ledger lacked, so a P1 the item repaired and pruned stays open in the main checkout with nothing in the report to explain why the next completion is blocked.
**Suggested fix:** Compare the worktree's ledger with the saved one and name each entry changed or removed, as block 2 does.
**Resolution:** 2026-10-25, the ignored-state section says comparing the worktree's ledger with the saved one also shows each entry the item changed or removed, to be made in the main checkout's ledger or named in the report. Re-reviewed 2026-10-25: the ignored-state section names changed and removed entries.

### 39d/F-20 [P2] closed - With ignored state, the fix's landing after a failed Verify drops the original item's record

**File:** src/skills/complete/reference/land-on-top.md:155
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-17
**Why it matters:** The ignored-state section redid only this item's share and archive, so after a failed Verify the fix's landing never carried the feature's plan tick, journal entry and archive to the main checkout, and removing the worktree deletes them.
**Suggested fix:** Say that landing redoes both shares and copies both archives.
**Resolution:** 2026-10-25, the ignored-state section says a landing after a failed Verify redoes the share and copies the archive of both. Re-reviewed 2026-10-25: the ignored-state section says both shares and archives are carried.

### 39d/F-21 [P3] closed - The abandon block refuses when Verify rewrote a tracked file

**File:** src/skills/complete/reference/land-on-top.md:123
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-13
**Why it matters:** A Verify that regenerates tracked output left that file changed, so the abort refused and the merge stayed open. Reproduced.
**Suggested fix:** Set the tree back to the merge's staged copy before aborting, since block 1 required it clean.
**Resolution:** 2026-10-25, the block runs `git checkout -- .` after staging; with `gen.txt` rewritten after block 3 and the hook run, it returned to the work commit in bash and zsh. Reopened 2026-10-25: Verify rewriting tracked files is handled, but a file the merge deletes and Verify regenerates is untracked, so the abort refuses to overwrite it and the merge stays open. Reproduced. Suggested: remove each worktree file at a path the merge deleted from `HEAD` before aborting. Repaired again 2026-10-25: each path the merge removed that something wrote again is cleared and named before the abort; with the target having untracked `gen.txt` and the handoff, both regenerated, abandoning returned to the work commit with `HEAD`'s copies, in bash and zsh. Reopened 2026-10-25: a path the target renamed is reported as a rename, not a deletion, so a rewritten old path is not cleared and the abort refuses. Reproduced. Suggested: `--no-renames` on the deleted-path listing. Repaired again 2026-10-25: the abandon block resets to the work commit; with the target having renamed `gen.txt` and the old path written again, it returned to the work commit naming both paths, in bash and zsh. Re-reviewed 2026-10-25 at fc5d6ec: every scenario, the rename included, returned to the work commit with both paths named, in bash and zsh; it stays fixed while 39d/F-28 to F-30, surfaced by this repair, are unresolved. Re-reviewed 2026-10-25 at efd71eb: every earlier scenario still holds; waiting on 39d/F-28 and F-32. Re-reviewed 2026-10-25 at 5f413a2: every earlier scenario still holds; waiting on 39d/F-28. Re-reviewed 2026-10-26 at 7f0c40f: every earlier scenario still holds; it stays fixed while 39d/F-39, surfaced by the reset this repair introduced, is unresolved. Re-reviewed 2026-10-26 at 03912db: a rewritten tracked file, a deleted file written again and a renamed file's old path written again each returned to the work commit with each path named once, in bash and zsh; nothing it surfaced is unresolved.

### 39d/F-22 [P3] closed - Run with no merge open, the abandon block stages the handoff and the next landing cannot start

**File:** src/skills/complete/reference/land-on-top.md:123
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-13
**Why it matters:** With no merge open it staged a hook-rewritten handoff, failed to abort, and block 1 then refused to merge over the staged change. Reproduced.
**Suggested fix:** Do nothing when no merge is open.
**Resolution:** 2026-10-25, the block prints `no merge open` and exits 0 first; afterwards nothing was staged and block 1 merged. Re-reviewed 2026-10-25: with no merge open the block printed `no merge open`, staged nothing, and block 1 then merged, in bash and zsh.

### 39d/F-24 [P3] closed - The abandon block cannot abandon a merge with unmerged paths

**File:** src/skills/complete/reference/land-on-top.md:134
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-21
**Why it matters:** `git checkout -- .` fails on an unmerged entry, so with a conflict left in the index, as after block 3's `unresolved paths remain`, the block exits before aborting. Reproduced.
**Suggested fix:** Use `git checkout -f -- .`, which skips unmerged entries.
**Resolution:** 2026-10-25, the block uses `git checkout -f -- .`; with two paths left unmerged and the hook run, it returned to the work commit in bash and zsh. Re-reviewed 2026-10-25: with two paths left unmerged and the hook run, the block returned to the work commit clean, in bash and zsh.

### 39d/F-25 [P3] closed - The abandon block silently discards edits made while the merge is open

**File:** src/skills/complete/reference/land-on-top.md:134
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-21
**Why it matters:** A tracked file edited by hand during debugging is set back without a word, where a plain abort kept it. Reproduced.
**Suggested fix:** Print each file it sets back before doing so.
**Resolution:** 2026-10-25, each path set back is printed first; a hand edit to `a.txt` was reported as `set back: a.txt`. Reopened 2026-10-25: an edit to a shared file while the merge is open is staged by the loop and then dropped by the abort without a word, and the routine says nothing goes unreported. Reproduced. Suggested: before staging, print each shared file that differs from `HEAD` as dropped with the merge, and reword the paragraph. Repaired again 2026-10-25: the block names each path the reset sets back before it runs; edits to the plan, the handoff and a product file while the merge was open were each named as discarded, and the paragraph now says so. Re-reviewed 2026-10-25 at fc5d6ec: hand edits to the plan, the handoff and a product file were each named and the block returned to the work commit, in bash and zsh.

### 39d/F-26 [P3] closed - The abandon block fails when the target replaced a file with a directory

**File:** src/skills/complete/reference/land-on-top.md:132
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-21
**Why it matters:** The deleted-path list names the old file, `-e` is true for the merge's directory there, and `rm` fails, leaving the merge open where the block before this change recovered. Reproduced.
**Suggested fix:** Test with `-f` or `-L` instead of `-e`.
**Resolution:** 2026-10-25, the reset restores the file; with the target's directory in its place, holding an untracked and an ignored file, the block returned to the work commit naming all four paths, in bash and zsh. Re-reviewed 2026-10-25 at fc5d6ec: with the target's directory holding an untracked and an ignored file, `x` was restored and all four paths named, in bash and zsh.

### 39d/F-27 [P3] closed - "Cleared, held in HEAD" can delete content HEAD does not hold

**File:** src/skills/complete/reference/land-on-top.md:132
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-21
**Why it matters:** A tracked file edited during the merge and then removed from the index is deleted under that label, losing the edit. Reproduced with an unusual index step.
**Suggested fix:** Delete only a file that matches `HEAD`'s copy; otherwise name it and stop.
**Resolution:** 2026-10-25, the reset restores `HEAD`'s copy and names the path as discarded, so no label claims `HEAD` holds an edit; an edit removed from the index was named and the block returned to the work commit, in bash and zsh. Re-reviewed 2026-10-25 at fc5d6ec: an edit removed from the index was named and `HEAD`'s copy restored, in bash and zsh.

### 39d/F-28 [P3] closed - Discarded names untracked files the reset left on disk

**File:** src/skills/complete/reference/land-on-top.md:121
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-21
**Why it matters:** `ls-files -o --directory` lists files in a directory the merge made one by one while it holds a tracked file, then collapses them once the reset removes it, so they are named both discarded and left untracked, and the paragraph says the reset removes them. Reproduced.
**Suggested fix:** Test the filesystem after the reset for each untracked entry listed before it, and say only a file standing where `HEAD` has a file is removed.
**Resolution:** 2026-10-25, each untracked entry listed before the reset is named discarded only when it is gone after; with files written into a directory the merge made, the block printed `left untracked: nd/` once and both files stayed, in bash and zsh. Re-reviewed 2026-10-25 at efd71eb: its scenario passes in bash and zsh; it stays fixed while 39d/F-33 and F-34, surfaced by this repair, are unresolved. Re-reviewed 2026-10-25 at 5f413a2: still waiting on 39d/F-33 and F-34. Re-reviewed 2026-10-26 at 7f0c40f: files written into a directory the merge made stayed and printed once as `left untracked: nd/`; nothing it surfaced is unresolved.

### 39d/F-29 [P3] closed - zsh prints backslashes in discarded paths differently from bash

**File:** src/skills/complete/reference/land-on-top.md:121
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-21
**Why it matters:** zsh `echo` interprets escapes, so a quoted name holding `\\n` prints as one holding a newline. Reproduced.
**Suggested fix:** `printf 'discarded: %s\n'` instead of `echo`, and `-c core.quotePath=false` for readable non-ASCII names.
**Resolution:** 2026-10-25, names are read NUL-separated and printed with `printf`; `back\nslash.txt`, `with space.txt` and `é.txt` printed exactly, the same in bash and zsh. Re-reviewed 2026-10-25 at efd71eb: backslash, space, non-ASCII, leading-dash and newline names printed exactly, bash and zsh byte-identical.

### 39d/F-30 [P3] closed - Left untracked prints one line per file

**File:** src/skills/complete/reference/land-on-top.md:121
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-21
**Why it matters:** 3000 untracked files under one directory printed 3000 lines. Reproduced.
**Suggested fix:** `--directory` on the `ls-files -o --exclude-standard` call.
**Resolution:** 2026-10-25, the untracked listing uses `--directory`; 300 files in `scratch/` printed one line. Re-reviewed 2026-10-25 at efd71eb: 3000 files in `scratch/` printed one line in both shells and all stayed.

### 39d/F-32 [P3] closed - A reset that fails midway loses untracked files unnamed and names paths it did not set back

**File:** src/skills/complete/reference/land-on-top.md:121
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-21
**Why it matters:** With a read-only directory the reset failed after deleting untracked and ignored files under a directory the merge made; the list was dropped before it was checked, so they went unnamed, while `z/b` was named discarded but kept the merge's copy. Reproduced.
**Suggested fix:** Run the check loop whatever the reset returns, then report the failure; say a failed reset may leave named paths unrestored.
**Resolution:** 2026-10-25, the check runs whatever the reset returns, then a failed reset stops saying the merge is still open; on a read-only `z/` the untracked `d/u` holding `precious` was named, the merge stayed open, and a rerun after `chmod 755 z` returned to the work commit, in bash and zsh. Re-reviewed 2026-10-25 at 5f413a2: with `z/` read-only the removed `d/u` and `d/x.log` were named, the block exited 1 with the merge open, and a rerun after `chmod 755 z` returned to the work commit, in bash and zsh.

### 39d/F-33 [P3] closed - A removed untracked directory is named only as dir/

**File:** src/skills/complete/reference/land-on-top.md:121
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-28
**Why it matters:** With the target having deleted `x` and files written into `x/`, the reset removed them and printed only `discarded: x/`. Reproduced.
**Suggested fix:** List such a directory by file before the reset, or say a removed directory is named as one line.
**Resolution:** 2026-10-25, an untracked directory standing where `HEAD` has a path is listed by file before the reset; with `d` deleted by the target and `d/u1`, `d/u2` written, both were named, in bash and zsh. Re-reviewed 2026-10-25 at 5f413a2: its scenario passes; it stays fixed while 39d/F-36, surfaced by this repair, is unresolved. Re-reviewed 2026-10-26 at 7f0c40f: `d/u1` and `d/u2` were each named, plus `d`; nothing it surfaced is unresolved.

### 39d/F-34 [P3] closed - On a case-insensitive filesystem a case-only twin is overwritten under the tracked spelling

**File:** src/skills/complete/reference/land-on-top.md:121
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-28
**Why it matters:** With the target having deleted `gen.txt`, an untracked `GEN.txt` was replaced by HEAD's `gen.txt` and only `gen.txt` was named, since `-e` folds case. Reproduced.
**Suggested fix:** Test the exact name in its directory listing, or record it as a known limit.
**Resolution:** 2026-10-25, each name is tested exactly in its directory listing; an untracked `GEN.txt` replaced by `HEAD`'s `gen.txt` on APFS was named, in bash and zsh. Re-reviewed 2026-10-25 at 5f413a2: its scenario passes; it stays fixed while 39d/F-35, F-37 and F-38, surfaced by this repair, are unresolved. Re-reviewed 2026-10-26 at 7f0c40f: `GEN.txt` and `gen.txt` were both named; nothing it surfaced is unresolved.

### 39d/F-35 [P3] closed - An untracked file replaced by a directory from HEAD goes unnamed

**File:** src/skills/complete/reference/land-on-top.md:121
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-34
**Why it matters:** With `HEAD` holding `x/a`, the target deleting `x/` and an untracked file `x` written, the reset made `x` a directory and only `x/a` was named; the check sees the name, not its type. Reproduced.
**Suggested fix:** Name an entry listed without a slash that is now a directory.
**Resolution:** 2026-10-26, untracked and ignored files are listed by git before and after the reset and each one gone is named; an untracked `x` replaced by `HEAD`'s `x/a` was named, in bash and zsh. Re-reviewed 2026-10-26 at 7f0c40f: an untracked `x` where `HEAD` has `x/a` was named and `x` restored as a directory, in bash and zsh.

### 39d/F-36 [P3] closed - A case-only directory twin is named only as X/

**File:** src/skills/complete/reference/land-on-top.md:121
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-33
**Why it matters:** With `HEAD` holding file `x` and `X/u1`, `X/u2` written, `ls-tree` matches case-sensitively, so the removed files were named only as `X/`. Reproduced.
**Suggested fix:** Match the name case-insensitively in the parent's listing, or record the limit.
**Resolution:** 2026-10-26, by the same listing; `D/u1` and `D/u2`, removed when `HEAD`'s `d` was restored on APFS, were each named. Re-reviewed 2026-10-26 at 7f0c40f: `D/u1` and `D/u2` were each named, plus `d`.

### 39d/F-37 [P3] closed - A decomposed Unicode name is named both discarded and left

**File:** src/skills/complete/reference/land-on-top.md:121
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-34
**Why it matters:** git lists the composed form while `ls -A` prints the bytes on disk, so a kept `é.txt` stored decomposed was named discarded and left untracked. Reproduced.
**Suggested fix:** Compare against a second git listing after the reset rather than `ls`.
**Resolution:** 2026-10-26, both listings come from git, so a kept decomposed `é.txt` was named only as left untracked. Re-reviewed 2026-10-26 at 7f0c40f: a kept decomposed `é.txt` was named only as left untracked.

### 39d/F-38 [P3] closed - The after-check is quadratic in untracked files under a tracked directory

**File:** src/skills/complete/reference/land-on-top.md:121
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-34
**Why it matters:** 3000 untracked files inside a tracked `big/` took 16.0s, against 0.14s before this repair, since one `ls -A` runs per entry. Reproduced.
**Suggested fix:** Compare against a second git listing after the reset.
**Resolution:** 2026-10-26, two listings and one sort replace the per-entry `ls`; 3000 untracked files inside a tracked `big/` took under 1s, and this repository's full listing 0.03s. Re-reviewed 2026-10-26 at 7f0c40f: 3000 untracked files in a tracked `big/` took 0.14s in bash and 0.13s in zsh, all kept.

### 39d/F-39 [P3] closed - A staged-only change is discarded by the reset without being named

**File:** src/skills/complete/reference/land-on-top.md:121
**Found:** 2026-10-26 by audit (scope: current; lens: quality)
**Surfaced by:** 39d/F-21
**Why it matters:** The tracked listing is `git diff HEAD`, which compares the work commit with the working tree, so a path whose index holds `mine` while its working copy matches `HEAD` is not named, and the reset discards the staged content. Reproduced in bash and zsh; present since the reset replaced the abort.
**Suggested fix:** Also list `git diff --cached --name-only --no-renames HEAD` into the tracked list; `sort -u` keeps each name once.
**Resolution:** 2026-10-26, the tracked list also takes `git diff --cached`; a staged `mine` in `c.txt` with its working copy set back was named once as discarded, the same in bash and zsh, and a conflicted path was still named once. Re-reviewed 2026-10-26 at 03912db: a staged-only change was named once as discarded, and a conflicted path and a path staged then edited were each named once, in bash and zsh.
