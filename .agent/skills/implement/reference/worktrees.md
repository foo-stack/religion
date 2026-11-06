# Building a wave in worktrees

One detached git worktree per wave step, outside the project, so a step can neither see nor
change another step's files. The parent runs every command here; a step's subagent only
works inside the worktree it is given.

Run the phases in order. A command that fails stops the wave: report it and stop, as for any
failed step.

## 1. Base

Once per wave, after every earlier step has landed, take the base, make the wave's directory,
and save the values every later phase needs. Run these lines as **one** command: the save
needs the values the first lines produce, and a fresh shell would have none of them.

    (
      root=$(git rev-parse --show-toplevel) || exit 1
      case "$root" in */step-*) [ ! -f "${root%/*}/base" ] || exit 1;; esac
      [ ! -e "$root/religion/.state/wave" ] || { cat "$root/religion/.state/wave"; exit 1; }
      base=$(git -C "$root" stash create) || exit 1
      [ -n "$base" ] || base=$(git -C "$root" rev-parse HEAD) || exit 1
      wave=$(mktemp -d) && wave=$(cd -- "$wave" >/dev/null && pwd -P) || exit 1
      printf '%s\n' "$base" > "$wave/base" || exit 1
      mkdir -p "$root/religion/.state" && printf '%s\n' "$wave" > "$root/religion/.state/wave" || exit 1
    )

Each line that can fail stops the block, rather than `set -e`, which would stay on in a tool
that keeps one shell between commands. The block runs in a subshell, so its exits end only
the subshell and never that shell; it hands nothing back, since every later phase reads the
saved values. The `cd` sends its output away so a shell hook that prints on a directory change
cannot end up in the saved path. Without the stops, a failed `mktemp` leaves `wave`
empty, `cd ""` stays in the project, and the block saves the project itself as the wave; a
failed `git stash create` falls back to `HEAD` and drops uncommitted earlier steps.

A saved wave that already exists means an earlier one was not torn down, which is what a
failed join leaves. The block prints the directory it names and stops, so the record of where
those worktrees are is never overwritten; deal with them first.

Every command that touches the project runs against `$root`, never the current directory.
From a subdirectory, `git apply` skips every path outside it and still exits 0, and
`git ls-files` lists only what is below it, so a wave started there would join nothing and
then tear down the work as if it had landed.

`git stash create` makes a commit of the working tree without touching the stash list, any
ref, or the working tree, so uncommitted earlier steps are part of the base. An empty result
means the tree is clean, and `HEAD` is the base.

Never `git stash push`, and never `git add -N` in the project: the user's index and stash
are not the wave's to change.

## 2. Create

