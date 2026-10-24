# Waves built in isolation

**Type:** Feature
**From build plan:** item 27
**Status:** verified
**Approved:** 2026-10-24, 144d9689a66f4f1e

## Goal

With `workflow.parallelSteps` on, each step of a wave builds in its own detached git worktree
outside the project, hands back a patch of the files it authored, and the parent joins those
patches in one atomic apply, renders once, gates each step on the joined tree, and reviews
the wave as one packet. A join that does not apply stops for review with nothing changed.
Today a wave's subagents all share one working tree, so "independent" is only asserted; after
this it is enforced, because a step cannot see or touch another step's files.

Grounded in `religion/history/spikes/do-wave-steps-stay-apart-in-their-own-worktrees.md`.

## In scope

- A worktree routine for implement: base, create, link dependencies, build, extract the
  patch, tear down
- The wave section of implement rewritten around it: refusal by authored files, atomic join,
  render once, per-step gate on the joined tree, failed join stops with worktrees kept
- One sentence in the Authority section letting a run remove the worktrees it created for a
  wave, and nothing else
- The wave description in `docs/architecture/config.md` and the review-cadence partial

## Out of scope

- Steps that change the same authored file. Implement already refuses those waves; that
  stays.
- `doctor` or `status` noticing worktrees left behind by an interrupted wave. Reported in the
  packet instead; a later fix if it bites.
- Windows, where the dependency link would be a junction. Unverified; the routine says so.
- Turning `workflow.parallelSteps` on in this project's own `religion/config.json`.
- Running several work items at once (item 39).

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - the worktree routine** - new `src/skills/implement/reference/worktrees.md`
  holding the exact commands, in order, for one wave:
  base, create, link, build, extract, teardown (contract below). *Done when:* the file renders
  to `.claude/skills/implement/reference/worktrees.md` and
  `.agents/skills/implement/reference/worktrees.md`, and `npm test` exits 0.
- [x] **Step 2 - implement builds waves in worktrees** - rewrite "Building a wave" in
  `src/skills/implement/SKILL.md` to use the routine; change the same-file refusal to count
  authored files only; add the join (one `git apply` of the concatenated patches, in step
  order), render once, gate each step on the joined tree, and the failed-join stop. A step
  that fails its gate on the joined tree leaves its patch applied for review, as a failed
  step does today. Leave the failure, packet, and off-by-default paragraphs as they are. *Done when:* the rendered
  `.claude/skills/implement/SKILL.md` links `reference/worktrees.md` and names the join
  command, a wave of two that joins cleanly ends in one packet, and `npm test` exits 0.
- [x] **Step 3 - the authority carve-out** - one sentence under the first tier in
  `src/entry/partials/authority.md`: removing a detached worktree the current run created for
  a wave, outside the project, after its join succeeded, is not deleting files or data;
  removing any other worktree still asks. *Done when:* `CLAUDE.md` and `AGENTS.md` carry the
  sentence after `npm run build:skills:link`, and `npm test` exits 0.
- [x] **Step 4 - describe isolation where waves are described** (with 3) -
  `docs/architecture/config.md` "Parallel steps" and `src/entry/partials/review-cadence.md`
  say each wave step builds in its own worktree and a failed join stops for review.
  *Done when:* both read that way in the rendered entry files and `npm test` exits 0.
- [x] **Step 5 - patches leave out the copied untracked files** - in
  `src/skills/implement/reference/worktrees.md`, stage the copied untracked files in each
  worktree right after phase 2 and save that tree with `git write-tree` as the step's diff
  base; phase 5 diffs against it; teardown also removes the saved patch and base files so the
  `mktemp` directory is empty. *Done when:* a clean two-step wave run by the rendered routine,
  in a project with untracked files, gives patches holding only each step's own edit, joins,
  passes `npm test` on the joined tree, and leaves no wave directory or worktree behind.
