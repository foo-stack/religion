---
"create-religion": minor
---

`implement` now stamps a spec before its first change with `**Approved:** <date>, <hash>` and
records any later change to what the spec asks for as a dated amendment with its reason,
renewing the stamp. `religion status` warns when the spec has changed without a renewed stamp,
and `status --json` gains `spec` (`hash`, `approved`, `drifted`). Ticks, the status line, and
the Evidence and Amendments sections never count as changes, and examples inside code fences
are ignored.
