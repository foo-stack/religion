# Export

**Type:** Feature
**From build plan:** item 51a
**Status:** verified
**Approved:** 2026-11-26, 309877889101a78d

## Goal

`religion export` packs the state a project keeps out of git into one zip at
`religion/.state/export/religion-bundle.zip`, inside the project. Pointing a sync client such as
Google Drive for desktop at that folder carries the state to another machine, with no network
code in Religion and nothing written outside the project. This is the first of three
sub-items: import will unpack the bundle and sync will report divergence, both working from what
export records here.

## In scope

- `religion export [directory]`, which works only when the state directory is ignored by git
  (the "local" choice in `setup`). A project with committed state is refused, because git
  already carries it.
- The bundle: every plain file under `religion/` except `.state/`, stored uncompressed in a zip,
  plus a `religion-bundle.json` entry with a hash per file, the repository's origin URL, and when
  and where the bundle was made.
- Writing it through a temporary file in the same folder and a rename, so a sync client never
  uploads half a file, and replacing the previous bundle.
- `.state/exchange.json`, recording the hashes of what was exported.
- `--dry-run`, which lists what would be bundled and writes nothing.
- The surface record, the stability statement's command table, the help text and the package
  readme.

## Out of scope

- `religion import` and every check it makes on a bundle (item 51b).
- `religion sync` and comparing machines (item 51c). This item only records the base it will
  need.
- Setting up the sync client. Pointing Google Drive or anything else at the folder is the user's
  own step, which the help text and readme describe.
- Compression. Shipped code may not import `zlib`, and state is small text.
- Projects where only part of `religion/` is ignored, or where it is ignored somewhere other
  than `.gitignore`. Shipped code may not run git, and parsing ignore rules or the index is not
  worth it for layouts `setup` never produces. So export follows doctor's existing
  all-or-nothing `.gitignore` check.
