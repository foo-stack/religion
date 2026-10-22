# Complete drafts the release note

**Type:** Feature
**From build plan:** item 34
**Approved:** 2026-10-21, 456a5ba7ab776c81
**Status:** verified

## Goal

In a project that uses Changesets, `complete` drafts the item's changeset from its archive: the
packages its product paths touch, a proposed bump, and a summary written for the people who will
read the changelog. It proposes and does not decide: interactively it asks before writing, and in
an automated run it writes the proposal and names it in the pull request's packet, where the
reviewer approves or changes it. An item that already carries a changeset keeps it.

## In scope

- `src/skills/complete/SKILL.md`: a step before the work commit that detects Changesets
  (`.changeset/config.json`), finds each touched package from the nearest `package.json` with a
  name, leaves out packages Changesets is told to ignore, proposes a bump, writes the summary from
  the archive's Outcome, and handles the interactive and automated cases.
- The review packet names a drafted changeset and its bump.
- A minor changeset.

## Out of scope

- Running `changeset version` or publishing, which belong to the release workflow.
- Release tools other than Changesets.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - the draft** - `src/skills/complete/SKILL.md`. *Done when:* the rendered skill
  drafts a changeset only where Changesets is configured and no changeset covers the item yet,
  names the packages from the product paths, proposes the bump by what changed in the public
  surface, writes a reader-facing summary from the Outcome, asks before writing interactively,
  writes and flags it in the packet in an automated run, and `npm test` exits 0.
- [x] **Step 2 - the release note** - a minor changeset. *Done when:* `npm test` exits 0.

## Files and areas

- `src/skills/complete/SKILL.md` and its rendered copies
- `.changeset/`

## Data and contracts

- A changeset file as Changesets reads it: frontmatter mapping each package name to `patch`,
  `minor` or `major`, then the summary.

## Testing

- `npm test` is declared, but this changes skill prose only.

## Notes for the agent

- The bump is a judgement about a project's public surface; where the project has a stability
  statement, it decides what counts as breaking, and otherwise the skill says what it assumed.
- Changesets reads the summary into the public changelog, so it is written for users, not as a
  commit message.

## Evidence

Checked 2026-10-21 at 02ba42a, tree clean.

- **Step 1 - the draft** - pass: the rendered `.claude/skills/complete/SKILL.md` has Step 2b drafting a changeset only where `.changeset/config.json` exists and none covers the item, naming packages from the product paths, proposing the bump by the public surface, summarising from the Outcome, asking interactively and flagging it in the packet in an automated run; `npm test` exited 0.
- **Step 2 - the release note** - pass: `.changeset/complete-drafts-the-release-note.md`, drafted under the new rule and proposed as minor; `npm test` exited 0 with 183 unit tests.

## Outcome

Before its work commit, `complete` drafts the item's changeset where the project uses Changesets
and none yet describes the item: each package the product paths touch, a proposed bump decided by
what changed in the public surface (by the project's stability statement where it has one), and a
summary written for the changelog. It asks before writing when someone is there; in an automated
run it writes the proposal and names it, with its bump, in the pull request's packet for the
reviewer. This item's own release note was drafted that way.

### What went wrong on the way

Nothing.

### Deferred

- **Release tools other than Changesets.**

## Landed

**Base:** 79d54081063ba014bd4072725b4e368ae1579529
**Commits:** fd6bcf9c0578a2ea390e5f10eae5faa6ec5152c7, 02ba42a7a1a9ca6ab240033336d91d7c5dd13ab9, 3bcc9533c24bba17cc4de52f6920e2138929c0c1
**Product paths:** .agents/skills/complete/SKILL.md, .changeset/complete-drafts-the-release-note.md, .claude/skills/complete/SKILL.md, src/skills/complete/SKILL.md
