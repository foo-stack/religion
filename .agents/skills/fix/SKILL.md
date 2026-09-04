---
name: fix
summary: spec an unplanned bug or small change, or repair a recorded finding
description: "Write a short spec for an unplanned bug or small change into religion/context/current-work.md so it runs through the same reviewed loop as planned work, then stop. Given a finding identifier instead, specs the repair of that recorded finding. Fixes are archived under religion/history/fixes/ and never touch the build plan. Use when the user runs $fix, reports a bug, asks to fix or change something that is not a planned item, or asks to pick up a finding from the ledger."
---

# fix - spec an unplanned change

Same loop as planned work, smaller spec. A fix is not a build-plan item: it is not
numbered, it ticks nothing, and it archives on its own.

## Input

- **A description** - `$fix "password reset email never sends"`. A problem stated in the
  conversation already counts; this skill does not scan the project hoping to find
  something wrong.
- **A finding identifier** - `$fix F-03` specs the repair of that ledger entry.

- **Nothing** - read `religion/context/inbox.md` and offer what is there. Those notes were
  taken mid-build precisely because they were not worth stopping for at the time, and this is
  the moment they are worth something. Specced notes leave the inbox; the rest stay.

Without any of those, ask what is wrong. Do not guess, and do not scan the project hoping to
find something.

## Step 1 - understand the problem

**For a described problem**, establish what actually happens before writing what should.
Reproduce it if you can do so cheaply. If the cause is genuinely unclear and finding it
would mean exploring, stop and point at $debug, which isolates a failure without
changing anything. Writing a fix spec against a guessed cause produces a fix for the wrong
problem.

**For a finding**, read its entry in `religion/context/findings.md`: the file and line, why
it matters, the suggested fix. The finding is the problem statement.

If something is already in progress in `religion/context/current-work.md`, say so and ask
whether to set it aside. One thing at a time is the point.

## Step 2 - write the spec

Write `religion/context/current-work.md` following the shape in
`$feature`'s spec template, marked `Type: Fix`, with no build-plan number. Keep it
short. A fix that needs a long spec is a feature that has not admitted it yet, and should
go through $feature instead.

Fill in:

- **Goal** - what is wrong, and what will be true afterwards.
- **Cause** - what actually produces the behavior, and how that was established. If the
  cause is a guess, say so; a fix built on a guess needs review to know that.
- **In and out of scope** - especially what nearby brokenness is deliberately not being
  fixed now. Fixes sprawl more easily than features because the surrounding code is already
  under suspicion.
- **Build steps** - usually one or two, each with an observable outcome.
- **Testing** - when a test runner is configured and the fix touches logic, the fix ships a
  test that fails without it. A bug that could recur silently is exactly what the test gate
  is for.

For a finding repair, name the finding identifier in the Goal so the archive and the ledger
agree about what happened.

## Step 3 - stop

Present the spec for review. This skill plans; $implement builds it.

For a finding repair, note that implementation marks the finding `fixed` and only a later
$audit moves it to `closed`.

## Rules

- A fix needs a real problem statement. Do not invent one.
- Do not fix things nobody reported while you are in there. Note them instead.
- If the fix turns out to be feature-sized, stop and say so rather than growing the spec.
- Never mark a finding `accepted` or `invalid`. Those are the user's call and a review's
  verdict.

## Formatting

Match the conventions in `religion/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
