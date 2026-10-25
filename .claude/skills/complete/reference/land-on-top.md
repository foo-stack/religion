# Landing on top of what already landed

Used before an item's branch is squash-merged or pushed, when the branch it lands in has moved
since the item began: another item, built in its own worktree, landed first. Both items wrote
the same state files, and a text merge of those conflicts every time, because each holds
bookkeeping derived from its own branch. So the landed copy of each is taken, and this item's
share of it is done again on top.

The **target** is the branch the item lands in: the default branch, or an automated run's
integration branch. Under `pull-request`, fetch it first, which is a network read and asks
outside an automated run, and use the remote-tracking name, such as `origin/main`.

The merge this makes is a commit on the item's own branch, like the work commit, and is covered
by the same yes; it never writes the target.

Run each block as **one** command, from the item's checkout, after the work commit. Each runs in
a subshell and sets what it needs. A block that stops ends the landing: report what it printed
and stop. A stop after block 1 leaves the merge open: either put right what the block named and
run it again, or abandon the merge with the block in "Abandoning the merge" below, never with
`git merge --abort` alone.

## 1. Bring in what landed

    (
      root=$(git rev-parse --show-toplevel) || exit 1
      target='<the target>'
      [ -z "$(git -C "$root" status --porcelain -- . ':!religion/context/handoff.md')" ] ||
        { echo "uncommitted changes; make the work commit first"; exit 1; }
      git -C "$root" checkout -q -- religion/context/handoff.md 2>/dev/null
      git -C "$root" rev-parse -q --verify "$target^{commit}" >/dev/null || { echo "no such target: $target"; exit 1; }
      if git -C "$root" merge-base --is-ancestor "$target" HEAD; then echo "nothing landed since"; exit 0; fi
      git -C "$root" merge --no-commit --no-ff "$target"
      git -C "$root" rev-parse -q --verify MERGE_HEAD >/dev/null || { echo "the merge did not start"; exit 1; }
      base=$(git -C "$root" merge-base HEAD MERGE_HEAD)
      for f in build-plan.md context/findings.md learning/journal.md context/project-overview.md context/handoff.md; do
        p="religion/$f"
        git -C "$root" diff --quiet "$base" MERGE_HEAD -- "$p" && continue
        if git -C "$root" cat-file -e "MERGE_HEAD:$p" 2>/dev/null; then
          git -C "$root" checkout MERGE_HEAD -- "$p" || exit 1
          echo "taken as landed: $p"
        else
          git -C "$root" rm -q -f --ignore-unmatch -- "$p" || exit 1
          echo "no longer tracked by the target: $p"
        fi
      done
      left=$(git -C "$root" diff --name-only --diff-filter=U)
      if [ -n "$left" ]; then
        echo "conflicts outside the shared state files:"; echo "$left"
        git -C "$root" merge --abort; exit 1
      fi
      echo "merged; redo this item's share of each file taken as landed"
    )

`nothing landed since` means the target is already part of the branch: skip the rest. Only a
shared file the target changed since the item began is taken from it; one it left alone merges
as usual, carrying this item's changes with nothing to redo. A shared file the target stopped
tracking is removed, as the target has it; this item's copy is still in `HEAD`. The handoff is generated and rewritten at the end of every turn, so discarding it loses nothing.

Taking the target's copy of a shared file resolves that file, conflicted or not. A conflict in
any other file, product code included, is not this routine's to settle: the merge is abandoned,
the branch is exactly as it was, and the paths are reported for review. Never resolve them by
taking either side.

While the merge is open, `HEAD` is this item's own work and `MERGE_HEAD` is what landed.

## 2. Redo this item's share

For each file block 1 took as landed, edit it as it now stands, taking this item's part from
`HEAD`'s copy, as `git show HEAD:religion/<file>` prints it:

| File | This item's share |
| --- | --- |
| `build-plan.md` | a feature ticks its line, and its parent once every sub-item is ticked; a rollback unticks its target and adds its note; a fix or refactor campaign has none |
| `context/findings.md` | append each entry `HEAD`'s copy holds that the merge base's did not, still `open`, `fixed` or `unverified`, unchanged; one whose identifier the landed copy already holds, two fixes' bare `F-1` say, takes its permanent prefixed form, the archive's name before it as completion would archive it, and the rename is reported; when the landed copy is the stub, replace its placeholder line |
| `learning/journal.md` | append its entry, the one whose `**Archive:**` line names this item's archive |
| `context/project-overview.md` | none: left as landed, and stale until /overview runs, as after any completion |
| `context/handoff.md` | none |

Then compare `HEAD`'s ledger with the merge base's,
`git diff $(git merge-base HEAD MERGE_HEAD) HEAD -- religion/context/findings.md`. A change this
item made to an entry it did not add is not carried, since the landed copy is the one kept; name
each such entry in the report so it can be made again by hand.

Everything else, this item's archive included, merged as git merges it.

## 3. Check, then commit the merge

