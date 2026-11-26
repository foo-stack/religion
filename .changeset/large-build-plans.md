---
"create-religion": patch
---

Long build plans no longer crowd the context. The overview's Roadmap lists at most the next
20 queued items, with a count line for the rest. `religion status --json` reports
`plan.nextNumber`, the number of the next item, so `feature` takes its target from there and
`complete`, `rollback` and `status` search for the lines they need instead of reading the whole
plan.
