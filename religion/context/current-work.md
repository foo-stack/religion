# Status shows live activity and the inbox

**Type:** Feature
**From build plan:** item 6
**Status:** in progress

## Goal

`religion status`, and its JSON, report the run recorded in `religion/.state/run.json` and
how many notes the inbox holds. When that run is blocked and names a resume command, the
resume command becomes the next action, because finishing an interrupted run beats starting
something new. Today both are visible only in the dashboard.

## In scope

- A tolerant parser for the activity record, read into the project state alongside the
  inbox's note count.
- Two additive fields in `status --json`: `activity` and `inbox`, recorded in the public
  surface and named in the stability statement.
- The next action: a blocked run with a resume command is next, after configuration and
  overview problems and before everything else.
- Two lines in the text output: the recorded run and the inbox.
- The `status` skill's fallback path reads the same two files when the tool is absent.

## Out of scope

- Judging whether a record is stale. The output shows when it was last updated and leaves
  the judgement to the reader; a cutoff can come later if a stale record proves misleading.
- The dashboard, which already shows both and keeps its own reader.
- The activity log, which item 25 adds.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - read the activity record and the inbox into the project state** -
  `parseActivity` in `lib/state.ts`, and `activity` and `inbox` on `ProjectState`. *Done
  when:* unit tests show a valid record parsed, a malformed or partial one read as
  not recorded, a resume command that is not a skill invocation dropped, and the inbox
  counted from a project with notes and one without.
- [ ] **Step 2 - the two fields in `status --json`, recorded as public** - `Status` gains
  `activity` and `inbox`; `surface.json`, the surface check's busy project, and
  `docs/stability.md` carry them. *Done when:* `status --json` on this repository prints
  both fields, and `npm run verify` passes, including the surface check and the stability
  statement check.
- [ ] **Step 3 - a blocked run becomes the next action, and the text output shows both** -
  `nextAction` and `renderStatus` in `lib/status.ts`. *Done when:* unit tests show a blocked
  run with a resume command chosen ahead of active work, one without a resume command
  ignored, configuration problems still winning, and `religion status` printing the run and
  inbox lines.
- [ ] **Step 4 - the skill's fallback and the release note** - `src/skills/status/SKILL.md`
  reads `run.json` and the inbox when the tool is absent, rendered into both trees, plus a
  minor changeset. *Done when:* `npm test` passes in full.

## Files and areas

- `packages/create-religion/lib/state.ts`, `lib/state.test.ts`
- `packages/create-religion/lib/status.ts`, a new `lib/status.test.ts`
- `packages/create-religion/surface.json`, `scripts/surface-current.ts`
- `docs/stability.md`
- `src/skills/status/SKILL.md` and its rendered copies
- `.changeset/`

## Data and contracts

**Load-bearing**, because `status --json` is public and a field never changes type within 1.x:

```ts
activity: {
  recorded: boolean;            // false when run.json is missing or malformed
  command: string | null;
  status: string | null;        // running | blocked | ready | completed
  summary: string | null;
  updatedAt: string | null;
  resumeCommand: string | null;
}
inbox: { notes: number }
```

`activity` is always an object, matching how `work` reports `active: false` instead of being
null, because the surface record has no way to express an object that may be null. A record
counts as recorded only when `command`, `status` and `summary` are strings and `status` is
one of the four values; anything else is `recorded: false`, never an exception.
`resumeCommand` is kept only when it looks like a skill invocation (an optional `/` or `$`,
a lowercase skill name, and plain word arguments); anything else reads as null, so a
tampered record cannot put an arbitrary shell command in front of someone as "next".

The next action's `command` is the resume command without its leading `/` or `$`, since
`renderStatus` adds the prefix.

## Testing

- `npm test` is declared, so the gate is on. `parseActivity`, the inbox count, and the
  next-action choice are logic and get unit tests beside their source.
- The JSON shape is held by the existing surface check, given a busy project that has both
  files.
- The text output is verified by running `religion status` against this repository.

## Notes for the agent

- The parsers in `lib/state.ts` never throw on a half-written file; keep that.
- `run.json` is written by skills and read here, so it is untrusted input: read only the
  named fields, and never echo anything else from it.
- The stability statement lists every `status` field; the verify check fails if a recorded
  field is missing from it.
