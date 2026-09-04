# AI Interaction

> How the agent works with you on this project. Yours to tune: the skills point here for
> communication and formatting, so a change made here applies everywhere.

## Communication

- Be concise and direct. Lead with the answer, then the supporting detail.
- Explain non-obvious decisions briefly. Skip the obvious ones.
- Ask before a large refactor or an architectural change.
- Do not add capabilities that are not in the current work item.
- Never delete files without asking.

## Output formatting

Format every response for fast scanning, in whatever renders it.

- **Real markdown, not walls of prose.** Bold labels, short lines, a blank line between
  blocks.
- **Enumerations are lists.** A sequence of steps, options, or findings is a list, never
  an inline "(1)... (2)... (3)" run buried in a paragraph.
- **Tables for matrices.** Comparing things across the same fields goes in a table.
- **Backticks for code things:** identifiers, paths, commands, filenames.
- **Do not over-format.** No deep bullet nests or decorative headers on a two-line reply.

## The loop

The spec for the work in progress lives in `religion/context/current-work.md`.

1. **Spec.** Run `feature` with no argument to spec the first unchecked item in the
   build plan, or name one. Add ` preview` to see what it involves without writing
   anything. For a bug or small change that is not in the plan, run `fix`. Review
   the spec before any code exists.
2. **Implement.** Run `implement`. It builds one step at a time, never the whole
   item at once.
3. **Review.** Each step shows a diff, not whole files, with a short summary: what the
   step delivered, one line per changed file on why, and its stated outcome shown true.
4. **Verify.** If the entry file declares a `Verify` command, that exact command is the
   automated gate. Otherwise the build runs, plus the test command when one is declared. A
   step that adds logic ships a passing test when the test gate is on.
5. **Iterate.** If it does not work, revise and re-test before moving on. Do not pile the
   next step on a broken one.
6. **Prove it.** Run `check` for an outside proof pass against the running app.
7. **Review the code.** Run `audit` for a read-only quality pass. Findings go to the
   ledger with durable identifiers; repairs happen through `implement`.
8. **Complete.** Run `complete`. It runs the final safety pass, archives the spec
   under `religion/history/`, checks the item off the build plan, resets the active spec,
   and makes the work commit. It ends with a manual walkthrough of what landed.
9. **Deploy, when it is time.** Run `release` after a completed item or a milestone
   for provider config, environment review, and a smoke-test path.

The skills are the structured path, not a requirement. You can describe a feature, fix, or
change directly at any time, and it is built the same way: small steps, a diff you approve,
these conventions. Use the skills when you want the repeatable loop and the written
history; ask directly when you just want something done.

## Resuming

Progress lives in files, not in the conversation. The active spec holds each step checked
off as it lands, and git holds the code. A fresh session loads the spec through the project
entry file, so `implement` continues from the first unchecked step. There is no
separate save or load.

If you are unsure where things stand, run `status`. If you are unsure whether the
setup is healthy, run `doctor`. Both are read-only.

## When stuck

- If something is not working after two or three attempts, stop and explain the problem.
- Do not keep trying variations of the same fix.
- Ask when the requirements are genuinely unclear, and only then.

## Automated runs

`auto` exists only as an explicit opt-in. Do not suggest it as the default next
action. When invoked it runs without pausing after each passing step, within the bounds in
`religion/config.json`. Its invocation grants the routine actions listed in the Authority
section of the project entry file, and grants nothing beyond them.

## Reviewing generated code

Review it periodically, especially for authorization checks and input validation,
performance traps such as repeated queries, edge cases the happy path skipped, and whether
it matches the patterns already in the codebase.
