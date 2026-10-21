# Everything deferred, in one place

**Type:** Feature
**From build plan:** item 12
**Status:** in progress

## Goal

The dashboard gains a Deferred view: every note each archive left under its Deferred
heading, gathered in one list, newest item first, each linked to the item that left it.
It reads as a record of what was set aside and why, not as a to-do list, because nothing
marks a deferred note as later done.

## In scope

- A Deferred view with its own rail link and a count of notes, built in the page from the
  archives `/state.json` already carries.
- Each item's heading links to its archive in the History view, selected.
- Wording that says plainly a note may since have been done.

## Out of scope

- Marking notes resolved, which would need a writer the archives do not have; archives are
  never edited after completion.
- Grouping by theme, or searching.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - the Deferred view** - a rail link, the view's section, its line in the
  `:target` rule, and `renderDeferred` in `lib/dashboard.ts`. *Done when:* the dashboard
  tests pass, and the running dashboard against this repository shows the view with every
  archive's deferred notes, and choosing an item opens it selected in History.
- [x] **Step 2 - the release note** - a minor changeset. *Done when:* `npm test` passes in
  full.

## Files and areas

- `packages/create-religion/lib/dashboard.ts`
- `.changeset/`

## Data and contracts

- None new. Each archive in `/state.json` already carries `deferred: string[]`, `number`,
  `title`, `kind` and `file`; the History view's selection key is `kind/file`.

## Testing

- `npm test` is declared, but this item adds no logic outside the page: interface work,
  verified by the running dashboard and the existing dashboard tests.

## Notes for the agent

- Every archive string reaches the page through `md`, which escapes first.
- Selecting an archive is the existing `data-pick='archive'` click, so the link needs only
  that attribute and `href='#history'`.