- [x] **Step 6 - untracked links survive the copy** - in
  `src/skills/implement/reference/worktrees.md`, phase 2 copies each untracked path with
  `cp -RPp`, so a link is copied as a link, and phase 3 links a dependency directory only
  when nothing, link or otherwise, already sits at that path in the worktree. *Done when:* a
  clean two-step wave run by the rendered routine, from a project whose untracked files
  include a link to its `node_modules` directory, joins and passes `npm test` on the joined
  tree, and the real `node_modules` has the same entries before and after.
- [x] Repair F-161 - a join run from a subdirectory applies nothing, reports success, and teardown deletes the work. In `src/skills/implement/reference/worktrees.md`, take the repository root once in phase 1 and run every project-side command against it: the untracked listing and copy, the dependency link, and the join's `git apply`; save the wave path under the state directory so later commands re-read it instead of trusting a shell variable. *Done when:* a clean two-step wave run by the rendered routine from a subdirectory of the project joins both patches into the project, and `npm test` exits 0.
- [x] Repair F-162 - a missing patch is hidden by the join's pipe. In the same file, the join checks every patch file exists, concatenates them into one file, and applies that file, with no pipe. *Done when:* with one step's patch file missing, the join stops with the project unchanged, and a clean wave still joins.
- [x] Repair F-179 - a re-read from inside a step's worktree resolves the root to that worktree. In `src/skills/implement/reference/worktrees.md`, phase 2 skips the state directory when copying untracked files, every re-read stops when the root it resolves sits inside the wave directory, and the build runs in a subshell. *Done when:* from inside a step's worktree the re-read stops before any apply, and a clean wave run from the project root still joins and passes `npm test`.
- [x] Repair F-181 - the re-read does not restore the base, and the `mktemp` sits beside the per-step command. In the same file, the base is saved in the wave directory and re-read, and the once-per-wave lines are shown apart from the per-step ones. *Done when:* each step's worktree is created in a fresh shell from the saved values, and the wave joins.
- [x] Repair F-183 - a wave started from a worktree an earlier wave kept joins into it. In `src/skills/implement/reference/worktrees.md`, the once-per-wave block and every re-read stop when the root is a step worktree of any wave, recognised by a `base` file beside it. *Done when:* starting a wave from inside a kept worktree of an earlier wave stops before anything is created, and a clean wave from the project root still joins and passes `npm test`.
- [x] Repair F-184 - the save step needs phase 1's values. In the same file, phase 1's lines and the save are one block. *Done when:* that block run as one fresh-shell command saves a non-empty base and the state file under the project, and the wave joins.
- [x] Repair F-185 - a new wave overwrites the saved path of a failed one. In the same file, the once-per-wave block stops when a saved wave already exists, naming it. *Done when:* with a saved wave left by a failed join, starting another wave stops and leaves the saved path unchanged.
- [x] Repair F-187 - phase 1 does not stop on a failed line. In `src/skills/implement/reference/worktrees.md`, each line of the phase 1 block that can fail ends in `|| exit 1`, so a failed `mktemp`, `git stash create` or save stops the block before anything is saved. *Done when:* with `mktemp` made to fail, the block exits non-zero and writes nothing into the project, and run normally it still saves the base and the wave.
- [x] Repair F-189 - phase 1's exits end a long-lived shell. In `src/skills/implement/reference/worktrees.md`, the phase 1 block runs in a subshell. *Done when:* sourcing the block with a saved wave present stops the block and returns control to the caller.
- [x] Repair F-190 - a printing zsh directory hook is captured into the wave path. In the same file, the `cd` that resolves the wave path sends its output to `/dev/null`. *Done when:* in zsh with a `chpwd` hook that echoes, the block saves a valid wave.

## Files and areas

- `src/skills/implement/reference/worktrees.md` (new)
- `src/skills/implement/SKILL.md`
- `src/entry/partials/authority.md`, `src/entry/partials/review-cadence.md`
- `docs/architecture/config.md`
- Rendered: `.claude/skills/implement/`, `.agents/skills/implement/`, `CLAUDE.md`,
  `AGENTS.md`, via `npm run build:skills:link`

## Data and contracts

