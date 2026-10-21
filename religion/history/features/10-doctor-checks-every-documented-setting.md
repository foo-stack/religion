# Doctor checks every documented setting

**Type:** Feature
**From build plan:** item 10
**Status:** verified

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
- [x] **Step 2 - doctor and the surface record read it** - `lib/doctor.ts` and
  `scripts/surface-current.ts`, and the example in `docs/doctor.md`. *Done when:* `doctor`
  on a config with `"auto.maxRepairAttempts": 11` fails naming the key, and
  `npm run verify` passes with `surface.json` unchanged.
- [x] **Step 3 - verification reads it** - the configuration check in `scripts/verify.ts`.
  *Done when:* the check passes on this repository, and fails when a schema key's row in
  the reference loses one of its values (shown by a scratch edit, then reverted).
- [x] **Step 4 - the release note** - a minor changeset. *Done when:* `npm test` passes in
  full.
- [x] Repair F-140 and F-141 - the reference's cells and the shipped defaults compared with the schema, and prefixes git refuses refused.

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

## Outcome

`religion doctor` checks every setting in the configuration reference with its type: the
enumerated ones as before, plus booleans, branch prefixes (lowercase, ending in `/`, and
nothing git would refuse), bounded integers, `auto.maxItems` as a positive integer or `null`,
and the schema version. A failure names the key, the value and what it accepts; keys the
reference does not name are still ignored. The rules live in `lib/settings.ts`, from which
`doctor` reads them and the surface record is built unchanged, and the verification suite
renders each row of the reference from the schema and compares it cell by cell, compares
every default with the shipped configuration, and flags a row with no schema entry.

Evidence behind it: `npm test` green at the final commit (every verification check, 129 unit
tests, 178 routing cases); `religion doctor` on a project with `auto.maxRepairAttempts: 11`
failing with `auto.maxRepairAttempts is 11, expected an integer from 0 through 10`;
`surface.json` unchanged; two scratch edits proving the verification check fails, one
dropping `squash` from the reference and one changing a range and two defaults in the
schema; and an audit that ran the new check against every configuration this repository has
ever shipped and the 1.0.0 fixture, all passing.

### What went wrong on the way

**The first verification check proved less than the spec claimed.** It confirmed each row
existed and named every enum value, and nothing else, so a changed range or default passed.
The audit showed it by planting four drifts that all passed; the check now compares every
cell. The schema's `default` field had no reader until then.

**The prefix rule was looser than git's**, accepting `a..b/` and `x.lock/`.

### Deferred

- **Keys the reference does not name**, still ignored, so notes of a project's own in the
  file never fail the check.
- **F-140 and F-141**, repaired and `fixed`, waiting for a review.

## Landed

**Base:** 07875bc03c1beddfe91874f30cef9709f16692d9
**Commits:** 3a7652bb1417585db4970e4dfcbfa9b7e7743c95, 245f4ef3458ebbf9097d2f2d8b13af8a7aa2f5bd, 6d26e400128318aad86dadba8c6083c01de99f5b, 135f781e5a72e5783490271a4a671875cd95a044, a49c1708cd64d371397bbbd22283494fe1ee1a95, a2332f4d97c4f2f58be12fe71840b9f7d60fbe8a
**Product paths:** .changeset/doctor-settings-schema.md, docs/doctor.md, packages/create-religion/lib/doctor.ts, packages/create-religion/lib/settings.test.ts, packages/create-religion/lib/settings.ts, scripts/verify.ts
