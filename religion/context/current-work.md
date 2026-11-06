# Antigravity support

**Type:** Feature
**From build plan:** item 50
**Status:** in progress
**Approved:** 2026-11-06, 0d27d260321422f4

## Goal

`religion install --antigravity` installs the workflow for Google Antigravity: every skill
rendered into a tree Antigravity discovers, with `/skill` invocation text, and an entry file it
reads. Install, update, uninstall, doctor, the dashboard and the drift check all treat it as a
fifth adapter, and the four existing adapters render byte for byte as before.

Settled by `religion/history/spikes/how-antigravity-discovers-skills.md`.

## In scope

- A third render tree: `.agent/skills` (Antigravity's backward-compatible skill folder) with
  entry file `GEMINI.md` and `/skill` invocation. `.agents/skills` keeps rendering `$skill` for
  Codex, Copilot and OpenCode, so neither tree carries the other's syntax.
- `src/entry/GEMINI.md`, shaped like `AGENTS.md` (a read-first list rather than `@` imports,
  since Antigravity's import syntax is unverified), and a line in `AGENTS.md` saying Antigravity
  reads `GEMINI.md`.
- The `antigravity` adapter in the command-line tool: `--antigravity`, the help text, the
  interactive choice, the dashboard's adapter names, and the surface record.
- `doctor` comparing any number of installed trees, and finding the entry file in an
  Antigravity-only install.
- The rendered-output guard and the drift warning covering `.agent/skills`.
- The upgrade check comparing the manifest only against the files of the adapters it records.
- Docs: the stability statement's adapter table and promise, getting-started's invocation
  table, and a decision-log row.

## Out of scope

- Antigravity hooks (`hooks.json`). Its event model was not compared with Claude Code's;
  Claude Code stays the only adapter with hooks.
- A `.agents/skills.json` manifest to stop Antigravity reading the Codex tree. When both
  adapters are installed, Antigravity sees both copies of each skill and keeps one, and its
  docs do not rank `.agent/` against `.agents/`. Documented as a known limit in this item, not
  engineered around.
- Personal (`~/.gemini/config/`) installs: Religion writes nothing outside the project.
- Adding Antigravity to an existing install automatically: `update` keeps the recorded adapters.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - the render tree** - `TREES` in `src/lib/adapters.ts` gains `antigravity`
  (`.agent/skills`, `GEMINI.md`, `/skill`); `src/entry/GEMINI.md` added and `src/entry/AGENTS.md`
  names it; the verification walk in `scripts/verify.ts` includes `.agent`; the upgrade check in
  `scripts/upgrade.ts` filters the expected manifest to the recorded adapters' trees and entries;
  `npm run build:skills:link` renders the repo's own `.agent/skills` and `GEMINI.md`. *Done
  when:* `.agent/skills/feature/SKILL.md` exists and its routing line names `feature` in the
  slash form, `.agents/skills/feature/SKILL.md` still names it in the dollar form, `git diff --stat` shows no change
  under `.claude/skills` or `.agents/skills`, and `npm test` exits 0.
- [x] **Step 2 - the guard and the drift warning** - `.agent/skills` added to the rendered list
  in `src/hooks/guard-rendered-output.mjs` and to `ALWAYS` in `src/hooks/warn-on-drift.mjs`, with
  a case in `scripts/hooks.test.ts`. *Done when:* the new hook test passes, and `npm test`
  exits 0.
- [x] **Step 3 - the adapter in the command-line tool** - `antigravity` in `ADAPTERS`
  (`packages/create-religion/lib/install.ts`), `.agent/skills` in `SKILL_TREES`
  (`lib/paths.ts`), the help line in `bin/religion.ts`, `ADAPTER_NAMES` in `lib/dashboard.ts`,
  the `adapters` entry in `surface.json`, the `antigravity` row in `docs/stability.md`'s adapter
  table (the stability check fails on a recorded adapter the statement does not name), the
  package keywords, and tests in `lib/args.test.ts` and `lib/install.test.ts`. *Done when:*
  `planInstall` for `["antigravity"]` plans `.agent/skills/**`, `GEMINI.md` and `religion/**`
  and nothing under `.claude` or `.agents`; a `GEMINI.md` the project already has is planned
  as a merge, not a conflict; `religion install --antigravity --dry-run` into an empty temporary
  directory lists the same files; and `npm test` exits 0.
- [ ] **Step 4 - doctor for any number of trees** - the adapters check in `lib/doctor.ts`
  compares every installed tree against the first, naming each that differs; the entry-file
  check also reads `GEMINI.md`. Tests in `lib/doctor.test.ts`. *Done when:* doctor passes both
  checks on an Antigravity-only install, reports `3 trees, same skills` on a full one, names the
  tree that is missing a skill, and `npm test` exits 0.
- [ ] **Step 5 - documentation** - `docs/stability.md` ("All five", "The five adapters stay",
  the known limit of two copies), `docs/getting-started.md` (an
  Antigravity row giving `setup` in the slash form), and a new row in `docs/decisions.md`. *Done when:* the
  documentation check in `npm test` passes and a search of `docs/` finds no "four adapters".

## Files and areas

- `src/lib/adapters.ts`, `src/entry/GEMINI.md` (new), `src/entry/AGENTS.md`
- `scripts/verify.ts`, `scripts/upgrade.ts`, `scripts/hooks.test.ts`
- `src/hooks/guard-rendered-output.mjs`, `src/hooks/warn-on-drift.mjs`
- `packages/create-religion/lib/install.ts`, `lib/paths.ts`, `lib/doctor.ts`, `lib/dashboard.ts`,
  `bin/religion.ts`, `surface.json`, `package.json`, and the tests beside them
- `docs/stability.md`, `docs/getting-started.md`, `docs/decisions.md`
- Rendered output: `.agent/skills/**`, `GEMINI.md`, `template/**`

## Data and contracts

- **Load-bearing:** the `Tree` for Antigravity: `id: "antigravity"`, `dir: ".agent/skills"`,
  `entryFile: "GEMINI.md"`, `command: (s) => "/" + s`. Every rendered path under it becomes a
  managed file in installs, so moving it later is a breaking change.
- **Load-bearing:** the `antigravity` key in `ADAPTERS` and the manifest's `adapters` array, and
  the `--antigravity` flag. Public surface: adding it is a minor release, removing it a major one.
- `TreeId` gains `"antigravity"`. No stored shape changes otherwise.

## Testing

Test command declared (`npm test`), so logic steps ship tests:

- Step 1: the drift check, the template-content checks, and the upgrade check, all already in
  `npm test`; the rendered syntax is verified by reading the files.
- Step 2: a guard case in `scripts/hooks.test.ts` for an edit under `.agent/skills`.
- Step 3: `args.test.ts` (the flag is accepted by install and update, refused elsewhere);
  `install.test.ts` (an Antigravity-only plan, and an existing `GEMINI.md` planned as a merge).
- Step 4: `doctor.test.ts` (three matching trees, a mismatch naming the tree, `GEMINI.md` as the
  entry file).
- Step 5: the documentation check.

## Notes for the agent

- Never edit rendered trees; edit `src/` and run `npm run build:skills:link`.
- The four existing trees must render byte for byte as before. Only `AGENTS.md` changes, by the
  one line naming Antigravity.
- No em dashes in docs, comments or commit messages; no plan numbers in comments or commits.
- Real Antigravity behaviour is unverified: no claim in docs or the packet may say it was run
  in the IDE.

## Amendments

- 2026-11-06 - Steps 1 and 5 reworded to name invocations in words rather than as literal slash and dollar forms, which the state-template check refuses in a state file. What the steps ask for is unchanged.
