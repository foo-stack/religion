---
"create-religion": minor
---

`religion doctor` checks every setting in the configuration reference with its type, not only
the enumerated ones: booleans, branch prefixes, bounded integers such as
`auto.maxRepairAttempts`, `auto.maxItems` (a positive integer or `null`), and the schema
version. A failure names the key, the value it found, and what it accepts. Keys the reference
does not name are still ignored.
