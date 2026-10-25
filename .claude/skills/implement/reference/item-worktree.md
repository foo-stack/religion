# Starting an item in its own worktree

Used when `workflow.parallelItems` is `true`, `git.mode` is `branch-per-item` or
`pull-request`, the spec is a feature from the build plan, and no automated run is underway.
The item gets its own git worktree beside the project, on the branch Step 1 would otherwise
create, and its spec moves there. The main checkout is then idle, and `/feature` can spec
the next item from it.

Run each block as **one** command. Each runs in a subshell, so a stop ends that block and never
the shell a tool keeps between commands, and nothing set in one block survives into the next:
each sets what it needs. A block that stops ends the start: report what it printed and stop.

A branch whose name holds a `'` is refused before anything runs, since the blocks quote it.

## 1. Check, then create

    (
      root=$(git rev-parse --show-toplevel) || exit 1
      [ "$(git -C "$root" rev-parse --absolute-git-dir)" = "$(git -C "$root" rev-parse --path-format=absolute --git-common-dir)" ] ||
        { echo "not the main checkout: $root"; exit 1; }
      [ -z "$(git -C "$root" status --porcelain -- . ':!religion/context/current-work.md' ':!religion/context/handoff.md')" ] ||
        { echo "uncommitted changes beyond the spec"; exit 1; }
      branch='<the branch Step 1 names>'
      tree="${root%/*}/${root##*/}.$(printf '%s' "$branch" | tr / -)"
      [ ! -e "$tree" ] && [ ! -L "$tree" ] || { echo "already exists: $tree"; exit 1; }
      ! git -C "$root" show-ref --verify --quiet "refs/heads/$branch" || { echo "branch exists: $branch"; exit 1; }
      git -C "$root" worktree add -q -b "$branch" "$tree" HEAD || exit 1
      echo "$tree"
    )

Started from inside a linked worktree, the first check stops: that worktree is an item already,
and a second one made from it would land on top of it. Anything uncommitted but the spec and
the generated handoff stops it too, settings and plan edits included, since the worktree is
made from `HEAD` and would run without them. Commit them first.

The path is the project's directory name, a dot, and the branch with each `/` as `-`, in the
project's parent directory: `religion` building `feature/export-reports` gets
`religion.feature-export-reports`. Landing the item later looks for it there, so never choose
another. A path or branch that already exists is another item's, or a start that stopped after
this block: when the path is a worktree on this item's branch and the main checkout still holds
the spec, go on to block 2; otherwise stop and say which, never reusing or replacing it.

## 2. Copy what git does not carry, then move the spec

Safe to run again. Set `tree` to the path block 1 printed:

    (
      root=$(git rev-parse --show-toplevel) || exit 1
      tree='<the path block 1 printed>'
      [ "$(git -C "$tree" rev-parse --show-toplevel)" = "$tree" ] || { echo "not a worktree: $tree"; exit 1; }
      for f in .claude/settings.json .claude/settings.local.json .claude/hooks; do
        if [ -e "$root/$f" ] && git -C "$root" check-ignore -q "$f"; then
          mkdir -p "$tree/$(dirname "$f")" && cp -RPp "$root/$f" "$tree/$f" || exit 1
        fi
      done
      if git -C "$root" check-ignore -q religion; then
        (cd "$root/religion" && find . -path ./.state -prune -o -type f -print) > "$tree.files" || exit 1
        while IFS= read -r f; do
          mkdir -p "$tree/religion/$(dirname "$f")" && cp -Pp "$root/religion/$f" "$tree/religion/$f" || exit 1
        done < "$tree.files"
        rm -f "$tree.files"
      fi
      for d in node_modules; do
        [ -d "$root/$d" ] || continue
        [ -e "$tree/$d" ] || [ -L "$tree/$d" ] || ln -s "$root/$d" "$tree/$d" || exit 1
        git -C "$tree" check-ignore -q "$d" || printf '/%s\n' "$d" >> "$(git -C "$root" rev-parse --path-format=absolute --git-path info/exclude)" || exit 1
      done
      mkdir -p "$tree/religion/context" &&
        cp -p "$root/religion/context/current-work.md" "$tree/religion/context/current-work.md" &&
        cmp -s "$root/religion/context/current-work.md" "$tree/religion/context/current-work.md" || exit 1
      echo "copied"
    )

The installer's output that git ignores is copied only where git ignores it; a tracked copy is
already in the worktree. When `religion/` itself is ignored, which `doctor` reports as "state is
local only", every state file but `religion/.state/` is copied, since each worktree keeps its own
activity record. The list of files is written beside the worktree, not piped, so a failed copy
stops the block in every shell.

Each installed dependency directory at the project root that the gate needs is linked, never
installed: an install needs its own yes. Name each one in the `for d` list; `node_modules` is the
usual one. A pattern such as `node_modules/` matches a directory but not a link to one, so a link
git would not ignore is added to the repository's own exclude file, which is never committed;
without that, the link would be committed with the item's work.

## 3. Reset the main checkout's spec

Only after block 2 printed `copied`: reset the main checkout's
`religion/context/current-work.md` to its stub, exactly as shipped, as `/complete` does.
The spec now lives only in the worktree. That is a move, not a deletion: if the copy did not
match, nothing is reset, and the spec is still where it was.

## 4. Confirm

From the main checkout, `religion status` lists the item under `inFlight` with its branch and
`here` false, and reports nothing active. From the worktree, it reports the item as active, and
`religion doctor` there names the main checkout in its git check. Without the `religion`
command, the handoff and the two specs say the same.

From here on, every file and command of this item is the worktree's. Removing the worktree is
deleting files, so it asks, every time.
