# Learning made visible

**Type:** Feature
**From build plan:** item 8
**Status:** in progress

## Goal

The dashboard gains a Learning view: the lessons every session loads, and the journal's
entries with which of them `distill` has not yet decided on. `status` warns once enough
undecided entries have piled up to be worth a `distill` pass. Today the learning loop can
only be seen by opening its files.

## In scope

- Parsers for `learning/lessons.md`, `learning/journal.md` and `learning/journal-archive.md`,
  carried on the project state as `learning`.
- A `status` warning when five or more journal entries are undecided.
- A Learning view in the dashboard, with its own rail link, built from `/state.json`'s new
  `learning` section, every piece of file text escaped like the rest of the page.
- The status skill's warning list names the same condition.
- A minor changeset.

## Out of scope

- A new field in `status --json`: the nudge is a warning, and `warnings` already exists.
- Editing lessons or running `distill` from the page, which stays read-only.
- Showing `journal-archive.md` decisions beyond whether an entry was decided.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - parse the lessons and the journal** - `parseLessons` and `parseJournal` in
  `lib/state.ts`, and `learning` on `ProjectState`. *Done when:* unit tests show lessons read
  without the header or the stub line, journal entries read with their labelled fields, a
  free-form entry read with its first paragraph, and an entry counted as decided only when
  `journal-archive.md` carries its heading.
- [ ] **Step 2 - the status nudge** - a warning in `computeStatus` at five or more undecided
  entries, and the status skill's warning list. *Done when:* unit tests show no warning at
  four and the warning at five, and the rendered skill names it.
- [ ] **Step 3 - the Learning view** - `learning` in `/state.json`, a rail link, the view's
  section and its renderer in `lib/dashboard.ts`, and the dashboard test's key list. *Done
  when:* the dashboard test passes, and a screenshot of the real dashboard against this
  repository shows the view with this repository's journal entries and the empty lessons
  state.
- [ ] **Step 4 - the release note** - a minor changeset. *Done when:* `npm test` passes in
  full.

## Files and areas

- `packages/create-religion/lib/state.ts`, `lib/state.test.ts`
- `packages/create-religion/lib/status.ts`, `lib/status.test.ts`
- `packages/create-religion/lib/dashboard.ts`, `lib/dashboard.test.ts`
- `src/skills/status/SKILL.md` and its rendered copies
- `.changeset/`

## Data and contracts

On the project state, and in `/state.json` as `learning`, which is not a public surface:

```ts
learning: {
  lessons: string[];          // paragraphs and list items after the header
  journal: JournalEntry[];    // in file order
  undecided: number;          // entries journal-archive.md does not carry
}
JournalEntry {
  heading: string;            // the text after "## ", the identity distill uses
  date: string | null;        // a leading YYYY-MM-DD in the heading
  archive: string | null;     // **Archive:**
  surprised: string | null;   // **Surprised:**
  wentWrong: string | null;   // **Went wrong:**
  deferred: string | null;    // **Deferred:**
  summary: string | null;     // first unlabelled paragraph, for free-form entries
  decided: boolean;
}
```

An entry is decided when `journal-archive.md` holds a line equal to `## ` plus its heading.
Five undecided entries is the nudge threshold: below it a pass has little to group, and
recurrence is what `distill` promotes on.

## Testing

- `npm test` is declared, so the gate is on. Both parsers and the warning threshold are
  logic and get unit tests beside their source.
- The view is interface work, verified by a screenshot of the running dashboard and by the
  existing dashboard tests, with no unit test of the markup.

## Notes for the agent

- Parsers never throw on a half-written file, and a missing file reads as empty.
- Every string from a state file reaches the page through `esc` or `md`, which escapes first.
- The page already polls `/state.json`; the view must render from that data alone.
- The rail and the view are shown by the address's target with no script; a new view needs
  its line in the `:has(...:target)` rule, or its link never shows as current.
