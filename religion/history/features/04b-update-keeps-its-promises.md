# Update keeps its promises

**Type:** Feature
**From build plan:** item 4b
**Status:** verified

## Goal

`update` is the command a stable release makes its biggest promise about, and today it
breaks four of the promises it implies.

- **It duplicates the entry file after `setup`.** A fresh install writes `CLAUDE.md` and
  `AGENTS.md` without markers. `setup` fills in their Commands section, so the next `update`
  finds a file matching neither the template nor the manifest, treats it as the user's own,
  and appends Religion's block to it. Reproduced in a scratch install: 9 sections became 16,
  with 7 of them twice. Every real install that ran `setup` hits this.
- **It never removes anything.** A file the template stopped shipping stays on disk forever
  and silently drops out of the manifest, so no skill, hook, or adapter tree can ever be
  retired, which the promise that dropping an adapter is a breaking change assumes it can.
- **It trusts any manifest.** The manifest's `version` and `schemaVersion` are written and
  never read, so an older package run against a project a newer one installed downgrades it
  without a word.
- **It says it backs up what it does not.** The merge prompt says "The originals are backed
  up either way", and `docs/getting-started.md` repeats it, but a declined merge makes no
  backup. A declined merge is then reported as "changed locally" with advice to use
  `--force`, which does not merge it either.

When this is done, an entry file Religion installed is rebuilt around the sections the user
owns rather than duplicated, files the template dropped are removed when unedited and
released when edited, a manifest from a newer version is refused before anything is
written, and every message about backups and conflicts says what actually happened.

## In scope

- Rebuilding an unmarked entry file that Religion installed, keeping every section the user
  owns or added, backing the original up first
- Removing unedited files the previous manifest recorded that the template no longer ships,
  and releasing edited ones, with removal confined to paths inside the project
- Refusing a manifest whose `schemaVersion` or `version` is newer than the running package
- Truthful messages: declined merges reported as their own category, and backup claims
  corrected in the tool and in `docs/getting-started.md`
- A changeset

## Out of scope

- **Files of an adapter that is no longer chosen.** `update --claude` over an install of all
  four keeps today's behaviour: the other trees stay on disk and leave the manifest. Removing
  them on a flag would turn an adapter choice into a deletion, which is a decision the plans
  have not made. Only files the template itself stopped shipping are removed.
- **Writing entry files with markers on a fresh install.** The rebuild makes the first
  `update` after `setup` produce a marked file, which is enough to stop the duplication.
- **Refreshing seeded files under `religion/`**, such as `context/untrusted-input.md` or
  `.state/settings-template.json`, and rewiring `.claude/settings.json`. Seeded once is a
  recorded decision. The stability statement has to say plainly that update does not touch
  them.
- **Validating the manifest's adapter list** (F-12) and **duplicate adapter flags** (F-13).
  Both are in the ledger.
- **A corrupt manifest.** It still reads as absent, as today.
- **An install with no manifest at all**, from before manifests existed. Its entry file is
  indistinguishable from one the user wrote, so it still goes through the merge prompt.
- **The published changelog.** Its 0.4.0 entry repeats the backup claim, but it is history.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - refuse a manifest from a newer version** - a pure `manifestRefusal(manifest,
  packageVersion)` in `lib/install.ts` returns a message when the manifest's `schemaVersion`
  is above 1 or its `version` is a newer release than the package, and nothing otherwise.
  `runInstall` checks it before planning and, on a refusal, prints it to stderr and exits 1
  having written nothing, dry run or not; `--force` does not override it. Add the case to the exit-code list in `--help` and
  the package readme. *Done when:* tests cover an older, equal, and newer version, a newer
  schema, a missing manifest, and an unparseable version string; and in a scratch project
  whose manifest claims `99.0.0`, both `update` and `update --dry-run` exit 1 with the
  message and leave every file byte-identical.
