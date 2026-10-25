---
"create-religion": minor
---

`religion status --json` gains `inFlight`, the work items active in any worktree of the
repository, each with its worktree, branch, plan item, title, step counts and whether it is the
one the command ran in. `religion status` lists items in flight elsewhere and passes over a plan
item another worktree is building, and the handoff lists them too. Worktrees are read from git's
own files, so nothing runs git, and a spec in another worktree is read only when it is a plain
file inside that worktree.
