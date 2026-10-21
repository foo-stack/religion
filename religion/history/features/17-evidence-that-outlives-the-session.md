# Evidence that outlives the session

**Type:** Feature
**From build plan:** item 17
**Status:** verified

## Goal

`check` writes its verdict for each outcome, and the evidence that decided it, into an
`## Evidence` section of the spec, stamped with the commit it checked. `complete` reuses that
record when nothing has changed since, instead of trusting a session that may have been
cleared, and the archive keeps it because the archive is the spec. Today the proof lives only
in the conversation that produced it.

## In scope

- `check` writes, and on a later run replaces, the spec's Evidence section: the date, the
  commit and whether the tree was clean, then one line per outcome with its verdict, what was
  run and what was observed. That section is the only thing it writes.
- `complete` reuses the section when its commit is the current one and the tree has not
  changed, and runs `check` again when it is missing or stale.
- The state model's ownership table names `check` as the section's writer, as the project
  plan now does.
- The dashboard's Work view shows the section when it exists.
- A minor changeset.

## Out of scope

- `implement`'s own per-step evidence, which stays in its review packet; the spec's Evidence
  section records the outside proof only.
- Rewriting earlier archives, which are never edited.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - `check` records it** - `src/skills/check/SKILL.md`: Step 4 writes the section
  in the shape below, its description says so, and its rules still forbid every other write.
  *Done when:* the rendered skill states the section's shape and that it is the skill's only
  write, and `npm run verify` and the routing corpus pass.
- [x] **Step 2 - `complete` reuses it** - `src/skills/complete/SKILL.md` Step 1, and the
  ownership row in `docs/architecture/state-model.md`. *Done when:* the rendered skill says
  when the record is reused and when `check` runs again, and `npm test` exits 0.
- [x] **Step 3 - the dashboard shows it** - `evidence` in `parseSpec` in `lib/state.ts`, and the
  Work view in `lib/dashboard.ts`. *Done when:* a unit test shows the section parsed into its
  stamp and one entry per outcome, and the running dashboard shows it for a spec carrying one.
- [x] **Step 4 - the release note** - a minor changeset. *Done when:* `npm test` exits 0.

## Files and areas

- `src/skills/check/SKILL.md`, `src/skills/complete/SKILL.md`, and their rendered copies
- `docs/architecture/state-model.md`
- `packages/create-religion/lib/state.ts`, `lib/state.test.ts`, `lib/dashboard.ts`
- `.changeset/`

## Data and contracts

**Load-bearing**, because `complete` decides reuse from the stamp and the dashboard parses it:

```markdown
## Evidence

Checked 2026-10-21 at 8ffa7af, tree clean.

- **Step 1 - `check` records it** - pass: the rendered `.claude/skills/check/SKILL.md` carries Step 5 with the section's shape and says it is the only write; `npm test` exited 0, routing corpus 26 skills and 178 cases clean.
- **Step 2 - `complete` reuses it** - pass: the rendered `.claude/skills/complete/SKILL.md` reuses the record only for the current commit with a clean tree; `npm test` exited 0.
- **Step 3 - the dashboard shows it** - pass: `parseSpec reads the Evidence section check writes` passed; the running dashboard's Work view showed this section's stamp and three passing outcomes.
- **Step 4 - the release note** - pass: `.changeset/check-evidence.md` present; `npm test` exited 0 with 160 unit tests.

## Outcome

`check` ends by writing its verdict into the spec's `## Evidence` section, its only write:
a stamp with the date, the commit checked and whether the tree was clean, then one line per
outcome with pass, fail or could not check and what was run and seen. `complete` takes its
evidence from that section rather than from the session, and reuses it only when the stamp
names the current commit with a clean tree and the tree is still clean; anything else means
running `check` again. The archive keeps the section because the archive is the spec, and the
dashboard's Work view shows it. The state model names `check` as the section's writer, as the
project plan does.

Evidence behind it: the section above, recorded at the final commit, and `npm test` exiting 0
there (every verification check, 160 unit tests, 178 routing cases); the running dashboard's
Work view showing this spec's own Evidence panel.

### What went wrong on the way

**Two counts were written from memory instead of from the output**, once in an archive for
the previous item and once in this spec's evidence, and corrected against the test run before
committing. The reuse rule this item adds exists for exactly this: a record is worth what the
output behind it is.

### Deferred

- **Per-step evidence from `implement`**, which stays in its review packet.
