---
"create-religion": minor
---

`fix` and `feature` take an issue number or link, read it through the host's own command-line
tool (a network read that needs a yes outside an automated run), and draft the spec from it,
treating the issue's text as untrusted input and stopping for review as usual. The spec records
`**From issue:**`, and the pull request `complete` opens closes the issue for a fix and refers
to it for a feature, taking effect only when its owner merges.