**The worktree routine (load-bearing).** Item 39 and any later wave work build on it.

| Phase | Contract |
| --- | --- |
| Base | `git stash create`; empty output (a clean tree) means `HEAD`. Untracked, non-ignored files (`git ls-files --others --exclude-standard`) are copied into each worktree with `cp -RPp`, so a link stays a link, since the stash commit leaves them out, then staged there and saved with `git write-tree` as that step's diff base, so they are part of the base rather than of the patch. `write-tree` makes a tree object only: no commit, no ref. Never `git stash push`, never `git add -N` in the main tree. |
| Create | One `mktemp -d` per wave, outside the project; one `git worktree add --detach <dir>/step-<n> <base>` per step. No branch is created in any `git.mode`. |
| Link | Each installed dependency directory at the project root that the gate needs (`node_modules`, for this project) is symlinked into the worktree, unless something already sits at that path, such as a copied untracked link. Nothing is installed. |
| Build | The project's build runs in the worktree when its gate reads build output, so a fresh checkout can gate at all. |
| Extract | `git -C <wt> add -A`, then `git -C <wt> diff --cached --binary <saved base tree>`, leaving out paths the project's instructions declare generated (here the rendered trees, entry files, and `template/`). A project that declares none keeps every path, so a shared generated file makes the join fail and stop, never merge. The worktree's own index is the only index touched. |
| Join | All patches concatenated in step order into **one** `git apply`. It applies all or nothing, including two patches to one file, so a failure leaves the main tree exactly as it was. No `--3way`, no merge, no agent-resolved conflict. |
| Teardown | After a successful join only: remove each link, then `git worktree remove --force` on each worktree this run created, then the saved patch and base files, then the empty `mktemp` directory. A failed join keeps them and names their paths in the report. |

**Wave step output.** A subagent returns its patch and its evidence. It still never ticks,
never writes the spec, and never touches the ledger.

## Testing

- The gate is `npm test` (the declared Verify command): verification checks, unit tests,
  routing corpus. It runs at the end of every step.
- No in-scope logic: every step is skill or documentation prose, so no new unit test.
  Routing is unaffected because no `description` changes; the corpus run confirms it.
- `check` proves the behaviour: in throwaway worktrees of this repository, follow the
  rendered routine for a two-step wave (two different skills, summaries changed), and show
  one clean join, a passing `npm test` on the joined tree, the worktrees gone afterwards,
  and a deliberately clashing pair stopping with the main tree unchanged
  (`git status --short` before and after).

## Notes for the agent

- Edit `src/` only; run `npm run build:skills:link` to refresh rendered trees. The guard hook
  blocks rendered edits.
- Skill prose uses the token vocabulary (the state-directory and command tokens), never one
  tool's syntax.
  The routine must read the same for all four adapters, so it names git commands, not a
  tool's subagent or worktree feature.
- The authority sentence is a narrow carve-out, not a new tier. It must not read as letting a
  run delete anything else, and `auto` gains nothing from it beyond this.
- No em dashes, en dashes, or ellipsis characters. No plan or item numbers in source
  comments or commit messages.
- Measured while writing this spec, in a scratch repository: one `git apply` given separate patch files is **not** atomic
  (`git apply a.patch bad.patch` left `a.patch` applied); one concatenated input is.

## Amendments

