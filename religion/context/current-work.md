# Evidence that outlives the session

**Type:** Feature
**From build plan:** item 17
**Status:** in progress

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
- [ ] **Step 2 - `complete` reuses it** - `src/skills/complete/SKILL.md` Step 1, and the
  ownership row in `docs/architecture/state-model.md`. *Done when:* the rendered skill says
  when the record is reused and when `check` runs again, and `npm test` exits 0.
- [ ] **Step 3 - the dashboard shows it** - `evidence` in `parseSpec` in `lib/state.ts`, and the
  Work view in `lib/dashboard.ts`. *Done when:* a unit test shows the section parsed into its
  stamp and one entry per outcome, and the running dashboard shows it for a spec carrying one.
- [ ] **Step 4 - the release note** - a minor changeset. *Done when:* `npm test` exits 0.

## Files and areas

- `src/skills/check/SKILL.md`, `src/skills/complete/SKILL.md`, and their rendered copies
- `docs/architecture/state-model.md`
- `packages/create-religion/lib/state.ts`, `lib/state.test.ts`, `lib/dashboard.ts`
- `.changeset/`

## Data and contracts

**Load-bearing**, because `complete` decides reuse from the stamp and the dashboard parses it:

```markdown
## Evidence

Checked 2026-10-21 at 9f73627, tree clean.

- **Step 1 - the plan** - pass: ran `npm test`; 159 passed, 0 failed.
- **Step 3 - the command** - fail: `religion uninstall --yes` exited 1 with "No install record".
- **Goal** - could not check: no browser available.
```

The stamp line is `Checked <date> at <short commit>, tree clean.` or `..., tree dirty.`; each
entry is `- **<outcome>** - <pass|fail|could not check>: <what was run and seen>`. The section
sits last in the spec, after Notes for the agent.

## Testing

- `npm test` is declared, so the gate is on. Parsing the section is logic and gets a unit
  test; the skill changes are prose, covered by the rendering and routing checks.
- The Work view is interface work, verified on the running dashboard.

## Notes for the agent

- `check` stays read-only for everything but this one section: never source, never a
  commit, never another state file.
- A record from another commit, or from a dirty tree that has changed since, proves nothing
  about the code being completed; `complete` must not reuse it.
- State templates and skills use the token vocabulary, not one tool's invocation syntax.
