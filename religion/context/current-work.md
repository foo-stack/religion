# Backfill discrepancies kept

**Type:** Feature
**From build plan:** item 19
**Status:** in progress

## Goal

When `tests backfill` finds code that does not do what its name or its documentation says,
it offers to note each mismatch through `capture`, so it reaches the inbox that `fix` and
`feature` read, instead of living only in the chat that a cleared context loses.

## In scope

- `src/skills/tests/SKILL.md`: Step 3 offers one `capture` per discrepancy, worded as a
  one-line note naming the file and what the code does instead of what it should, and never
  writes the inbox itself.
- A minor changeset.

## Out of scope

- Recording discrepancies as findings: nothing has reviewed them, and the ledger is the
  audit's.
- Changing `capture`, which already takes a one-line note with where it came from.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - the offer** - Step 3 and the rules of `src/skills/tests/SKILL.md`, rendered
  into both trees. *Done when:* the rendered skill offers a capture per discrepancy, states
  the note's shape, names `capture` as the only way into the inbox, and `npm test` exits 0.
- [ ] **Step 2 - the release note** - a minor changeset. *Done when:* `npm test` exits 0.

## Files and areas

- `src/skills/tests/SKILL.md` and its rendered copies
- `.changeset/`

## Data and contracts

- None new. A note keeps `capture`'s shape, `- <date> - <file> - <what>`, which `parseInbox`
  already reads.

## Testing

- `npm test` is declared, but this changes skill prose only, covered by the rendering,
  reference and routing checks.

## Notes for the agent

- The inbox has one writer, `capture`; the tests skill offers, the user agrees, and `capture`
  writes.
- Use the token vocabulary for invocations in the skill.