- [x] **Step 2 - rebuild an entry file around what the user owns** - a pure
  `rebuildEntry(existing, template)` in `lib/merge.ts`: the existing file's leading lines
  without import lines, then every section it has that is not one of the template's managed
  sections and not Commands, then the template's managed block, then the existing Commands
  section. *Done when:* tests show a setup-edited copy of the template rebuilt with one copy
  of every section, its edited title and Commands intact, the managed block current, a
  section the user added kept outside the block, and a second rebuild of the result changing
  nothing.
- [x] **Step 3 - plan and apply the rebuild** - in `planInstall`, an entry file with no
  markers that the previous manifest records, and that no longer matches that record, gets
  a new `rebuild` action instead of `merge`. `applyInstall` backs it up and writes
  `rebuildEntry`. The summary counts it. *Done when:* install tests cover the plan and the
  apply, and the scratch reproduction (install, fill in Commands, `update --yes`) ends with 9
  sections, each once, the filled-in Commands kept, a backup under
  `religion/.state/backups/`, exit 0, and a further `update` reporting the file as merged
  rather than rebuilt again.
- [x] **Step 4 - remove what the template dropped** - `planInstall` compares the previous
  manifest with the full template: a recorded path the template no longer ships is `remove`
  when it is unedited and `release` when it was edited. `applyInstall` deletes removed files
  and any directories that leaves empty, stopping at the project root, and leaves released
  files alone. A recorded path that is absolute, climbs out with `..`, or sits under
  `religion/` is never touched. The summary counts both and names released files. *Done
  when:* install tests cover removal, empty-directory cleanup, release, an already missing
  file, a path outside the project, and a dry run; and in a scratch project with a
  fabricated manifest entry for an extra skill, `update` removes it and its empty directory,
  keeps an edited one, and the manifest no longer lists either.
- [x] **Step 5 - say what actually happened** - a declined merge is reported as its own
  line, not counted with local edits and not followed by `--force` advice, and still exits
  1. The merge prompt says the originals are backed up before merging; the backup line says
  where. `docs/getting-started.md` is corrected, with any quoted output re-captured from a
  real run. *Done when:* a scratch run of each case, accepting a merge, declining one, and
  leaving a local edit, prints messages that match what happened on disk, and every line
  `docs/getting-started.md` quotes appears verbatim in a captured run.
- [x] **Step 6 - a changeset** - add `.changeset/update-keeps-its-promises.md` as a minor
  bump naming the rebuild, removals, the refusal, and the corrected messages. *Done when:*
  the changeset exists, names all four, and `npm test` passes.
- [x] **Repair F-14, F-16, F-17 - removal confined to Religion's trees and plain paths** -
  only a recorded path under a skill or hook tree, by exact case, with no backslash, no
  `..`, and no symbolic link in any component, is ever removed; the path and hash are
  checked again immediately before deleting; pruning stops at the tree. This also closes
  F-18, F-19 and F-31, which sit on the same lines. *Done when:* tests reproduce each
  reported vector (a symlinked parent, `RELIGION/...`, `.git/HEAD`, `package.json`, a
  backslash key, an edit between planning and applying, a manifest without `managed`) and
  each is refused, and a scratch run of the symlink vector leaves the outside file intact.
- [x] **Repair F-15 - rebuild only a plain, genuinely recorded file, never backing up
  through a link** - a rebuild needs a well-formed recorded hash and an entry file with no
  symbolic link in its path, otherwise it is a conflict; any run that would back something
  up refuses before writing anything when the backup path passes through a link. One
  backup helper and one exported location replace the five copies (F-23). *Done when:*
  tests refuse a symlinked entry file, a forged `true` record, and a symlinked backups
  directory with nothing written, and the two reported scratch vectors leave the outside
  files intact.
- [x] **Repair F-36, F-39, F-40 - no write follows a symbolic link** - every path install and
  update write to, whether a shipped file, a seeded file, an entry file being merged,
  remerged or rebuilt, the manifest, or `.claude/settings.json`, is refused when any
  component of it is a link, dangling or not. Such files get a `linked` action that is never
  written, not even with `--force`, are reported on their own, keep their manifest record,
  and exit 1. The check runs again just before each write, and the manifest's path is
  checked before anything is written. This also closes F-41, F-43 and F-44, which the same
  check covers. *Done when:* tests reproduce each vector the re-review ran (a linked and a
  dangling manifest, a dangling shipped skill and seeded file, a linked entry file under
  merge, remerge and `--force`, a linked `.claude`, and a dangling `settings.json` with an
  attacker template) and each leaves the outside path untouched; and the same vectors run
  through the CLI in a scratch project do too.

