# Spec amendments recorded

**Type:** Feature
**From build plan:** item 30a
**Approved:** 2026-10-21, dec621847cc83be2
**Status:** verified

## Goal

A spec is stamped when implementation starts with a hash of what was approved. Any later change
to what the spec asks for is recorded in an `## Amendments` section, dated and with its reason,
and the stamp is renewed with it. `religion status` warns when the spec has changed since its
stamp with no amendment to say why, which is drift nobody decided. The archive keeps the
amendments because it is the spec.

## In scope

- `specHash` in `lib/state.ts`: a hash of the spec's content that ignores what legitimately
  changes as work proceeds: ticks, the status line, the stamp itself, and the Evidence and
  Amendments sections.
- `parseSpec` reads the stamp, the amendments, and whether the content still matches the stamp.
- `status` warns on a spec that drifted from its stamp, and `status --json` reports the spec's
  hash, stamp and drift as `spec`, recorded in the public surface, so `implement` has a hash to
  stamp with.
- `implement`: stamps the spec before its first change, records each amendment with its reason
  and renews the stamp, including when it adds a repair step.
- A minor changeset.

## Out of scope

- Warning about edits to files a step does not name, which is item 30b.
- Showing amendments in the dashboard.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - the stamp and the amendments** - `specHash`, and `approved`, `amendments` and
  `drifted` on `parseSpec`'s result. *Done when:* unit tests show ticking a step, changing the
  status, recording evidence or adding an amendment leave the hash unchanged; changing a step's
  wording changes it; amendments are read as dated lines; and a spec with no stamp is never
  called drifted.
- [x] **Step 2 - status warns on drift** - `computeStatus`. *Done when:* a unit test shows the
  warning for a drifted spec and none for a stamped one that matches, and `status --json`
  reports `spec`, recorded in `surface.json` and `docs/stability.md`.
- [x] **Step 3 - `implement` stamps and amends** - the implement skill. *Done when:* the rendered
  skill stamps before the first change, records an amendment with its reason for any change to
  what the spec asks for, renews the stamp, and treats an added repair step as an amendment;
  `npm test` exits 0.
- [x] **Step 4 - the release note** - a minor changeset. *Done when:* `npm test` exits 0.
- [x] Repair F-158 - the hash and the stamp hold against whitespace, heading case, tilde fences, malformed stamps and fenced headings, and folded repair steps are amended.

## Files and areas

- `packages/create-religion/lib/state.ts`, `lib/state.test.ts`
- `packages/create-religion/lib/status.ts`, `lib/status.test.ts`
- `src/skills/implement/SKILL.md` and its rendered copies
- `.changeset/`

## Data and contracts

**Load-bearing**, because item 30b and `status` read it:

```markdown
**Approved:** 2026-10-21, 3f2a9c01b4e5d678

## Evidence

Checked 2026-10-21 at 15a8799, tree clean.

- **Step 1 - the stamp and the amendments** - pass: state tests show ticks, status, evidence and amendments leave the hash alone and wording changes it, and fenced examples are ignored; this spec's own stamp read clean after each renewal and drifted before each.
- **Step 2 - status warns on drift** - pass: a real silent edit to this spec made `religion status` print the drift warning, and restoring it cleared it; `status --json` reports `spec`, recorded in `surface.json` and `docs/stability.md`.
- **Step 3 - `implement` stamps and amends** - pass: the rendered `.claude/skills/implement/SKILL.md` stamps from `spec.hash`, amends any change with its reason, renews the stamp, and treats repair steps as amendments; `npm test` exited 0.
- **Step 4 - the release note** - pass: `.changeset/spec-amendments.md` present; `npm test` exited 0 with 177 unit tests.

## Amendments

- 2026-10-21 - Step 3 now checks the template copy, not the repository's - the build stages hooks into the template only.
```

The stamp sits with the other header fields. Its hash is the first 16 hex characters of the
SHA-256 of the spec with these removed: the `**Status:**` and `**Approved:**` lines, the tick in
each `- [x]`, and the `## Evidence` and `## Amendments` sections. `drifted` is true only when a
stamp exists and the hash no longer matches.

## Testing

- `npm test` is declared, so the gate is on. The hash, the parsing and the warning are logic and
  get unit tests.

## Notes for the agent

- A spec without a stamp, from before this item or not yet started, is never drifted.
- This spec is itself the first to carry a stamp, written once step 1 can compute it.

## Amendments

- 2026-10-21 - Restored the example `**Approved:**` line in Data and contracts - the first stamping script removed the first `**Approved:**` line it found, which was the example inside the code fence; the parser now ignores fenced text.
- 2026-10-21 - Step 2 now adds `spec` to `status --json` instead of leaving the surface unchanged - step 3 found `implement` had no way to obtain the hash it must stamp with.
- 2026-10-21 - Added the repair step for F-158 - the audit found seven ways drift could be misread or hidden.

## Outcome

`implement` stamps a spec before its first change with `**Approved:** <date>, <hash>`, the hash
taken from `religion status --json`'s new `spec.hash`, and records any later change to what the
spec asks for as a dated amendment with its reason, renewing the stamp. The hash leaves out what
changes as work proceeds: ticks, the status and stamp lines, the Evidence and Amendments sections,
trailing whitespace, and anything inside a code fence is read only as content. `religion status`
warns when the spec no longer matches its stamp, or when the stamp cannot be read. This spec was
the first stamped, and its three amendments, above, were each made the way the feature asks.

### What went wrong on the way

**The first stamping script deleted the spec's own example stamp**, and the parser counted the
fenced example's `## Amendments` as real; both came from reading fenced text as the record.

**`implement` was told to stamp with a hash nothing exposed**, found while writing step 3; step 2
was amended to add `spec` to `status --json`.

**A scratch edit meant to prove the warning never applied**, because the phrase it targeted wrapped
across a line, so the first live check proved nothing until it was redone.

### Deferred

- **F-158**, repaired and `fixed`, waiting for a review.
- **The hook that warns on edits outside a step's files**, which is item 30b.
