# Building a wave in worktrees

One detached git worktree per wave step, outside the project, so a step can neither see nor
change another step's files. The parent runs every command here; a step's subagent only
works inside the worktree it is given.

Run the phases in order. A command that fails stops the wave: report it and stop, as for any
failed step.

## 1. Base

Take the base once per wave, after every earlier step has landed:

    base=$(git stash create)
    [ -n "$base" ] || base=$(git rev-parse HEAD)

`git stash create` makes a commit of the working tree without touching the stash list, any
ref, or the working tree, so uncommitted earlier steps are part of the base. An empty result
means the tree is clean, and `HEAD` is the base.

Never `git stash push`, and never `git add -N` in the project: the user's index and stash
are not the wave's to change.

## 2. Create

    wave=$(mktemp -d)
    git worktree add --detach "$wave/step-<n>" "$base"

One `mktemp -d` per wave, one worktree per step, named for the step's number. `--detach`
creates no branch, whatever `git.mode` says. Keeping the worktrees outside the project keeps
a second copy of the source out of the project's own tests, linters and file watchers.

The stash commit leaves untracked files out, so copy them in:

    git ls-files --others --exclude-standard -z |
      while IFS= read -r -d '' f; do
        mkdir -p "$wave/step-<n>/$(dirname "$f")" && cp -RPp "$f" "$wave/step-<n>/$f"
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
      ln -s "$PWD/node_modules" "$wave/step-<n>/node_modules"

Skip the link when anything already sits at that path, such as an untracked link copied in
phase 2. `ln -s` onto an existing link to a directory does not replace it: it creates a new
link inside the directory it points at, which here is the project's real dependencies.

Never install into a worktree. That is a dependency install, which the Authority section
does not grant a wave. On Windows the link would be a junction, which this routine has not
been run against.

## 4. Build

When the project's gate reads build output that is not committed, run the project's build in
the worktree before handing it to the subagent, so the step's checks can run there at all.

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

All patches, in step order, through **one** `git apply`:

    cat "$wave"/step-<n>.patch "$wave"/step-<m>.patch | git apply

One concatenated input applies all or nothing, including two patches to the same file.
Separate patch files given to one `git apply` do not: the first lands even when a later one
fails. Never `--3way`, never a merge, and never resolve a conflict by editing.

On failure the project is exactly as it was. Stop the wave, keep the worktrees, and report
the paths `git apply` named and where each worktree is.

On success, run the project's build once when any path was excluded, so generated output is
rendered from the joined sources, then run each step's gate on the joined tree.

## 7. Teardown

Only after a successful join, and only for worktrees this run created for this wave:

    rm "$wave/step-<n>/node_modules"
    git worktree remove --force "$wave/step-<n>"
    rm "$wave/step-<n>.patch" "$wave/step-<n>.base"
    rmdir "$wave"

Remove each link first, so nothing follows it into the project's real dependencies. Removing
any other worktree, or these after a failed join, still asks.
