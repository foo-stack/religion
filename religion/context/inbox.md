# Inbox

> **Generated file.** Notes taken with `capture` while something else was being built.
> One line each, newest last. Not a plan, not a ledger, and not loaded into every session.

`fix` and `feature` read this when choosing what to build next and offer what is
here alongside the build plan. Choosing a note specs it and removes the line. Deleting one
yourself is the other way out, and needs no ceremony.

- 2026-10-21 - docs/architecture/state-model.md - omits `refactor` as a current-work writer, says `history/` is written by `complete` only (spike writes there too), says `complete` writes the handoff and that `status` reads `run.json`; neither is true
- 2026-10-21 - docs/architecture/enforcement.md:29 - says the third hook applies only when working on Religion itself; it is the guard, the second
- 2026-10-21 - src/skills/check, src/skills/debug - read-only but declare no `allowed-tools`, where `audit` does
- 2026-10-21 - src/skills/rollback - matches only `history/features/`, so fix and refactor archives, which carry `## Landed`, cannot be rolled back
- 2026-10-21 - religion/reference/ - its README says to delete screenshots whose work has landed, but no skill does; `complete` already clears `prototypes/`
- 2026-10-21 - src/hooks - the rendered-output guard misses edits through Bash and MultiEdit, and the injection scan never sees project source or command output
- 2026-10-21 - evals/routing - missing negatives for confusable pairs: prototype/spike, debug/spike, check/tests, check/browser-tests, audit/refactor, audit/debug, try/complete, complete/try, complete/auto, distill/capture, implement/rollback `--steps`
- 2026-10-21 - scripts/evals/routing.ts:4 - header says 22 skills; there are 26
