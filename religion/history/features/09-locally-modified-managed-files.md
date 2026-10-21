# Locally modified managed files

**Type:** Feature
**From build plan:** item 9
**Status:** verified

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
- [x] **Step 2 - the doctor check** - `managed files` in `lib/doctor.ts`, built by a pure
  `managedFilesCheck`, and its section in `docs/doctor.md`. *Done when:* unit tests cover
  no install record, everything unchanged, and a long list cut short, and `religion doctor`
  on this repository prints the check.
- [x] **Step 3 - the Install panel** - `edited` and `missing` from `readInstall` in
  `lib/dashboard.ts`, shown in the panel. *Done when:* the dashboard tests pass and a
  screenshot of the running dashboard shows the list for this repository.
- [x] **Step 4 - the release note** - a minor changeset. *Done when:* `npm test` passes in
  full.
- [x] Repair F-137, F-138 and F-139 - a failed read and anything not a plain file count as edited, and the dashboard compares once per poll.

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

## Outcome

`religion doctor` runs an eighth check, `managed files`, which never fails and names every
installed skill or hook that no longer matches the hash recorded at install, and any that
are gone, cutting a long list short after five. The dashboard's Install panel lists them in
full, with what `update` will do about each. A recorded path outside the skill and hook
trees is never read, a link or a directory or an unreadable file at a managed path counts as
edited rather than being followed or failing, and entry files are left out because `update`
merges them. The dashboard compares once per poll and shares the result with doctor.

Evidence behind it: `npm test` green at the final commit (every verification check, 124 unit
tests, 178 routing cases); `religion doctor` on this repository printing
`6 edited and 0 missing of 31 since install` against its 0.5.0 install record; the real
dashboard in Chrome showing the six edited skills in the Install panel and Health at 8 of 8;
one audit probing traversal, absolute and backslash paths, symlinks, FIFOs, odd `managed`
values and a 200,000-entry manifest.

### What went wrong on the way

**A check documented as never failing could crash doctor.** The read after `isPlainFile` was
unguarded, so a single unreadable skill threw through `runDoctor` and broke the dashboard.
The audit reproduced it with a mode `000` file; a failed read now counts as edited.

**The first rule let a link at a managed path read as unchanged**, and the first test locked
that in by counting the link in the total while listing it nowhere. It now counts as
edited, which is what `update` reports too.

**A test's cleanup hook ran after the fixture had already deleted the directory**, failing
on `chmod` while the assertion itself had passed.

### Deferred

- **F-137, F-138 and F-139**, repaired and `fixed`, waiting for a review.
- **What changed inside an edited file**, and restoring one, both outside this item.

## Landed

**Base:** 7e0f690aa304aeaae9dc471597fe520a8695cd25
**Commits:** 864a799c90e854a249723bb67c35b22012a1a90d, 6848ce47d9d77664b35f5c06d4e68536bc86ee8e, ed187f762521632de2326fc0ce6a592547796bd2, 1bb90fae649709833372116130b75f70e92588a9, c3ceb8f8f434df9b267681fc64e1c5a46d2dc7b6, 9c3ad506f052b4481ab901bc79775f0b6edeb0d6
**Product paths:** .changeset/modified-managed-files.md, docs/doctor.md, packages/create-religion/lib/dashboard.ts, packages/create-religion/lib/doctor.test.ts, packages/create-religion/lib/doctor.ts, packages/create-religion/lib/install.test.ts, packages/create-religion/lib/install.ts