- 2026-10-24 - Notes for the agent: the token-vocabulary line no longer quotes literal tokens, which the verify check reads as unrendered output in this file. Wording only; nothing asked for changed.
- 2026-10-24 - Added Step 5 and changed the Base, Extract and Teardown contracts: `check` found the copied untracked files landing in every step's patch, so any wave started with untracked files failed its join, and teardown left patch files that stop the `mktemp` directory being removed.
- 2026-10-24 - Added Step 6 and changed the Base and Link contracts: the clean-tree recheck found phase 2's `cp -p` aborting on an untracked link to a directory, and copying the link instead would let phase 3's `ln -s` write a link inside the real `node_modules`.
- 2026-10-24 - Added repair steps for F-161 and F-162, the two P1 findings the completion audit raised in the join: a subdirectory cwd makes `git apply` skip every path and report success, and the pipe into `git apply` hides a missing patch.
- 2026-10-24 - Added repair steps for F-179 (P1) and F-181 (P3), both surfaced by the F-161 repair's re-read; F-161 cannot close while either is open.
- 2026-10-24 - Added repair steps for F-183, F-184 and F-185, surfaced by the second re-review of the F-161, F-179 and F-181 repairs, which cannot close while these are open. If the next re-review surfaces anything at P2 or worse in the routine, stop and reconsider its design rather than patch again.
- 2026-10-24 - Added a repair step for F-187, surfaced by the F-179 repair, after the third re-review closed F-181, F-183, F-184 and F-185.
- 2026-10-24 - Added repair steps for F-189 and F-190, surfaced by the F-187 repair. Per the user, anything new and fail-safe at P3 that the next re-review raises is to be put to them for acceptance rather than repaired; P2 or worse still stops for a design rethink.

## Evidence

Checked 2026-10-24 at dea21bb, tree clean. Every phase ran the rendered routine's code blocks verbatim, each in a fresh `bash`, from stand-in projects (detached worktrees at dea21bb whose untracked paths were a `node_modules` link and `notes/untracked note.md`) or one-commit scratch repositories, so the real tree stayed untouched.

- **Step 1 - the worktree routine** - pass: renders to `.claude/skills/implement/reference/worktrees.md` and `.agents/skills/implement/reference/worktrees.md`; `npm test` exit 0, 183 passed, 0 failed.
- **Step 2 - implement builds waves in worktrees** - pass: rendered `.claude/skills/implement/SKILL.md:165` links the routine and `:173` names the single `git apply`; a clean two-step wave joined both patches into the stand-in and its `npm test` passed (183 passed, 0 failed).
- **Step 3 - the authority carve-out** - pass: `CLAUDE.md:73` and `AGENTS.md:109`; `npm test` exit 0.
- **Step 4 - describe isolation** - pass: `CLAUDE.md:157` and `AGENTS.md:193`; `npm test` exit 0.
- **Step 5 - patches leave out the copied untracked files** - pass: with two untracked paths in the stand-in, the patches held only `src/skills/check/SKILL.md` and `src/skills/debug/SKILL.md`.
- **Step 6 - untracked links survive the copy** - pass: the untracked `node_modules` link copied without error, and the real `node_modules` listing was identical before and after.
- **Repair F-161** - pass: the clean wave driven from `packages/create-religion` joined both patches at the stand-in's root.
- **Repair F-162** - pass: with step 2's patch removed, the join exited 1 and the stand-in's `src` was unchanged, step 1's patch included.
- **Repair F-179** - pass: a read-back run from inside a kept step worktree exited 1.
- **Repair F-181** - pass: every phase after phase 1 ran in a fresh shell from the saved root, wave and base, and the wave joined.
- **Repair F-183** - pass: phase 1 started from inside a kept worktree of an earlier wave exited 1 with no temp directory created (53 before and after).
- **Repair F-184** - pass: phase 1 run as one fresh-shell command saved a non-empty base and the state file under the project.
- **Repair F-185** - pass: with a saved wave left by a failed join, phase 1 printed it, exited 1, and left the saved path unchanged.
- **Repair F-187** - pass: with `mktemp` failing, phase 1 exited 1 and wrote nothing into the project.
- **Repair F-189** - pass: sourced in a long-lived shell with a saved wave present, phase 1 returned status 1 and the caller kept running.
- **Repair F-190** - pass: in zsh with a printing `chpwd` hook, phase 1 saved a clean, valid wave path.
- **Goal, failed join** - pass: a clashing pair was refused with `patch failed: src/skills/check/SKILL.md:1`, the stand-in was unchanged, and the worktrees and saved wave were kept.
- **Goal, clean teardown** - pass: after the clean wave, the wave directory and the state file were gone.
- **Goal, project untouched** - pass: the real tree's `git status --short` was identical before and after, the stash list stayed at 0, and the branch count stayed at 13.

