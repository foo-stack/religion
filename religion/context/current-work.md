# Compatibility guards

**Type:** Feature
**From build plan:** item 4c
**Status:** verified

## Goal

A stability promise is only as good as whatever notices when it is broken. Today nothing
does: a skill could be renamed, a flag dropped, a config value retired, a field removed from
`status --json`, or an upgrade from the published release broken, and `npm test` would pass.
The only protection is a reviewer spotting it in a diff.

When this is done, the public surface is written down in one record, and the verification
suite fails when the code and that record disagree. A removal or rename fails as a breaking
change; an addition fails until it is recorded, so every change to the surface shows up as a
reviewable edit to the record. A second check installs the real last published release into
a scratch project, edits it the way `setup` would, updates it with the current code, and
fails if the upgrade loses the user's work or leaves the project in a broken state.

## In scope

- The command grammar exported as one table that `parseArgs` is driven by
- A record of the public surface: commands and their flags, skill names, adapters and the
  paths they install, configuration keys and their allowed values, and the shapes of
  `status --json` and `doctor --json`
- A verification check comparing the current surface with that record
- The last published release's package, committed as a fixture, and a verification check
  that upgrades a project it installed
- A script that refreshes the fixture after a release, and a section in the release notes
  on changing the surface deliberately

## Out of scope

- **The stability statement itself**, and what counts as breaking in words. Item 4d writes
  it from this record.
- **Exit codes, state file formats, and the manifest shape as recorded entries.** Exit codes
  are pinned by the command-line tests, the manifest by the upgrade check. Recording the
  markdown formats the tool parses is a larger job the statement can scope first.
- **Running the checks on Windows**, or adding a CI platform.
- **Updating the stale check counts** in `CLAUDE.md`, `AGENTS.md` and `README.md`. The
  statement rewrites those claims.
- **Every other open finding**, except F-06 and F-13, which the grammar table removes by
  construction.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - the grammar as one table** - `lib/args.ts` exports `GRAMMAR`, the flags each
  command accepts, built from a single flag table that `parseArgs` also dispatches on, so a
  flag cannot be listed without its effect (F-06). A repeated adapter flag is recorded once
  (F-13). Behaviour is otherwise unchanged. Add a patch changeset for the duplicate fix.
  *Done when:* every existing args test passes unchanged, new tests pin `GRAMMAR` for every
  command and a repeated `--claude`, and `npm test` passes.
- [x] **Step 2 - comparing a surface with its record** - a pure `compareSurface(record,
  current)` and `shapeProblems(value, shape)` in `scripts/surface.ts`. The comparison names
  each removed or changed entry as breaking and each new one as unrecorded. The shape
  language covers strings, numbers, booleans, null, unions, objects with exactly their
  keys, arrays of one shape, and records with any keys. Tests beside it, with the unit test
  command widened to include `scripts/`. *Done when:* tests cover a removal, a rename, an
  addition, a narrowed value list, an unchanged surface, and each shape kind matching and
  failing, including an extra key and a missing one.
