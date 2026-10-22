---
"create-religion": minor
---

A fourth Claude Code hook, `warn-on-drift.mjs`, asks before an edit to a file that neither the
active spec's current step nor its Files and areas names, pointing at an amendment when the
spec is what should change. The workflow's own state, changesets and rendered skill trees are
always allowed, and it stays silent with no spec in progress. New installs wire it; on an
existing project, `religion doctor`'s hooks check reports it until it is added to
`.claude/settings.json`.
