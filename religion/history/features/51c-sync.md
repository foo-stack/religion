# Sync

**Type:** Feature
**From build plan:** item 51c
**Status:** verified
**Approved:** 2026-11-26, 7a754379aa3b531e

## Goal

`religion sync <file>` says how this machine's state and another machine's bundle have moved
apart since they last exchanged, without changing anything. For every file it reports whether
it changed here, changed there, changed on both, or exists on only one side, so a person knows
before importing or exporting which way the work should flow, and what would conflict.

## In scope

- `compareState(root, bundle)` in a new `lib/sync.ts`. It validates the bundle exactly as
  import does, then gives each file one state from this machine's copy, the bundle's copy, and
  the exchange base.
- Moving import's bundle validation into one shared function that both import and sync call, so
  the two can never disagree about which bundles are acceptable.
- Sharing export's file listing, so sync sees this machine's files exactly as an export would.
- `religion sync <file>`: a report grouped by state, ending with the next step that fits. It is
  read-only, exiting 0 when it reports and 1 when the bundle is refused.
- The surface record, the stability table, the help text and the package readme.

## Out of scope

- Merging, or choosing a side. Sync reports, and the person decides. The plan line says it
  "never merges".
- Finding the newest bundle on its own. Like import, it takes the path the sync client shows,
  since the bundle's location depends on the client.
- JSON output. Add `--json` when a script needs it.
- Watching for changes, or running on a schedule.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - shared validation and listing** - import's checks (readable zip, manifest,
  manifest and entries agree, hashes, repository, committed state) move into
  `readBundle(root, bundle)` in `lib/import.ts`, which `planImport` then calls. Export's file
  walk is exported as `stateFiles(root)`. *Done when:* every existing import and export test
  passes unchanged, and `planImport` contains no validation of its own.
- [x] **Step 2 - comparing the two sides** - `compareState` gives each file under `religion/`,
  except `.state/`, on either side one of these states:
  - `same`: identical on both sides
  - `here`: changed here since the exchange
  - `there`: changed in the bundle since the exchange
  - `both`: changed on both sides since the exchange, and different
  - `only-here`: present only on this machine
  - `only-there`: present only in the bundle
  - `differs`: different, with no exchange base to say which side moved

  *Done when:* a test on temporary projects, after a real export and import between them, makes
  one edit of each kind and finds each state on the file it was made to. A second test without
  a base finds `differs`, and a refused bundle gives import's reason.
- [x] **Step 3 - the command** - `sync` joins the grammar taking the bundle file, as `import`
  does, with only the help flags. It prints each non-`same` file under its state's heading and
  the count of `same` ones, then one closing line:
  - nothing changed: "in step"
  - only `there` and `only-there`: import
  - only `here` and `only-here`: export
  - anything `both` or `differs`: resolve those by hand first
  - changes on each side, but to different files: resolve by hand, since import would refuse and export would leave the other machine behind

  The surface record, the stability table, the help text and the readme name it. *Done when:*
  `npm test` passes, the args tests cover `sync` with and without a file, and a scratch run
  between two projects prints each state and the right closing line, with both projects' files
  identical before and after.

## Files and areas

- `packages/create-religion/lib/import.ts`, `export.ts`, and their tests
- New: `packages/create-religion/lib/sync.ts`, `sync.test.ts`
- `packages/create-religion/lib/args.ts`, `args.test.ts`, `packages/create-religion/bin/religion.ts`
- `packages/create-religion/surface.json`, `docs/stability.md`, `packages/create-religion/README.md`

## Data and contracts

- **The `sync` command** (load-bearing: public within 1.x): `sync <file>`, the bundle as its
  one argument, and the project found from the current directory. Only the help flags. Exit 0
  when it reports, whatever it finds. Exit 1 when the bundle is unreadable or refused. Exit 2
  on a usage error. It writes nothing, `.state/` included.
- **The sync states** (load-bearing: a later `--json` would expose them): `same`, `here`,
  `there`, `both`, `only-here`, `only-there`, `differs`.
- **`readBundle`** returns the manifest and entries, or import's refusal reason, unchanged.

## Testing

`npm test` is the Verify command, and the test gate is on.

- Step 1 is a behaviour-preserving move, so the existing import and export tests are its proof.
- Step 2 is logic, and ships its tests on temporary projects that exchange through real bundles.
- Step 3 is the command surface: the args tests, the surface check, and a scratch run whose
  output is shown, with both projects hashed before and after to prove nothing was written.

## Notes for the agent

- Shipped code may not import `child_process` or `zlib`. Reuse `classify`'s base semantics: a
  path missing from the base was not part of the last exchange.
- Sync is read-only: it must not write the exchange base or anything else.

## Amendments

- 2026-11-26 - Step 3's closing line gains a fifth case: changes on each side, to different files. Import refuses that (the bundle's copy of a file changed here is a conflict), so the four cases first written would have recommended an import that fails.

## Findings

None raised or closed with this item.

## Landed

**Base:** f2de156cfd5856122f5fa40e4d9aca0c17933180
**Commits:** 27b6a2d1a2aa157dea0bdd34d0717411dcd23208
**Product paths:** docs/stability.md, packages/create-religion/README.md, packages/create-religion/bin/religion.ts, packages/create-religion/lib/args.test.ts, packages/create-religion/lib/args.ts, packages/create-religion/lib/export.ts, packages/create-religion/lib/import.ts, packages/create-religion/lib/sync.test.ts, packages/create-religion/lib/sync.ts, packages/create-religion/surface.json
