---
name: rollback
summary: plan a guarded reversal of completed work, preserving its history
description: "Plan the safe reversal of a completed item using its archive and the commits it recorded when it landed. Verifies the recorded commits still resolve and are ancestors of HEAD, reviews later commits for work that depends on them, then writes a Type: Rollback spec to {{state}}/context/current-work.md and stops before any code changes. The reversal applies only the product diff in reverse, never a whole-commit revert, so the archive and plan bookkeeping that landed in the same commits survive. Use when the user runs {{cmd}}, asks to remove or undo completed work, or wants the project returned to its behavior before an item without erasing the record that it existed."
---

# rollback - plan a guarded reversal

Where this sits:

    history/  ->  [rollback]  ->  implement  ->  complete
    (archive)     (plan it)       (apply it)     (record it)

Removing completed work is not `git revert`. The commits that landed an item also carry its
archive, its build-plan tick, and its ledger pruning. Reverting them whole would delete the
record that the work ever existed, and would fight with whatever the plan says now.

This skill plans. It writes a spec and stops. No product file changes here.

## Step 1 - identify the target

Take a build-plan number or name. Match it to a **checked** item and its archive under
`{{state}}/history/features/`. If the item is not checked, it was never completed, and there
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
      ':(exclude){{state}}/**' \
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

Write `{{state}}/context/current-work.md` marked `Type: Rollback`, recording:

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

- The archive is never deleted or rewritten. Completion adds a rollback record beside it.
- Reverse only the recorded product diff. Never a whole-commit revert.
- The build-plan item is unticked and annotated, and keeps its number.
- Stop on any mismatch between the record and the repository. Guessing is what makes a
  rollback dangerous.

## Formatting

Match the conventions in `{{state}}/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
