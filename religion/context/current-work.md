# Documentation checked against the public surface

**Type:** Feature
**From build plan:** item 11
**Status:** in progress

## Goal

A verification check fails when the documentation names a command, a flag or an exit code
that the public surface record does not have, or carries a relative link or anchor that
leads nowhere. The docs describe a 1.x promise, and today nothing holds them to it.

## In scope

- The exit codes as one table in code, which the help text renders and the surface record
  carries, so the record has exit codes to check against.
- `scripts/docs.ts`: what each document in `docs/`, the root readme and the package readme
  gets wrong, checking invocations in inline code and shell blocks, exit codes named in
  prose, and relative links with their anchors.
- The check in `scripts/verify.ts`, and repairs to any document it catches.

## Out of scope

- External links, which would need the network the suite never uses.
- Output blocks (`text` fences), which show what the tool prints, including the errors it
  gives for the very mistakes this check looks for.
- Skill files, which name invocations in the token vocabulary and have their own check.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - exit codes as a table** - `EXIT_CODES` in `lib/args.ts`, rendered by the
  help text, read by `scripts/surface-current.ts`, recorded in `surface.json`, and named by
  the stability statement check. *Done when:* `religion help` prints byte-for-byte what it
  printed before, and `npm run verify` passes with `exitCodes` in the record.
- [x] **Step 2 - the documentation check** - `docsProblems` in `scripts/docs.ts`, with
  `scripts/docs.test.ts`. *Done when:* unit tests show an unknown command, a flag the
  command lacks, an unrecorded exit code, a missing file and a missing anchor each reported
  with its file and line, and an output block, an external link and a valid link ignored.
- [ ] **Step 3 - into the suite, and the docs it catches** - the check in
  `scripts/verify.ts`, and any repair it calls for. *Done when:* `npm test` passes, and a
  scratch edit adding `religion status --verbose` to a doc fails the check, then is
  reverted.

## Files and areas

- `packages/create-religion/lib/args.ts`, `bin/religion.ts`
- `packages/create-religion/surface.json`, `scripts/surface-current.ts`, `scripts/promises.ts`
- `scripts/docs.ts`, `scripts/docs.test.ts`, `scripts/verify.ts`
- `docs/**/*.md`, `README.md`, `packages/create-religion/README.md`, where they need repair

## Data and contracts

**Load-bearing**, because the record is the public surface: `surface.json` gains
`"exitCodes": [0, 1, 2]`, and removing one later is a breaking change the surface check
reports.

An invocation is `religion`, `create-religion` or `create-religion@<version>`, with or
without `npx`, then words up to a `#`, `|`, `&&` or the end of the code. The first word is
the command when it is one; a first word that is a flag, or nothing at all, means
`install`; any other first word is reported as unknown, except a path-like word after
`install` or nothing, which is `install [dir]`. Every later word starting with `-` must be
one of that command's recorded flags.

An exit code is named by "exits N", "exit code N" or "exit N" in prose. Anchors follow
GitHub's heading slugs: lowercase, punctuation other than `-` and spaces removed, spaces as
`-`.

## Testing

- `npm test` is declared, so the gate is on. `docsProblems` is a parser and validator and
  gets unit tests over fixture text.
- The help text is held byte-for-byte by comparing its output before and after.

## Notes for the agent

- The suite reads, never fetches: the network check would fail on a fetch, and should.
- `scripts/**/*.test.ts` already runs under `npm test`.
- No changeset: nothing the package ships changes behaviour, and the help text is identical.
