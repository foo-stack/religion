# Import

**Type:** Feature
**From build plan:** item 51b
**Status:** verified
**Approved:** 2026-11-26, f4483f74ff8b73e5

## Goal

`religion import <file>` takes a bundle that `religion export` wrote on another machine and
unpacks it into this project's `religion/`, so the state kept out of git arrives intact. Before
writing anything it proves the bundle is whole, made for this repository, and contains nothing
that could land outside `religion/` or in `.state/`. It also refuses to overwrite anything
changed here since the last exchange, so an import never silently discards local work.

## In scope

- A zip reader for the format export writes (stored entries only), which checks every CRC and
  size and refuses anything it does not fully understand.
- Validating the bundle: its manifest, that the manifest and the entries name the same files,
  each file's hash, every entry path, and that its `repository` matches this checkout's
  origin.
- A plan per file: create, overwrite, unchanged, or conflict (changed here since the last
  exchange). Any conflict refuses the whole import.
- `religion import <file>` with `--dry-run` and `--yes`. It shows the plan and asks before
  writing unless `--yes` is given, and declines without asking when there is no terminal, as
  `uninstall` does.
- Writing each file through a temporary file and a rename, refusing any target whose parent
  folders pass through a link, then recording the import as the new exchange base.
- A shared rule that keeps `religion/.state/` paths out of every bundle, applied by both
  export and import.
- The surface record, the stability table, the help text and the package readme, which says a
  bundle is untrusted input.

## Out of scope

- `religion sync` and its report (item 51c). Import only refuses on a conflict; it does not
  explain divergence beyond naming the conflicting files.
- Merging. A conflict stops the import, and it is the person's to resolve.
- Deleting local files the bundle does not hold. Import adds and replaces, never removes.
- Bundles from other tools, or compressed entries. Export writes stored entries only, so
  import reads only those.
- Proving who made a bundle. Hashes prove it arrived whole, not that it came from you. The
  readme says so.
- An all-or-nothing write across files. Each file is replaced atomically, but a failure halfway
  through leaves the files written so far in place and does not move the exchange base, so a
  retry reports those files as conflicts for the person to check.
- Running without an install. `findProjectRoot` needs `religion/config.json`, so a fresh clone
  runs `religion install` first, then `import`, which overwrites the seeded files after
  showing them.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - a zip reader** - `readZip(buffer)` in `lib/bundle.ts` returns the entries or a
  reason. It finds the end record, walks the central directory, and checks each local header
  against it. It refuses a split or ZIP64 archive, encryption, any method but stored, a CRC or
  size mismatch, a duplicate name, and any path `badEntryPath` refuses. `badEntryPath` also
  refuses `religion/.state/`. *Done when:* a test reads back what `writeZip` wrote, byte for
  byte. Separate tests refuse a flipped data byte (CRC), a name patched to contain a `..`
  segment, a `religion/.state/` path, a deflated entry made by the system `zip`, and a
  truncated file, each with its own reason.
- [x] **Step 2 - the import plan** - `planImport(root, bundle)` in `lib/import.ts` reads the
  zip and its `religion-bundle.json`. It refuses on a bad manifest, files named in only one of
  manifest and entries, a hash mismatch, a repository that differs from this checkout's origin
  (one present and the other missing counts as different), or committed state. It then
  classifies each file against the exchange base: `create`, `overwrite`, `unchanged`, or
  `conflict` when the local copy differs from the base. Without a base, nothing is a conflict.
  *Done when:* tests on temporary projects cover each refusal and each class. A local edit
  since the last export is a conflict, and the same file untouched since then is an overwrite.
- [x] **Step 3 - the command and its dry run** - `import` joins the grammar with `--dry-run`,
  `--yes` and `-y`, taking the bundle file as its argument; a missing file is a usage error.
  `religion import <file> --dry-run` prints the bundle's host and date and each file's class,
  then writes nothing. A conflict or a refusal exits 1. The surface record, the stability
  table, the help text and the readme name it. *Done when:* `npm test` passes, the args tests
  cover `import` with and without a file, and a dry run on a scratch project prints the plan and
  leaves the project's contents identical.
