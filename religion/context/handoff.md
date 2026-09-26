# Handoff

> **Generated file.** Rewritten at the end of each turn from the other state files.
> Nothing reads it to make a decision; it is how a person or a fresh session catches up.

## Where the work sits

**Update keeps its promises** is in progress: 8 step(s) done, 0 to go.

Plan: 4 of 8 item(s) complete. Next up: 4. **A path to 1.0** - state what is stable, what an update guarantees, and what counts as a breaking change

## Blocking findings

- F-14 [P0] fixed - Removal follows a symlinked parent out of the project
- F-15 [P0] fixed - A rebuild writes through symlinks, and a forged record skips the merge prompt
- F-16 [P1] fixed - A case variant of the state directory passes the removal guard
- F-17 [P1] fixed - The manifest can remove any project file with predictable content

These prevent completion until repaired and re-reviewed.

## Read first

1. `religion/context/current-work.md` - the active spec and which steps are done
2. `religion/context/project-overview.md` - the source of truth
3. `religion/build-plan.md` - what is done and what is next

