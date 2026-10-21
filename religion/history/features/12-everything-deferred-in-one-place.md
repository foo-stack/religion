# Everything deferred, in one place

**Type:** Feature
**From build plan:** item 12
**Status:** verified

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

## Outcome

The dashboard has a Deferred view, linked from the rail with a count: every note each archive
left under its Deferred heading, newest item first, under the item's number, title and kind.
It says plainly that a note may since have been done, since archives are never edited.
Choosing an item selects it, and the panel's link opens it in History, selected. That
replaced the planned per-item link: the page's script may never write markup that navigates,
which the network check enforces, so the link is static and the choice is made in place.

Evidence behind it: `npm test` exiting 0 at the final commit (every verification check, 132
unit tests, 178 routing cases); the running dashboard against this repository in Chrome,
showing 39 notes from 14 archives, item 10 selected in place, and the panel link opening
History with item 10 selected.

### What went wrong on the way

**A step was committed on a red suite, a third time.** The command piped `npm test` into
`grep` and chained the commit with `&&`, so `grep` matching `FAIL` counted as success. The
network check had refused the first version's script-written `href`. A fix commit followed,
and every commit after it was gated on `npm test`'s own exit code.

**The first design put a link in script-written markup**, which the page's own rules forbid;
reading the network check before writing the view would have avoided it.

**A repair count of zero in History** exposed a parser gap outside this item, captured in the
inbox: unbolded repair steps get no label.

### Deferred

- **Marking a deferred note as done**, which would need archives to change after completion.
