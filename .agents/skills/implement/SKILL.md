---
name: implement
summary: build the current spec one reviewed step at a time
description: "Build the feature, fix, or rollback spec'd in religion/context/current-work.md, one small reviewable step at a time. Implements each step as the smallest change that satisfies its stated outcome, shows the diff and explains it in plain language, proves the outcome with evidence, ticks the step off so progress survives a cleared context, and resumes from the first unchecked step when interrupted. Repairs open high-severity findings as extra reviewed steps and has them re-reviewed independently. Ends with a review packet; the work commit and any merge belong to $complete. Use when the user runs $implement, or asks to build, start, continue, or resume the current work item once its spec is ready."
---

# implement - build the current spec, one reviewed step at a time

Where this sits:

    feature, fix, or rollback  ->  [implement]  ->  complete
    (the spec)                     (build it)       (commit, close it out)

The spec was written and reviewed. This skill turns it into code without vibe coding:
small steps, a visible diff and a plain-language explanation for each, evidence that its
outcome is met, and iteration until it works.

## Before you start

**Read `religion/config.json`.** A missing file means defaults. If it exists but cannot
be parsed, stop and point at $doctor; a skill that is about to change code must not
guess past broken configuration.

**Read the spec.** If `religion/context/current-work.md` is still the stub, or its status
is already complete, stop and say to run $feature, $fix, or
$rollback first.

**Take the context.** Conventions from `religion/context/coding-standards.md`, the data
model from the project overview. Code that ignores them is rework, not progress.

**Resuming?** Steps already ticked (`- [x]`) mean this was started earlier and
interrupted, usually by a cleared context. That is expected and costs nothing. Read which
steps are done, check the working tree and recent commits to see what actually landed, and
continue from the **first unchecked step**. Do not start over, and do not re-verify
completed steps unless something suggests they broke.

**A rollback spec** carries `Type: Rollback`. Apply it by recomputing the diff command the
spec records, confirming it still matches, then applying it in reverse with three-way
conflict detection and staging it. Show the staged diff and confirm no workflow-owned path
was touched before presenting the step. Never write the reversal freehand, and never run a
whole-commit revert: the commits being reversed also carry the archive and plan bookkeeping
that must survive. On a conflict, stop and report the paths and the later commit involved
rather than resolving it.

## Step 1 - position the work

Read `git.mode`.

**`trunk`** (the default) works on the branch already checked out. Do not create a branch.
If the current branch looks wrong for this work, say so and ask; do not switch or create
one unprompted.

**`branch-per-item`** and **`pull-request`** both create and check out a branch named from
the spec, using the prefix configured for its kind: feature, fix, rollback, or refactor.
They differ only in how the work leaves the branch at completion, which is not this skill's
concern. On a resume the branch exists already, so check it out rather than creating a
second one.

Either way, if the project is not a git repository, say so and ask the user to initialize
one. The loop needs history to be reviewable.

## Step 2 - build one step

Set the spec's status to `in progress` before the first code change of this run, and again
whenever work resumes after a passing check and touches product code. That invalidates
stale verification state.

Work through the build steps **in order, one at a time**, unless a wave applies. For each:

1. **Implement just that step.** The smallest change that satisfies its stated outcome.
   Nothing from a later step, nothing nobody asked for.
2. **Show the diff**, not whole files.
3. **Explain it, and prove it.** What the step delivered, one line per changed file on
   what it does and why, then the outcome shown true with evidence: command output, a
   screenshot, a passing assertion. Keep it concrete; this is the comprehension gate, not
   a ritual. Add a short **how to try it** line when there is a manual path.
4. **Verify what the step touched.** Run the focused checks for this change: the relevant
   test, the typecheck, whatever proves this diff. The full `Verify` command runs once
   before the work is completed, so a step does not pay for the whole suite every time.
   Run the full command earlier anyway if a step could plausibly break something far away.

   With `verification.logicTests: "required"`, a logic change with no configured runner
   stops and points at $tests. With `when-configured`, the gate applies only when a
   test command is declared. When it is on, a step that adds in-scope logic ships a passing
   test in the same diff. Interface and integration steps ride on running it, a screenshot,
   and the build. With `verification.uiEvidence: "required"`, an interface outcome cannot
   pass on build output alone.

   Never install a runner mid-step unless this spec is what sets that runner up.
5. **Iterate until it works.** If it fails, revise and re-test. After two or three
   attempts that do not work, **stop**. Report what each attempt did and why you think it
   is failing, and offer to hand it to $debug, which reproduces the failure and
   tests competing hypotheses in parallel. Do not keep trying variations.
6. **Tick the step** (`- [x]`) once its gate is satisfied, so progress survives a cleared
   context. In a wave, tick each step that passed, and only those. If the step repaired a finding, mark that finding `fixed` and note the repair
   in its resolution line. Never mark it `closed`; see Step 3.

   **Tick it then, not later.** Never save several ticks to write in one go. The spec on
   disk is the only record of what is done, and a session that ends between the work and
   the bookkeeping loses exactly the step it just finished: the next one rebuilds it,
   because an unticked step is indistinguishable from one never started.
