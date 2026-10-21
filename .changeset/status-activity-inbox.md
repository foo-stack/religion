---
"create-religion": minor
---

`religion status` reports the run recorded in `religion/.state/run.json` and how many notes
the inbox holds, and `status --json` gains `activity` and `inbox` fields. When the recorded
run is blocked and names a resume command, that command becomes the next action. A resume
command that is not a skill invocation is ignored.
