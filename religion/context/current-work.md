# Update shows what changed

**Type:** Feature
**From build plan:** item 14
**Status:** in progress

## Goal

`religion update`, run on a project an older version installed, says what changed between
that version and this one: each release in between, newest first, with the first sentence of
each change, and where the full changelog is. The changelog ships in the package so the tool
can read it without the network.

## In scope

- `CHANGELOG.md` in the package's `files`.
- `changesSince(changelog, from, to)` in a new `lib/changelog.ts`, parsing the Changesets
  format: `## x.y.z` releases, `### ... Changes` groups, `- <sha>: text` entries.
- `update` printing it before the plan, on a real run and on `--dry-run`, only when the
  installed version is older than this one.
- A paragraph in `docs/upgrading.md`, and a minor changeset.

## Out of scope

- `install`, which has no earlier version to compare with.
- Fetching release notes, which would break the no-network promise.
- Printing whole entries, which run to paragraphs; the full file is named instead.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - read the changelog** - `lib/changelog.ts` and its tests. *Done when:* unit
  tests show the releases after `from` up to and including `to` returned newest first, each
  entry's first sentence with its commit prefix removed, nothing for an equal or newer
  installed version or an unparseable one, and an empty or missing changelog read as
  nothing.
- [x] **Step 2 - update prints it, and the package ships it** - `bin/religion.ts`,
  `package.json`'s `files`, and `docs/upgrading.md`. *Done when:* `religion update --dry-run`
  on a temporary project whose manifest says `1.0.0` prints the 1.1.0 and 1.2.0 changes, one
  whose manifest says this version prints none, and `npm test` exits 0.
- [x] **Step 3 - the release note** - a minor changeset. *Done when:* `npm test` exits 0.

## Files and areas

- `packages/create-religion/lib/changelog.ts`, a new `lib/changelog.test.ts`
- `packages/create-religion/bin/religion.ts`, `packages/create-religion/package.json`
- `docs/upgrading.md`
- `.changeset/`

## Data and contracts

```ts
changesSince(changelog: string | null, from: unknown, to: string): { version: string; changes: string[] }[]
```

Versions compare as `major.minor.patch`; anything that does not parse, on either side, gives
an empty list rather than a guess. The printed block is plain text, not part of any JSON
output, so no recorded shape changes.

## Testing

- `npm test` is declared, so the gate is on. `changesSince` is a parser and gets unit tests.
- The printing is verified by running the real command against temporary projects.

## Notes for the agent

- `lib/install.ts` already parses versions for `manifestRefusal`; reuse its comparison rather
  than writing a second one.
- The changelog is written by Changesets in the release pull request; its format is the
  contract, and a release without the file still updates normally.
