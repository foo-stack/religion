---
"create-religion": minor
---

With items built in their own worktrees, `complete` now lands each one on top of whatever
landed first: it merges the target without committing, takes the landed copy of the build plan,
findings ledger, journal, overview and handoff, redoes the item's own tick, findings and journal
entry, stops on any other conflict, and runs `Verify` again before committing the merge. A merge
given up half way resets to the item's work commit and names everything it discarded.
