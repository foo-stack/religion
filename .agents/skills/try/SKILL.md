---
name: try
summary: write the human walkthrough for reviewing the work yourself
description: "Generate the manual walkthrough for the current or most recently completed work: what to start, where to go, what to click or run, what to expect, and what would count as wrong. Read-only, and written for a person rather than an agent. $complete emits one for every completed item automatically, so this is for asking again later or for work still in progress. Use when the user runs $try, asks how to see or test a change themselves, asks where to click, or wants a manual review path."
allowed-tools: Read, Grep, Glob, Bash
---

# try - the human review path

$check is the agent proving the work. This is you checking it yourself, which is a
different thing and catches different problems: the ones that are technically correct and
still wrong.

Read-only. It does not run the project unless asked to.

## Step 1 - find the work

Use `religion/context/current-work.md` when something is in progress. When it is the stub,
use the most recent archive under `religion/history/`, and say which one you are describing.

## Step 2 - write the walkthrough

Read the spec's outcomes and the project's declared commands, then write instructions a
person can follow without knowing how any of it was built.

1. **Start it.** The exact command, and where it will be listening.
2. **Get there.** The route, the screen, the command, the endpoint. Say how to reach it
   from a cold start, including any state that has to exist first, such as being signed in
   or having a record to act on.
3. **Do the thing.** What to click, type, or run.
4. **Expect this.** What should happen, concretely enough to disagree with.
5. **This would be wrong.** The specific failure worth watching for. Skipping this makes
   the whole walkthrough a confirmation exercise, because someone following instructions
   tends to see what they were told to expect.

Cover the unhappy paths too when they are quick: the empty state, the error case, what a
second attempt does.

For a rollback, say how to confirm the removed behavior is gone, and name one unaffected
path that should still work.

## Step 3 - keep it honest

State any setup that will not be obvious: seed data, environment variables, a service that
must be running, a browser signed into something.

If a step cannot be described because the work has no observable effect, say so plainly.
That is worth knowing before completion, not after.

## Rules

- Instructions for a person, never a claim that a person followed them. Generating a
  walkthrough is not evidence of review.
- Read-only. Do not start the project, change files, or run anything unless asked.
- Concrete over complete. Five steps someone will actually follow beat twenty they will not.

## Formatting

Match the conventions in `religion/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
