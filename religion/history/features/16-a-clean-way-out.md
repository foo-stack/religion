# A clean way out

**Type:** Feature
**From build plan:** item 16
**Status:** verified

## Goal

`religion uninstall` takes Religion back out of a project. It removes the managed files
nobody edited, leaves and names the edited ones, takes its managed block out of the entry
file and its own hook entries out of `.claude/settings.json`, removes the install manifest,
and keeps the plans, the history and everything else under `religion/`. It shows its plan
and asks first, removes nothing without `--yes` or a yes at the prompt, and `--dry-run`
only plans.

## In scope

- `planUninstall` and `applyUninstall` in a new `lib/uninstall.ts`.
- **Managed files** under a skill or hook tree: removed when unedited, kept and named when
  edited, a link, or not a plain file. Directories left empty by a removal are removed,
  never one that still holds anything.
- **Entry files:** the managed block cut out when the markers are intact; the whole file
  removed when it is still exactly what was installed; otherwise left and named, since an
  unmarked file someone edited cannot be split safely.
- **`.claude/settings.json`:** removed when it is still the installed copy; otherwise
  Religion's three hook entries removed and the rest kept, after a backup; left and named
  when it does not parse or is reached through a link.
- `religion/.state/manifest.json` removed last, so an interrupted uninstall can be run
  again.
- The `uninstall` command with `--dry-run`, `--yes`, `-y`, `--help` and `-h`, recorded in the
  surface and named in the stability statement, with a section in `docs/upgrading.md`.
- A minor changeset.

## Out of scope

- Anything under `religion/` other than the manifest: the plans, history, findings and
  journal are the project's record, and deleting them is the user's call.
- Seeded files outside `religion/` that the manifest does not record.
- Reinstalling, which `install` already does.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - the plan** - `planUninstall(target)` in `lib/uninstall.ts`. *Done when:*
  unit tests over a project installed by `applyInstall` show unedited files planned for
  removal, an edited one and a linked one kept, an entry file with markers planned for its
  block to be cut, an unedited unmarked one for removal and an edited unmarked one kept,
  settings planned as removed, unwired or kept by the same rules, a manifest path outside
  the trees ignored, and no manifest planned as nothing to do.
- [x] **Step 2 - carrying it out** - `applyUninstall(target, plan)`. *Done when:* unit tests
  show the planned files gone, the kept ones byte-for-byte unchanged, the entry file's own
  text intact around the cut, settings keeping a user's own hook, a backup of each rewritten
  file, emptied directories removed and a non-empty one kept, `religion/` other than the
  manifest untouched, and a run through a linked state directory refused before anything
  is written.
- [x] **Step 3 - the command** - `uninstall` in `lib/args.ts`, `runUninstall` and the help
  text in `bin/religion.ts`, `surface.json`, `docs/stability.md`, and a section in
  `docs/upgrading.md`. *Done when:* on a temporary project, `religion uninstall --dry-run`
  prints the plan and changes nothing, `religion uninstall` without a terminal prints the
  plan and removes nothing, `religion uninstall --yes` removes what it planned, and
  `npm test` exits 0.
- [x] **Step 4 - the release note** - a minor changeset. *Done when:* `npm test` exits 0.
- [x] Repair F-147, F-148, F-149, F-150 and F-151 - every backup path checked for a link first, contents re-hashed before each removal, only the named directory uninstalled, backups that never collide, and an unfilled Commands placeholder cut with the block.
- [x] Repair F-152 - the backup path checked again just before the copy, and a copy that cannot be made safely kept as a file left rather than an exception.

## Files and areas

- `packages/create-religion/lib/uninstall.ts`, a new `lib/uninstall.test.ts`
- `packages/create-religion/lib/args.ts`, `lib/args.test.ts`, `bin/religion.ts`
- `packages/create-religion/surface.json`, `docs/stability.md`, `docs/upgrading.md`
- `.changeset/`

## Data and contracts

**Load-bearing**, because `uninstall` and its options join the public surface:

```ts
type UninstallAction =
  | "remove"          // a managed file, unedited
  | "keep-edited"     // a managed file whose contents changed since install
  | "keep-linked"     // reached through a link, or not a plain file
  | "cut-block"       // an entry file with intact markers
  | "keep-entry"      // an entry file that cannot be split safely
  | "unwire"          // settings with other content: Religion's hook entries removed
  | "keep-settings"   // settings that do not parse or are reached through a link
  | "remove-manifest";
interface UninstallEntry { relative: string; action: UninstallAction; why?: string }
```

Exit codes keep their meanings: 0 when it did what it planned, edited files kept included,
since keeping them is the design; 1 when something it meant to change was left, a damaged
entry file or settings it could not read; 2 for a usage error.

## Testing

- `npm test` is declared, so the gate is on. Planning and applying are logic with real files
  and get unit tests over temporary projects, built by `applyInstall` from a fixture template.
- The command is verified by running it against temporary projects.

## Notes for the agent

- The manifest is a file in the user's repository, so a recorded path must not steer a
  removal: only paths `retiringTree` accepts, through `isPlainFile`, like `update`'s own
  removals.
- Hooks are matched as `doctor` matches them, by script, so a hook the user re-pointed or
  added stays.
- No removal is ever made through a link, and the manifest and backups are refused when the
  state directory is reached through one, as `install` does.
- Never run the command against this repository itself while building it.

## Outcome