7. **Then prompt, according to config.**

   With `workflow.stepReview: "item"`, do not prompt. Continue to the next step and
   collect everything into one packet at the end. Still stop early for a failed check, a
   decision, a conflict, scope drift, or anything in the first tier of the authority rules.

   With `stepReview: "every"`, offer only the options that config actually allows:

   - **Continue** - move to the next step.
   - **Commit checkpoint** - only when `git.checkpoints` is `every-step` or `squash`.
     Choosing it is the approval that authorizes the commit. Commit just this step with a
     conventional message describing what the change does.
   - **Walk me through it** - a deeper, line-level explanation: why this approach, what
     each part does, the gotchas. Then re-ask. A loop back, not a terminal choice.
   - **Stop here** - pause. Say where things stand and how to resume.

   Use the tool's short input prompt when there is one. When you have just produced a long
   block to read, ask in plain text instead, so the prompt does not cover what is still
   being read.

Never batch the whole item into one diff. A diff too large to read means the step was too
large; split it.

## Waves, when the spec asks for them

Off unless `workflow.parallelSteps` is `true`. When it is off, ignore every marker and build
in order: a spec carrying markers must behave identically in a project that never opted in.

A step marked `(with N)` may run alongside step `N`. Those steps and everything transitively
joined to them form one **wave**. A step with no marker waits for every step before it, which
is why an unmarked spec is exactly as sequential as it has always been.

    - [ ] 1. Add the schema migration
    - [ ] 2. Build the endpoint
    - [ ] 3. Build the client  (with 2)
    - [ ] 4. Update the docs

Two waves of one, then a wave of two, then a wave of one.

**Refuse a wave rather than guess at one.** Run the wave sequentially, and say why, when:

- a marker names a later step, itself, or a step that does not exist
- two steps in the wave would change the same file, which is a conflict the spec did not
  intend and the author is better placed to resolve than a merge
- the wave is larger than three steps, which usually means the spec is describing one step
  badly rather than three independent ones

**Building a wave.** Each step runs in its own subagent with the step, the spec, the
standards, and nothing else. They build and **return**; they do not tick, do not write the
spec, and do not touch the ledger. The parent applies what comes back, runs the gate for each
step, and performs every write. This is the same rule audit's lenses follow, for the same
reason: concurrent writers to one file is the one thing waves must never introduce.

**A failure stops the wave.** Report which steps passed and which did not, tick only what
passed, and stop. Do not retry the wave; the next run resumes at the first unticked step,
sequentially, because a wave that failed once has already shown its independence was wrong.

**One packet per wave.** Steps that ran together are reviewed together: one diff with a
section per step and its evidence, prompted once. `workflow.stepReview` still decides whether
that prompt happens per wave or is collected to the end; a wave never lands unreviewed.

## Step 3 - clear the ledger before handing off

Read `religion/context/findings.md`. A P0 or P1 finding that is `open` or `fixed` will
block completion, so close the loop now rather than discovering it later.

For each `open` P0 or P1:

1. **Append it to the spec's build steps** first (`- [ ] Repair F-03 - <title>`), so the
   repair is on the record and survives a cleared context.
2. Build it through the same loop as Step 2: smallest change, diff, explanation, evidence.
3. Tick the step and mark the finding `fixed`.

Then have the repairs re-reviewed. Run $audit over the repaired code **in a
subagent with fresh context**, and record what it returns. The independence is the point:
a repair is not done when the code changes, it is done when a review that did not write it
has looked at the result, because a fix can introduce a worse defect than the one it
removed. Reviewing your own repair in the context that produced it is not that review.

A finding that a user decides not to fix is `accepted`, and only they may set it, with
their reason recorded. A finding that looks wrong goes back to review to be marked
`invalid` with evidence. This skill sets neither.

## Step 4 - hand off

When every step is built and its gate has passed, stop with a compact review packet:

- where the work sits: branch, or the current branch under trunk mode
- what changed, grouped by file or area
- checks run, with the exact command and result for each
- how to try it manually
- ledger state: any findings still `open` or `fixed`, by identifier
- known risks, skipped checks, or follow-ups
- next action, normally $complete

Set the spec's status to `verified` immediately before that packet, but only when every
required command, outcome, and configured gate actually passed. A gate that could not run
is a blocker, not a pass.

Then say that $complete runs the full `Verify`, archives the spec, updates the
build plan, makes the work commit, and asks separately before any merge or push.

## Rules

- One small step per diff, and never a commit before its review gate is satisfied.
- Explain every change in plain language. Understanding the code is the point.
- Build only what the spec says. If the spec is wrong or thin, stop and fix the spec
  first. Do not improvise around it.
- Follow the project's coding standards, including scoping user-owned queries by the
  authenticated identity taken from the server.
- Checkpoints are optional rollback points. The work commit, any merge, and any push
  belong to $complete.
- This skill does not merge, push, or complete.

## Formatting

Match the conventions in `religion/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
