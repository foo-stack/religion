# What the loop actually feels like

The loop is five skills in a line:

```text
feature -> implement -> check -> audit -> complete
```

What that costs you, and what you get for it, is easier to see walked than described. This
walks one real item all the way through, using one that is already finished and archived in
this repository:

`religion/history/features/02-setup-drafts-usable-plans-from-an-existing-codebase.md`

Every block below is quoted from a file you can open. Nothing here is illustrative.

If you have not installed yet, start with [Getting started](getting-started.md).

## First: a spec, before any code

`feature` turns one line of the build plan into something buildable and writes it to
`religion/context/current-work.md`. It writes no code at all.

That file opens with what the work is and what will be true when it is done. From the
archive:

```text
# Setup drafts usable plans from an existing codebase

**Type:** Feature
**From build plan:** item 2
**Status:** verified
```

Then scope, in two lists. The out-of-scope list is the one that earns its place, because it
is what the work is measured against later when something starts creeping in.

The core of the file is the build steps. Each is one small change with a stated outcome:

```text
- [x] **Step 1 - a drafting reference to aim at** - add
  `src/skills/setup/reference/drafted-plans.md`, following the pattern
  `src/skills/feature/reference/spec-template.md` and
  `src/skills/overview/reference/project-overview-template.md` already set. It states the
  eight project-plan headings and, for each, what a drafted answer looks like and what it is
  derived from; the build-plan item line format; and the acceptance rules `overview` enforces
  at `src/skills/overview/SKILL.md:53-76`. Files under a skill directory are rendered
  automatically, so no script changes. *Done when:* the file exists, `npm run build:skills:link`
  renders it into both `.claude/skills/setup/reference/` and `.agents/skills/setup/reference/`
  with no unrendered token left in either, and `npm test` passes.
```

Two things to notice, because they are the whole point of writing this before the code
exists.

**The `*Done when:*` clause is observable.** Not "the reference is good" but a file existing,
a command rendering it into two named directories, and a suite passing. You can tell whether
it happened without trusting anyone's description of it.

**You can argue with it now.** A spec is cheap to change and code is not. This is the moment
to say a step is too big, an outcome is vague, or something is missing.

`feature` also red-teams its own draft before showing it to you, and reports what the
critique changed. If it says "nothing, the draft held up", that is a claim you can push on.

## Then: one step at a time

`implement` builds the first unchecked step. Just that one.

For each step you get a diff rather than whole files, a plain-language explanation of what
changed and why, and the stated outcome shown true with evidence: a command and its output,
a passing assertion, a screenshot. "It should work" is not evidence and neither is a summary
of what the code intends.

Then it stops and asks. The options come from `religion/config.json`, and with the shipped
settings they are:

```text
- **Continue** - move to the next step.
- **Commit checkpoint** - only when `git.checkpoints` is `every-step` or `squash`.
  Choosing it is the approval that authorizes the commit. Commit just this step with a
  conventional message describing what the change does.
- **Walk me through it** - a deeper, line-level explanation: why this approach, what
  each part does, the gotchas. Then re-ask. A loop back, not a terminal choice.
- **Stop here** - pause. Say where things stand and how to resume.
```

**Saying no is not one of the four**, and that is deliberate. There is no reject button
because you are not voting; you are talking. Say the step is wrong, or too large, or missing
a case, and it is revised and re-proved before anything moves on. The step is only ticked
once its gate passes, so an unfinished argument cannot be mistaken for a finished step.

**Walk me through it** loops back to the same question rather than advancing, so asking for
more detail never costs you the decision.

If you would rather not be asked after every step, set `workflow.stepReview` to `item` in
`religion/config.json` and the steps collect into one review packet at the end. It still
stops early for a failed check, a decision, a conflict, or work drifting outside its spec.
The settings are listed in `docs/architecture/config.md`.

## Progress lives on disk, not in the conversation

The checkboxes in `religion/context/current-work.md` are ticked as each step lands. That is
the entire resumption mechanism.

Clear the context, close the terminal, come back in a week: `implement` reads which boxes
are ticked and continues from the first one that is not. Nothing is remembered and nothing
needs to be. Run `status` if you are unsure where things stand.

This is why steps are ticked immediately rather than in a batch at the end. A session that
ends between the work and the bookkeeping loses exactly the step it just finished, because
an unticked step is indistinguishable from one never started.

## When a review finds something

`check` proves the work behaves as specced by running the real thing. `audit` is a read-only
quality pass. Anything `audit` finds goes to `religion/context/findings.md` with a durable
identifier, a severity, and a status:

```text
### F-01 [P0] open - Auth volume carries the run label
### F-02 [P2] closed - Duplicated slug helper
### F-03 [P1] fixed - Missing ownership check
```

The identifier never changes, because repairs and archives refer back to it.

**A P0 or P1 blocks completion while it is `open` or `fixed`.** `fixed` blocking is not a
bug. It means the repair exists but no review has looked at it, and a fix can introduce a
worse defect than the one it removed. Moving it to `closed` takes another `audit` pass, run
with fresh context so that the review is not the same reading that produced the repair.

Two other ways past, both on the record: you can mark a finding `accepted` with your reason,
which only you may do, or a review can mark it `invalid` with evidence. Neither is a silent
drop, and both travel into the archive.

## Closing it out

`complete` runs the full verify command, then refuses to continue if any step is unticked or
any P0 or P1 is unresolved. Then it archives the spec, ticks the item in
`religion/build-plan.md`, resets `religion/context/current-work.md` to its stub, and makes
one commit.

The archive keeps the spec as it stood, plus what actually happened. The item walked here
carries an `## Outcome` section, a `### What went wrong on the way`, a `### Deferred`, and:

```text
## Landed

**Base:** 1df050c97526121d9023e9d3099e8e4513134e2d
**Commits:** f2cde22cef8acc22206b46529a67e3b798baa617
**Product paths:** src/skills/setup/SKILL.md, src/skills/setup/reference/drafted-plans.md,
evals/routing/setup.json, evals/routing/discovery.json, docs/architecture/state-model.md
```

Full identifiers, never abbreviated. That block is what makes a later reversal possible:
without it, working out which commits belong to an item means guessing from messages and
dates, and guessing wrong reverses somebody else's work.

Merging and pushing are asked for separately, and agreeing to one is never agreeing to the
other.

## What it actually costs

Honestly: a spec you have to read before anything is built, and a diff you have to read per
step. On a small change that is more ceremony than the change deserves.

So do not use it for those. `fix` writes a short spec for an unplanned bug and skips the
build plan entirely. `debug` isolates a cause without changing anything. And you can simply
describe what you want and have it built directly, with the same conventions applied,
because they are loaded every session either way.

The loop is for work you would regret not being able to review, and for work that has to
survive a conversation ending in the middle of it.

## What to read next

- [Getting started](getting-started.md) if you have not installed yet
- [What to do when doctor complains](doctor.md) when something is wrong
