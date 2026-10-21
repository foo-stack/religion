# A review packet for the pull request

**Type:** Feature
**From build plan:** item 24
**Status:** verified

## Goal

Under `pull-request` mode, the pull request `complete` opens carries a review packet built
from the item's own record: the goal, each step with the verdict and evidence `check`
recorded, the findings closed with the item, and a link to the archive for everything else.
A teammate reviewing on the host gets the proof beside the diff, kept short, and the packet
only presents: it adds no gate and asks nobody to approve anything new.

## In scope

- `src/skills/complete/SKILL.md`, Step 4's pull request body under `pull-request`: the packet's
  shape and where each part comes from.
- `src/skills/auto/SKILL.md`, Step 3's aggregate body: one line per item from the same
  records, pointing at each item's pull request for its packet.
- A minor changeset.

## Out of scope

- A review gate, required reviewer, or anything the host must enforce: the non-goal on
  independent review stands, and this is presentation.
- `trunk` and `branch-per-item`, which open no pull request.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - the packet in `complete`** - Step 4 of the complete skill. *Done when:* the
  rendered skill names the packet's four parts, takes each from the archive and its Evidence
  and Findings sections rather than from memory, keeps it short with the archive linked, and
  says it is presentation only; `npm test` exits 0.
- [x] **Step 2 - the aggregate in `auto`** - Step 3 of the auto skill. *Done when:* the rendered
  skill takes each item's line from its archive's Evidence section and links the item's own
  pull request for the full packet; `npm test` exits 0.
- [x] **Step 3 - the release note** - a minor changeset. *Done when:* `npm test` exits 0.

## Files and areas

- `src/skills/complete/SKILL.md`, `src/skills/auto/SKILL.md`, and their rendered copies
- `.changeset/`

## Data and contracts

- None new. The packet reads the archive `complete` has just written, whose `## Evidence`,
  `## Findings` and `## Landed` sections already exist.

## Testing

- `npm test` is declared, but this changes skill prose only, covered by the rendering,
  reference and routing checks.

## Notes for the agent

- The project plan's non-goal "no independent-review mechanism" rules out anything that turns
  this into a gate; keep the wording to what the body shows.
- A packet longer than the diff is the problem the project exists to fix: one line per step,
  detail behind the link.

## Evidence

Checked 2026-10-21 at f921642, tree clean.

- **Step 1 - the packet in `complete`** - pass: the rendered `.claude/skills/complete/SKILL.md` names the goal, steps and evidence, findings and the record link, takes them from the archive, and says it is not a sign-off; `npm test` exited 0.
- **Step 2 - the aggregate in `auto`** - pass: the rendered `.claude/skills/auto/SKILL.md` takes each item's line from its archive's Evidence section and links the item's pull request; `npm test` exited 0.
- **Step 3 - the release note** - pass: `.changeset/review-packet.md` present; `npm test` exited 0 with 164 unit tests.

## Outcome

Under `pull-request` mode, `complete` opens its pull request with a review packet from the
archive it has just written: the goal, one line per step with its recorded verdict and
evidence, the findings closed with the item, and a link to the archive for the rest. `auto`'s
aggregate packet takes each item's line from that item's archive and links the item's own pull
request. Both are presentation only. This item's own pull request is the first written in that
shape.

### What went wrong on the way

Nothing.

### Deferred

- **Nothing.**

## Landed

**Base:** 784e7a7f624c5a6dacb4e07ad34fab5d93057b4f
**Commits:** f0e518618710eac591ea105fbfdeefce3e48b1be, 6eca7ca9866a019e260b44fb73eadbd61c79bc03, f9216423b0a6c4b82edf7e85f9fb326a71753de7, b938a3818c2e0e463ab79c05ee7e75a127376770
**Product paths:** .agents/skills/auto/SKILL.md, .agents/skills/complete/SKILL.md, .changeset/review-packet.md, .claude/skills/auto/SKILL.md, .claude/skills/complete/SKILL.md, src/skills/auto/SKILL.md, src/skills/complete/SKILL.md