- [x] **Step 4 - writing the files** - without `--dry-run`, the command asks unless `--yes`,
  then writes each `create` and `overwrite` file through a temporary file and a rename. It
  refuses before writing anything if a target's parent folders pass through a link, or if a
  target exists and is not a plain file. It then
  records `.state/exchange.json` with `direction` `"import"` and the bundle's files. *Done
  when:* a round trip passes. Export from one scratch project, then import into a second one
  freshly seeded: every bundled file is byte-identical, and `exchange.json` names the import. A
  second import after editing one file in the second project is refused as a conflict with
  nothing written. A bundle whose target folder is a link is refused with nothing written.
- [x] Repair 51b/F-1 - Case and Unicode variants pass the .state and duplicate-name checks. *Done when:* tests refuse `religion/.STATE/x`, `religion/.state` itself, a case-only duplicate, an NFD duplicate, a file-versus-folder clash and a NUL in a name, and the auditor's crafted bundle no longer writes into `.state/`.

## Files and areas

- `packages/create-religion/lib/bundle.ts`, `bundle.test.ts`
- New: `packages/create-religion/lib/import.ts`, `import.test.ts`
- `packages/create-religion/lib/export.ts` (the shared types and paths it already exports)
- `packages/create-religion/lib/args.ts`, `args.test.ts`, `packages/create-religion/bin/religion.ts`
- `packages/create-religion/surface.json`, `docs/stability.md`, `packages/create-religion/README.md`

## Data and contracts

- **The `import` command** (load-bearing: public within 1.x): `import <file>`, where the one
  argument is the bundle, not a directory, and the project is found from the current directory.
  `--dry-run`, `--yes`, `-y`, and the help flags. Exit 0 on success, a dry run, or a declined
  prompt. Exit 1 on an unreadable or refused bundle, a conflict, or a failed write. Exit 2 on
  a usage error.
- **The file classes** (load-bearing: sync reports the same ones): `create`, `overwrite`,
  `unchanged`, `conflict`, decided by comparing the local hash, the bundle's hash, and the
  exchange base's.
- **`.state/exchange.json`** keeps the shape export gave it. `last.direction` is now `"export"`
  or `"import"`, and an import also records the bundle's `host`.
- **Bundle entry paths** additionally never start `religion/.state/`.

## Testing

`npm test` is the Verify command, and the test gate is on.

- Steps 1 and 2 are logic, and each ships its tests: the reader against `writeZip`'s output and
  against archives deliberately damaged or made by the system `zip`, and the plan on temporary
  projects.
- Steps 3 and 4 are the command surface. The args tests and the surface check cover the
  grammar, and scratch-project runs show the dry run and the round trip, with contents compared
  by hash.
- The `audit` gate is `when-sensitive`, and unpacking an archive from outside the project is a
  security boundary, so the item is audited before it completes.

## Notes for the agent

- Shipped code may not import `child_process` or `zlib`, and may use only the allowed
  `process` members. Tests may run the system `zip` and `unzip`.
- Treat the bundle as untrusted input throughout: check every offset against the buffer's
  length before reading, and decide everything before writing anything.
- Reuse `hash`, `stateIgnored`, `originUrl`, `BUNDLE_MANIFEST`, `EXCHANGE_PATH`, and the
  confirm pattern `uninstall` uses.

## Amendments

- 2026-11-26 - Added a repair step for 51b/F-1 (P1), raised by the audit gate. It also closes 51b/F-2 and 51b/F-3, which sit in the same checks and break this spec's rule that import decides everything before writing. 51b/F-4 stays open: exit 0 on a declined prompt matches `uninstall`, and changing it is the user's call.

## Findings

### 51b/F-1 [P1] closed - Case and Unicode variants pass the .state and duplicate-name checks

