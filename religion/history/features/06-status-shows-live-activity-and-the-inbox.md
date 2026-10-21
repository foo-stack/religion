# Status shows live activity and the inbox

**Type:** Feature
**From build plan:** item 6
**Status:** verified

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
- [x] **Step 2 - the two fields in `status --json`, recorded as public** - `Status` gains
  `activity` and `inbox`; `surface.json`, the surface check's busy project, and
  `docs/stability.md` carry them. *Done when:* `status --json` on this repository prints
  both fields, and `npm run verify` passes, including the surface check and the stability
  statement check.
- [x] **Step 3 - a blocked run becomes the next action, and the text output shows both** -
  `nextAction` and `renderStatus` in `lib/status.ts`. *Done when:* unit tests show a blocked
  run with a resume command chosen ahead of active work, one without a resume command
  ignored, configuration problems still winning, and `religion status` printing the run and
  inbox lines.
- [x] **Step 4 - the skill's fallback and the release note** - `src/skills/status/SKILL.md`
  reads `run.json` and the inbox when the tool is absent, rendered into both trees, plus a
  minor changeset. *Done when:* `npm test` passes in full.
- [x] Repair F-125, F-126 and F-127 - the activity record's command must be a skill name, the resume command must resume that skill and stay under a length bound, and control characters are stripped from what is printed.
- [x] Repair F-125 again, and F-129 - the record's skill must be installed, read from the skill trees, and bidi and line-separator characters are stripped too.
- [x] Repair F-130 - the status skill's fallback applies the same condition before following a resume command.

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

## Outcome

`religion status` prints two more lines, the recorded run with its command, status, summary
and when it was last updated, and the inbox's note count, and `status --json` carries the
same as `activity` and `inbox`, recorded in the public surface and named in the stability
statement. A blocked run with a resume command is the next action, after configuration and
overview problems and ahead of active work. The record is untrusted: it is believed only
when its `command` names a skill installed in `.claude/skills` or `.agents/skills`, its
resume command only when it invokes that same skill with plain word arguments and stays
under 200 characters, and control, format and separator characters in what it prints become
spaces. The status skill's fallback, for a project without the tool, reads the same two
files under the same rule.

Evidence behind it: `npm test` green at the final commit (every verification check including
the surface and stability checks, 113 unit tests, 178 routing cases); `religion status` and
`religion status --json` run against this repository during its own automated run, printing a
`Run:` line for the running `auto` run and `Inbox:    8 note(s)`; one audit and
two fresh-context re-reviews of the repairs, probing crafted records with shell commands,
newlines, escape sequences, bidi overrides, a 10 MB resume command, files, symlinks and odd
directory names in the skill trees.

### What went wrong on the way

**The first rule for the resume command checked its shape, not its meaning.** The audit
showed `git push --force` passed the pattern. Tying it to the record's own `command` was the
first repair, and a fresh-context re-review showed the record supplies both fields, so
`command: "git"` passed too. The second and last attempt reads the installed skills from the
directories instead of trusting the file. The same review found the skill's fallback path
still followed any resume command, repaired as F-130.

**A checkpoint swept up a change that was not this item's.** Step 1 was staged with
`git add -A` and took the user's mid-run edit to `religion/config.json`, `stepReview` from
`every` to `item`, into its commit. Every later step staged named paths only.

**`npm run build:skills` renders only the package template.** The repository's own trees
need `npm run build:skills:link`, which the drift check caught on the first full run.

### Deferred

- **F-128** (the dashboard reads the activity record and the inbox a second time, without
  the new checks) and **F-130** (the skill fallback's repair, `fixed` and waiting for a
  review), neither blocking.
- **Judging a stale record.** The output shows when it was last updated and leaves the call
  to the reader.

## Findings

### 6/F-125 [P2] closed - The resume command check accepts any command, not only a skill

**File:** packages/create-religion/lib/state.ts:292
**Found:** 2026-10-21 by audit (scope: current; lens: security)
**Why it matters:** `git push --force`, `npm publish` and `sudo reboot` all match the pattern, become `next.command`, and the status skill tells an agent to run that command.
**Suggested fix:** Require the first word to equal the record's `command`, which must itself be a skill name, and test that `git push --force` is rejected.
**Resolution:** Repaired 2026-10-21, second attempt: the first tied the resume command to the record's `command`, but a re-review showed the record controls both fields (`command: "git"` passed). The record's `command` must now name a skill installed in `.claude/skills` or `.agents/skills`, read from the directories; `git` and `rm` records are tested as not recorded. Closed 2026-10-21 by a fresh-context re-review: records naming `git`, `sh`, a file, a symlink or an odd directory read as not recorded, and only `/auto resume` survived.

### 6/F-126 [P2] closed - Control characters in the record reach the terminal and can fake the Next line

**File:** packages/create-religion/lib/status.ts:68
**Found:** 2026-10-21 by audit (scope: current; lens: security)
**Why it matters:** A `summary` holding a newline and escape codes is printed whole into `next.because` and the Run line, so a crafted record can print a second, fake Next line or clear the screen.
**Suggested fix:** Reject a `command` that is not a skill name, and strip control characters from `summary` and `updatedAt` in `parseActivity`.
**Resolution:** Repaired 2026-10-21: a `command` that is not a skill name reads as not recorded, and control characters in `summary` and `updatedAt` become spaces; a spoofed Next line is tested. Closed 2026-10-21 by a fresh-context re-review: no printed field can carry a newline or escape sequence.

### 6/F-127 [P2] closed - A very long resume command overflows the regex stack and crashes status

**File:** packages/create-religion/lib/state.ts:317
**Found:** 2026-10-21 by audit (scope: current; lens: security)
**Why it matters:** At about 10 MB the repeated group throws `RangeError: Maximum call stack size exceeded`, uncaught, from `status`, `doctor` and the dashboard, which all read the project state.
**Suggested fix:** Bound the length before testing the pattern.
**Resolution:** Repaired 2026-10-21: resume commands over 200 characters are dropped before the pattern runs; a 10 MB command is tested. Closed 2026-10-21 by a fresh-context re-review: the 10 MB case passes and a 200-character worst case runs in under a millisecond.

### 6/F-129 [P3] closed - Bidi overrides and line separators pass the control-character strip

**File:** packages/create-religion/lib/state.ts:299
**Found:** 2026-10-21 by audit (scope: current; lens: security)
**Surfaced by:** F-126
**Why it matters:** The strip covered only C0, DEL and C1, so U+202E could visually reorder the Run and Next lines in a bidi-aware terminal, and U+2028 can render as a line break.
**Suggested fix:** Strip `\p{Cc}`, `\p{Cf}`, `\p{Zl}` and `\p{Zp}`.
**Resolution:** Repaired 2026-10-21 with that class; a summary carrying U+202E, U+2028 and U+200F is tested. Closed 2026-10-21 by a fresh-context re-review: every format, separator and control character probed became a space.
