# A handoff that tells the whole story

**Type:** Feature
**From build plan:** item 18
**Status:** verified

## Goal

The handoff written at the end of each turn also says when the overview is stale, how many
notes are waiting in the inbox, which findings are unverified, and when a recorded run is
blocked with the command that resumes it. Those are the things that change what a fresh
session should do first, and today the handoff leaves them out.

## In scope

- `src/hooks/write-handoff.mjs`: four more lines of state, each shown only when it applies.
- The overview's staleness computed exactly as `overview` and `status` compute it: the first
  16 hex characters of the SHA-256 of the project plan followed by the build plan.
- A blocked run reported by its command and resume command only, each held to the rule
  `status` applies: a lowercase skill name, and a resume command that invokes that skill with
  plain words. No free text from `run.json` reaches the handoff.
- Tests in `scripts/hooks.test.ts`, and a minor changeset.

## Out of scope

- The inbox notes themselves: the handoff gives their count, and `fix` and `feature` read them.
- Reading the installed skills to confirm a run's command, which `status` does and a hook that
  runs every turn should not.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - the four lines** - `write-handoff.mjs`. *Done when:* tests running the hook
  in a temporary project show the stale overview named, the inbox counted, unverified
  findings listed, a blocked run shown with its resume command, a run whose fields fail the
  rule shown with neither, and none of the four when nothing applies.
- [x] **Step 2 - the shipped copy and the release note** - the hook staged into the package
  template by `npm run build`, and a minor changeset. This repository's own `.claude/hooks/`
  is ignored installer output, so it is not part of the change. *Done when:* the template's
  copy matches the source, and `npm test` exits 0.
- [x] Repair F-153 and F-154 - unverified findings by identifier only, blocking titles cleaned, shortened and capped, and the inbox counted as `status` counts it.

## Files and areas

- `src/hooks/write-handoff.mjs`, staged into the package template by the build
- `scripts/hooks.test.ts`
- `.changeset/`

## Data and contracts

- None new. The hook reads `project-plan.md`, `build-plan.md`, `context/project-overview.md`,
  `context/inbox.md`, `context/findings.md` and `.state/run.json`, and writes only
  `context/handoff.md`, as before.

## Testing

- `npm test` is declared, so the gate is on. The hook's new parsing is logic and gets tests
  that run the real hook, as the existing hook tests do.

## Notes for the agent

- `handoff.md` is imported into every session, so it is always-loaded context: anything copied
  into it from another file is text the next agent treats as trusted. Copy nothing free-form
  from `run.json`, and keep finding titles to what the ledger already puts in front of the
  agent.
- The hook is copied into projects as a standalone file and cannot import from the package.
- Losing the handoff costs nothing; failing a turn because of it costs a lot. Every new read
  must fail quietly.

## Evidence

Checked 2026-10-21 at a906265, tree clean.

- **Step 1 - the four lines** - pass: `scripts/hooks.test.ts` runs the real hook; the stale overview, inbox count, unverified identifiers and blocked run with its resume command each appear, a run failing the rule shows no resume command, and nothing extra appears when nothing applies.
- **Step 2 - the shipped copy and the release note** - pass: `npm run build` staged the hook and `diff -q` found the template copy identical; `npm test` exited 0 with 164 unit tests.

## Outcome

The handoff written at the end of each turn now also says when the overview is stale (by the
same hash `overview` stamps and `status` compares), how many notes wait in the inbox (counted as
`status` counts them), which findings are unverified (by identifier and severity only), and
when a recorded run is blocked, with the command that resumes it. Every session loads this
file, so nothing free-form reaches it from the activity record, and the blocking titles it
already copied from the ledger are now cleaned of control, format and markup characters, cut to
120 characters and capped at five.

### What went wrong on the way

**The first version copied unverified titles verbatim into always-loaded context.** The audit
showed bidi and escape characters, an unclosed comment and a 3,000-entry ledger all reaching the
handoff; unconfirmed findings now appear by identifier only.

**The spec assumed the build renders hook copies into this repository**; it stages them into
the package template, and `.claude/hooks/` here is ignored installer output.

### Deferred

- **F-153 and F-154**, repaired and `fixed`, waiting for a review.
- **This repository's own `.claude/hooks/write-handoff.mjs`**, an ignored local copy, still
  runs the previous version until it is refreshed by an install or by hand.
