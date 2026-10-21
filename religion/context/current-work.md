# A clean way out

**Type:** Feature
**From build plan:** item 16
**Status:** in progress

## Goal

`religion uninstall` takes Religion back out of a project. It removes the managed files
nobody edited, leaves and names the edited ones, takes its managed block out of the entry
file and its own hook entries out of `.claude/settings.json`, removes the install manifest,
and keeps the plans, the history and everything else under `religion/`. It shows its plan
and asks first, removes nothing without `--yes` or a yes at the prompt, and `--dry-run`
only plans.

## In scope

- `planUninstall` and `applyUninstall` in a new `lib/uninstall.ts`.
- **Managed files** under a skill or hook tree: removed when unedited, kept and named when
  edited, a link, or not a plain file. Directories left empty by a removal are removed,
  never one that still holds anything.
- **Entry files:** the managed block cut out when the markers are intact; the whole file
  removed when it is still exactly what was installed; otherwise left and named, since an
  unmarked file someone edited cannot be split safely.
- **`.claude/settings.json`:** removed when it is still the installed copy; otherwise
  Religion's three hook entries removed and the rest kept, after a backup; left and named
  when it does not parse or is reached through a link.
- `religion/.state/manifest.json` removed last, so an interrupted uninstall can be run
  again.
- The `uninstall` command with `--dry-run`, `--yes`, `-y`, `--help` and `-h`, recorded in the
  surface and named in the stability statement, with a section in `docs/upgrading.md`.
- A minor changeset.

## Out of scope

- Anything under `religion/` other than the manifest: the plans, history, findings and
  journal are the project's record, and deleting them is the user's call.
- Seeded files outside `religion/` that the manifest does not record.
- Reinstalling, which `install` already does.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - the plan** - `planUninstall(target)` in `lib/uninstall.ts`. *Done when:*
  unit tests over a project installed by `applyInstall` show unedited files planned for
  removal, an edited one and a linked one kept, an entry file with markers planned for its
  block to be cut, an unedited unmarked one for removal and an edited unmarked one kept,
  settings planned as removed, unwired or kept by the same rules, a manifest path outside
  the trees ignored, and no manifest planned as nothing to do.
- [ ] **Step 2 - carrying it out** - `applyUninstall(target, plan)`. *Done when:* unit tests
  show the planned files gone, the kept ones byte-for-byte unchanged, the entry file's own
  text intact around the cut, settings keeping a user's own hook, a backup of each rewritten
  file, emptied directories removed and a non-empty one kept, `religion/` other than the
  manifest untouched, and a run through a linked state directory refused before anything
  is written.
- [ ] **Step 3 - the command** - `uninstall` in `lib/args.ts`, `runUninstall` and the help
  text in `bin/religion.ts`, `surface.json`, `docs/stability.md`, and a section in
  `docs/upgrading.md`. *Done when:* on a temporary project, `religion uninstall --dry-run`
  prints the plan and changes nothing, `religion uninstall` without a terminal prints the
  plan and removes nothing, `religion uninstall --yes` removes what it planned, and
  `npm test` exits 0.
- [ ] **Step 4 - the release note** - a minor changeset. *Done when:* `npm test` exits 0.

## Files and areas

- `packages/create-religion/lib/uninstall.ts`, a new `lib/uninstall.test.ts`
- `packages/create-religion/lib/args.ts`, `lib/args.test.ts`, `bin/religion.ts`
- `packages/create-religion/surface.json`, `docs/stability.md`, `docs/upgrading.md`
- `.changeset/`

## Data and contracts

**Load-bearing**, because `uninstall` and its options join the public surface:

```ts
type UninstallAction =
  | "remove"          // a managed file, unedited
  | "keep-edited"     // a managed file whose contents changed since install
  | "keep-linked"     // reached through a link, or not a plain file
  | "cut-block"       // an entry file with intact markers
  | "keep-entry"      // an entry file that cannot be split safely
  | "unwire"          // settings with other content: Religion's hook entries removed
  | "keep-settings"   // settings that do not parse or are reached through a link
  | "remove-manifest";
interface UninstallEntry { relative: string; action: UninstallAction; why?: string }
```

Exit codes keep their meanings: 0 when it did what it planned, edited files kept included,
since keeping them is the design; 1 when something it meant to change was left, a damaged
entry file or settings it could not read; 2 for a usage error.

## Testing

- `npm test` is declared, so the gate is on. Planning and applying are logic with real files
  and get unit tests over temporary projects, built by `applyInstall` from a fixture template.
- The command is verified by running it against temporary projects.

## Notes for the agent

- The manifest is a file in the user's repository, so a recorded path must not steer a
  removal: only paths `retiringTree` accepts, through `isPlainFile`, like `update`'s own
  removals.
- Hooks are matched as `doctor` matches them, by script, so a hook the user re-pointed or
  added stays.
- No removal is ever made through a link, and the manifest and backups are refused when the
  state directory is reached through one, as `install` does.
- Never run the command against this repository itself while building it.
