---
"create-religion": minor
---

Add `git.mode: pull-request`, a third way for finished work to reach the default branch.

`complete` pushes the work item's branch and opens a pull request into the default branch
instead of merging locally. Nothing merges it and nothing writes to the default branch: the
merge is yours, on the host, and whether it lands as a squash, a merge commit, or a rebase is
the pull request's setting rather than this workflow's business. A repository that cannot
host one is a stop, never a quiet fallback to a local merge.

`auto` runs the whole queue onto one integration branch, each item landing into it behind its
own pull request, and ends with a single aggregate pull request it never merges. That shape
is what lets item three build on items one and two. It states the entire remote budget before
any work starts and does not begin without a yes.

The authority rules move with it. Tier one now reads "pushing to the default branch, and
force-pushing anything anywhere" rather than "pushing to any remote", because the danger of a
push is what it lands on. Pushing a branch a run created itself is the one action that may be
granted ahead of time, and only through that enumeration.

Also adds `git.refactorBranchPrefix` and `git.integrationBranchPrefix`, and fixes the
command-line tool rejecting the new mode and overlooking the refactor archive directory.
