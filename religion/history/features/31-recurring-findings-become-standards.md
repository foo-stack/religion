# Recurring findings become standards

**Type:** Feature
**From build plan:** item 31
**Status:** verified

## Goal

`distill` reads the findings archived with each finished item alongside the journal. Where the
same kind of finding has recurred across different items, it proposes the coding-standard rule
that would have prevented it, citing the findings as evidence, and waits for approval. Today
`audit` finds the same mistakes again and nothing changes upstream of them.

## In scope

- `src/skills/distill/SKILL.md`: a second input, the `## Findings` section of every archive under
  `religion/history/`, and the ledger's still-open findings as context; a rule for what counts
  as the same kind; the proposal's shape; and recording what was decided so a group is not
  proposed twice.
- The description gains the findings source, and a routing case.
- A minor changeset.

## Out of scope

- Running `distill` here, or writing any standard: proposals wait for the user, as distill's
  standards edits already do.
- Changing how `audit` records findings.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - findings as a second input** - distill's steps, rules and description, rendered,
  and a routing case. *Done when:* the rendered skill reads archived findings, groups only those
  that recur across at least two different items, proposes a rule with the findings cited, waits
  for approval, records each decision in `journal-archive.md`, and `npm test` exits 0.
- [x] **Step 2 - the release note** - a minor changeset. *Done when:* `npm test` exits 0.

## Files and areas

- `src/skills/distill/SKILL.md` and its rendered copies
- `evals/routing/distill.json`
- `.changeset/`

## Data and contracts

- Reads the archived findings' existing shape: `### <item>/F-<n> [P<n>] <status> - <title>`, with
  `**File:**`, `**Found:**` (its lens), and `**Why it matters:**`.
- A decided group is recorded in `journal-archive.md` under `## findings - <kind>`, with the
  identifiers it covered, so a later pass proposes only what is new.

## Testing

- `npm test` is declared, but this changes skill prose and a routing case only.

## Notes for the agent

- Recurrence across items is the evidence, not severity: three P3s from three items are a pattern;
  one P1 is an incident, already repaired.
- A rule that only restates a finding is a finding; a standard says what to do in work not yet
  started.

## Evidence

Checked 2026-10-21 at c4bfb56, tree clean.

- **Step 1 - findings as a second input** - pass: the rendered `.claude/skills/distill/SKILL.md` has Step 2b reading every archive's Findings section, grouping only across two or more items, proposing a cited rule for approval, and recording each decision in `journal-archive.md`; the routing corpus passed with 180 cases, the new positive among them.
- **Step 2 - the release note** - pass: `.changeset/findings-to-standards.md` present; `npm test` exited 0 with 172 unit tests.

## Outcome

`distill` takes the review record as a second input: the `## Findings` section of every archive.
It groups findings that are the same kind of mistake, whatever their wording, and proposes a
coding-standard rule only for a group drawn from at least two different items, citing each
finding, worded as an instruction for work not yet started, and waiting for approval. Each
decided group is recorded in `journal-archive.md` under `## findings - <kind>` so a later pass
proposes only what is new. Open findings in the ledger inform it but are not evidence.

### What went wrong on the way

**The spec carried a raw template token for the state directory**, which the verification suite rejects in rendered
state; it was written as the real path.

### Deferred

- **Running `distill` on this repository.** The archives already hold a candidate group: reads
  and writes through a link, across items 4b, 4d, 5 and 16.