- [x] **Step 3 - the record, and a check against it** - `packages/create-religion/surface.json`
  records commands and flags, skills, adapters with their trees and entry files, and
  configuration keys with their allowed values or type. A verification check computes the
  current surface from the code (`GRAMMAR`, `PLANNED_SKILLS`, `ADAPTERS`, the shipped
  configuration and doctor's allowed values) and compares. *Done when:* the check passes on
  the current code, and removing a skill, dropping a flag, or adding a config value each
  makes it fail with a message naming what changed, shown by temporary edits that are then
  reverted.
- [x] **Step 4 - the JSON shapes** - the record gains the shapes of `status --json` and
  `doctor --json`, and the check runs both against a scratch project it builds with an
  active item, several findings and a failing doctor check, so nullable and array fields
  are exercised. *Done when:* the check passes, and removing a field from `Status` or
  adding one to the doctor report each makes it fail, shown by temporary edits.
- [x] **Step 5 - an upgrade from the last release** - commit the published tarball as
  `packages/create-religion/fixtures/create-religion-<version>.tgz`, named by a
  `lastRelease` field in the record. A verification check extracts it, runs that release's
  own installer into a scratch project, fills in the entry files' Commands and the plans as
  `setup` would, then runs the current `update --yes`. It fails unless the update exits 0,
  every entry file has each section once with the edits kept, the plans are byte-identical,
  the manifest carries the current version, and a second update leaves every file
  byte-identical. *Done when:* the check
  passes, and it fails when the rebuild is temporarily disabled, reproducing the
  duplication this guards against.
- [x] **Step 6 - changing the surface on purpose** - `scripts/capture-release.ts`, run as
  `npm run capture:release -- <version>`, replaces the fixture with that published tarball
  and updates `lastRelease`. A section in `docs/architecture/releasing.md` says what each check failure means, how to record an
  addition, that a removal belongs in a major release, and that the fixture is refreshed
  after every publish with that command. *Done when:* running the capture for `0.5.0`
  reproduces the committed fixture byte for byte, the section exists, every command it names
  exists in `package.json`, and `npm test` passes.
- [x] **Repair F-51 - the upgrade check proves the update did something** - after the
  update, every managed file matches the current template, each entry file has every
  template heading exactly once with the edits kept, doctor's required-files, adapters and
  entry-file checks pass, and setup's edits to the coding standards and configuration
  survive. Folded in on the same lines: the fixture is pinned to the registry integrity
  recorded as `lastReleaseIntegrity` and refused on a mismatch (F-53), setup's full edits
  (F-55), a minimal environment and a timeout (F-57), a validated version (F-58), a capture
  script that records the integrity from `npm pack --json` (F-59), and problems returned
  rather than thrown (F-60). *Done when:* the check passes, fails when the update is made a
  no-op, and fails on a fixture whose bytes differ from the recorded integrity, each shown
  by a temporary break.
- [x] **Repair F-52 - skills derived from what is authored** - the surface's skill names
  come from the skill sources, not the planned roster. *Done when:* moving a skill's source
  aside fails the check as breaking, shown by a temporary move.

## Files and areas

- `packages/create-religion/lib/args.ts` and `lib/args.test.ts` - the grammar table
- `scripts/surface.ts` and `scripts/surface.test.ts` - new: comparison and shapes
- `scripts/verify.ts` - two new checks
- `packages/create-religion/surface.json` - new: the record
- `packages/create-religion/fixtures/` - new: the last release's tarball
- `scripts/capture-release.ts` - new: refreshes the fixture
- `package.json` - the unit test glob, and a script for the capture
- `packages/create-religion/lib/doctor.ts` - exports its allowed values
- `docs/architecture/releasing.md` - the new section
- `.changeset/` - a patch changeset for the repeated adapter flag

## Data and contracts

- **`surface.json` is load-bearing**: item 4d writes the stability statement from it, and
  every later change to the public surface is an edit to it. Shape:
  `{ lastRelease, lastReleaseIntegrity, commands: { [command]: flags[] }, skills: [], adapters: { [id]: { trees,
  entry } }, config: { [key]: values[] | "boolean" | "number" | "string" | "null" }, json:
  { status: shape, doctor: shape } }`.
- **The comparison rule**: the current surface must equal the record, with lists compared
  as sets so order never matters. Anything in the record
  that is missing or narrowed is reported as breaking; anything current that is not in the
  record is reported as unrecorded. Both fail the check.
- **The shape language**: `"string"`, `"number"`, `"boolean"`, `"null"`; names joined by
  `|`, such as `"string|null"`, are a union; `{ key: shape }` is an object with exactly those keys; `[shape]` is an
  array whose every element matches; `{ "*": shape }` is an object with any keys whose
  every value matches.
- **The fixture is the published tarball, byte for byte.** It is never edited; a new release
  replaces it.

## Testing

The gate is on: the entry file declares `Test: npm test` and `Verify: npm test`.

| Logic | Test |
| --- | --- |
| the grammar table and the repeated adapter | `lib/args.test.ts` |
| `compareSurface` and `shapeProblems` | `scripts/surface.test.ts` |

The two verification checks are proved by passing on the current code and failing on a
deliberate break:

| Step | Evidence beyond `npm test` |
| --- | --- |
| 3 | a removed skill, a dropped flag and an added config value each fail the check |
| 4 | a removed `Status` field and an added doctor field each fail the check |
| 5 | disabling the rebuild makes the upgrade check fail on duplicated sections |

## Notes for the agent

- **Branch.** Cut from `feature/update-keeps-its-promises`, which is not yet merged; the
  upgrade check depends on the update fixes. Both earlier branches are held locally.
- **Running the old release executes its code.** It is this project's own published package
  with no dependencies. Run it only inside a temporary directory, with no network access
  needed.
- **The upgrade check needs the built template**, as the existing template checks already
  do. CI builds before testing; a local run needs `npm run build` first. If the template is
  missing, the check fails with that instruction rather than passing.
- **Every deliberate break is reverted.** The temporary edits in steps 3 to 5 prove the
  checks can fail; none of them is committed. Confirm the tree matches before ticking.
- **The record must describe the code as it is**, not as it should be. Where the current
  surface looks wrong, record it and leave a finding, rather than changing behaviour here.
- **Coding standards apply.** No em dashes, no plan or item numbers in anything committed.
