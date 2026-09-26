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

## Outcome

The public surface is written down and guarded. `packages/create-religion/surface.json`
records every command and the options it accepts, the skill names, each adapter with what it
installs, every setting with its allowed values or the type of its default, and the shapes of
`status --json` and `doctor --json`. A verification check derives the same from the code and
fails on any difference: a removal as breaking, an addition as unrecorded. A second check
installs the real last release from its published tarball, pinned to the registry's
integrity, edits the project the way `setup` would, and updates it with a copy of the
current tool whose template has changed in every managed file, then asserts the whole
outcome. Option parsing now runs from one table, which the recorded grammar is read from.

Evidence behind it: `npm test` green (twelve checks, 84 unit tests, 158 routing cases);
each guard shown failing on the break it exists for, by temporary edits reverted before
committing; a three-lens audit; and two fresh-context re-reviews, the second trying some
thirty update regressions in scratch copies and finding none of the defect's kind left.

### What went wrong on the way

**The first upgrade check proved nothing.** Everything it asserted was already true before
the update ran, so a stub that only bumped the manifest's version passed. The first repair
compared files with the current template, which still detected nothing whenever the
template equalled the release, the state right after every fixture capture. The second
repair gives the update real work every time by perturbing a copy of the template, and takes
its expectations from template text rather than from the code under test, which had let two
broken mutations agree with themselves.

**The surface's skill names came from a hand-kept roster**, so a skill removed from both the
sources and the roster went unnoticed. They are now read from the sources.

**A step was committed on a red suite.** The chained command committed whatever the test
result, and the suite was red because the previous item's archive quoted template token
syntax, which the token check rightly rejects. That archive was fixed on its own branch and
carried here; from then on every commit ran only on a green suite.

**A temporary break was reverted with `git checkout`**, which also discarded an uncommitted
export from the same step. Caught at once when the suite failed; later breaks were restored
from copies.

### Deferred

- **F-69, F-71 and F-72 (P2):** a skill can still be dropped at render or pack time without
  failing the surface check; the upgrade check never changes the entry template's imports or
  sections; and the project's own `.claude/settings.json` is never checked.
- **The rest of the ledger**, none blocking: F-54, F-56 and the P3s from this item's audit
  and re-reviews, the open findings from earlier items, and F-06 and F-13, fixed here and
  awaiting a review.
- **Exit codes, state file formats and the manifest shape as recorded entries**, and whether
  the settings file and the shared state tree are promised (F-68), are for the stability
  statement to scope.

## Findings

### 4c/F-51 [P1] closed - The upgrade check passes when the update does nothing

**File:** scripts/upgrade.ts:48
**Found:** 2026-09-26 by audit (scope: current; lens: tests, quality)
**Why it matters:** Everything it asserts is already true before the update: the entry files hold their edits once, the plans are intact, and a second run matches the first. A stub that only rewrote the manifest's version passed, so a planner marking everything unchanged, skipped skill writes, or a dropped managed section would all go unnoticed.
**Suggested fix:** Require every managed file to match the current template afterwards, each template heading once in the entry files, and doctor's install checks to pass.
**Resolution:** Repaired 2026-09-26: after the update the check requires every managed file to match the current template, each template heading exactly once in both entry files with the edits kept, and doctor's required-files, configuration, adapters and entry-file checks to pass. A no-op update now fails with the stale managed files named. Re-reviewed 2026-09-26: not closed, since the check could only notice files that differed between the release and the current template, which after a capture is none. Repaired again 2026-09-26: the update now runs against a copy of the current tool whose template changes every managed file, adds a skill and retires one, and the check asserts managed files, leftovers, entry sections and imports taken from the template text, the owner's title, sections and edits, backups, every owned file (each carrying an edit), doctor checks by name, and the manifest's version and hashes. Thirteen regressions each failed it in a scratch copy, a correct update passed, and with the skill trees made identical to the release a no-op update still failed. Re-reviewed 2026-09-26 in a second fresh-context adversarial pass on a scratch copy: every regression from the first re-review failed the check, as did deleting files whose template is unchanged, skipping the added skill, keeping the retired one, keeping stale sections, and a self-consistent change to the hash; with the template made byte-identical to the release, a no-op update still failed with 57 stale files. Closed; the regressions that still pass are F-71 to F-78.

### 4c/F-52 [P1] closed - A shipped skill can be removed without failing the surface check

**File:** scripts/surface-current.ts:33
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** Skills are read from `PLANNED_SKILLS`, a hand-kept roster, and the only related check requires authored skills to be a subset of it. Removing `src/skills/try` and its routing cases passed the whole suite; so does a rename that leaves the old name listed.
**Suggested fix:** Derive skill names from the authored sources.
**Resolution:** Repaired 2026-09-26: skill names are read from the authored sources with `readSkills`, so moving `src/skills/try` aside failed the check as `breaking: skills no longer includes try`. Re-reviewed 2026-09-26 in a fresh-context adversarial pass on a scratch copy: removing, renaming or hiding the `try` skill source, or removing it from the roster or rendered trees, each failed the suite. Closed; dropping a skill at render or pack time is F-69.