## Files and areas

- `packages/create-religion/lib/install.ts` and `lib/install.test.ts` - the refusal, the
  `rebuild`, `remove` and `release` actions
- `packages/create-religion/lib/merge.ts` and `lib/merge.test.ts` - `rebuildEntry`
- `packages/create-religion/bin/religion.ts` - wiring, summary lines, messages
- `packages/create-religion/README.md` - the exit-code row
- `docs/getting-started.md` - the backup claim
- `.changeset/update-keeps-its-promises.md` - new

## Data and contracts

- **The manifest shape does not change.** `{ schemaVersion: 1, version, adapters, managed }`
  is **load-bearing**: this item starts reading `schemaVersion` and `version`, which makes
  them the fields a later release must keep writing.
- **Version comparison** takes `major.minor.patch` numerically and ignores anything after a
  hyphen. A version it cannot parse never causes a refusal.
- **What counts as Religion's file:** an entry file the previous manifest records. A file it
  does not record is the user's and still goes through the merge prompt.
- **What counts as dropped:** a path recorded in the previous manifest that appears nowhere
  in the template, for any adapter. Not the same as a path outside the chosen adapters.
- **Exit codes** keep the contract fixed by the command-line work: a refusal and a declined
  merge are reported failures and exit 1; removals and releases are not failures.
- `PlanEntry` actions and `applyInstall`'s result are internal and may grow.

## Testing

The gate is on: the entry file declares `Test: npm test` and `Verify: npm test`.

| Logic | Test |
| --- | --- |
| `manifestRefusal` and the version comparison | `lib/install.test.ts` |
| `rebuildEntry` | `lib/merge.test.ts` |
| the `rebuild`, `remove` and `release` plans and their application | `lib/install.test.ts`, with real files under the temp directory as the existing tests do |

Messages and `docs/getting-started.md` are proved by scratch runs, not unit tests.

| Step | Evidence beyond `npm test` |
| --- | --- |
| 1 | `update` against a manifest claiming `99.0.0`, with file hashes compared before and after |
| 3 | the duplication reproduction, run again, ending with one copy of each section |
| 4 | a fabricated dropped skill removed with its directory, an edited one released |
| 5 | each message case run, and every quoted line matched against captured output |

## Notes for the agent

- **Branch.** This builds on the command-line work, which is committed but not yet merged,
  so the branch is cut from `feature/cli-surface-fit-to-freeze` rather than from `main`.
  When that pull request merges, this branch needs rebasing onto `main`, which is the
  user's call.
- **Removal is the one destructive path.** Guard it before building it: nothing outside the
  project, nothing under `religion/`, nothing edited. The manifest is a file in someone's
  repository and must not be able to steer a deletion. Test the guard with a hostile entry.
- **Deletion in this item is the tool's behaviour, not the agent's action.** Every run that
  exercises it happens in the session scratchpad, never against this repository.
- **The rebuild loses edits inside Religion's own sections.** That is why it backs up first,
  and why the summary says where the backup is. Do not try to preserve them by diffing.
- **Keep the existing tests green unchanged.** The merge, remerge, conflict and force
  behaviours they pin are not being redesigned.
- **Coding standards apply.** No em dashes, no plan or item numbers in anything committed.

## Outcome

`update` now keeps the promises it implies. An entry file `setup` edited is backed up and
rebuilt around its owner's sections instead of duplicated; files the template stopped
shipping are removed when unedited and released when edited, only from Religion's own skill
and hook folders; a manifest from a newer version or format is refused before anything is
written; nothing is written through a symbolic link; and every message about backups,
merges and conflicts says what happened, with `docs/getting-started.md` quoting captured
output.