## Outcome

With `workflow.parallelSteps` on, each wave step builds in its own detached git worktree outside
the project, set up and torn down by `implement`'s `reference/worktrees.md`. Each step hands the
parent its evidence; the parent takes a patch of the files the step authored, measured against a
base that already holds the project's untracked files, and joins every patch with one `git apply`
of one file, which lands all of them or none. A join that does not apply stops with the project
unchanged and the worktrees kept. Set-up runs once per wave as one block in a subshell, against
the repository root, stops on any failed line, refuses to start inside any wave's worktree or over
a saved wave, and saves the wave's directory and base so every later phase can start again in a fresh
shell. The Authority section lets a run remove the worktrees it created for a wave once that wave
has joined; removing anything else still asks.

### What went wrong on the way

- The first `check` found the copied untracked files landing in every step's patch, so any wave
  started with untracked files failed its join; the clean-tree recheck then found untracked links
  aborting the copy, and that copying them as links would let `ln -s` write inside the real
  `node_modules`.
- The completion audit found two P1s in the join: run from a subdirectory, `git apply` skipped
  every path and exited 0; and the pipe into `git apply` hid a missing patch. In both cases
  teardown would then have deleted the work.
- Each repair surfaced a smaller gap in what it added, through four further rounds of independent
  re-review, before nothing new remained above P3.
- Twice a probe of mine took a wave's base after an earlier join had already changed the
  stand-in, so its patches came back empty; the routine refused both correctly.

### Deferred

- **Open in the ledger:** F-163 to F-178, F-180, F-182 and F-188 (P2 and P3), and F-186
  (unverified). Among them: forced teardown destroying ignored files a step made (F-163), writes
  through linked directories (F-164), shared tool caches in `node_modules` (F-165), the
  carve-out's wording and the lack of a record of created worktrees (F-166), and silent guard
  refusals (F-188).
- **Windows**, where the dependency link would be a junction.
- **The other three tools' shells**, which were not exercised.

## Findings

### 27/F-161 [P1] closed - A join run from a subdirectory applies nothing, reports success, and teardown deletes the work

**File:** src/skills/implement/reference/worktrees.md:92
**Found:** 2026-10-24 by audit (scope: current; lens: security)
**Why it matters:** `git apply` skips paths outside the current directory and exits 0. Reproduced from `sub/`: exit 0, `git status` empty. The routine then counts the join as successful, and phase 7's `git worktree remove --force` (:109) destroys every step's work. The same cwd dependence makes `git ls-files --others` (:35) list only files under the cwd, relative to it, and `ln -s "$PWD/node_modules"` (:58) point at nothing.
**Suggested fix:** Take `root=$(git rev-parse --show-toplevel)` in phase 1 and run every project-side command against it (`git -C "$root" apply`, `git -C "$root" ls-files`, `"$root/node_modules"`). Before teardown, confirm the files `git apply --numstat` reports match the patches' file lists.
**Resolution:** 2026-10-24, repaired in implement: phase 1 takes `root=$(git rev-parse --show-toplevel)` and the untracked listing, the copy, the dependency link and the join all run against it; the wave path is saved under the state directory and re-read. A wave run from `packages/create-religion` in a stand-in joined both patches into the project and its `npm test` passed. Re-reviewed 2026-10-24: the subdirectory path is gone, but the re-read surfaced F-179 and F-181, so this stays fixed until both are closed. Re-reviewed again 2026-10-24: every project-side command now runs against the root and no path depends on the current directory, but it stays fixed while F-179, F-181 and F-185, which its repair surfaced, are not closed. Third re-review 2026-10-24: every project-side command in phases 1 to 6 runs against the root, and F-181 and F-185 are closed; it closes with F-179. Closed 2026-10-24: F-179, F-181 and F-185, which its repair surfaced, are closed.

### 27/F-162 [P1] closed - A missing patch is hidden by the join's pipe, so some steps land and the rest are deleted