`pwd -P` saves the resolved path, the form `git rev-parse` reports, so the check below can
compare the two. A shell that does not keep variables between commands starts each later
phase by reading the values back, and stops if the current directory has drifted into one of
the wave's own worktrees:

    root=$(git rev-parse --show-toplevel)
    case "$root" in */step-*) [ ! -f "${root%/*}/base" ] || exit 1;; esac
    wave=$(cat "$root/religion/.state/wave")
    base=$(cat "$wave/base")
    case "$root/" in "$wave"/*) exit 1;; esac

From inside a worktree, `root` would be that worktree, and the join would land there and
report success while the project stayed unchanged. The first `case` stops in a step worktree
of any wave, including one kept by an earlier failed join, recognised by the `base` file in
the wave directory beside it; the second stops in one of this wave's own. A linked worktree
the user works from is neither, so it is not refused.

Then, once per step, named for the step's number:

    git -C "$root" worktree add --detach "$wave/step-<n>" "$base"

`--detach` creates no branch, whatever `git.mode` says. Keeping the worktrees outside the
project keeps a second copy of the source out of the project's own tests, linters and file
watchers.

The stash commit leaves untracked files out, so copy them in, all but the workflow's own
state, which would carry the saved wave path into the worktree:

    git -C "$root" ls-files --others --exclude-standard -z |
      while IFS= read -r -d '' f; do
        case "$f" in religion/.state/*) continue;; esac
        mkdir -p "$wave/step-<n>/$(dirname "$f")" && cp -RPp "$root/$f" "$wave/step-<n>/$f"
      done

`-RP` copies an untracked link as a link. Plain `cp` refuses a link to a directory, and
following it would copy whatever it points at.

Then make the copies part of the step's base, so they are not handed back as new files:

    git -C "$wave/step-<n>" add -A
    git -C "$wave/step-<n>" write-tree > "$wave/step-<n>.base"

`write-tree` saves a tree object and nothing else: no commit, no ref. The saved file is the
base phase 5 diffs against, and it survives a shell that does not keep variables between
commands.

## 3. Link

A fresh worktree has none of the project's installed dependencies. Symlink each installed
dependency directory at the project root that the gate needs, such as `node_modules`:

    [ -e "$wave/step-<n>/node_modules" ] || [ -L "$wave/step-<n>/node_modules" ] ||
      ln -s "$root/node_modules" "$wave/step-<n>/node_modules"

Skip the link when anything already sits at that path, such as an untracked link copied in
phase 2. `ln -s` onto an existing link to a directory does not replace it: it creates a new
link inside the directory it points at, which here is the project's real dependencies.

Never install into a worktree. That is a dependency install, which the Authority section
does not grant a wave. On Windows the link would be a junction, which this routine has not
been run against.

## 4. Build

When the project's gate reads build output that is not committed, run the project's build in
the worktree before handing it to the subagent, so the step's checks can run there at all.
Run it in a subshell, `(cd "$wave/step-<n>" && <build>)`, so the current directory never
moves into the worktree.

## 5. Extract

When the subagent returns, take its patch:

    git -C "$wave/step-<n>" add -A
    git -C "$wave/step-<n>" diff --cached --binary "$(cat "$wave/step-<n>.base")" -- . <exclusions> > "$wave/step-<n>.patch"

`add -A` writes to the worktree's own index, never the project's, and brings new files into
the patch. `<exclusions>` is one `':!<path>'` for each link made in phase 3, which an ignore
rule with a trailing slash such as `node_modules/` does not cover, because a link is not a
directory. Then one more for each path the project's instructions declare as generated, such
as rendered trees, so two steps that both regenerate a shared file do not
collide over output the build reproduces. A project that declares none keeps every path, and
a generated file that both steps touched then fails the join and stops it.

## 6. Join

All patches, in step order, through **one** `git apply` of one file:

    for p in "$wave"/step-<n>.patch "$wave"/step-<m>.patch; do [ -f "$p" ] || exit 1; done
    cat "$wave"/step-<n>.patch "$wave"/step-<m>.patch > "$wave/join.patch"
    git -C "$root" apply "$wave/join.patch"

Check that every step's patch exists first, and never pipe into `git apply`: without
`pipefail` a pipe reports `git apply`'s status alone, so a missing patch would land the
others as a success and teardown would delete the step that never applied.

One concatenated input applies all or nothing, including two patches to the same file.
Separate patch files given to one `git apply` do not: the first lands even when a later one
fails. Never `--3way`, never a merge, and never resolve a conflict by editing.

On failure the project is exactly as it was. Stop the wave, keep the worktrees, and report
the paths `git apply` named and where each worktree is.

On success, run the project's build once when any path was excluded, so generated output is
rendered from the joined sources, then run each step's gate on the joined tree.

## 7. Teardown

Only after a successful join, and only for worktrees this run created for this wave. Once per
step:

    rm "$wave/step-<n>/node_modules"
    git worktree remove --force "$wave/step-<n>"
    rm "$wave/step-<n>.patch" "$wave/step-<n>.base"

Then once for the wave:

    rm "$wave/join.patch" "$wave/base"
    rmdir "$wave"
    rm "$root/religion/.state/wave"

Remove each link first, so nothing follows it into the project's real dependencies. Removing
any other worktree, or these after a failed join, still asks.
