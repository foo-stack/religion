---
"create-religion": minor
---

`religion dashboard` is rebuilt as an operational console with an overview and four views,
following the system's light or dark theme and updating live. Work shows the active spec as
written: its goal, every step with what it builds and when it is done, its scope and files.
Findings charts the ledger by lens, by file and by the item that closed each one, and lists
every finding in full with status and severity filters. History lists what shipped, with its
commits, repairs, closed findings, lessons and deferrals, beside the plan. Health shows the
activity record, doctor's checks, the configuration, the install and the inbox, and says
when the project was installed by an older version than the one running. The page still
loads nothing but its own data, under the same policy.

`status --json` now reports the whole name of the next step in `work.nextStep`, such as
`Step 3 - client`, where it was cut at the first ` - ` before. A dashboard that cannot read
the project answers with the error instead of stopping.
