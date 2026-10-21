# Verified outcomes become regression checks

**Type:** Feature
**From build plan:** item 28
**Status:** verified

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
- [x] **Step 2 - `tests` keeps them** - an `evidence` mode in the tests skill, its description,
  and a routing case. *Done when:* the rendered skill reads the Evidence section, re-runs each
  capture before writing, asserts exit status and stable output only, writes one reviewed diff
  per test, and stops without a test command; `npm test` exits 0 with the new routing case.
- [x] **Step 3 - the release note** - a minor changeset. *Done when:* `npm test` exits 0.

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

## Evidence

Checked 2026-10-21 at b4c6167, tree clean.

- **Step 1 - `check` offers** - pass: the rendered `.claude/skills/check/SKILL.md` lists passing command-line and API outcomes as candidates, offers `tests evidence` only where a test command is declared, and its rules keep the Evidence section as its only write; `npm test` exited 0.
- **Step 2 - `tests` keeps them** - pass: the rendered `.claude/skills/tests/SKILL.md` has an Evidence mode that re-runs each capture, asserts exit status and stable output, writes one reviewed diff per test and stops without a test command; the routing corpus passed with 179 cases, the new positive among them.
- **Step 3 - the release note** - pass: `.changeset/outcome-regressions.md` present; `npm test` exited 0 with 164 unit tests.

## Outcome

`check` names, in its report, each passing outcome whose evidence is a captured command or a
request and response, and offers `tests evidence` to keep them where a test command is
declared. `tests` gains an `evidence` mode: it reads the spec's Evidence section, re-runs each
capture as written, reports any that no longer behave as recorded instead of testing around
them, and writes one test per outcome asserting the exit status and the output the program
promises, each shown able to fail. The writing stays with `tests`; `check` still writes only
its record.

### What went wrong on the way

Nothing.

### Deferred

- **Repaired findings becoming tests**, which an earlier scout run suggested folding in here.

## Landed

**Base:** 87b601c557a2c111a7493442f693e09be7d801ed
**Commits:** 830156c203dc0a2456f2c7904ce9b9aef6913a36, 563713b04d5dc82b8c8574cbabb85d947871bde7, b4c6167ec75a63d8c7da7e386da1d3d446e5441f, 2da382736062d40a8133b369e7f17462fd39d53c
**Product paths:** .agents/skills/check/SKILL.md, .agents/skills/tests/SKILL.md, .changeset/outcome-regressions.md, .claude/skills/check/SKILL.md, .claude/skills/tests/SKILL.md, evals/routing/tests.json, src/skills/check/SKILL.md, src/skills/tests/SKILL.md
