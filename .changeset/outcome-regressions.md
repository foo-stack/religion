---
"create-religion": minor
---

`check` now names the passing command-line and API outcomes that could become regression
tests and, where a test command is declared, offers `tests evidence` to keep them. The new
`evidence` mode of `tests` reads the spec's Evidence section, re-runs each capture, and writes
one reviewed test per outcome, asserting the exit status and the stable parts of the output.
Interface outcomes stay browser evidence.
