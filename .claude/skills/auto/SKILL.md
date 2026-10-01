---
name: auto
summary: run the loop unattended, within explicit bounds
description: "Run the reviewed loop without stopping between steps, within bounds you set. With no argument it takes one work item and stops before completing it; `all` runs the remaining build plan; a number runs that many items; `fix` works through the findings ledger instead, every class most severe first or one class such as `fix P1`, one fix per file and class, re-reviewing every repair and folding any finding a repair surfaces into the same fix. Specs, implements, verifies, applies the configured gates, repairs confirmed high-severity findings, and completes each item. Its invocation grants committing, dependency installs, and remote reads for the run, and grants nothing else: it still stops to ask before any merge. Under git.mode pull-request it lands every item on one shared integration branch and ends by opening a single aggregate review packet it never merges, after stating that whole remote budget up front and being told yes. Use only when the user runs /auto or explicitly asks for an unattended run."
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
- `/auto fix` - the findings ledger instead of the plan; see Fix mode.

`auto.maxItems` caps successful completions. `auto.maxRepairAttempts` caps repeated
attempts at the same finding. `auto.finalAudit` adds one review across everything the run
produced.

## What the invocation grants

Running this authorizes, for this run only: committing, installing dependencies, and
network reads. That is the second authority tier, and the invocation is the approval.

It grants **nothing** in the first tier. Merging into the default branch, pushing to it,
deploying, publishing, deleting data, and rewriting history each still stop and ask, every
time, no matter how many items remain.

Under `git.mode: trunk` there is no merge, so a run completes items and keeps going. Under
`branch-per-item` it stops once per item to ask. That is not a flaw in the mode; landing
work on a shared branch is a decision, and it stays one.

Under `pull-request` nothing lands on the default branch, so there is no merge to stop for.
What the run does need is the one grant the authority rules allow to be given ahead of time,
and it is asked for **before any work starts**, in full:

    This run will, without asking again:
      create and push the integration branch <integrationBranchPrefix><date>
      create and push one branch per item
      open a pull request from each item into the integration branch
      merge those pull requests into the integration branch
      open one aggregate pull request into <default branch>

    It will not merge or push <default branch>, and it will not merge
    the aggregate pull request.

Print that, naming the real branches, and wait. **The enumeration is the approval, and it is
the whole remote budget.** A general yes to running is not it, and neither is silence. If the
answer is no, the run does not start.

## Step 1 - preflight once

Before the first item:

- Configuration is valid. Stop and point at /doctor if not.
- The overview is fresh, or regenerate it.
- No open question blocks the queued items. One that does stops the run **before** any work
  starts, naming the question, since a run that stops halfway through item four is worse
  than one that never began.
- The working tree is clean, or the only dirt belongs to work being resumed.
- The plan has unchecked items, or in fix mode the ledger has `open` or `fixed` findings in
  range.
- Under `pull-request`, the repository can host one: a remote exists and the host command
  works. A repository that cannot is a stop, not a reason to fall back to local merges. The
  mode exists to produce review gates, and silently producing a different history instead
  would be worse than not running.

Record the default branch's current commit. It bounds what the aggregate pull request will
carry, and the final report refers to it.

Under `pull-request`, then establish the run's integration branch, named from
`git.integrationBranchPrefix` and the date. Create it from that recorded commit and push it.
Every item branches off it and lands back into it, which is what lets item three build on
items one and two. On a resume, reuse the branch of that name rather than opening a second;
if one exists that does not descend from the recorded commit, stop, because the run's base
moved and that needs a person. Never rebase, reset, or force-push it: it is append-only for
the run.

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
6. **Land it**, under `pull-request` only: push the item's branch, open its pull request
   **into the integration branch** rather than the default branch, and merge it there once
   its checks are green. Merge only a pull request this run opened, only into the integration
   branch. A failing or conflicted one is a stop, never something to force. Then delete the
   item branch, confirming the work commit is in the integration branch first, since a
   squash leaves no merge parent for `git branch -d` to find. Return to the integration
   branch clean before the next item.
7. **Report one line** and move on.

An item counts against `auto.maxItems` once it has landed, not once it is built.

## Fix mode

`/auto fix` works through the findings ledger instead of the build plan, under the same
grant, gates, landing and stop rules.

- `/auto fix` or `/auto fix all` - every class, P0 first, until no `open` finding is
  left or a bound is reached.
- `/auto fix P0` through `/auto fix P3` - only that class.

**The queue.** Read `religion/context/findings.md` afresh before each fix, because every fix
and every review changes it. Take the classes in turn, most severe first. Within a class, the
`open` findings that name the same file form one group, oldest first, and each group is one
work item: specced by /fix with all of its identifiers, then implemented, gated,
completed and landed exactly as Step 2 does for a plan item. A fix confined to one file and
one class stays a diff someone can review; a fix that sweeps several is not.

`unverified` findings are not repaired. Nothing has confirmed them, and repairing a guess
produces a change nobody can check; report them instead. `fixed` findings in range are
re-reviewed rather than repaired again, because the repair exists and only a review can
close it.

**Every repair is re-reviewed.** Repair is the whole point of this mode, so after
implementation the repaired findings always go to /audit in a subagent with fresh
context, whatever `qualityGates.audit` says. Only that review closes a finding.

**Folding.** When that review raises a new finding in code the fix changed, the audit records
it under its own identifier with a `**Surfaced by:**` line naming the finding whose repair
exposed it, and it joins the current fix as another repair step, whatever its class. The
finding that surfaced it cannot close while it is `open` or `fixed`. A defect a repair
introduced belongs with that repair: left for a later fix, it loses the context that
explains it.

**Bounds.** `auto.maxRepairAttempts` caps the attempts at any one finding. A fix folds in at
most three findings; a fourth is still recorded, but left out of this fix, and the fix
completes with what it has, its unclosed findings staying in the ledger. When completion is
blocked because a P0 or P1 is still `open` or `fixed`, the run stops. A finding the run has
already given up on is not queued again, and `auto.maxItems` caps completed fixes. Without
these bounds the loop need not end: a review of a repair can always find something new.

## Step 3 - close the run

Under `trunk` and `branch-per-item` there is nothing to close: the items are done and the
run reports.

Under `pull-request`, open one aggregate pull request from the integration branch into the
default branch. Title it for the run rather than for any one item. Its body is the run's
review packet, and it is the artefact a person actually reads:

- one section per completed item, in plan order, naming what it delivered, its merged pull
  request, and the checks that proved it
- findings still open or fixed, by identifier, and anything deliberately left out
- what the run did not reach, and why it stopped

Report the URL and stop. **Never merge it.** It is the review gate the mode exists to reach.

Open it even when the run stopped early with completed items behind it, saying plainly in
the body that it stopped short: work that passed every gate deserves to be reviewable, and a
packet describing three of six items beats an integration branch nobody knows about. When
the run completed no items at all, open nothing and say so.

## Step 4 - stop

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

## Step 5 - report

- items completed, by name, and what each delivered
- under `pull-request`, the recorded starting commit, the integration branch and its head,
  each item's merged pull request, and the aggregate pull request URL or why none was opened
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
- Never write to the default branch, in any mode. Never merge the aggregate pull request,
  and never force-push anything, the integration branch included.
- Never deploy, publish, or delete without asking, however long the queue is.
- Never widen an item's scope to make its gate pass.
- Stop on ambiguity. There is nobody to ask mid-run, so a guess compounds silently.

## Formatting

Match the conventions in `religion/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
