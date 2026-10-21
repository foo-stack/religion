# Locally modified managed files

**Type:** Feature
**From build plan:** item 9
**Status:** in progress

## Goal

`religion doctor` and the dashboard's Install panel list the managed files whose contents
no longer match the hash recorded when they were installed, and any that are gone. Someone
about to run `update` sees in advance which files it will report as changed locally.

## In scope

- One function in `lib/install.ts` that compares each managed file under a skill or hook
  tree with its recorded hash, reading only plain files at paths the manifest may name.
- A `managed files` check in `doctor`, advisory: an edit is the owner's right, not a fault.
- The edited and missing files in the dashboard's Install panel.
- A section in `docs/doctor.md`, and a minor changeset.

## Out of scope

- Entry files, which `update` merges rather than replaces, so an edit there is expected.
- Showing what changed inside a file, or offering to restore one.
- Seeded state files under `religion/`, which have no recorded hash.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - compare managed files with what was installed** - `editedSinceInstall` in
  `lib/install.ts`. *Done when:* unit tests show an edited skill listed, a deleted one listed
  as missing, an unedited one and an edited entry file left out, a symlinked file neither
  read nor listed, a manifest path outside the trees ignored, and no manifest read as null.
- [ ] **Step 2 - the doctor check** - `managed files` in `lib/doctor.ts`, built by a pure
  `managedFilesCheck`, and its section in `docs/doctor.md`. *Done when:* unit tests cover
  no install record, everything unchanged, and a long list cut short, and `religion doctor`
  on this repository prints the check.
- [ ] **Step 3 - the Install panel** - `edited` and `missing` from `readInstall` in
  `lib/dashboard.ts`, shown in the panel. *Done when:* the dashboard tests pass and a
  screenshot of the running dashboard shows the list for this repository.
- [ ] **Step 4 - the release note** - a minor changeset. *Done when:* `npm test` passes in
  full.

## Files and areas

- `packages/create-religion/lib/install.ts`, `lib/install.test.ts`
- `packages/create-religion/lib/doctor.ts`, `lib/doctor.test.ts`
- `packages/create-religion/lib/dashboard.ts`
- `docs/doctor.md`
- `.changeset/`

## Data and contracts

```ts
editedSinceInstall(target): Promise<{ edited: string[]; missing: string[]; total: number } | null>
```

`null` when there is no readable manifest. `total` counts the managed files compared;
`edited` and `missing` are sorted paths. The check's `detail` is a sentence, which
`doctor --json` already carries as a string, so no recorded shape changes.

## Testing

- `npm test` is declared, so the gate is on. The comparison and the check's wording are
  logic and get unit tests beside their source.
- The panel is interface work, verified by a screenshot of the running dashboard.

## Notes for the agent

- The manifest is a file in someone's repository: a recorded path must not be able to make
  the tool read outside the skill and hook trees, or follow a link. `retiringTree` and
  `isPlainFile` already draw that line for `update`; reuse them.
- `doctor` runs on every dashboard poll, so the comparison must stay a read and a hash per
  file, with nothing cached between calls.
