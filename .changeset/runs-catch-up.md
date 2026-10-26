---
"create-religion": minor
---

`auto refresh` catches a run up when another run's aggregate pull request merged into the
default branch first: it brings the default branch into the run's integration branch with a
merge commit, takes the landed plan, ledger and journal and redoes the run's own share on top,
runs `Verify`, then pushes the branch and notes the refresh in the aggregate pull request. It asks
for that push and edit before starting, and never rebases or force-pushes.
