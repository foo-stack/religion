---
"create-religion": minor
---

`auto` takes an explicit list or range of plan items, such as `1-5` or `6, 7, 8`, and records
them in its activity record as `items`. `religion status --json` reports them under `activity`
and under each `inFlight` entry, and lists a worktree whose run sits between items by the items
it holds. `religion status` and `feature` pass over items a run in another worktree holds,
including the ones it has not reached yet, and the handoff names them. A held plan item
holds every sub-item under it.
