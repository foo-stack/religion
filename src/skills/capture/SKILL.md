---
name: capture
summary: note something for later without breaking the one thing in progress
description: "Write a one-line note into {{state}}/context/inbox.md and carry on, so noticing something worth doing does not cost the work item in progress. Takes the note as an argument, records it dated with where it came from, and stops. It never specs, never plans, and never starts work: {{cmd:fix}} and {{cmd:feature}} read the inbox when choosing what to build next. Use when the user runs {{cmd}}, says to note, park, remember or jot something down, mentions something worth doing later or some other time, or spots a problem mid-build that is not the thing being built."
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
---

# capture - note it, keep building

This exists because of a rule elsewhere: one work item at a time. That rule is what makes a
cleared context cheap, and it is also what makes noticing something mid-build awkward, since
there is nowhere to put it. Without an answer, a good observation either derails the work or
is lost.

The answer is a line in a file and no ceremony at all.

## Input

The note, as an argument:

    {{cmd}} "the rate limiter drops the first request after an idle period"

With no argument, ask what to note. Do not guess from the conversation, and do not sweep up
everything recently mentioned: a note nobody chose is a note nobody wants.

## What it does

Append one line to `{{state}}/context/inbox.md` with the date and, when there is one, the file
or area it concerns. Then stop, and return to whatever was happening.

That is the whole skill. It is deliberately small: anything more, and using it costs more
attention than the thought was worth, which is the failure mode that makes people stop
noting things.

## What it does not do

- **It does not spec.** A note is not a work item. {{cmd:fix}} turns one into a spec when you
  decide to.
- **It does not start work**, touch the active spec, or tick anything.
- **It does not record code defects found by review.** Those are findings, they carry
  severities and block completion, and {{cmd:audit}} owns them. A note is something you
  thought of; a finding is something a review proved.
- **It does not judge.** Write down what was said. Triage happens when the note is read, not
  when it is written.

## How a note leaves the inbox

{{cmd:fix}} and {{cmd:feature}} read the inbox when they start, and offer what is in it
alongside the build plan. Choosing one specs it and removes the line; that is the only way a
note leaves, other than you deleting it.

An inbox nobody reads is a list of things nobody did, so the reading is the point rather
than the writing.

## Rules

- One line per note. If it needs a paragraph, it needs a spec, and that is {{cmd:fix}}.
- Never interrupt the work in progress to discuss the note.
- Never write to the findings ledger.
- Never let the inbox become a plan. The build plan is the plan.

## Formatting

Match the conventions in `{{state}}/context/ai-interaction.md`: concise, scannable markdown,
lists for enumerations and tables for matrices rather than dense paragraphs.