**File:** packages/create-religion/lib/bundle.ts:34
**Found:** 2026-11-26 by audit (scope: current; lens: security)
**Why it matters:** Both checks compare exact strings, but the default macOS filesystem matches names regardless of case and Unicode normalisation. A bundle holding `religion/.STATE/run.json` writes into the real `religion/.state/`. Two entries differing only by case or normalisation land on one file, and the exchange base records two hashes for it. Confirmed by the auditor with a crafted bundle.
**Suggested fix:** Compare names NFC-normalised and lowercased, both for the `.state` rule and for duplicates, and refuse any bundle in which two entries collide on that key. Add tests for `.STATE/`, a case-only duplicate, and an NFD duplicate.
**Resolution:** Fixed 2026-11-26, second attempt. The first, lowercasing alone, missed `.ſtate`, which APFS also folds onto `.state` (found by re-review). Names are now folded NFC, then upper case, then lower case. The first folder under `religion/` must be ASCII. And `applyImport` asks the filesystem, through `realpath`, whether any existing folder on a target's path is the real `religion/.state`. Tested with `.STATE/`, `.ſtate/`, `s.md` and `ſ.md`, case-only and NFD duplicates, and a `..` route to `.state`. The re-reviewer's probe is refused. Closed 2026-11-26 by independent re-review, which brute-forced every non-ASCII code point on APFS: only `.ſtate`, `.ﬅate` and `.ﬆate` resolve to `.state`, and each is refused.

### 51b/F-2 [P3] closed - Clashes between a bundle's own entries are found only while writing

**File:** packages/create-religion/lib/import.ts:132
**Found:** 2026-11-26 by audit (scope: current; lens: correctness)
**Why it matters:** A bundle holding both `religion/x` and `religion/x/y`, or a name with a NUL byte, passes every check and fails partway through writing. That leaves earlier files written, against the rule that import decides everything before writing anything.
**Suggested fix:** Refuse in `readZip` any entry whose path is another entry's path plus `/`, and refuse control characters in `badEntryPath`.
**Resolution:** Fixed 2026-11-26: `readZip` refuses a name that is also another entry's folder, compared with the same folding as F-1, including long-s spellings, and `badEntryPath` refuses control characters. Tested. Closed 2026-11-26 by independent re-review, which brute-forced every non-ASCII code point on APFS: only `.ſtate`, `.ﬅate` and `.ﬆate` resolve to `.state`, and each is refused.

### 51b/F-3 [P3] closed - An entry named exactly religion/.state is allowed

**File:** packages/create-religion/lib/bundle.ts:34
**Found:** 2026-11-26 by audit (scope: current; lens: security)
**Why it matters:** The rule only matches the `religion/.state/` prefix. Where `.state` does not exist yet, an import creates a plain file of that name, and every later write to the exchange or activity record fails.
**Suggested fix:** Refuse `religion/.state` itself as well, compared the same folded way as F-1.
**Resolution:** Fixed 2026-11-26: the `.state` rule matches the second path segment folded as in F-1, so `religion/.state` and `religion/.ſtate` themselves are refused. Tested. Closed 2026-11-26 by independent re-review, which brute-forced every non-ASCII code point on APFS: only `.ſtate`, `.ﬅate` and `.ﬆate` resolve to `.state`, and each is refused.

## Landed

**Base:** a2d6404df1e695cd082cda9138ff4c217737b75b
**Commits:** cc0285a5daefee699cda91b5a206195b2b03c9b7
**Product paths:** docs/stability.md, packages/create-religion/README.md, packages/create-religion/bin/religion.ts, packages/create-religion/lib/args.test.ts, packages/create-religion/lib/args.ts, packages/create-religion/lib/bundle.test.ts, packages/create-religion/lib/bundle.ts, packages/create-religion/lib/import.test.ts, packages/create-religion/lib/import.ts, packages/create-religion/surface.json