Evidence behind it: `npm test` green (ten checks, 71 unit tests, 158 routing cases); every
step's outcome observed through the compiled or source CLI in scratch projects, including
the duplication reproduction ending with nine sections each once; a four-lens audit; and
two fresh-context adversarial re-reviews, the second enumerating every write the tool makes
and finding none that a link can route outside the project.

### What went wrong on the way

**The removal guard was lexical, and the audit broke it four ways.** It checked the text of
a recorded path, not what the path resolved to, so a committed manifest could delete files
outside the project through a symlinked directory, reach state files through `RELIGION/` on
a case-insensitive disk, and delete `.git/HEAD` or `package.json`. The rebuild could be
triggered by any truthy manifest value and wrote through links. All four were repaired by
confining removal to Religion's trees, by exact case, with no link in any component, checked
again just before deleting.

**The re-review then found the older write paths were worse.** Hook wiring followed a
dangling `.claude/settings.json` and wrote the project's own template text wherever it
pointed; merge, remerge, create, update, `--force` and the manifest write all followed links.
None came from this work, but they broke the promise that nothing is written outside the
repository, so the item was widened, with approval, to refuse every write through a link.

**One repair claimed more than it did.** The first fix for a manifest without a `managed`
field covered only the dropped-file planning; the re-review showed the entry-file path still
crashed. It stays open (F-31).

**The previous completion wrote an unrendered stub.** Resetting the active spec after the
command-line work copied the source template, leaving `{{cmd:...}}` tokens in place. Caught
while writing this spec and fixed on that branch. Nothing checks the project's own state
files for unrendered tokens.

### Deferred

- **F-46, the one open P2 on the security boundary:** hook wiring still reads its template
  through a link, so a hostile repository can have an outside file's contents copied into
  `.claude/settings.json`.
- **Open findings, none blocking:** F-02 to F-13 from the command-line work, and F-20 to F-35,
  F-42, F-45 and F-47 to F-50 from this one: documentation that still says update never
  overwrites an edited file, duplicated or thin tests, a renamed section surviving a
  rebuild, a user's own import lines dropped by a rebuild, and smaller cleanups. Five leads
  stay `unverified`.
- **Files of an adapter no longer chosen**, refreshing seeded files under `religion/`, and
  rewiring existing settings stay out of scope by design. The stability statement has to
  say plainly that update does not touch them.
- **Windows** was never run.

## Findings

### 4b/F-14 [P0] closed - Removal follows a symlinked parent out of the project

**File:** packages/create-religion/lib/install.ts:146
**Found:** 2026-09-26 by audit (scope: current; lens: security, tests)
**Why it matters:** `planDropped` only `lstat`s the last path component and `isInsideProject` is lexical, so with `.claude/skills/evil` committed as a symlink to a directory elsewhere, a manifest entry hashing a file there gets it deleted, and `pruneEmptyParents` removes its emptied parents outside the project. Reproduced: `update --yes` exited 0 and the outside file and directory were gone.
**Suggested fix:** Refuse any recorded path with a symlink in any component, and re-check before deleting.
**Resolution:** Repaired 2026-09-26: a removal candidate must be a plain file with no symbolic link in any component (`isPlainFile`), and pruning stops at the tree. The symlinked-parent vector is refused by a test and by a CLI run that left the outside file intact.  Re-reviewed 2026-09-26 in a fresh-context adversarial pass over the whole of `lib/install.ts` on a case-insensitive APFS scratch disk: symlinked skill directory, `.claude/skills` and `.claude` as links, and the file itself as a link all removed nothing; a parent swapped to a link between planning and applying was released. Closed.

### 4b/F-15 [P0] closed - A rebuild writes through symlinks, and a forged record skips the merge prompt