`religion uninstall [dir]` takes Religion back out of the directory it is named, never a parent
found by walking up. It shows its plan and asks, defaulting to no; `--yes` skips the
question, `--dry-run` only plans, and outside a terminal nothing is removed without `--yes`.
It removes every installed skill and hook nobody edited and any directory that leaves empty,
keeps and names edited ones, cuts only the managed block from a merged entry file (with the
Commands placeholder if nobody filled it in) or removes one still exactly as installed, takes
only Religion's hook entries out of `.claude/settings.json` or removes the installed copy, and
removes the install record last. The plans, history and the rest of `religion/` stay. Every
removal is re-hashed just before it happens, every changed file is backed up under
`religion/.state/backups/uninstall/` without replacing an earlier backup, and no path it writes
or removes is reached through a link.

Evidence behind it: `npm test` exiting 0 at the final commit (every verification check, 159
unit tests, 178 routing cases, 13 of them for uninstall over projects installed by
`applyInstall`); the real command on a temporary install, where `--dry-run` and a run without
a terminal left all 56 files and `--yes` removed 34, leaving only the edited skill and
`religion/`; one audit and one fresh-context re-review probing links at every level, races,
edits between plan and yes, subdirectories, and real merged entry files.

### What went wrong on the way

**The first version could write outside the project.** It checked the backups folder for a
link but not the path beneath it, and a copy follows a link at its destination. The audit
reproduced writes outside the project; every backup path is now checked first and again just
before the copy, which a re-review confirmed, after finding the mid-run race the first repair
left (F-152).

**It deleted an edit made while the prompt was open, and walked up to a parent project.**
Both came from treating a file that was planned as a file still safe to touch, and from reusing
the project lookup that suits reading commands. Removals are re-hashed, and uninstall takes only
the directory named.

**A shell variable holding the command did not split into words in zsh**, so the first
end-to-end run tested nothing; a function replaced it.

### Deferred

- **F-152**, repaired and `fixed`, waiting for a review.
- **Removing `religion/` itself**, which stays the user's decision.

## Findings

### 16/F-147 [P1] closed - A link inside the backups directory makes uninstall write outside the project

**File:** packages/create-religion/lib/uninstall.ts:92
**Found:** 2026-10-21 by audit (scope: current; lens: security)
**Why it matters:** Only `religion/.state/backups` itself was checked for a link, not the path under it, and the copy follows links at its destination: with `backups/.claude` linked outside, `uninstall --yes` wrote `settings.json` there, and a linked `backups/CLAUDE.md` overwrote the file it pointed at.
**Suggested fix:** Check every backup path for a link before anything is written, as `install` does.
**Resolution:** Repaired 2026-10-21: every backup path is chosen and checked for a link before anything is written, and copied with `COPYFILE_EXCL`; a linked `backups/uninstall/.claude` is refused with nothing written outside. Closed 2026-10-21 by a fresh-context re-review: links at every level under the backups were refused or skipped, and a destination planted just before the copy failed with EEXIST, the target untouched.

### 16/F-148 [P2] closed - A file edited after the plan is removed anyway

**File:** packages/create-religion/lib/uninstall.ts:101
**Found:** 2026-10-21 by audit (scope: current; lens: data loss)
**Why it matters:** Applying re-checked only that the file was still plain, not its contents, so an edit made while the prompt was open was deleted.
**Suggested fix:** Carry the expected hash in the plan and re-hash just before removing.
**Resolution:** Repaired 2026-10-21: each removal carries the hash it expects and is re-hashed just before it goes; a skill and an entry file edited after the plan are kept, tested. Closed 2026-10-21 by a fresh-context re-review: a skill, a hook, an unedited entry file and installed settings edited between plan and apply were each kept.

### 16/F-149 [P2] closed - Uninstall run from inside a project's subdirectory removes the parent project

**File:** packages/create-religion/bin/religion.ts:80
**Found:** 2026-10-21 by audit (scope: current; lens: data loss)
**Why it matters:** The project root is found by walking up, which suits reading commands but let `uninstall pb/vendor/lib --yes` uninstall `pb`.
**Suggested fix:** Uninstall only the directory named, refusing one with no `religion/config.json` of its own.
**Resolution:** Repaired 2026-10-21: `uninstallRoot` takes only the directory named, which must hold `religion/config.json`; a subdirectory of a project is refused, tested. Closed 2026-10-21 by a fresh-context re-review: a subdirectory, a linked config and a linked state directory were each refused or confined to the directory named.

### 16/F-150 [P3] closed - Uninstall overwrites install's backup of the original entry file

**File:** packages/create-religion/lib/uninstall.ts:120
**Found:** 2026-10-21 by audit (scope: current; lens: data loss)
**Why it matters:** `install` keeps the user's pre-merge entry file at `backups/CLAUDE.md`, and uninstall replaced it with the merged copy, losing the one record of the original.
**Suggested fix:** Back up under a path that never collides with an earlier backup.
**Resolution:** Repaired 2026-10-21: uninstall backs up under `backups/uninstall/`, numbering a second copy, so install's backup of the original stays; tested with both present. Closed 2026-10-21 by a fresh-context re-review: with three earlier backups present, the new one went to `CLAUDE.md.3` and the others kept their contents.

### 16/F-151 [P3] closed - Religion's Commands placeholder survives the cut

**File:** packages/create-religion/lib/uninstall.ts:132
**Found:** 2026-10-21 by audit (scope: current; lens: correctness)
**Why it matters:** On a real merged entry file the cut kept the appended Commands section with its setup-required marker and placeholders, which Religion wrote and nobody filled in.
**Suggested fix:** Drop a Commands section that still carries the setup-required marker.
**Resolution:** Repaired 2026-10-21: a Commands section still carrying the setup-required marker is cut with the block; a real `spliceEntry` merge cuts back to exactly what the user wrote. Closed 2026-10-21 by a fresh-context re-review: merges from `spliceEntry` and `rebuildEntry`, Commands filled and unfilled, CRLF included, each cut correctly.