**File:** src/skills/implement/reference/worktrees.md:92
**Found:** 2026-10-24 by audit (scope: current; lens: security)
**Why it matters:** Without `pipefail`, the pipe's status is `git apply`'s alone. Reproduced: `cat` of a missing file and a good patch piped into `git apply` exited 0 and applied the good half. A missing patch file, or an empty wave variable in a later shell call (the routine itself says variables may not persist, :49-50), lands part of the wave as a success, and teardown then force-removes the step whose changes never applied.
**Suggested fix:** Check each `.patch` exists before the join and build one input with `cat ... > all.patch || stop`, then `git apply all.patch`. Save the literal wave path to a file, as the base is, instead of relying on the shell variable.
**Resolution:** 2026-10-24, repaired in implement: the join checks each step patch exists, concatenates them into `join.patch`, and runs `git -C "$root" apply` on that file, with no pipe; teardown removes `join.patch`. With one patch deleted, the join stopped and the stand-in was unchanged; a clean pair still joined and passed `npm test`. Closed 2026-10-24 by an independent re-review: no pipe remains in the join, an empty wave variable fails the existence check before anything applies, and nothing worse was introduced.

### 27/F-179 [P1] closed - The re-read takes the root from the current directory, so a join from inside a step's worktree lands there and teardown deletes the other steps

**File:** src/skills/implement/reference/worktrees.md:39
**Found:** 2026-10-24 by audit (scope: current; lens: security)
**Surfaced by:** F-161
**Why it matters:** Phase 4 has the parent build inside a worktree, and a `cd` there persists between calls. The installer does not ignore `religion/.state/`, so phase 2 copies the saved wave file into every worktree, and the re-read from inside `step-<m>` resolves `root` to that worktree. Reproduced by the re-review: with step 2's patch empty, `git -C "$root" apply` patched step 2 and exited 0, the project was unchanged, and teardown would then force-remove step 1, the only copy of its work.
**Suggested fix:** After the re-read, stop when `$root` is inside `$wave`; skip `religion/.state/` when copying untracked files; build in a subshell rather than a bare `cd`.
**Resolution:** 2026-10-24, repaired in implement: phase 2 skips `religion/.state/` when copying untracked files, every re-read ends with `case "$root/" in "$wave"/*) exit 1;; esac` against a wave path saved resolved with `pwd -P`, and the build runs in a subshell. From inside `step-2` the re-read stopped before any apply; a clean wave from the root still joined and passed `npm test`. Re-reviewed 2026-10-24: closed for the named path (the guard trips from inside a current-wave worktree, on `/var` and `/private/var` forms alike, and when the wave variable is empty), but the same defect remains from a worktree kept by an earlier wave, F-183, so it stays fixed. Third re-review 2026-10-24: closed on every path it names, but the `cd "$(mktemp -d)"` line its repair added surfaced F-187, so it stays fixed until F-187 is closed. Closed 2026-10-24: F-183 and F-187, which its repair surfaced, are closed.

### 27/F-181 [P3] closed - The re-read restores root and wave but not base, and the mktemp sits beside the per-step command

**File:** src/skills/implement/reference/worktrees.md:34
**Found:** 2026-10-24 by audit (scope: current; lens: quality)
**Surfaced by:** F-161
**Why it matters:** A later `git worktree add` in a fresh shell gets an empty base and fails with `invalid reference` (safe, but it contradicts the claim that every phase can start from the saved values); run once per step as written, `wave=$(mktemp -d)` makes a new directory and overwrites the saved path each time.
**Suggested fix:** Save the base beside the wave path and re-read it; show the `mktemp` and the state write once, apart from the per-step commands.
**Resolution:** 2026-10-24, repaired in implement: the base is saved to `$wave/base` and re-read with the root and wave; the once-per-wave lines are shown apart from the per-step ones, in phase 2 and in teardown. Each step worktree was created in a fresh shell from the saved values and the wave joined. Re-reviewed 2026-10-24: the base is saved and re-read and the once-per-wave lines are separate, but the separated save step needs phase 1's values, F-184, so it stays fixed. Closed 2026-10-24 by the third re-review: the base is saved and re-read, and the once-per-wave lines run apart from the per-step command.