**File:** packages/create-religion/lib/install.ts:119
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** Any truthy manifest value for `CLAUDE.md` turns the consented `merge` into an unprompted `rebuild`, whose write follows a symlinked entry file and whose backup follows a symlinked `religion/.state/backups`. Reproduced non-interactively: a file outside the project was rewritten, and a file under a fake home `.claude/` was overwritten with attacker text.
**Suggested fix:** Rebuild only for a well-formed recorded hash and a plain file, and refuse to back up through a symlinked directory before writing anything.
**Resolution:** Repaired 2026-09-26: a rebuild needs a 16-hex-digit recorded hash and an entry file with no symbolic link in its path (`rebuildOrConflict`), re-checked at apply; otherwise it is a conflict. Any run that would back something up refuses before writing anything when the path to the backup passes through a link (`refuseLinkedBackups`). Both reported vectors refused by tests and by CLI runs that left the outside files intact.  Re-reviewed 2026-09-26 in a fresh-context adversarial pass over the whole of `lib/install.ts` on a case-insensitive APFS scratch disk: the recorded vectors (a `true` record with a linked `CLAUDE.md`, a forged well-formed hash with `--yes`, and links at `backups`, `backups/CLAUDE.md`, `religion/.state`, `religion` and a nested backups subdirectory) were each refused before anything was written. Closed as scoped: writing through a linked entry file by merge, remerge or `--force` is tracked as F-36 and F-40.

### 4b/F-16 [P1] closed - A case variant of the state directory passes the removal guard

**File:** packages/create-religion/lib/install.ts:55
**Found:** 2026-09-26 by audit (scope: current; lens: security, tests)
**Why it matters:** `isManaged` compares `religion/` case-sensitively, so on the default macOS filesystem `Religion/config.json` or `RELIGION/context/findings.md` passes and deletes the real state file. Reproduced for both.
**Suggested fix:** Only consider paths under a known adapter tree, compared by exact case.
**Resolution:** Repaired 2026-09-26: only paths under a skill or hook tree, compared by exact case, can be retired (`retiringTree`), so `RELIGION/` and `Religion/` never qualify. Refused by a test and by a CLI run on a case-insensitive disk.  Re-reviewed 2026-09-26 in a fresh-context adversarial pass over the whole of `lib/install.ts` on a case-insensitive APFS scratch disk: `RELIGION/`, `Religion/`, `.CLAUDE/` and `.claude/Skills/` keys were all refused and every target survived. Closed; a case variant below the tree prefix is F-45.

### 4b/F-17 [P1] closed - The manifest can remove any project file with predictable content

**File:** packages/create-religion/lib/install.ts:145
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** Removal candidates are any manifest key, so a committed manifest listing `.git/HEAD` or `package.json` with their current hashes deletes them. Reproduced: `git status` then failed with `not a git repository`.
**Suggested fix:** Only retire paths under a known adapter tree, and stop pruning at that tree.
**Resolution:** Repaired 2026-09-26: the same tree allowlist excludes `.git/`, `package.json` and entry files. Refused by a test and by a CLI run after which `git` still worked.  Re-reviewed 2026-09-26 in a fresh-context adversarial pass over the whole of `lib/install.ts` on a case-insensitive APFS scratch disk: `.git/HEAD`, `.GIT/HEAD`, `package.json`, entry files in either case, `religion/config.json`, `..`, `./`, `//`, backslash, absolute and tree-root keys were all refused with real hashes. Closed.

### 4b/F-18 [P2] closed - A removal is not re-checked before deleting

**File:** packages/create-religion/lib/install.ts:195
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** The decision is made at planning and the merge prompt can wait indefinitely before applying, so a file edited in between is deleted, breaking "never deletes an edited file". Reproduced through the API.
**Suggested fix:** Re-check the path and hash immediately before removing; release on a mismatch.
**Resolution:** Repaired 2026-09-26: the remove branch re-checks the path and the planned hash immediately before deleting and releases on a mismatch; tested by editing between planning and applying. Re-reviewed 2026-09-26 in a fresh-context adversarial pass over the whole of `lib/install.ts` on a case-insensitive APFS scratch disk: an edit between planning and applying, a parent swapped to a link, and forged plan entries for `package.json` and `religion/config.json` were all released. Closed.

### 4b/F-19 [P2] closed - The removal guard is wrong on Windows

