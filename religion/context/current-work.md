# Doctor checks every documented setting

**Type:** Feature
**From build plan:** item 10
**Status:** in progress

## Goal

`religion doctor` validates every setting in the configuration reference with its type, not
just the seven enumerated ones: booleans, branch prefixes, bounded integers, and the schema
version. The rules live in one schema that `doctor`, the surface record, and the
verification suite all read, so the reference, the shipped defaults and the check cannot
drift apart unnoticed.

## In scope

- `lib/settings.ts`: one entry per setting in `docs/architecture/config.md`, with its kind
  and what it accepts, and `settingProblems(config)`.
- `doctor`'s configuration check reads it in place of `ALLOWED`; the surface record is
  built from it and stays byte-identical.
- The verification check that every shipped key is documented also requires every shipped
  key to be in the schema, every schema key to have a row naming each allowed value, and the
  shipped configuration to pass the schema.
- `docs/doctor.md` shows a type error, and a minor changeset.

## Out of scope

- Reporting keys the reference does not name. A key Religion does not read is ignored as it
  is today; flagging it would fail installs that carry their own notes in the file.
- Defaults applied by skills, which read the reference rather than this module.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - the schema** - `lib/settings.ts` and its tests. *Done when:* unit tests
  show each kind accepting what the reference allows and refusing the rest with a message
  naming the key, the value and what would work, a missing key ignored, and a section that
  is not an object reported.
- [ ] **Step 2 - doctor and the surface record read it** - `lib/doctor.ts` and
  `scripts/surface-current.ts`, and the example in `docs/doctor.md`. *Done when:* `doctor`
  on a config with `"auto.maxRepairAttempts": 11` fails naming the key, and
  `npm run verify` passes with `surface.json` unchanged.
- [ ] **Step 3 - verification reads it** - the configuration check in `scripts/verify.ts`.
  *Done when:* the check passes on this repository, and fails when a schema key's row in
  the reference loses one of its values (shown by a scratch edit, then reverted).
- [ ] **Step 4 - the release note** - a minor changeset. *Done when:* `npm test` passes in
  full.

## Files and areas

- `packages/create-religion/lib/settings.ts`, a new `lib/settings.test.ts`
- `packages/create-religion/lib/doctor.ts`
- `scripts/surface-current.ts`, `scripts/verify.ts`
- `docs/doctor.md`
- `.changeset/`

## Data and contracts

**Load-bearing**, because item 15 reads it to explain each setting in the dashboard:

```ts
type Setting =
  | { kind: "enum"; values: readonly string[]; default: string }
  | { kind: "boolean"; default: boolean }
  | { kind: "prefix"; default: string }                  // lowercase, ending in "/"
  | { kind: "integer"; min: number; max?: number; nullable?: boolean; default: number | null };

SETTINGS: Record<string, Setting>   // keyed "section.key", plus "schemaVersion"
settingProblems(config: unknown): string[]
```

`ALLOWED` stays exported, derived from the enum entries, so nothing that imports it
changes. The surface record's `config` section is built from the same entries and must not
change: a different record would mean the public surface moved.

## Testing

- `npm test` is declared, so the gate is on. `settingProblems` is a validator and gets unit
  tests per kind.
- The verification change is proved by the scratch edit in step 3.

## Notes for the agent

- The reference table in `docs/architecture/config.md` is the source of what each setting
  accepts; the schema transcribes it and the verification check holds the two together.
- Messages follow the existing form: `git.mode is "trunkk", expected one of trunk, ...`.
