---
"create-religion": minor
---

`auto fix` works through the findings ledger unattended, under the same grant, gates and
landing rules as a plan run. With no class, or `all`, it takes every class most severe
first until no open finding is left; `auto fix P1` takes only that class. Each class's
findings that name the same file are repaired together as one fix, every repair is
re-reviewed in a fresh context, and a finding the review surfaces in the repaired code is
folded into the same fix, linked to the finding that surfaced it, which cannot close first.
Repair attempts and a cap of three folded findings per fix bound the run; unverified
findings are reported rather than repaired. `fix` now accepts several finding identifiers,
and `audit` records the `Surfaced by` link.
