---
name: auto
summary: run the loop unattended, within explicit bounds
description: "Run the reviewed loop without stopping between steps, within bounds you set. With no argument it takes one work item and stops before completing it; `all` runs the remaining build plan; a number runs that many items. Specs, implements, verifies, applies the configured gates, repairs confirmed high-severity findings, and completes each item. Its invocation grants committing, dependency installs, and remote reads for the run, and grants nothing else: it still stops to ask before any merge. Use only when the user runs /auto or explicitly asks for an unattended run."
---

# auto - the same loop, without the pauses

Explicit opt-in only. Never suggest this as a next action, and never fall into it because
several items are queued.

Same skills, same gates, same evidence. The only difference is that it does not stop
between steps.

## Bounds

- `/auto` - one work item, stopping **before** completing it, with a review packet.
- `/auto all` - the remaining build plan, completing each item, until it runs out or hits
  a bound.
- `/auto 3` - the next three items, completing each.
- `/auto resume` - continue an interrupted run from the file-backed state.

`auto.maxItems` caps successful completions. `auto.maxRepairAttempts` caps repeated
attempts at the same finding. `auto.finalAudit` adds one review across everything the run
produced.

## What the invocation grants

Running this authorizes, for this run only: committing, installing dependencies, and
network reads. That is the second authority tier, and the invocation is the approval.

It grants **nothing** in the first tier. Merging, pushing, deploying, publishing, deleting
data, and rewriting history each still stop and ask, every time, no matter how many items
remain.

Under `git.mode: trunk` there is no merge, so a run completes items and keeps going. Under
`branch-per-item` it stops once per item to ask. That is not a flaw in the mode; landing
work on a shared branch is a decision, and it stays one.

## Step 1 - preflight once

Before the first item:

- Configuration is valid. Stop and point at /doctor if not.
- The overview is fresh, or regenerate it.
- No open question blocks the queued items. One that does stops the run **before** any work
  starts, naming the question, since a run that stops halfway through item four is worse
  than one that never began.
- The working tree is clean, or the only dirt belongs to work being resumed.
- The plan has unchecked items.

State the bounds, the gates in force, and how many items are in range. Then start.

## Step 2 - each item

For every item, in plan order:

1. **Spec it**, following /feature, including the sizing and the self-critique. Do
   not skip the critique because nobody is reading: it is what catches an oversized step
   before it becomes an unreviewable diff.
2. **Implement it**, following /implement, with no prompt between steps. Verify each
   step against what it touched.
3. **Apply the gates** from `qualityGates`, then run the full `Verify`.
4. **Repair confirmed findings** at P0 and P1, within this item's scope, then re-review them
   in a subagent with fresh context. Give up after `auto.maxRepairAttempts` and stop with
   the finding recorded rather than trying variations.
5. **Complete it**, following /complete, which archives, ticks the plan, prunes the
   ledger, and commits. Ask before any merge.
6. **Report one line** and move on.

## Step 3 - stop

Stop immediately, keeping all state intact, when any of these happens:

- a check fails and two repair attempts do not fix it
- a product decision is needed that the plans do not answer
- a finding cannot be repaired within the item's scope
- work would touch anything in the first authority tier
- an item turns out to need splitting in a way that changes the plan
- a bound is reached
- the same failure appears twice in a row across different items, which means something
  systemic and further items will not fix it

A stopped run leaves the branch, the spec, and the ticked steps exactly as they are.
`/auto resume` picks up from there, because the state is in files rather than in the run.

## Step 4 - report

- items completed, by name, and what each delivered
- what stopped the run, exactly, and the state it stopped in
- findings raised, repaired, and still open
- checks run, and any that could not run
- the resume command, when one applies

Never report an item as complete when its gate did not pass. An unattended run that
overstates what it did is worse than one that stopped early, because nobody was watching
the part it got wrong.

## Rules

- Explicit invocation only.
- The gates are the same gates. Unattended is not a reason to lower one.
- Never merge, push, deploy, publish, or delete without asking, however long the queue is.
- Never widen an item's scope to make its gate pass.
- Stop on ambiguity. There is nobody to ask mid-run, so a guess compounds silently.

## Formatting

Match the conventions in `religion/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
