# Exactly one work item exists at a time

The active spec file holds one feature, fix, rollback, or refactor campaign. Finish it,
archive it, then start the next.

**Why not a queue.** Because progress lives in checkboxes inside that one file, and that is
what makes a cleared context cost nothing: a fresh session reads which steps are ticked and
resumes at the first that is not. Several concurrent specs would need a way to say which one
a session is in, which is state about state.

**Why not let a second item start while the first waits on review.** It reintroduces exactly
the context this design removes. The cost of waiting is small; the cost of a session
mistaking which item it is building is not.

**What would change this.** Parallel execution, if it is ever adopted across items rather
than within one, needs a different state shape and is a different design.

**Reversed:** partly, across worktrees. Within one checkout this still holds: the spec file
holds one item, and a session in it never wonders which. What changed is that several items
may be in flight at once, one per git worktree, behind `workflow.parallelItems`, which ships
off. That answers the objection above without state about state: a worktree is the item, so a
session there needs nothing to say which one it is in, and the set of items in flight is read
from git's own worktree list and each worktree's spec. The cost moved from resuming to
landing, where the shared plan, overview, ledger and journal conflict as text every time. So
items land one at a time: `complete` takes what already landed and redoes the item's own share
of those files on top, and never merges them as text.
