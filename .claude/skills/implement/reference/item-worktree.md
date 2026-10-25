# Starting an item in its own worktree

Used when `workflow.parallelItems` is `true`, `git.mode` is `branch-per-item` or
`pull-request`, and the spec is a feature from the build plan. The item gets its own git
worktree beside the project, on the branch Step 1 would otherwise create, and its spec moves
there. The main checkout is then idle, and `/feature` can spec the next item from it.

Run each block as **one** command. A command that fails stops the start: report it and stop.

## 1. Check, then create

    (
      root=$(git rev-parse --show-toplevel) || exit 1
      [ "$(git -C "$root" rev-parse --absolute-git-dir)" = "$(git -C "$root" rev-parse --path-format=absolute --git-common-dir)" ] ||
        { echo "not the main checkout: $root"; exit 1; }
      [ -z "$(git -C "$root" status --porcelain -- . ':!religion')" ] ||
        { echo "uncommitted changes outside religion/"; exit 1; }
      branch='<the branch Step 1 names>'
      tree="${root%/*}/${root##*/}.$(printf '%s' "$branch" | tr / -)"
      [ ! -e "$tree" ] && [ ! -L "$tree" ] || { echo "already exists: $tree"; exit 1; }
      ! git -C "$root" show-ref --verify --quiet "refs/heads/$branch" || { echo "branch exists: $branch"; exit 1; }
      git -C "$root" worktree add -q -b "$branch" "$tree" HEAD || exit 1
      echo "$tree"
    )

Started from inside a linked worktree, the first check stops: that worktree is an item already,
and a second one made from it would land on top of it. Work outside `religion/` that is not
committed would stay behind in the main checkout, so it stops too; the spec and the other state
files are what moves or stays, below.

The path is the project's directory name, a dot, and the branch with each `/` as `-`, in the
project's parent directory: `religion` building `feature/export-reports` gets
`religion.feature-export-reports`. Landing the item later looks for it there, so never choose
another. A path or branch that already exists is an earlier start that did not finish,
or another item's: stop and say which, never reuse or replace it.

Every later command names `$tree` by the path the block printed.

## 2. Copy what git does not carry

A new worktree has only what git tracks. Copy the installer's output that git ignores, each
only when it exists in the main checkout and is ignored there:

    for f in .claude/settings.json .claude/settings.local.json .claude/hooks; do
      [ -e "$root/$f" ] && git -C "$root" check-ignore -q "$f" || continue
      mkdir -p "$tree/$(dirname "$f")" && cp -RPp "$root/$f" "$tree/$f" || exit 1
    done

When `religion/` itself is ignored, which `doctor` reports as "state is local only", copy it
too, all but `religion/.state/`: each worktree keeps its own activity record.

    git -C "$root" check-ignore -q religion &&
      (cd "$root/religion" && find . -path ./.state -prune -o -type f -print) |
      while IFS= read -r f; do
        mkdir -p "$tree/religion/$(dirname "$f")" && cp -Pp "$root/religion/$f" "$tree/religion/$f" || exit 1
      done

Then link each installed dependency directory at the project root that the gate needs, such
as `node_modules`, exactly as the wave routine's Link phase does in `worktrees.md`, never
installing into the worktree: that is a dependency install, which needs its own yes.

## 3. Move the spec

Copy the spec in, confirm the copy, and only then reset the main checkout's:

    cp -p "$root/religion/context/current-work.md" "$tree/religion/context/current-work.md" &&
      cmp -s "$root/religion/context/current-work.md" "$tree/religion/context/current-work.md" || exit 1

Reset the main checkout's `religion/context/current-work.md` to its stub, exactly as shipped,
as `/complete` does. The spec now lives only in the worktree. That is a move, not a
deletion: if the copy did not match, nothing is reset.

## 4. Confirm

From the main checkout, `religion status` lists the item under `inFlight` with its branch and
`here` false, and reports nothing active. From the worktree, it reports the item as active, and
`religion doctor` passes, naming the main checkout in its git check. Without the `religion`
command, the handoff and the two specs say the same.

From here on, every file and command of this item is the worktree's. Removing the worktree is
deleting files, so it asks, every time.