### 27/F-183 [P2] closed - A wave started from a worktree kept by an earlier failed wave joins into that worktree

**File:** src/skills/implement/reference/worktrees.md:46
**Found:** 2026-10-24 by audit (scope: current; lens: security)
**Surfaced by:** F-179
**Why it matters:** The routine keeps worktrees after a failed join and says where they are; an agent whose directory persists may `cd` into one to inspect it and then start the next wave. Phase 1 then takes that worktree as the root, writes the state file inside it, and the guard passes because the root is not under the new wave. Reproduced by the re-review: the join exited 0 into the stale worktree, the project was unchanged, and teardown would force-remove the new step worktrees.
**Suggested fix:** In phase 1 and every re-read, stop when the root is any wave's step worktree, recognisable by a `base` file in its parent; do not reject linked worktrees in general, which users may run from.
**Resolution:** 2026-10-24, repaired in implement: phase 1 and every re-read stop when the root is `*/step-*` with a `base` file in the directory beside it. Started from inside a kept worktree of an earlier wave, phase 1 exited 1 with no temp directory created and nothing saved there; a detached worktree named `my-feature` passed the guard; a clean wave from the root still joined and passed `npm test`. Closed 2026-10-24 by the third re-review: phase 1 and the re-read both stopped inside a kept worktree reached through the unresolved `/var` path, and the `base` file outlives every way a kept worktree can be left.

### 27/F-184 [P3] closed - The once-per-wave save step needs phase 1's values but is shown as its own command

**File:** src/skills/implement/reference/worktrees.md:34
**Found:** 2026-10-24 by audit (scope: current; lens: quality)
**Surfaced by:** F-181
**Why it matters:** Run in a fresh shell, the base is empty and the root is empty, so the save writes an empty base and tries to create the state directory at the filesystem root; it fails or, as a root user, leaves a stray file, and the guard then stops the wave.
**Suggested fix:** Put phase 1's three lines at the top of the save block, so they always run together.
**Resolution:** 2026-10-24, repaired in implement: phase 1 now holds the root, the base, the wave directory and both saves as one block, run as one command. Extracted verbatim from the rendered routine and run as one fresh-shell command, it saved a non-empty base and the state file under the project and wrote nothing at the filesystem root; the wave then joined and passed `npm test`. Closed 2026-10-24 by the third re-review: one block produces and saves the values together; the block has no stop-on-error, recorded separately as F-187.

### 27/F-185 [P3] closed - A new wave overwrites the saved path of a failed one

**File:** src/skills/implement/reference/worktrees.md:36
**Found:** 2026-10-24 by audit (scope: current; lens: quality)
**Surfaced by:** F-161
**Why it matters:** After a failed join the state file still points at the kept worktrees; the next wave overwrites it without a check, so nothing on disk records where they are any more.
**Suggested fix:** Stop in the save step when the state file already exists, and say which wave it names.
**Resolution:** 2026-10-24, repaired in implement: phase 1 stops when a saved wave exists, printing the directory it names, before anything is created. With a saved wave left by a failed join, starting another wave printed that path, exited 1, created no temp directory, and left the saved path unchanged. Closed 2026-10-24 by the third re-review: with a saved wave present, phase 1 printed it and exited 1 without creating or overwriting anything.

### 27/F-187 [P3] closed - Phase 1 does not stop on a failed line, so a failed mktemp saves the project itself as the wave

