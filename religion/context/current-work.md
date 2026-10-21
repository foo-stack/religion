# Verified outcomes become regression checks

**Type:** Feature
**From build plan:** item 28
**Status:** in progress

## Goal

When `check` proves a command-line or API outcome from captured evidence, it offers to keep
that proof as a regression test, and `tests` writes it, so the next change cannot quietly
break what was shown to work. Today the proof is recorded in the spec and then nothing
re-runs it.

## In scope

- `check` (skill): its report names the passing outcomes whose evidence is a captured command
  or request and response, and offers `tests` to keep them. It writes no test itself.
- `tests` (skill): an `evidence` mode that reads the spec's `## Evidence` section, re-runs each
  offered capture to see its current output, and writes one test per outcome in the project's
  runner, asserting the exit status and the stable parts of the output, each as its own
  reviewed diff.
- A routing case for the new mode, and a minor changeset.

## Out of scope

- Interface outcomes, which the coding standards keep out of unit tests; `check`'s browser
  evidence stays evidence.
- Projects with no declared test command: `evidence` mode stops and points at setup, as
  `backfill` does.
- Turning repaired findings into tests.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - `check` offers** - its report and rules. *Done when:* the rendered skill lists
  the passing command-line and API outcomes as candidates, offers `tests` for them only where a
  test command is declared, and still writes nothing but its Evidence section; `npm test` exits 0.
- [ ] **Step 2 - `tests` keeps them** - an `evidence` mode in the tests skill, its description,
  and a routing case. *Done when:* the rendered skill reads the Evidence section, re-runs each
  capture before writing, asserts exit status and stable output only, writes one reviewed diff
  per test, and stops without a test command; `npm test` exits 0 with the new routing case.
- [ ] **Step 3 - the release note** - a minor changeset. *Done when:* `npm test` exits 0.

## Files and areas

- `src/skills/check/SKILL.md`, `src/skills/tests/SKILL.md`, and their rendered copies
- `evals/routing/tests.json`
- `.changeset/`

## Data and contracts

- None new. `evidence` mode reads the `## Evidence` section item 17 defined.

## Testing

- `npm test` is declared, but this changes skill prose and a routing case, covered by the
  rendering, reference and routing checks.

## Notes for the agent

- The test files a project gets belong to `tests`, the skill that already writes them; `check`
  observes and records, and does not gain a second kind of write.
- A test built from output must not assert what changes between runs: timestamps, absolute
  paths, durations, ordering the program does not promise.
- A test that would pass against broken code is worse than none; `tests` already requires
  showing each one can fail.
