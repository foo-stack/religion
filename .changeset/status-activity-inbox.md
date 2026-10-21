---
"create-religion": minor
---

`religion status` reports the run recorded in `religion/.state/run.json` and how many notes
the inbox holds, and `status --json` gains `activity` and `inbox` fields. When the recorded
run is blocked and names a resume command, that command becomes the next action. A record is believed only when it names a skill installed
in the project, and its resume command only when it invokes that same skill with plain
word arguments; control and format characters in what it prints are replaced with spaces.