### 4c/F-53 [P2] closed - The executed fixture has no integrity pin

**File:** scripts/upgrade.ts:24
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** The upgrade check runs the tarball's code in every `npm test`, including the release job, which holds OIDC and write permissions. A replaced tarball shows only as a binary diff, and nothing records or checks what npm published.
**Suggested fix:** Record the registry integrity with the version and refuse to extract a fixture that does not match it.
**Resolution:** Repaired 2026-09-26: `lastReleaseIntegrity` records the registry integrity and the check refuses to extract a fixture whose sha512 differs; a tampered fixture was refused. The release notes tell the reviewer how to confirm the recorded value. Re-reviewed 2026-09-26 in a fresh-context adversarial pass on a scratch copy: a repacked, appended-to or swapped tarball, and a missing, empty, sha1, array or padded integrity, were each refused before extraction. Closed; the integrity sits in the same reviewable file by design, and the release notes say how to confirm it.

### 4c/F-55 [P2] closed - The upgrade check makes only some of setup's edits

**File:** scripts/upgrade.ts:83
**Found:** 2026-09-26 by audit (scope: current; lens: tests)
**Why it matters:** It never edits `religion/context/coding-standards.md` or `religion/config.json`, which setup does, so an update that overwrote either would pass. Current behaviour keeps both.
**Suggested fix:** Edit and assert both.
**Resolution:** Repaired 2026-09-26: the check also edits the coding standards and the configuration and requires both unchanged after the update. Re-reviewed 2026-09-26 in a fresh-context adversarial pass on a scratch copy: overwriting the coding standards or the configuration during the update failed the check. Closed.

### 4c/F-57 [P3] closed - The old installer inherits the environment and has no timeout

**File:** scripts/upgrade.ts:95
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** The fixture runs with the full environment, including the release job's token request variables, and a hang stalls the suite.
**Suggested fix:** Pass a minimal environment and a timeout.
**Resolution:** Repaired 2026-09-26: every spawned command gets only `PATH`, a scratch `HOME` and `TMPDIR`, and a sixty-second limit. Re-reviewed 2026-09-26: the environment half held, but a fixture ignoring SIGTERM hung the suite. Repaired again 2026-09-26: the time limit now kills with SIGKILL; a process ignoring SIGTERM returned after two seconds with SIGKILL. The parent's environment remains readable through the process table, which only an isolated runner would close. Re-reviewed 2026-09-26 in a second fresh-context adversarial pass on a scratch copy: a child ignoring SIGTERM, a shell whose grandchild held the pipe, and a detached grandchild each returned at the limit with SIGKILL, and an update that never exits failed the check after sixty seconds with no orphan left. Closed.

### 4c/F-58 [P3] closed - The last release's version is used in a path unchecked

**File:** scripts/upgrade.ts:24
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** A value like `../../x` would name another tarball, which would then be run.
**Suggested fix:** Validate it as a version first.
**Resolution:** Repaired 2026-09-26: `lastRelease` must match a strict version pattern before it names a file. Re-reviewed 2026-09-26 in a fresh-context adversarial pass on a scratch copy: `../../x`, `latest`, `0.5`, padded, empty and missing values were rejected. Closed.

### 4c/F-59 [P3] closed - The capture script accepts tag-shaped versions and can delete the tarball it fetched

**File:** scripts/capture-release.ts:16
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** `\w` admits `_`, which npm reads as a tag, so the packed file can be named differently from the one kept and is then deleted.
**Suggested fix:** Take the file name and integrity from `npm pack --json` and use a strict version pattern.
**Resolution:** Repaired 2026-09-26: the capture script takes the file name, version and integrity from `npm pack --json`, refuses a mismatched version, and uses the strict pattern, which rejects tag-shaped input. Re-reviewed 2026-09-26 in a fresh-context adversarial pass on a scratch copy: thirteen malformed or tag-shaped arguments exited 2 before any npm call, and a version mismatch left the record alone. Closed; its leftovers are F-70.

### 4c/F-60 [P3] closed - The upgrade check throws instead of failing

**File:** scripts/upgrade.ts:40
**Found:** 2026-09-26 by audit (scope: current; lens: tests, quality)
**Why it matters:** Missing `tar`, an installer that writes no entry file, or a missing `tsx` throw, stopping the suite with a message that names no check.
**Suggested fix:** Return a problem line.
**Resolution:** Repaired 2026-09-26: spawn failures and any thrown error become a problem line naming the check. Re-reviewed 2026-09-26 in a fresh-context adversarial pass on a scratch copy: missing `tar`, missing `tsx` and an installer that writes nothing each produced a problem line. Closed.
