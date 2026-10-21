---
"create-religion": minor
---

`check` now records its verdict for each outcome, and what decided it, in an `## Evidence`
section of the spec, stamped with the commit and whether the tree was clean, so the proof
survives a cleared context and travels into the archive. `complete` reuses that record only
when it names the current commit with a clean tree, and runs `check` again otherwise. The
dashboard's Work view shows the section.
