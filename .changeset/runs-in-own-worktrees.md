---
"create-religion": minor
---

With `workflow.parallelItems` on under `git.mode: pull-request`, an `auto` run works in its own
git worktree beside the project, on an integration branch named from the date and its items,
such as `auto/2026-10-26-6-10`, so two sessions can each run a named set of items at once.
Before any work a named run stops on an item another run holds, and names the items it will
pass over because they wait on another run's. A named run now releases its items only as its
last write, after the aggregate pull request is open.
