# CI runs doctor

**Type:** Feature
**From build plan:** item 20
**Status:** verified

## Goal

The workflow `ci` writes also runs `religion doctor`, so a broken install or a stale overview
fails the build instead of waiting for someone to notice. Today the plans can change many times
with nothing flagging that the overview no longer matches them.

## In scope

- `src/skills/ci/SKILL.md`: Step 3's workflow gains a doctor step, and Step 4 runs it locally.
- **What may fail the build:** a doctor check that fails and blocks `work` or `completion`.
  Checks that block `nothing` are printed but never fatal, because the ones that cannot hold on
  a runner are exactly those: `hooks` reads `.claude/settings.json`, which many projects do not
  commit, and `managed files` reads the install record under the uncommitted `religion/.state/`.
  The decision is made from `doctor --json`, whose `checks[].ok` and `checks[].blocks` the
  stability statement already promises.
- **Where the tool comes from:** `npx --yes create-religion@<major>`, pinned to the major
  version that installed the project, so a new major cannot change the build unannounced.
- A section in `docs/doctor.md` on running it in CI, and a minor changeset.

## Out of scope

- A new `doctor` option: the existing JSON output already carries what the decision needs.
- This repository's own workflow, which builds the tool from source.
- Making the check required on the host, a remote setting `ci` never changes.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - the step and its rule** - `src/skills/ci/SKILL.md`, rendered into both trees.
  *Done when:* the rendered skill carries the workflow step, and its filter, run locally over
  `doctor --json`, exits 0 for this healthy repository, exits 0 for a project failing only an
  advisory check, exits 1 for a stale overview, and exits 1 when doctor prints nothing.
- [x] **Step 2 - the docs and the release note** - a section in `docs/doctor.md`, and a minor
  changeset. *Done when:* `npm test` exits 0.

## Files and areas

- `src/skills/ci/SKILL.md` and its rendered copies
- `docs/doctor.md`
- `.changeset/`

## Data and contracts

- Reads the public `doctor --json` shape: `checks[]` with `name`, `ok`, `detail`, `blocks`. No
  field is added.

## Testing

- `npm test` is declared, but this changes skill prose and docs. The filter, a few lines of
  Node in the workflow, is proved by running it locally against real `doctor --json` output in
  each of the four cases.

## Notes for the agent

- A doctor that crashes prints no JSON; the filter must fail then, not pass.
- The docs check reads `docs/doctor.md`, so any invocation shown there must use recorded
  commands and options only.

## Evidence

Checked 2026-10-21 at ee85f1c, tree clean.

- **Step 1 - the step and its rule** - pass: the filter, run over real `doctor --json` output, exited 0 for this repository, 0 for a fresh install failing only `hooks`, 1 for a stale overview, 1 for an empty report; the `node -e` text extracted from the rendered `.claude/skills/ci/SKILL.md` gave 0 and 1 on the first and third.
- **Step 2 - the docs and the release note** - pass: `docs/doctor.md` has the CI section and the docs check passed it; `.changeset/ci-doctor.md` present; `npm test` exited 0 with 164 unit tests.

## Outcome

The workflow `ci` writes gains a step that runs `npx --yes create-religion@<major> doctor --json`
and fails the build for a failed check that blocks work or completion, printing each failure as an
annotation, while a failed advisory check is only a warning. The decision is read from the JSON's
`checks`, `ok` and `blocks`, already stable, not from `doctor`'s exit code, which is 1 for any
failed check. `ci` runs the step locally before it is committed, and `docs/doctor.md` explains how
a build is decided.

### What went wrong on the way

Nothing. The one design question, which checks cannot hold on a runner, was settled by the
`blocks` field the checks already carry, with no new option.

### Deferred

- **This repository's own workflow**, which builds the tool from source and does not run the
  published `doctor`.
