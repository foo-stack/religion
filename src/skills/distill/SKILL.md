---
name: distill
summary: promote proven observations from the journal into loaded lessons
description: "Read {{state}}/learning/journal.md, promote observations that have proved stable into {{state}}/learning/lessons.md, fold corrections about this project into its coding standards, and archive what was processed. Lessons are loaded every session, so promotion is deliberately strict: an observation earns a place only once it has recurred or been confirmed. Use when the user runs {{cmd}}, asks to consolidate what has been learned, or when the journal has grown enough to be worth a pass."
---

# distill - turn observations into lessons

The journal is cheap and unfiltered: anything surprising goes in. Lessons are expensive,
because they are loaded into every session forever. This skill is the gate between them.

## What is in the journal

{{cmd:complete}} appends one entry to `{{state}}/learning/journal.md` for every item it
finishes, and it is the journal's only writer. Each entry is a `##` heading with the date
and the item's title, then its archive, what surprised, what went wrong, and what was
deferred and why. Nothing is loaded from here, so the entries can be plain.

This skill reads the journal and never edits it. What it decides is recorded in
`{{state}}/learning/journal-archive.md`, which this skill alone writes.

## Step 1 - read and group

Read the journal, skipping every entry whose heading and `Archive` line already appear in
`journal-archive.md`: those were decided on an earlier pass. Group the rest, together with
earlier entries the archive kept for later, where they are really the same observation seen
more than once.
Recurrence is the main evidence that something is a lesson rather than an incident.

## Step 2 - decide what has earned promotion

Promote an observation only when it is all of these:

- **Confirmed**, not suspected. Either seen more than once, or explicitly corrected by the
  user.
- **General**, not incidental. It will apply again, to work not yet started.
- **Actionable**. It changes what someone would do, not just what they would know.
- **Not already written down.** If it belongs in the coding standards or the project plan,
  it goes there instead, where it is already loaded and already owned.

Everything else is rejected, or kept for later until it recurs. A single surprising incident is not a
lesson; it is an incident.

## Step 3 - route by kind

Two destinations, and the distinction matters.

**About this codebase** goes to `{{state}}/context/coding-standards.md`. "Server actions in
this project take the organization identifier from the session, never from arguments" is a
convention, and conventions belong with the conventions. Propose the exact edit and wait:
the standards are the user's file.

**About how work goes here** goes to `{{state}}/learning/lessons.md`. "Schema changes in
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

## Step 5 - record what was decided

Append every entry read on this pass to `{{state}}/learning/journal-archive.md`, under its
own heading and `Archive` line, with what was decided: promoted, rejected and why, or kept
for later because it has not recurred yet. Leave the journal exactly as it is. Nothing is
lost either way: a rejected observation that recurs is exactly the evidence that promotes it
next time, and the archive is where the earlier sighting is found.

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

Match the conventions in `{{state}}/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