Stage the redone files, so the merge can still be abandoned cleanly, then check them:

    (
      root=$(git rev-parse --show-toplevel) || exit 1
      for f in build-plan.md context/findings.md learning/journal.md context/project-overview.md context/handoff.md; do
        [ -e "$root/religion/$f" ] && git -C "$root" ls-files --error-unmatch -- "religion/$f" >/dev/null 2>&1 &&
          { git -C "$root" add -- "religion/$f" || exit 1; }
      done
      for f in build-plan.md context/findings.md learning/journal.md; do
        ! grep -n -e '^<<<<<<< ' -e '^>>>>>>> ' -- "$root/religion/$f" 2>/dev/null || { echo "conflict markers in religion/$f"; exit 1; }
      done
      [ -z "$(git -C "$root" diff --name-only --diff-filter=U)" ] || { echo "unresolved paths remain"; exit 1; }
      echo "ready for Verify"
    )

Only the files edited by hand are searched: git leaves no markers in a file it merged cleanly,
and a document elsewhere may show one on purpose.

Run the project's full `Verify` on the result: it is new code, made of both items, and neither
was checked against the other. A turn that ends before the merge is committed has its handoff
rewritten by the hook; run block 3 again before committing, which stages it only while the index
still tracks it.

When `Verify` passes, commit the merge with a message that says what was brought in, such as
`merge: bring in what landed on main`.

When it fails, abandon the merge with the block below, which returns the branch to its work
commit, and stop with the failure. The item is complete on its branch but cannot land as it
stands: the way forward is /fix here, describing the failure, built on this branch.
Completing that fix lands both through this routine: block 2 then redoes the share of both, the
item's and the fix's, every row, each taken from `HEAD`, and the `## Landed` record goes into
both archives with the one range they share, each saying it is shared.

## Abandoning the merge

    (
      root=$(git rev-parse --show-toplevel) || exit 1
      git -C "$root" rev-parse -q --verify MERGE_HEAD >/dev/null || { echo "no merge open"; exit 0; }
      for f in build-plan.md context/findings.md learning/journal.md context/project-overview.md context/handoff.md; do
        [ -e "$root/religion/$f" ] && git -C "$root" ls-files --error-unmatch -- "religion/$f" >/dev/null 2>&1 &&
          { git -C "$root" add -- "religion/$f" || exit 1; }
      done
      git -C "$root" diff --name-only | sort -u | sed 's/^/set back: /'
      git -C "$root" checkout -q -f -- . || exit 1
      git -C "$root" diff --cached --name-only --diff-filter=D HEAD | while IFS= read -r f; do
        [ -e "$root/$f" ] || [ -L "$root/$f" ] || continue
        echo "cleared, held in HEAD: $f"; rm -f -- "$root/$f" || exit 1
      done || exit 1
      git -C "$root" merge --abort || exit 1
      echo "back at the work commit"
    )

`git merge --abort` refuses while a file the merge touched has changes that are not staged: a
share redone by hand, or a handoff the hook rewrote at the end of a turn. Staging each shared file
the index tracks first, as block 3 does, keeps the redone shares. Anything else changed since,
output a run of `Verify` regenerated or an edit made while the merge was open, is set back to the
merge's staged copy, and each such path is printed first, so nothing goes unreported; the tree was
clean when block 1 started, so none of it is this item's committed work. The `-f` skips paths
still in conflict, which the abort itself clears. A path the merge removed, a shared file the
target stopped tracking among them, that something wrote again would stop the abort from
restoring `HEAD`'s copy, so it is cleared and named; `HEAD` holds this item's own. With no merge
open, the block does nothing.

## 4. Record what landed

When a merge was made, the item's `## Landed` record names the last such merge's second parent,
the target it brought in, as **Base**, and that merge commit and anything after it as **Commits**:
`git diff` from that base to the last commit is then this item's work alone, which is what a
rollback reverses. Without a merge, the record is as `/complete` describes. Commit the
record: in a worktree, an uncommitted file goes when the worktree is removed.

## When the state directory is ignored

Then none of these files are in git, and the merge carries none of them: this item's archive,
plan tick, journal entry and ledger exist only in its worktree's copy of `religion/`. Before
the worktree can be removed, redo this item's share, as the table in block 2 lists it, in the
main checkout's own `religion/` files, and copy this item's archive there. When this landing
follows a failed `Verify`, that is the share and the archive of both, the item's and the fix's. With no `HEAD` copy
or merge base in git, the worktree's own files are this item's part, and the ledger saved when
the worktree was made, `religion/.state/findings-at-start.md` in it, is the base: an entry the
worktree's ledger holds that the saved one did not is this item's. Comparing the two also shows
each entry this item changed or removed, a repair it closed and pruned among them: make the
same change in the main checkout's ledger, or name the entry in the report, so a finding this
item closed does not stay open there. Removing the worktree deletes ignored files with it, so
until then they are the only record.
