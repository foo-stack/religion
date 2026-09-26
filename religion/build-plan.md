# Build Plan

> The second planning document you own. One line per feature, in rough build order. The
> depth lives in each work item's spec, not here.
>
> `feature` with no argument specs the first unchecked item; `complete` checks it off.
> Do not renumber completed items: their archives refer back to those numbers.

## Plan

- [x] 1. **Tests for the command-line tool** - a runner, and coverage for manifest hashing, conflict detection, and the marker surgery that merges entry files
- [x] 2. **Setup drafts usable plans from an existing codebase** - survey an unfamiliar repository with real history and produce two plans a person would keep
- [x] 3. **Documentation for people who did not build it** - a getting-started walkthrough, what the loop feels like in practice, and what to do when `doctor` complains
- [ ] 4. **A path to 1.0** - state what is stable, what an update guarantees, and what counts as a breaking change
  - [x] 4a. **A command-line surface fit to freeze** - unknown commands and flags refused, documented exit codes, versioned JSON output, a dashboard that rejects foreign hosts
  - [ ] 4b. **Update keeps its promises** - removes files the template dropped, refuses a manifest from a newer version, backs up what it says it backs up, and cannot duplicate an edited entry file
  - [ ] 4c. **Compatibility guards** - checks that fail when the public surface changes by accident: JSON shapes, skill names, flags, config keys, and an upgrade from the last release
  - [ ] 4d. **The stability statement** - what is public and what is internal, what a 1.x update guarantees, the three promises, an upgrade guide, and the major changeset that makes it 1.0

## Order

Tests come first because everything after them risks breaking the installer, and because
stability should not be promised for code nothing checks.

Onboarding is second: it is where adoption succeeds or fails, and `setup` has been
exercised properly once, against one project, before half of the current system existed.

Documentation is third because it describes what onboarding actually does, and writing it
earlier would document intentions.

1.0 is last. It is a commitment about all three.
