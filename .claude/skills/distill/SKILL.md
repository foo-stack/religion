---
name: distill
summary: promote proven observations from the journal into loaded lessons
description: "Read religion/learning/journal.md, promote observations that have proved stable into religion/learning/lessons.md, fold corrections about this project into its coding standards, and archive what was processed. Lessons are loaded every session, so promotion is deliberately strict: an observation earns a place only once it has recurred or been confirmed. Use when the user runs /distill, asks to consolidate what has been learned, or when the journal has grown enough to be worth a pass."
---

# distill - turn observations into lessons

The journal is cheap and unfiltered: anything surprising goes in. Lessons are expensive,
because they are loaded into every session forever. This skill is the gate between them.

## What goes in the journal, and when

Any skill appends to `religion/learning/journal.md` when something is worth remembering:

- a correction from the user, especially a repeated one
- an assumption that turned out to be wrong about this project
- a failure whose cause was non-obvious
- a convention discovered in the code that no document states

One entry, dated, in a sentence or two. What happened and what it implies. Appending is
cheap and unreviewed; nothing is loaded from here.

Do not journal the ordinary. "The build passed" is not an observation.

## Step 1 - read and group

Read the journal. Group entries that are really the same observation seen more than once.
Recurrence is the main evidence that something is a lesson rather than an incident.

## Step 2 - decide what has earned promotion

Promote an observation only when it is all of these:

- **Confirmed**, not suspected. Either seen more than once, or explicitly corrected by the
  user.
- **General**, not incidental. It will apply again, to work not yet started.
- **Actionable**. It changes what someone would do, not just what they would know.
- **Not already written down.** If it belongs in the coding standards or the project plan,
  it goes there instead, where it is already loaded and already owned.

Everything else stays in the journal or is dropped. A single surprising incident is not a
lesson; it is an incident.

## Step 3 - route by kind

Two destinations, and the distinction matters.

**About this codebase** goes to `religion/context/coding-standards.md`. "Server actions in
this project take the organization identifier from the session, never from arguments" is a
convention, and conventions belong with the conventions. Propose the exact edit and wait:
the standards are the user's file.

**About how work goes here** goes to `religion/learning/lessons.md`. "Schema changes in
this project need the migration and the type change in the same step, or the typecheck
fails halfway through review" is a lesson about working, not a coding convention.

## Step 4 - write, keeping it short

Each lesson is two or three lines: what to do, and why, since a lesson without its reason
gets discarded the first time it is inconvenient.

**Keep the file short.** It is loaded every session, so every line is paid for constantly.
Before adding, look for a lesson that is now wrong, superseded, or has become obvious
because the code changed, and remove it. A lessons file that only grows becomes a file
nobody reads, which is worse than no file.

If the file is getting long, that is a finding: report it rather than adding to it.

## Step 5 - archive what was processed

Remove promoted and rejected entries from the journal, appending them to
`religion/learning/journal-archive.md` with what was decided. Nothing is deleted outright:
a rejected observation that recurs is exactly the evidence that promotes it next time.

## Step 6 - report

- entries read, grouped, promoted, and rejected, with the reason for each rejection
- lessons added, and any removed
- standards edits proposed, and whether they were approved
- whether the lessons file is getting too long

## Rules

- Promote on evidence, never on a good story. One incident is an incident.
- Codebase conventions belong in the standards. Do not duplicate them as lessons.
- Standards edits are proposed and wait. That file belongs to the user.
- Remove as readily as you add.
- Never promote something that is really a bug. That is a finding, and it belongs in the
  ledger.

## Formatting

Match the conventions in `religion/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
