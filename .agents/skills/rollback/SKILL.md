---
name: rollback
summary: plan a guarded reversal of completed work, preserving its history
description: "Plan the safe reversal of a completed item using its archive and the commits it recorded when it landed. Verifies the recorded commits still resolve and are ancestors of HEAD, reviews later commits for work that depends on them, then writes a Type: Rollback spec to religion/context/current-work.md and stops before any code changes. The reversal applies only the product diff in reverse, never a whole-commit revert, so the archive and plan bookkeeping that landed in the same commits survive. Given `--steps N` instead, backs out the last N steps of the item in progress: stashes anything uncommitted first, reverts what those steps changed, and unticks them, after showing what it will do and being told yes. Use when the user runs $rollback, asks to remove or undo completed work, wants the project returned to its behavior before an item without erasing the record that it existed, or asks to back out or undo the last step or two of work still in progress."
---

# rollback - plan a guarded reversal

Where this sits:

    history/  ->  [rollback]  ->  implement  ->  complete
    (archive)     (plan it)       (apply it)     (record it)

Removing completed work is not `git revert`. The commits that landed an item also carry its
archive, its build-plan tick, and its ledger pruning. Reverting them whole would delete the
record that the work ever existed, and would fight with whatever the plan says now.

This skill plans. It writes a spec and stops. No product file changes here.

**Except in one mode.** `$rollback --steps N` backs out the last N steps of the item currently
in progress, and does it rather than speccing it. The two jobs share a verb and nothing else:
reversing completed work is large, has consequences for anything built on top, and earns a
reviewed spec. Backing out two steps you just wrote is small, local, and speccing it would
mean writing into the very file whose steps are being undone.

## Backing out steps in progress

Only for `--steps N`. For a completed item, skip to Step 1.

1. **Read the active spec.** Take the last N ticked steps. If fewer than N are ticked, say so
   and take what there is. If none are, there is nothing to undo and this stops.
2. **Make it recoverable before making it gone.** Stash anything uncommitted with a named
   entry, whatever `git.checkpoints` says, and keep the name. Undoing work git cannot recover
   is a deletion, and the stash is what turns it back into a mistake that costs one command.
3. **Show what will happen**, then ask once: the steps by number and title, the files that
   change, and whether they came from commits or the working tree. Wait for a yes. This is
   the only approval, and it does not extend to anything else.
4. **Reverse it.** Where the steps are commits, revert their product diff. Where they are
   uncommitted, restore the files to their state before those steps. Never rewrite pushed
   history, and never reach past the current work item.
5. **Untick the steps** in the active spec, so the next $implement resumes at the first
   of them rather than believing they are done.
6. **Report** what was reversed, what was left alone, and the exact command that recovers the
   stash. Say the stash name; a recovery path nobody can find is not one.

The spec, the archive and the build plan are untouched: the item is still in progress, and
nothing about it has been completed or recorded.

## Step 1 - identify the target

Take a build-plan number or name. Match it to a **checked** item and its archive under
`religion/history/features/`. If the item is not checked, it was never completed, and there
is nothing to roll back: say so.

Read the archive's `## Landed` section for the base commit, the item's commits, and the
product paths it touched.

**If there is no `## Landed` section**, the item was completed before that record existed.
Do not guess the commit range from messages or dates: reversing the wrong commits damages
unrelated work. Report what is missing, show the archive and the commits around it, and ask
the user to confirm the exact range before continuing.

## Step 2 - verify the record still holds

Stop on any failure. Do not repair a mismatch by choosing a nearby commit.

1. Every recorded identifier matches `^[0-9a-f]{40}$`. Reject abbreviated or uppercase
   values.
2. Every recorded commit resolves in this repository and is an ancestor of `HEAD`.
3. The recorded base is the parent of the earliest recorded commit.
4. The working tree is clean apart from the rollback spec being written.

## Step 3 - preview the product diff

Compute the reversal exactly as it will be applied, excluding everything the workflow owns:

    git diff --binary <base> <last-recorded-commit> -- . \
      ':(exclude).agents/**' ':(exclude).claude/**' \
      ':(exclude)religion/**' \
      ':(exclude)AGENTS.md' ':(exclude)CLAUDE.md' \
      ':(exclude)prototypes/**'

Confirm the result is non-empty and its paths match the product paths in the archive. A
mismatch means the record and the repository disagree, which is a stop.

Never drop those exclusions for convenience. They are what keeps the archive, the plan, and
the ledger intact while the product change goes away.

Under `git.mode: trunk` the item's commits sit among other commits on the same branch. The
recorded range is what separates them; the diff is still computed only across that range,
never from the branch tip.

## Step 4 - review what came after

Inspect commits after the target for work that depends on it: imports of things it added,
callers of its functions, columns or fields it introduced, configuration it established.

Report each dependency with its commit and file. A reversal that cascades into later work
is not a rollback, it is a second reversal that has not been planned. Say so plainly and
let the user decide before writing the spec.

## Step 5 - write the spec

Write `religion/context/current-work.md` marked `Type: Rollback`, recording:

- **Target** - the item, its number, and its archive path
- **Reason** - why it is being removed, in the user's words
- **Base** and **Commits** - the verified full identifiers
- **Product paths** - what the reverse patch will touch
- **Later dependencies** - what Step 4 found, and how each is handled
- **Build steps** - normally one: apply the reverse patch and confirm the tree
- **Done when** - the removed behavior is gone, and one named unaffected path still works

Include the exact command from Step 3 in the spec, so implementation applies the reviewed
diff rather than reconstructing it.

Then stop for review.

## What implementation will do

Recorded here so the spec and the build agree:

1. Recompute the diff from Step 3 and confirm it still matches.
2. Apply it in reverse with three-way conflict detection, and stage it:
   `... | git apply --reverse --3way --index`
3. Show the staged diff and the status, and confirm no workflow-owned path is touched.

On a conflict: stop, report the exact paths and the later commit involved, and ask. Never
auto-resolve, discard, stash, reset, or check out broadly. A cascade into other completed
work needs its own plan.

## Rules

- `--steps` acts; everything else plans. Never blur the two.
- `--steps` never touches the build plan, an archive, or a completed item.
- Stash before reverting, every time, even when the steps are committed. The cost is one
  stash entry and the alternative is an unrecoverable mistake.

- The archive is never deleted or rewritten. Completion adds a rollback record beside it.
- Reverse only the recorded product diff. Never a whole-commit revert.
- The build-plan item is unticked and annotated, and keeps its number.
- Stop on any mismatch between the record and the repository. Guessing is what makes a
  rollback dangerous.

## Formatting

Match the conventions in `religion/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
