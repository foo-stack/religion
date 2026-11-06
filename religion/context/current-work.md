# Antigravity support

**Type:** Feature
**From build plan:** item 50
**Status:** in progress
**Approved:** 2026-11-06, 2e94e1abb9ef90ee

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
- [x] **Step 4 - doctor for any number of trees** - the adapters check in `lib/doctor.ts`
  compares every installed tree against the first, naming each that differs; the entry-file
  check also reads `GEMINI.md`. Tests in `lib/doctor.test.ts`. *Done when:* doctor passes both
  checks on an Antigravity-only install, reports `3 trees, same skills` on a full one, names the
  tree that is missing a skill, `docs/doctor.md` describes both checks as they now behave, and
  `npm test` exits 0.
- [x] **Step 5 - documentation** - `docs/stability.md` ("All five", "The five adapters stay",
  the known limit of two copies), `docs/getting-started.md` (an
  Antigravity row giving `setup` in the slash form), and a new row in `docs/decisions.md`. *Done when:* the
  documentation check in `npm test` passes and a search of `docs/` finds no "four adapters".
- [x] Repair 50/F-1 - rollback excludes the Antigravity tree and entry file - `src/skills/rollback/SKILL.md` adds `.agent/**` and `GEMINI.md` to the paths a reversal leaves alone. *Done when:* every rendered rollback skill lists both exclusions, `npm test` exits 0, and a fresh review closes the finding.

## Files and areas

- `src/lib/adapters.ts`, `src/entry/GEMINI.md` (new), `src/entry/AGENTS.md`
- `scripts/verify.ts`, `scripts/upgrade.ts`, `scripts/hooks.test.ts`
- `src/hooks/guard-rendered-output.mjs`, `src/hooks/warn-on-drift.mjs`
- `packages/create-religion/lib/install.ts`, `lib/paths.ts`, `lib/doctor.ts`, `lib/dashboard.ts`,
  `bin/religion.ts`, `surface.json`, `package.json`, and the tests beside them
- `docs/stability.md`, `docs/getting-started.md`, `docs/decisions.md`, `docs/doctor.md`,
  `docs/architecture/enforcement.md`
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

## Evidence

Checked 2026-11-06 at 624bfec, tree clean.

- **Step 1 - the render tree** - pass: `npm run build:skills:link` rendered 219 files from 26 skills and 3 entry files; `.agent/skills/feature/SKILL.md` routes on the slash form and `.agents/skills/feature/SKILL.md` still on the dollar form; no `$` invocation anywhere under `.agent/skills/auto`; `git diff --stat` empty for `.claude/skills` and `.agents/skills`; `npm test` exit 0, including "a project the last release installed updates cleanly".
- **Step 2 - the guard and the drift warning** - pass: with the hook changes stashed, the new guard test and the extended drift test both fail (`.agent/skills/a/SKILL.md` asked about); with them, `scripts/hooks.test.ts` 16 of 16; `npm test` exit 0 with 193 unit tests.
- **Step 3 - the adapter in the command-line tool** - pass: the Antigravity-only `planInstall` test lists exactly `.agent/skills/feature/SKILL.md`, `GEMINI.md`, `religion/config.json`; an existing `GEMINI.md` plans as `merge`; a real `religion install --antigravity --yes` into an empty directory wrote 54 files (32 under `.agent`, 21 under `religion`, `GEMINI.md`) and nothing under `.claude` or `.agents`, with the manifest recording `["antigravity"]` and 33 managed files; installing over an existing `GEMINI.md` kept its text above the managed markers and backed it up; `npm test` exit 0 with 195 unit tests.
- **Step 4 - doctor for any number of trees** - pass: the new doctor test fails on the old code with `no entry file found` and passes on the new; on the real Antigravity install doctor reports `adapters: .agent/skills with 26 skills` and reads `GEMINI.md` (failing only on the shipped placeholder, as a fresh install should); the test covers `3 trees, same skills` and `.claude/skills and .agent/skills hold different skills`; `npm test` exit 0 with 196 unit tests.
- **Step 5 - documentation** - pass: the documentation and stability checks in `npm test` pass; outside the decision records and the dated decision-log rows, `docs/` no longer says four adapters or four supported tools.
- **Update and uninstall** - pass: a second `update --yes` on the real install created, updated and removed nothing; `uninstall --yes` removed 34 files (the 33 managed plus the manifest) and kept `religion/`.

Not verified: Antigravity itself was not run, so discovery, the slash commands and which of two same-named skills it keeps rest on its documentation only.

## Amendments

- 2026-11-06 - Steps 1 and 5 reworded to name invocations in words rather than as literal slash and dollar forms, which the state-template check refuses in a state file. What the steps ask for is unchanged.
- 2026-11-06 - Step 4 also updates `docs/doctor.md`, which describes the adapters and entry-file checks and would otherwise say only two trees and two entry files exist.
- 2026-11-06 - Step 5 also updates `docs/architecture/enforcement.md`, whose rule says all four supported tools behave identically. Decision records and the dated decision-log rows stay as written: they are history.
- 2026-11-06 - Added a repair step for 50/F-1, raised by the audit gate: rollback's exclusions were an adapter enumeration this item missed.
