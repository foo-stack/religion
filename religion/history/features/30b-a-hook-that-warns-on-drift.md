# A hook that warns on drift

**Type:** Feature
**From build plan:** item 30b
**Approved:** 2026-10-21, 03045a36fa324214
**Status:** verified

## Goal

A fourth Claude Code hook asks before an edit to a file the active spec does not name, so work
that wanders outside its spec stops for a person to decide instead of drifting unseen. It
backs `implement`'s rule to build only what the spec says, and points at an amendment when the
spec, not the edit, is what needs to change.

## In scope

- `src/hooks/warn-on-drift.mjs`, a PreToolUse hook on `Edit`, `Write` and `MultiEdit`, active
  only while a spec is in progress. It allows an edit to a file named in backticks in the current
  step or in the spec's Files and areas, or under the state directory, `.changeset/` or a rendered
  skill tree; anything else gets an `ask` naming the file and the two ways forward.
- Wired in the settings template, in `doctor`'s `HOOKS`, and so in `uninstall`, with the docs
  that count the hooks.
- Tests running the real hook, and a minor changeset.

## Out of scope

- Blocking: the hook asks, and a person decides. Bash commands, which no file-path hook sees.
- Edits outside the project, which are not this hook's concern.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - the hook** - `src/hooks/warn-on-drift.mjs`, with tests in
  `scripts/hooks.test.ts`. *Done when:* tests running the hook show it silent with no spec in
  progress, silent for a file the current step or Files and areas names (a named directory
  covering what is inside it), silent for state files and changesets, asking for an unnamed file
  with its path in the reason, and silent on a payload it cannot read.
- [x] **Step 2 - wired in** - `src/state/.state/settings-template.json`, `HOOKS` in
  `lib/doctor.ts`, the tests that count hooks, `docs/doctor.md`, `docs/upgrading.md` and
  `docs/architecture/enforcement.md`, and a minor changeset. *Done when:* the verify check that
  holds `HOOKS` to the template passes with four, `doctor` reports all four wired on a fresh
  install, and `npm test` exits 0.
- [x] Repair F-159 - the split made linear, names read as specs write them, bare basenames held to the root, sub-steps kept with their step, and notebooks covered.

## Files and areas

- `src/hooks/warn-on-drift.mjs`, `scripts/hooks.test.ts`
- `src/state/.state/settings-template.json`, `packages/create-religion/lib/doctor.ts`,
  `packages/create-religion/lib/doctor.test.ts`, `packages/create-religion/lib/uninstall.test.ts`
- `docs/doctor.md`, `docs/upgrading.md`, `docs/architecture/enforcement.md`
- `.changeset/`

## Data and contracts

- A new public hook in the settings template; adding one is a minor change, and `update` does not
  rewire existing settings, which `doctor`'s hooks check already reports.
- The hook reads `religion/context/current-work.md` only, and writes nothing.

## Testing

- `npm test` is declared, so the gate is on. Deciding whether a path is named is logic, tested by
  running the hook as the existing hook tests do.

## Notes for the agent

- A hook that cannot read its input stays silent here, unlike the rendered-output guard: it
  advises, and failing a turn over advice costs more than missing one warning.
- This repository's own `.claude/settings.json` is the user's, and is not changed.
- The path in the reason is the agent's own requested path, printed as plain text.

## Evidence

Checked 2026-10-21 at 057d6e4, tree clean.

- **Step 1 - the hook** - pass: `scripts/hooks.test.ts` runs the real hook: silent with no spec, silent for named files, named directories, state and changesets, asking with the path for anything else, silent on unreadable input, and quick on a 200,000-line spec.
- **Step 2 - wired in** - pass: a fresh install has `warn-on-drift.mjs` and `religion doctor` reports `hooks: all 4 wired`; the verify check holding `HOOKS` to the template passed with four; `npm test` exited 0 with 183 unit tests.

## Amendments

- 2026-10-21 - Step 2 also changes `lib/uninstall.test.ts` - its fixture settings were built one hook per event, so a second PreToolUse hook overwrote the first; the doctor tests had the same shape.
- 2026-10-21 - Added the repair step for F-159, and the hook's matcher gains NotebookEdit - the audit found notebook edits skipped the check.

## Outcome

A fourth Claude Code hook, `warn-on-drift.mjs`, runs before Edit, Write, MultiEdit and
NotebookEdit. While a spec is active it answers `ask` for a file that neither the current step
(with its sub-steps) nor the spec's Files and areas names, saying to amend the spec if the work
needs the file. Names match as specs write them: a path, a path shorthand, a directory for what is
inside it, a line suffix dropped, a bare name only at the root. The workflow's own state,
changesets and rendered trees are always allowed. It never blocks, fails silently, and new
installs wire it, so `doctor` expects four hooks and `uninstall` removes four.

### What went wrong on the way

**On macOS every path looked outside the project**, because the temp directory reached the hook
under `/var` and its working directory resolved to `/private/var`; the first allow tests passed for
the wrong reason. The hook now compares real paths.

**Test fixtures built one hook per event**, so a second PreToolUse hook silently replaced the first;
`uninstall`'s tests, which the spec did not name, were amended in.

**The audit found the step split quadratic** and six smaller cases where it nagged or missed.

### Deferred

- **Wave partner steps**, allowed only once parallel steps are in use.
- **F-159**, repaired and `fixed`, waiting for a review.
- **This repository's `.claude/settings.json`**, which is the user's and does not wire the new hook.
