---
"create-religion": minor
---

A new setting, `workflow.parallelItems`, off by default, has `implement` start each planned
feature in its own git worktree beside the project, on the item's branch, moving the spec there
so the main checkout can spec the next item. `religion doctor` refuses the setting under
`git.mode: trunk`, and inside a linked worktree names the main checkout and says where to copy a
missing `.claude/settings.json` from.
