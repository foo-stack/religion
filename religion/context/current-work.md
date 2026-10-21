# A journal that something writes

**Type:** Feature
**From build plan:** item 7
**Status:** in progress

## Goal

`complete` appends one short entry to `religion/learning/journal.md` for every item it
finishes: what surprised, what went wrong, and what was deferred and why. `distill` finally
has input, and the journal has exactly one writer, as the project plan now says.

## In scope

- `complete` writes the entry during Step 2, so it lands in the work commit, for every kind
  of item it closes: feature, fix, rollback, refactor. A project installed before the
  journal existed gets the file created with the template's header.
- `distill` stops claiming that any skill appends, and stops rewriting the journal: it
  records what it processed in `journal-archive.md`, its own file, and skips entries already
  recorded there on the next pass.
- The journal template's header and the state model's ownership table say the same.
- A minor changeset.

## Out of scope

- Showing the journal anywhere, which is item 8.
- Backfilling entries for items finished before this one.
- Changing how `distill` decides what to promote.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - `complete` appends the entry** - a paragraph in Step 2 of
  `src/skills/complete/SKILL.md` naming the entry's shape, when it is written, and what to do
  when the file is missing, rendered into both trees. *Done when:* the rendered skill states
  the entry and its shape, and `npm run verify` passes.
- [x] **Step 2 - `distill` reads without rewriting** - its "what goes in the journal" section
  names `complete` as the writer; Step 1 skips entries already in `journal-archive.md`;
  Step 5 records decisions there and leaves the journal alone. The journal template's
  header and `docs/architecture/state-model.md` follow, plus the changeset. *Done when:*
  no skill other than `complete` is told to write the journal (checked with
  `grep -rn "journal" src/skills`), and `npm test` passes in full.

## Files and areas

- `src/skills/complete/SKILL.md`, `src/skills/distill/SKILL.md`, and their rendered copies
- `src/state/learning/journal.md`
- `docs/architecture/state-model.md`
- `.changeset/`

## Data and contracts

The entry, **load-bearing** because item 8 counts entries and `distill` identifies them by
their heading:

```markdown
## 2026-10-21 - Status shows live activity and the inbox

**Archive:** history/features/06-status-shows-live-activity-and-the-inbox.md
**Surprised:** one or two sentences, or "nothing".
**Went wrong:** one or two sentences, or "nothing".
**Deferred:** what was left, and why, or "nothing".
```

One `##` heading per entry, the date and the item's title. `distill` records processed
entries in `journal-archive.md` under the same heading with what it decided; an entry whose
heading and `Archive` line are already there has been processed.

## Testing

- `npm test` is declared, but this item changes skill prose and a template, with no logic
  to unit-test. The verification suite covers it: skill references resolve, rendered output
  matches source, and state templates carry no tool-specific invocation.
- The grep in step 2 proves the single writer.

## Notes for the agent

- The entry draws on what the session went through, not on the spec, which says what was
  planned rather than what happened.
- The journal is not loaded into context, so the entry may be plain; lessons are where
  brevity costs.
- State templates must not name a tool's invocation syntax: use the token vocabulary.
