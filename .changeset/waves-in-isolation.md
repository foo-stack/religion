---
"create-religion": minor
---

With `workflow.parallelSteps` on, `implement` builds each wave step in its own detached git
worktree outside the project and joins the steps' patches with one all-or-nothing `git apply`,
stopping for review with the project unchanged when they do not apply. The commands live in the
implement skill's `reference/worktrees.md`. The authority rules let a run remove the worktrees it
created for a wave once that wave has joined; removing anything else still asks.
