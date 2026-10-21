---
"create-religion": minor
---

`complete` now appends one entry to `religion/learning/journal.md` for every item it
finishes, with what surprised, what went wrong, and what was deferred and why, so `distill`
has something to read. `complete` is the journal's only writer: `distill` no longer moves
entries out of it, and instead records what it decided about each one in
`journal-archive.md`, skipping entries it has already decided on the next pass.
