# Every state file has exactly one writer

The findings ledger is written by the audit skill. The active spec is written by the skills
that create work items. The handoff is written at the end of a turn. No file has two authors.

**Why this is load-bearing rather than tidy.** It is what makes fan-out safe. Audit runs one
subagent per lens and repairs are re-reviewed in a fresh context, but none of those
subagents write anything: they read and return, and the parent performs the single write.
Parallel reviewers cannot race a file only one of them touches.

**Why not let each subagent append its own findings.** Because identifiers have to be unique
and sequential, and two processes assigning them from the same file is the classic lost
update. The merge has to happen somewhere, and the parent is the only place that sees all
the results.

**What would change this.** A state file that is genuinely append-only with no shared
identifier space could take concurrent writers.

**Reversed:** no.
