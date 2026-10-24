# Do steps marked independent stay apart when each builds in its own worktree?

**For:** item 27
**Settled:** yes

## Question

When a spec marks steps `(with N)`, can each be built and gated in its own git worktree and
the results joined into one packet without a conflict? The answer is yes, no, or yes under
named conditions.

Good enough meant two real, disjoint skill edits built and gated separately in this
repository, then joined onto a clean base, with the joined tree passing `npm test`.

## Answer

Yes, under four conditions. The authored sources stay apart; the generated output does not.

1. **Join sources, then render once.** Two steps that edit different files under
   `src/skills/` still both rewrite the roster in `AGENTS.md` (and `CLAUDE.md`), so their
   full diffs conflict. Joining only the authored files and running the build once on the
   joined tree is clean, and renders byte-for-byte what each worktree rendered alone.
   Rendered and staged paths are therefore never part of what a wave step hands back, and
   implement's "two steps change the same file" refusal has to count authored files only,
   or every skill wave in this repository is refused.
2. **A worktree is not ready to gate.** It has no `node_modules` and no gitignored
   `template/`, so `npm test` fails on a fresh checkout before any change is made. A
   symlink to the main tree's `node_modules` plus `npm run build` made it pass. Installing
   per worktree would be a dependency install, a second-tier action, so linking is the
   approach the spec should take.
3. **The base must include unfinished steps.** A worktree checks out a commit. Under
   `git.checkpoints: none`, earlier steps sit uncommitted and would be missing. Running
   `git stash create` gives a commit of the working tree without touching the stash list,
   any ref, or the working tree, and a detached worktree on it carries those edits.
4. **Detached, outside the project, removed afterwards.** `git worktree add --detach`
   creates no branch, which keeps `trunk` mode honest. Removing a worktree is a deletion, so
   the run removes only worktrees it created, and unlinks the `node_modules` symlink first.

## Evidence

Run on 2026-10-24 against `a83ec3f`, in detached worktrees under the session scratchpad.

| Probe | Command | Result |
| --- | --- | --- |
| Fresh worktree gates | `npm test` on clean `HEAD` | fail: `rendered output matches its source`, 81 stale files under `template/`; then `the template is not built` |
| After link and build | `ln -s` node_modules, `npm run build`, `npm test` | exit 0 in all three worktrees |
| Step A alone | `check` summary and body edited, built, gated | exit 0; touched `src/skills/check`, both rendered `check` trees, `AGENTS.md` |
| Step B alone | `debug` summary and body edited, built, gated | exit 0; touched `src/skills/debug`, both rendered `debug` trees, `AGENTS.md` |
| Full diffs joined | `git apply a.patch`, then `git apply --3way b.patch` | `error: patch failed: AGENTS.md:61`; B rejected whole |
| Sources joined | `git diff -- src` per worktree, applied in turn, `npm run build` | both applied; `npm test` exit 0 |
| Render fidelity | `diff` of each rendered skill, joined against its own worktree | identical for both |
| Uncommitted base | `git stash create`, `git worktree add --detach` on it | plan edits present; `git stash list` count 0 before and after; working tree unchanged |

The roster lines that collided were `AGENTS.md:61` (`check`) and `:64` (`debug`), within
each other's patch context.

## What this means for item 27

- A wave step returns a patch of authored files only. The parent applies them in step
  order, renders once, then runs each step's gate on the joined tree.
- A join that fails to apply is a stop for review, as the plan line says, never a merge
  resolved by the agent.
- Worktree setup (stash-create base, detached add, linked `node_modules`, build) and its
  teardown are one shared routine, not prose repeated per adapter.
- Off the table: returning full diffs, `git merge` of per-step branches (branches, and
  rendered conflicts), and a fresh `npm install` per worktree.

## Not tested

- `git stash create` leaves out untracked files, so a new file from an unfinished earlier
  step would be missing from the base. Needs a check, or adding them with `git add -N` first.
- Edits in a project whose generated files are committed but not produced by Religion's
  renderer, such as a lockfile two steps both touch.
- Three-step waves, and a wave whose steps change the same authored file in different
  hunks (implement already refuses these).
- Codex, Copilot and OpenCode subagents running inside a worktree path; only the git side
  was exercised.
- Windows, where the `node_modules` link would be a junction.

Budget: one hour; took about 25 minutes.
