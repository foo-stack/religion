---
"create-religion": minor
---

`tests backfill` now offers to note each discrepancy it finds with `capture`, one line naming
the file and what the code does instead of what it should, so the mismatch reaches the inbox
that `fix` and `feature` read rather than being lost when the context is cleared. The failing
tests stay as they are, and the skill never writes the inbox itself.
