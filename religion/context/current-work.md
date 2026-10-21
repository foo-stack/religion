# A hook that warns on drift

**Type:** Feature
**From build plan:** item 30b
**Approved:** 2026-10-21, 1aaf9f1103032918
**Status:** in progress

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
- [ ] **Step 2 - wired in** - `src/state/.state/settings-template.json`, `HOOKS` in
  `lib/doctor.ts`, the tests that count hooks, `docs/doctor.md`, `docs/upgrading.md` and
  `docs/architecture/enforcement.md`, and a minor changeset. *Done when:* the verify check that
  holds `HOOKS` to the template passes with four, `doctor` reports all four wired on a fresh
  install, and `npm test` exits 0.

## Files and areas

- `src/hooks/warn-on-drift.mjs`, `scripts/hooks.test.ts`
- `src/state/.state/settings-template.json`, `packages/create-religion/lib/doctor.ts`,
  `packages/create-religion/lib/doctor.test.ts`
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