- Keeping older bundles. Each export replaces the last; the hashes inside are what import and
  sync compare.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - a zip writer** - `lib/bundle.ts` builds a zip from a list of path and content
  pairs: stored entries, a hand-written CRC-32, local headers, a central directory and the end
  record. It refuses any entry path other than `religion-bundle.json` that does not start
  `religion/`, contains a `..` segment, starts with `/`, or uses `\`. *Done when:* a test writes
  a zip of three entries, including a nested path and an empty file, and `unzip -t` reports no
  errors while `unzip -p` returns each entry's exact bytes. A second test shows each bad path
  refused.
- [x] **Step 2 - what goes in the bundle** - `lib/export.ts` `planExport(root)` refuses when
  the state directory is not ignored, lists every plain file under it except `.state/`, reports
  a link or other non-plain file as skipped, hashes each file with the existing `hash`, gives every path `/` separators whatever the
  platform, and reads
  the origin URL from the repository's config without running git. *Done when:* tests on
  temporary projects show `.state/` (the bundle folder included) and a symbolic link left out,
  the link reported, a project with committed state refused, an empty state directory refused,
  and a repository with no origin giving `null`. (with 1)
- [x] **Step 3 - the command and its dry run** - `export` joins the grammar with `--dry-run`.
  `religion export --dry-run` prints the files it would bundle, anything skipped, and the bundle
  path, then writes nothing. The surface record, the command table in `docs/stability.md`, the
  help text and the package readme name it. The readme says to point a sync client at the
  folder. *Done when:* `npm test` passes, the args tests cover `export` and refuse `--yes` and
  `--json` on it, and a dry run on a scratch project prints the file list and leaves the project
  byte for byte unchanged.
- [x] **Step 4 - writing the bundle** - without `--dry-run`, the command creates
  `.state/export/` when needed and writes the zip to a temporary file created exclusively there, named with a leading dot and
  a random suffix so sync clients that skip hidden files leave it alone.
  It renames that file over `religion-bundle.zip`, then records `.state/exchange.json`. On any
  failure it removes the temporary file and leaves the previous bundle as it was. *Done when:* an
  export from a scratch project produces a bundle that `unzip -t` accepts, whose
  `religion-bundle.json` hashes match the project's files and whose entries all start
  `religion/`. `exchange.json` records those hashes. A second export after editing one file
  replaces the bundle with that file's new hash. A run against a project with committed state
  exits 1 and writes nothing.

## Files and areas

- New: `packages/create-religion/lib/bundle.ts`, `export.ts`, each with its `*.test.ts`
- `packages/create-religion/lib/args.ts`, `args.test.ts`, `packages/create-religion/bin/religion.ts`
- `packages/create-religion/surface.json`, `docs/stability.md`, `packages/create-religion/README.md`

## Data and contracts

- **The bundle path** (load-bearing: users point a sync client at it):
  `religion/.state/export/religion-bundle.zip`.
- **`religion-bundle.json`** (load-bearing: import and sync read it), at the zip's root:
  `schemaVersion` (1), `createdAt` (ISO 8601), `host` (the machine's hostname),
  `repository` (origin URL or `null`), `files` (an object from each path, relative to the
  project root and starting `religion/`, to its `hash`: SHA-256 cut to its first 16 hex
  characters, as the install manifest uses).
- **Bundle entries** (load-bearing): apart from `religion-bundle.json`, every path starts
  `religion/`, uses `/` separators, and never contains a `..` segment or starts with `/`. Export
  never writes anything else, and import refuses anything else.
- **`.state/exchange.json`** (load-bearing: sync's base), written by the command-line tool:
  `schemaVersion` (1), `last` (`direction` `"export"`, `createdAt`, `files` as in the bundle).
- **The `export` command** (load-bearing: public within 1.x): one optional directory argument,
  `--dry-run`, and the help flags. Exit 0 on success or a dry run. Exit 1 when state is
  committed, there is nothing to export, or the write fails. Exit 2 on a usage error.

## Testing

`npm test` is the declared Verify command, and the test gate is on (`when-configured`).

- Steps 1 and 2 add logic, and each ships its test: the zip writer checked by `unzip` (test
  files may run commands, shipped code may not), and the file collection on temporary projects.
- Steps 3 and 4 are the command surface. The args tests and the surface check cover the
  grammar. A scratch-project run in the scratchpad shows what was written, checked with
  `unzip -t` and the bundle's own hashes, and a test covers the replace-and-record path.

## Notes for the agent

- Shipped code may import only what `scripts/promises.ts` allows: no `child_process`, no
  `zlib`. Use `os.hostname()` for `host`.
- Reuse `hash`, `isPlainFile`, `findProjectRoot`, `statePath`, and the `.gitignore` test from
  `doctor.ts`, rather than writing new ones. Move that check somewhere shared only if both
  callers need it.
- Read the git config through the same `.git` and `commondir` resolution `state.ts` uses, so a
  linked worktree finds its repository's origin.
- Nothing is written outside the project, so the promise in `docs/stability.md` stays as it is.

## Amendments

- 2026-11-26 - Step 4 names the temporary file with a random suffix instead of the process id. The check that holds the no-network promise allows only a fixed set of `process` members, and `pid` is not one of them, while `node:crypto` is already allowed.

## Findings

None raised or closed with this item.

## Landed

**Base:** 39b756fc438b43d449b00140d441c3e8fa4b239a
**Commits:** 34d79cbd0829a9baede07cef695ab29bec44ea98, 8daffe0c5dc69db87a9dbd3e33dbcab6dec24121
**Product paths:** docs/stability.md, packages/create-religion/README.md, packages/create-religion/bin/religion.ts, packages/create-religion/lib/args.test.ts, packages/create-religion/lib/args.ts, packages/create-religion/lib/bundle.test.ts, packages/create-religion/lib/bundle.ts, packages/create-religion/lib/doctor.ts, packages/create-religion/lib/export.test.ts, packages/create-religion/lib/export.ts, packages/create-religion/lib/paths.ts, packages/create-religion/lib/state.ts, packages/create-religion/surface.json