**File:** src/skills/implement/reference/worktrees.md:21
**Found:** 2026-10-24 by audit (scope: current; lens: quality)
**Surfaced by:** F-179
**Why it matters:** Reproduced by the third re-review with a failing `mktemp` first on the path: `cd ""` stays in the project, so the block wrote an untracked `base` into the project, saved the project root as the wave, and exited 0; every later phase 1 then refuses, and the stray file would ride into the work commit. A failed `git stash create` likewise falls back to `HEAD` silently, dropping uncommitted earlier steps from the base. Nothing is joined or deleted.
**Suggested fix:** Start the phase 1 block with `set -e`, or `wave=$(mktemp -d) && wave=$(cd "$wave" && pwd -P) || exit 1`.
**Resolution:** 2026-10-24, repaired in implement: every line of the phase 1 block that can fail ends in `|| exit 1`, with `mktemp` and the `pwd -P` resolution split so an empty result stops. Extracted verbatim and run with a failing `mktemp` first on the path, the block exited 1 with no `base` in the project and no saved wave; run normally it exited 0 with a non-empty base and a wave outside the project. Narrow re-review 2026-10-24: closed on its path (failed `mktemp`, `git stash create`, `rev-parse` and saves all exit 1 with the project unchanged, in bash, zsh and sh), but the change surfaced F-189 and F-190, so it stays fixed. Closed 2026-10-24 by a narrow re-review: failing `mktemp`, a corrupt index under `git stash create`, an unborn HEAD, no repository, and a read-only state directory all exit 1 with nothing written, in bash, zsh and sh, and the subshell still returns that status when run as a script, sourced or pasted. F-189 and F-190 are closed.

### 27/F-189 [P3] closed - In a tool that keeps one shell, phase 1's exits end that shell

**File:** src/skills/implement/reference/worktrees.md:15
**Found:** 2026-10-24 by audit (scope: current; lens: quality)
**Surfaced by:** F-187
**Why it matters:** Reproduced by the narrow re-review: sourcing the block with a saved wave present printed the path and never returned to the caller. The block still stops safely and later phases read their values from files, but the paragraph after it rejects `set -e` for persisting in such a tool while `exit` costs that tool its shell.
**Suggested fix:** Run the block in a subshell, `( ... )`; it needs nothing from the caller afterwards.
**Resolution:** 2026-10-24, repaired in implement: the phase 1 block runs in a subshell. Sourced with a saved wave present, it printed the wave and returned status 1 while the caller kept running. Closed 2026-10-24 by a narrow re-review: sourced from bash, zsh and sh with a saved wave present, the block printed it and returned 1 while the caller kept running.

### 27/F-190 [P3] closed - A zsh directory hook that prints makes phase 1 refuse a valid start

**File:** src/skills/implement/reference/worktrees.md:20
**Found:** 2026-10-24 by audit (scope: current; lens: quality)
**Surfaced by:** F-187
**Why it matters:** Reproduced with a `chpwd` hook that echoes: its output is captured into the wave path, the save then fails, and the block exits 1, leaving an empty temp directory; no wave can start in that shell.
**Suggested fix:** `cd -- "$wave" >/dev/null && pwd -P`.
**Resolution:** 2026-10-24, repaired in implement: the `cd` that resolves the wave path is `cd -- "$wave" >/dev/null`. In zsh with a `chpwd` hook that echoes, the block saved a valid wave with no hook output in the path. Closed 2026-10-24 by a narrow re-review: with a printing `chpwd` hook, and in bash with `CDPATH` set, the saved wave path was clean.

## Landed

**Base:** 4a5c387fc665900248be4621367c96cadc5fec80
**Commits:** f458e1e6e10ca72d9f35d204e328227678d489d2, 80e0476645d6143a8d61624045e3ec57620f046a, dea21bb7914e18c30c9aaf90ecbf29bd974506d0, a15784b33b4845e868410874efb8a3ff37b2ad04, bb9577b3410aeadf5edcc32a1e39f3c65dabca9b
**Product paths:** .agents/skills/implement/SKILL.md, .agents/skills/implement/reference/worktrees.md, .changeset/waves-in-isolation.md, .claude/skills/implement/SKILL.md, .claude/skills/implement/reference/worktrees.md, AGENTS.md, CLAUDE.md, docs/architecture/config.md, src/entry/partials/authority.md, src/entry/partials/review-cadence.md, src/skills/implement/SKILL.md, src/skills/implement/reference/worktrees.md
