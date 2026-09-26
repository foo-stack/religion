# Update keeps its promises

**Type:** Feature
**From build plan:** item 4b
**Status:** in progress

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
- [ ] **Step 6 - a changeset** - add `.changeset/update-keeps-its-promises.md` as a minor
  bump naming the rebuild, removals, the refusal, and the corrected messages. *Done when:*
  the changeset exists, names all four, and `npm test` passes.

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
