# Landing on top of what already landed

Used before an item's branch is squash-merged or pushed, when the branch it lands in has moved
since the item began: another item, built in its own worktree, landed first. Both items wrote
the same state files, and a text merge of those conflicts every time, because each holds
bookkeeping derived from its own branch. So the landed copy of each is taken, and this item's
share of it is done again on top.

The **target** is the branch the item lands in: the default branch, or an automated run's
integration branch. Under `pull-request`, fetch it first, which is a network read and asks
outside an automated run, and use the remote-tracking name, such as `origin/main`.

Run each block as **one** command, from the item's checkout, after the work commit. Each runs in
a subshell and sets what it needs. A block that stops ends the landing: report what it printed
and stop.

## 1. Bring in what landed

    (
      root=$(git rev-parse --show-toplevel) || exit 1
      target='<the target>'
      git -C "$root" checkout -q -- religion/context/handoff.md 2>/dev/null
      [ -z "$(git -C "$root" status --porcelain)" ] || { echo "uncommitted changes; make the work commit first"; exit 1; }
      git -C "$root" rev-parse -q --verify "$target^{commit}" >/dev/null || { echo "no such target: $target"; exit 1; }
      if git -C "$root" merge-base --is-ancestor "$target" HEAD; then echo "nothing landed since"; exit 0; fi
      git -C "$root" merge --no-commit --no-ff "$target" >/dev/null 2>&1
      git -C "$root" rev-parse -q --verify MERGE_HEAD >/dev/null || { echo "the merge did not start"; exit 1; }
      for f in build-plan.md context/findings.md learning/journal.md context/project-overview.md context/handoff.md; do
        if git -C "$root" cat-file -e "MERGE_HEAD:religion/$f" 2>/dev/null; then
          git -C "$root" checkout MERGE_HEAD -- "religion/$f" || exit 1
        fi
      done
      left=$(git -C "$root" diff --name-only --diff-filter=U)
      if [ -n "$left" ]; then
        echo "conflicts outside the shared state files:"; echo "$left"
        git -C "$root" merge --abort; exit 1
      fi
      echo "merged; redo this item's share"
    )

`nothing landed since` means the target is already part of the branch: skip the rest. The
handoff is generated and rewritten at the end of every turn, so discarding it loses nothing and
keeps it from blocking the merge.

Taking the target's copy of a shared file resolves that file, conflicted or not. A conflict in
any other file, product code included, is not this routine's to settle: the merge is abandoned,
the branch is exactly as it was, and the paths are reported for review. Never resolve them by
taking either side.

While the merge is open, `HEAD` is this item's own work and `MERGE_HEAD` is what landed.

## 2. Redo this item's share

Edit each file as the landed copy now stands, taking this item's part from `HEAD`'s copy, as
`git show HEAD:religion/<file>` prints it:

| File | This item's share |
| --- | --- |
| `build-plan.md` | tick its line, and its parent once every sub-item is ticked |
| `context/findings.md` | append its entries still `open`, `fixed` or `unverified`, those headed with its prefix, unchanged |
| `learning/journal.md` | append its entry, the one whose `**Archive:**` line names this item's archive |
| `context/project-overview.md` | when its stamp no longer matches the plans, follow $overview to regenerate it |
| `context/handoff.md` | nothing |

Then compare `HEAD`'s ledger with the merge base's,
`git diff $(git merge-base HEAD MERGE_HEAD) HEAD -- religion/context/findings.md`. A change
this item made to an entry that is not its own is not carried, since the landed copy is the one
kept; name each such entry in the report so it can be made again by hand.

Everything else, this item's archive included, merged as git merges it.

## 3. Check, then commit the merge

    (
      root=$(git rev-parse --show-toplevel) || exit 1
      ! git -C "$root" grep -n -e '^<<<<<<< ' -e '^>>>>>>> ' -- . >/dev/null || { echo "conflict markers remain"; exit 1; }
      [ -z "$(git -C "$root" diff --name-only --diff-filter=U)" ] || { echo "unresolved paths remain"; exit 1; }
      echo "ready for Verify"
    )

Run the project's full `Verify` on the result: it is new code, made of both items, and neither
was checked against the other. When it passes, stage the redone files and commit the merge,
with a message that says what was brought in, such as `merge: bring in what landed on main`.
When it fails, abandon the merge with `git merge --abort`, which returns the branch to its work
commit, and stop with the failure: a fix for it is a change of its own, and goes through the
loop.

The `## Landed` record is written after this merge, so its commits and base are the ones the
branch actually carries.