**File:** packages/create-religion/lib/install.ts:158
**Found:** 2026-09-26 by audit (scope: current; lens: security, quality, tests)
**Why it matters:** `path.normalize` turns `/` into `\` on Windows, so every real key is rejected, while a backslash key such as `religion\config.json` passes. Simulated with `path.win32`; not run on Windows.
**Suggested fix:** Reject backslashes and normalise with `path.posix`.
**Resolution:** Repaired 2026-09-26: keys with a backslash are refused and paths are checked with `path.posix` and joined by segment. Covered by a backslash key in the hostile-path test; Windows itself not run. Re-reviewed 2026-09-26 in a fresh-context adversarial pass over the whole of `lib/install.ts` on a case-insensitive APFS scratch disk: a backslash key is refused and checks use `path.posix` with segment joins. Closed by construction; Windows not run.

### 4b/F-23 [P2] closed - The backup location is spelled out five times

**File:** packages/create-religion/lib/install.ts:215
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** Three identical backup blocks in `applyInstall` and two in the CLI's messages must all agree for "says where" to stay true.
**Suggested fix:** One exported constant and one backup helper.
**Resolution:** Repaired 2026-09-26: one exported `BACKUPS` location and one `backUp` helper replace the three blocks and the CLI's two copies. Re-reviewed 2026-09-26 in a fresh-context adversarial pass over the whole of `lib/install.ts` on a case-insensitive APFS scratch disk: one `BACKUPS` constant and one `backUp` helper, and the CLI uses the constant. Closed.

### 4b/F-36 [P1] closed - Older write paths follow symlinked parents

**File:** packages/create-religion/lib/install.ts:252
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** `create`, `update`, the forced conflict write and `writeManifest` also write through a symlinked `.claude` or `religion/.state`. Predates this work; not reproduced.
**Suggested fix:** Share one no-symlinked-component check with the removal guard.
**Resolution:** Repaired 2026-09-26: every template path with a symbolic link in any existing component, dangling or not, is planned as `linked` before existence is checked, re-checked immediately before each write, never written even with `--force`, reported on its own, kept in the manifest, and exits 1; the manifest path is checked before anything is written and again in `writeManifest`. Tests and CLI runs cover a linked and a dangling manifest, a dangling shipped skill and seeded file, a linked `.claude`, and `--force` through a linked entry file, each leaving the outside path untouched.  Confirmed 2026-09-26 by the re-review: a plain `update` overwrote an outside file through a linked `manifest.json`, created one through a dangling link, created outside files through a dangling shipped skill file and a dangling `religion/build-plan.md`, and `--force` wrote the template through a linked `CLAUDE.md`. Raised to P1. Re-reviewed 2026-09-26 in a fresh-context adversarial pass enumerating every write, copy, mkdir, rm and rmdir in `lib/install.ts` and `bin/religion.ts` on a case-insensitive APFS scratch disk: linked and dangling manifests, a linked `religion/.state`, dangling shipped and seeded files, a linked `.claude` under `--force`, case-variant links, and links swapped in while the merge prompt waited (tested under a pty) were all refused or released, with outside files unchanged and linked records kept. Closed.

### 4b/F-39 [P0] closed - Wiring the hooks writes attacker-chosen content outside the project

**File:** packages/create-religion/lib/install.ts:416
**Found:** 2026-09-26 by audit (scope: current; lens: security re-review of F-14 to F-19)
**Why it matters:** `wireHooks` checks `.claude/settings.json` with `stat`, which follows links, and copies the project's own `religion/.state/settings-template.json` to it. With `settings.json` a dangling link to an outside path and the template holding attacker text, a plain `update` with no flags and no terminal created the outside file with exactly that text and exited 0. Predates this work.
**Suggested fix:** Refuse a settings path with a link in any component, using the same check as removal.
**Resolution:** Repaired 2026-09-26: `wireHooks` returns `linked` and writes nothing when any component of `.claude/settings.json` is a link, dangling or not. Tested, and a CLI run with a dangling link and an attacker template created nothing outside. Re-reviewed 2026-09-26 in a fresh-context adversarial pass enumerating every write, copy, mkdir, rm and rmdir in `lib/install.ts` and `bin/religion.ts` on a case-insensitive APFS scratch disk: a dangling `.claude/settings.json` with an attacker template was left alone and nothing was created outside. Closed; reading the template through a link is F-46.

### 4b/F-40 [P1] closed - Merging and remerging write through a linked entry file

**File:** packages/create-religion/lib/install.ts:245
**Found:** 2026-09-26 by audit (scope: current; lens: security re-review of F-14 to F-19)
**Why it matters:** With `CLAUDE.md` linked to an outside file that carries Religion's markers, a plain non-interactive `update` rewrote the outside file; with no record and `--yes`, text was appended to any outside file and its contents copied into the backups directory. Predates this work.
**Suggested fix:** Treat a linked entry file as a conflict for merge and remerge too.
**Resolution:** Repaired 2026-09-26: a linked entry file is `linked` before merge, remerge or rebuild is considered, so none of them writes through it. Tested with a marked outside file under `--force --yes`, and CLI runs of the remerge and `--yes` merge vectors left the outside files unchanged. Re-reviewed 2026-09-26 in a fresh-context adversarial pass enumerating every write, copy, mkdir, rm and rmdir in `lib/install.ts` and `bin/religion.ts` on a case-insensitive APFS scratch disk: remerge through a linked marked file, merge through a linked unmarked file with `--yes` and no manifest, and `AGENTS.md` linked to `CLAUDE.md` under `--yes --force` left every target unchanged. Closed.

### 4b/F-41 [P2] closed - A linked entry file's conflict advice writes through the link

**File:** packages/create-religion/bin/religion.ts:207
**Found:** 2026-09-26 by audit (scope: current; lens: security re-review of F-14 to F-19)
**Why it matters:** A linked entry file is now a conflict, and the message advises `--force`, which writes the template through the link and copies the outside file into backups. The rebuild guard's promise to leave the file alone depends on F-36.
**Suggested fix:** Fixed with F-36, or give linked files their own message.
**Resolution:** Repaired 2026-09-26: a linked entry file is no longer a conflict, so it gets no `--force` advice; it is reported as linked with advice to replace the link. Re-reviewed 2026-09-26 in a fresh-context adversarial pass enumerating every write, copy, mkdir, rm and rmdir in `lib/install.ts` and `bin/religion.ts` on a case-insensitive APFS scratch disk: a linked entry file is reported as linked with no `--force` advice. Closed.

### 4b/F-43 [P3] closed - The backup refusal says to make a directory when the link is the file

**File:** packages/create-religion/lib/install.ts:347
**Found:** 2026-09-26 by audit (scope: current; lens: security re-review of F-14 to F-19)
**Why it matters:** A dangling link at `backups/CLAUDE.md` is refused with "Make it a real directory".
**Suggested fix:** Name what to fix by what the link is.
**Resolution:** Repaired 2026-09-26: the refusal now names the path and says to replace the link with a real directory or file. Re-reviewed 2026-09-26 in a fresh-context adversarial pass enumerating every write, copy, mkdir, rm and rmdir in `lib/install.ts` and `bin/religion.ts` on a case-insensitive APFS scratch disk: a dangling `backups/CLAUDE.md` under `--force` is refused with advice to replace the link. Closed.

### 4b/F-44 [P3] closed - A linked managed file can hang update

**File:** packages/create-religion/lib/install.ts:96
**Found:** 2026-09-26 by audit (scope: current; lens: security re-review of F-14 to F-19)
**Why it matters:** With a shipped skill file linked to `/dev/zero`, `update` read forever and had to be killed after 150 seconds. Related to F-33.
**Suggested fix:** Skip anything that is not a plain file before reading it.
**Resolution:** Repaired 2026-09-26: a linked file is classed as `linked` before it is read, so a link to `/dev/zero` exits 1 at once instead of hanging. Re-reviewed 2026-09-26 in a fresh-context adversarial pass enumerating every write, copy, mkdir, rm and rmdir in `lib/install.ts` and `bin/religion.ts` on a case-insensitive APFS scratch disk: a skill linked to `/dev/zero` exits 1 in about a second. Closed.
