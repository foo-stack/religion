# Doctor confirms the hooks are wired

**Type:** Feature
**From build plan:** item 13
**Status:** verified

## Goal

When the Claude Code adapter is installed, `religion doctor` checks that
`.claude/settings.json` registers every hook in the project's hook wiring template, under the
same event, and that each hook's file exists, and names the fix when one is missing. Today an
unwired hook silently switches off the rendered-output guard or the injection scan, and
nothing says so; this repository's own settings lack the scan.

## In scope

- A `hooks` check in `doctor`, built by a pure function from what it reads: whether
  `.claude/skills` exists, the template's commands per event, the settings file, and which
  hook files exist.
- The settings file is read only when it is a plain file, never through a link, matching what
  `install` refuses to write through.
- A section in `docs/doctor.md` with the fix, and a minor changeset.

## Out of scope

- Writing the missing entries, which would edit a file the user owns; `doctor` stays
  read-only and names the fix.
- Comparing matchers exactly: an entry counts as wired when its event and command match,
  whatever matcher the user has tuned.
- Hooks for the other adapters, which is item 21.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - the hooks check** - `hooksCheck` and its wiring in `runDoctor`, in
  `lib/doctor.ts`. *Done when:* unit tests show it passing for a fully wired project,
  failing with the missing hook named for an unwired one and for a missing hook file,
  reporting a settings file that is missing, does not parse or is a link, and staying out of
  the way when `.claude/skills` is absent; and `religion doctor` on this repository names the
  missing scan.
- [x] **Step 2 - held to the shipped template** - a verification check that `HOOKS` equals
  the `(event, command)` pairs in `src/state/.state/settings-template.json`. *Done when:* it
  passes, and fails on a scratch edit to the template, then reverted.
- [x] **Step 3 - the docs and the release note** - a `hooks` section in `docs/doctor.md`,
  the check count, and a minor changeset. *Done when:* `npm test` exits 0.
- [x] Repair F-142 and F-143 - hooks matched by file in every documented form, the local settings and `disableAllHooks` read, and each odd path described as what it is.

## Files and areas

- `packages/create-religion/lib/doctor.ts`, `lib/doctor.test.ts`
- `packages/create-religion/lib/install.ts` (exporting `isPlainFile`)
- `docs/doctor.md`
- `.changeset/`

## Data and contracts

- The check is `{ name: "hooks", ok, detail, blocks: "nothing" }`: hooks back prose rules
  that hold without them, so a missing one is reported, not a block on work. Its `ok` is
  false when anything is missing, so `doctor` exits 1, as it does for every failed check.
- Expected hooks are `HOOKS` in `lib/doctor.ts`: the `(event, command)` pairs this version
  ships, held equal to `src/state/.state/settings-template.json` by a verification check. Not
  the project's own `religion/.state/settings-template.json`, which is seeded once: building
  this showed this repository's seed still naming a hook the package dropped, and missing the
  scan. A hook's file is the path after `node ` in its command.

## Testing

- `npm test` is declared, so the gate is on. `hooksCheck` is logic and gets unit tests over
  its inputs; one `runDoctor` test over a temp project covers the reading.

## Notes for the agent

- Do not edit `.claude/settings.json` in this repository to make the check pass: it is the
  user's configuration. Report what the check finds.
- The project's template is seeded once and never refreshed, so it cannot say what the
  current version wires; the check compares with `HOOKS` instead.

## Outcome

`religion doctor` runs a ninth check, `hooks`, wherever `.claude/skills` is installed. It
confirms that each hook this version ships is registered under its event in
`.claude/settings.json` or `.claude/settings.local.json`, matched by the hook's script whether
the command names it directly or through `"$CLAUDE_PROJECT_DIR"`, whatever the matcher, and
that each script exists. It fails when `disableAllHooks` is on, says which hook is missing and
how to add it, and refuses to read a settings file reached through a link. The expected hooks
are a constant in code, held equal to the shipped settings template by a verification check,
because a project's own template is seeded once and goes stale.

Evidence behind it: `npm test` exiting 0 at the final commit (every verification check, 140
unit tests, 178 routing cases); `religion doctor` on this repository reporting
`scan-untrusted-input.mjs (PostToolUse)` as not registered, which is true; a scratch rename in
the settings template failing the new verification check, then reverted; one audit probing
malformed, linked, nested and disabled settings, none of which threw.

### What went wrong on the way

**The first version compared against the project's seeded template**, and this repository's
seed, written by 0.5.0, still names a hook the package dropped and lacks the scanner. Running
the check here exposed it before the step was committed; the wiring is now a constant held to
the shipped template.

**The first match was an exact command string**, which would fail a project wired the way
Claude Code's own docs show. The audit caught it, with four smaller cases where the message
said the wrong thing.

### Deferred

- **Writing the missing entries.** `doctor` stays read-only; the fix is named.
- **This repository's own `.claude/settings.json`** lacks the scan hook. It is the user's
  configuration, so it was reported rather than edited.
- **F-142 and F-143**, repaired and `fixed`, waiting for a review.
