# Spec amendments recorded

**Type:** Feature
**From build plan:** item 30a
**Approved:** 2026-10-21, 8f08823757cf0953
**Status:** in progress

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

## Files and areas

- `packages/create-religion/lib/state.ts`, `lib/state.test.ts`
- `packages/create-religion/lib/status.ts`, `lib/status.test.ts`
- `src/skills/implement/SKILL.md` and its rendered copies
- `.changeset/`

## Data and contracts

**Load-bearing**, because item 30b and `status` read it:

```markdown
**Approved:** 2026-10-21, 3f2a9c01b4e5d678

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
