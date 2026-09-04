---
name: complete
summary: run the final gate, archive the work, commit it, and close it out
description: "Close out a finished feature, fix, or rollback. Runs the full Verify command and the final safety pass, applies the configured quality gates, archives the spec under religion/history/, ticks the build plan, prunes resolved findings into the archive, resets the active spec, and makes the work commit. Under branch-per-item it squash-merges only with explicit approval, then asks separately before pushing. Ends with a manual walkthrough of what landed. Use when the user runs /complete, or asks to finish, wrap up, close out, or merge the current work item once it is built and reviewed."
---

# complete - close out the finished work

Where this sits:

    implement  ->  [complete]  ->  next item
    (built it)     (gate, archive, commit, merge)

The work is built and reviewed. This skill decides whether it is actually done, records it
in the project's history, and lands it.

## Before you start

**Read `religion/config.json`.** A missing file means defaults; an unparseable one stops
here and points at /doctor.

**Confirm there is something to complete.** `religion/context/current-work.md` holds a
real spec, not the stub. Uncommitted step work is expected under `git.checkpoints: none`,
so do not require the steps to be pre-committed.

## Step 0 - the final safety pass

Report blockers only. Stop before Step 1 if any of these fail.

- **The full `Verify` command passed in this session.** Implementation verified each step
  against what it touched; this is where the whole suite runs. If the entry file declares
  no `Verify` command, run the build, plus the test command when one is declared and the
  work touched logic. A check that cannot run is a blocker, not a pass.
- **Every build step is ticked.** An unticked step is work the spec asked for that nobody
  confirmed landed. To finish without it, remove it from the spec first and say why.
- **No P0 or P1 finding is `open` or `fixed`** in `religion/context/findings.md`. `fixed`
  blocks on purpose: the repair exists but no review has looked at it. Run /audit
  to move it to `closed`. The only other ways past are `accepted`, which only the user may
  set and which records their reason, and `invalid`, which needs review evidence. A
  missing ledger means no findings.
- **With `verification.logicTests: "required"`**, logic changes have a configured runner
  and passing focused tests.
- **With `verification.uiEvidence: "required"`**, interface outcomes have direct browser
  evidence, not build output alone.

Then **report, without blocking**, anything in the working tree that is not tied to this
spec. A dirty findings ledger is expected. Anything else is about to be committed, so name
the files and let the user decide before continuing.

Never claim passed, verified, or working without naming the command, route, screenshot, or
output that proves it.

## Step 1 - apply the configured gates

Read `qualityGates`. Reuse evidence already produced during this work item rather than
repeating it.

- **`audit`**: `manual` runs only on request. `when-sensitive` runs for authentication,
  authorization, payments, secrets, personal data, migrations, destructive operations,
  external side effects, security boundaries, or unusually broad changes. `always` runs
  every time.
- **`check`**: `manual` runs only on request. `when-behavioral` runs when an outcome needs
  observed runtime behavior: a click, a request, a download, a background job, a flow
  across screens. `always` runs every time.

Run `check` first, then `audit`. A required gate that cannot run is a blocker. If an audit
raises a new P0 or P1, completion stops and the repair goes back to /implement.

Set the spec's status to `verified` once this passes, then archive it.

## Step 2 - record the work

Read the spec's type.

- **Feature** - archive to `religion/history/features/NN-name.md`, where `NN` is the
  build-plan number, and tick that item in the build plan, plus its parent once every
  sub-item is ticked.
- **Fix** - archive to `religion/history/fixes/name.md`. A fix is not a plan item, so
  there is nothing to tick.
- **Rollback** - archive to `religion/history/rollbacks/YYYY-MM-DD-NN-name.md`, leaving
  the original feature archive intact. Untick the target item, and append a short note to
  that line with the date and the rollback's archive path. Keep the number stable.

The number lives in the path. It never appears in the commit message.

**Record what landed.** After the work commit exists in Step 3, append a `## Landed`
section to the archive with the exact commits this item produced, oldest first, and the
commit that preceded them:

    ## Landed

    **Base:** <40-character sha of the commit before this item>
    **Commits:** <40-character sha>, <40-character sha>
    **Product paths:** src/export.ts, src/routes/export.ts

Full identifiers only, never abbreviated. This is what makes a later reversal possible:
without it, reconstructing which commits belong to an item means guessing from messages and
dates, and guessing wrong reverses somebody else's work. Under `git.mode: trunk` the item's
commits sit among others on the same branch, so this record is the only reliable boundary.

**Prune the ledger.** Append every `closed`, `accepted`, and `invalid` entry to a
`## Findings` section in the archive just written, at its final status, with the reason
preserved for accepted entries. Prefix each identifier with the archive name so it is
globally unique: item 12's `F-03` becomes `12/F-03`, and that prefixed form is the
permanent reference.

Then remove only those entries from the ledger. `open`, `fixed`, and `unverified` entries
stay, with their identifiers, so nothing is silently dropped. A `fixed` P2 does not block
completion but must survive verbatim for a later review. Reset the ledger to its stub only
when nothing unresolved remains.

**Reset the active spec** to its stub, exactly as shipped.

**Discard consumed prototypes.** If this work built its look from throwaway static mockups
and an early step ported their tokens into the real stylesheet, delete `prototypes/` as
part of this work. Prototypes that are real components are not throwaway: leave them.

Do not commit yet.

## Step 3 - the work commit

Stage everything: any uncommitted step work, plus the archive, plan, and ledger changes
from Step 2. Make one commit.

    feat: export reports as CSV

    - streaming serializer for large result sets
    - /reports/export route
    - empty and error states

Conventional prefix, a subject saying what the change does, and a short body naming what
changed. Never a plan number, a roadmap reference, or any AI attribution: someone reading
this history later has none of those documents open.

If checkpoints already committed the steps, this commit carries the bookkeeping and the
history reads as the build sequence followed by its closing entry. Then offer to squash
the item into one commit. Squashing rewrites history, so it needs an explicit yes, and it
is refused outright when any of those commits has already been pushed.

## Step 4 - land it

Under **`git.mode: trunk`** the work is already on the branch you were on. There is nothing
to merge. Go to Step 5.

Under **`branch-per-item`**:

1. Squash-merge into the default branch, only with an explicit yes, so the item lands as
   one commit however many checkpoints the branch carried.
2. Delete the branch after a clean merge.
3. Stop.

Then, in either mode, ask separately whether to push. **Approval to merge is not approval
to push.** Push only after an explicit yes to pushing, in this conversation. If there is no
remote, say so rather than guessing.

## Step 5 - say how to try it

Always end with the manual walkthrough for what just landed: what to start, where to go,
what to click or run, what to expect, and what would count as wrong. This is instructions
for a person, never a claim that the review happened.

For a rollback, say how to confirm the removed behavior is gone, and name one unaffected
path that should still work.

Then point at what is next: /feature for the next planned item, or /fix.

## Rules

- The work item is the unit of history.
- Do not complete failing or unfinished work. The full `Verify`, or the fallback build and
  tests, must pass first.
- Never land work while a P0 or P1 finding is `open` or `fixed`. The recorded ways past
  without code are `accepted`, by the user's explicit decision with their reason, or
  `invalid`, backed by review evidence. Both travel into the archive; neither is a silent
  drop.
- A rollback preserves the original archive and adds its own. Never rewrite history to
  make a feature look as though it never existed.
- Merging and pushing are the user's calls, and they are two separate calls.
- One item per completion. A parent with unticked sub-items stays unticked.

## Formatting

Match the conventions in `religion/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
