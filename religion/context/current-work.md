# Settings explained in the dashboard

**Type:** Feature
**From build plan:** item 15
**Status:** in progress

## Goal

The dashboard's Configuration panel shows every setting with what it means, what it
accepts, its default, and its value in this project, marking which ones the project has set
and naming any key Religion does not read. Today the panel lists only the keys present in
`config.json` and their raw values.

## In scope

- A one-line `summary` for each setting in `lib/settings.ts`, the schema item 10 introduced.
- `describeSettings(config)` in the same module, giving one row per setting and one per key
  the schema does not name, with `referenceCells` supplying what each accepts.
- `/state.json`'s health section carrying those rows, and the panel rendering them.
- A minor changeset.

## Out of scope

- Editing settings from the page, which stays read-only.
- The prose sections of `docs/architecture/config.md`, which stay the long form; the summary
  is one line.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - meanings and rows** - `summary` on every `Setting`, and `describeSettings`,
  in `lib/settings.ts`. *Done when:* the type requires a summary on every entry, and unit
  tests show a set value, an unset one falling back to its default, a value the schema
  refuses marked as such, and a key the schema does not name listed as not read.
- [x] **Step 2 - the panel** - `settings` in `/state.json`'s health section, and the
  Configuration panel in `lib/dashboard.ts`. *Done when:* the dashboard tests pass, and the
  running dashboard against this repository shows every setting with its meaning, what it
  accepts, its default and this project's value.
- [ ] **Step 3 - the release note** - a minor changeset. *Done when:* `npm test` exits 0.

## Files and areas

- `packages/create-religion/lib/settings.ts`, `lib/settings.test.ts`
- `packages/create-religion/lib/dashboard.ts`, `lib/dashboard.test.ts`
- `.changeset/`

## Data and contracts

```ts
interface SettingRow {
  key: string;
  summary: string | null;    // null for a key the schema does not name
  accepts: string | null;    // the reference's Values cell
  default: string | null;    // the reference's Default cell
  value: string | null;      // as set in config.json, JSON-encoded, or null when unset
  problem: string | null;    // what settingProblems says about it, or null
}
```

`/state.json` is not a public surface; `health.config` stays as it is beside the new
`health.settings`, so nothing else that reads the page changes.

## Testing

- `npm test` is declared, so the gate is on. `describeSettings` is logic and gets unit tests.
- The panel is interface work, verified by the running dashboard.

## Notes for the agent

- Each summary must agree with `docs/architecture/config.md`; read its sections before
  writing them.
- Every string reaches the page through `esc` or `md`.
