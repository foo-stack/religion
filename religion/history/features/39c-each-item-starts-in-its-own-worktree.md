# Each item starts in its own worktree

**Type:** Feature
**From build plan:** item 39c
**Status:** verified
**Approved:** 2026-10-25, 3972fc71d26571c8

## Goal

Behind a new setting, `workflow.parallelItems`, `implement` starts a planned item in its own git
worktree on the item's branch, beside the project, and moves the spec there, so the main
checkout is idle again and can spec the next item while this one is built. A later session
resumes the item by working from that worktree. `doctor` run inside such a worktree passes and
says it is one. The setting ships `false`, and with it off nothing changes.

Grounded in `religion/history/spikes/does-resuming-two-items-cost-less-than-finishing-one.md`:
a worktree is the item, so resuming needs no state saying which item a session is in. Items in
flight are already visible from every worktree; landing them one at a time is item 39d.

## In scope

- The setting, its reference row and section, the seeded config and the surface record
- `doctor`: the setting under `trunk` is a configuration problem, and inside a linked worktree
  the git check says so and the hooks check points at the main checkout's copy
- A reference routine for starting an item worktree: where it goes, the branch, moving the spec,
  copying what git ignores but the loop needs, linking dependencies
- `implement`: starting with the setting on, and resuming, including a session in the main
  checkout whose item is in flight elsewhere

## Out of scope

- `complete` landing items one at a time and redoing the shared bookkeeping (39d)
- Removing an item's worktree after it lands: deleting files, which still asks, and 39d's
- Starting fixes, rollbacks and refactor campaigns in worktrees: they keep today's path
- Any change while the setting is off
- Windows, where the dependency link would be a junction nobody has run

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - the setting** - `workflow.parallelItems`, boolean, default `false`, in
  `packages/create-religion/lib/settings.ts`, the table and a "Parallel items" section in
  `docs/architecture/config.md`, `src/state/config.json`, and the surface record and stability
  statement. *Done when:* `religion doctor` accepts `true` and `false` and refuses `"yes"`, the
  reference and surface checks pass, and `npm test` exits 0.
- [x] **Step 2 - doctor in a linked worktree** - in `packages/create-religion/lib/doctor.ts`,
  the configuration check fails with `workflow.parallelItems` on under `git.mode: trunk`, since
  an item worktree needs its own branch; inside a linked worktree the git check's detail names
  the main checkout, and a missing `.claude/settings.json` there says to copy the main
  checkout's; tests in `doctor.test.ts` against a real temporary repository. *Done when:* those
  three cases pass, a main checkout's output is unchanged, and `npm test` exits 0.
- [x] **Step 3 - the routine** - `src/skills/implement/reference/item-worktree.md`: the
  worktree goes beside the project at the path the contract below names, on the item's branch
  made from `HEAD`; the spec is copied in, the copy confirmed, and only then the main checkout's
  spec reset to the stub; the ignored installer output (`.claude/settings.json`,
  `.claude/settings.local.json`, `.claude/hooks/`) is copied, and when the state directory is
  ignored, the state files except `.state/`; dependency directories are linked, never
  installed; it stops on an existing path or branch, on uncommitted changes beyond the spec, and
  when run from inside a linked worktree. *Done when:* run by hand in a throwaway repository,
  the worktree exists on its branch with the spec, the main checkout's spec is the stub,
  `status` from the main checkout lists the item in flight, and `doctor` inside the worktree
  passes.
- [x] **Step 4 - implement uses it** - in `src/skills/implement/SKILL.md`, Step 1 under
  `branch-per-item` or `pull-request` with the setting on starts a feature through the routine
  and works from the worktree from then on, by moving the session there where the tool can and
  otherwise by addressing every file and command to the worktree's path, telling the person to
  open later sessions there; resuming inside it is today's resume; a session in the main
  checkout with no active spec, whose `status` lists items in flight elsewhere, names each
  worktree and stops rather than start a second copy. *Done when:* the rendered skill says so,
  the routing corpus passes unchanged, and `npm test` exits 0.
- [x] **Step 5 - Repair 39c/F-1 to 39c/F-10** - the routine's blocks each run in a subshell and
  set their own values, the state copy is a no-op when tracked, only the spec and handoff may be
  uncommitted, a dependency link is excluded from git, the copy and move block is safe to repeat,
  a quoted branch name is refused, and `implement` keeps the plain branch during an automated run
  and says where creating the worktree sits in the tiers. *Done when:* the blocks, run one per
  fresh bash and zsh shell in a throwaway project with a space in its path, leave a worktree whose
  status shows only the spec, `doctor` there passes its configuration, git and hooks checks, an
  uncommitted setting is refused, and `npm test` exits 0.
- [x] **Step 6 - Repair 39c/F-11 to 39c/F-14** - the copy block refuses once the spec has moved
  or the worktree holds another spec, rebuilds the worktree's path from the branch, copies
  directories into their parent, and says what a stopped copy leaves. *Done when:* a rerun after
  the reset, a rerun with the next item's spec in the main checkout and a wrong branch each stop
  with the worktree's spec intact, a project named with a quote is filled, and `npm test` exits 0.

## Files and areas

- `packages/create-religion/lib/settings.ts`, `settings.test.ts`, `doctor.ts`, `doctor.test.ts`
- `packages/create-religion/surface.json`, `docs/stability.md`, `docs/architecture/config.md`
- `src/state/config.json`
- `src/skills/implement/SKILL.md`, `src/skills/implement/reference/item-worktree.md`, rendered by
  `npm run build:skills:link`

## Data and contracts

**Where an item's worktree lives (load-bearing).** 39d lands from it and later removes it.

- path: the project's parent directory, named `<project directory name>.<branch>` with each
  `/` in the branch replaced by `-`, such as `religion.feature-items-start-in-own-worktree`
- branch: the one `implement` would create today, from the configured prefix
- while the item is in flight its spec lives only there; the main checkout's is the stub
- `religion/.state/` is never copied: each worktree keeps its own activity record

## Testing

- The gate is `npm test`: the verification checks, the unit tests and the routing corpus.
- In-scope logic with tests: the setting (Step 1) and doctor's three cases (Step 2).
- Steps 3 and 4 are prose, held by the drift and routing checks and by `check`, which runs the
  routine in a throwaway repository and observes `status` and `doctor` from both places.

## Notes for the agent

- Creating the worktree writes beside the project, an agent action under the authority tiers,
  not the command-line tool's no-outside-writes promise. Removing one still asks.
- A hook a tool runs for its own session still runs where that session started, so a session
  that addresses the worktree by path keeps rewriting the main checkout's handoff. That is why
  later sessions should open in the worktree.
- No em dashes, en dashes or ellipsis characters, and no plan or item numbers in source
  comments or commit messages.

## Amendments

- 2026-10-25 - Step 5 added to repair 39c/F-1 to 39c/F-10, raised by the audit of this item: the
  routine's blocks shared values no fresh shell has, failed on a tracked state directory, let
  uncommitted settings stay behind and would have committed the dependency link.
- 2026-10-25 - Step 6 added to repair 39c/F-11 to 39c/F-14, surfaced by the re-review of
  step 5: a rerun could overwrite the moved spec, nested the hooks, broke on a quoted project
  name, and left a file list behind.

## Evidence

Checked 2026-10-25 at 17a5832, tree clean.

- **Step 1 - the setting** - pass: `npm test` exit 0 with 190 unit tests; the settings test accepts `parallelItems: true` and refuses `"yes"` with `workflow.parallelItems is "yes", expected true or false`; the reference and surface checks ok.
- **Step 2 - doctor in a linked worktree** - pass: the doctor test against a real repository shows the trunk refusal, `linked worktree of <main>` from the linked worktree and the settings hint naming the main checkout, with the main checkout's `repository present` unchanged; in a throwaway project the routine's worktree gave its git check naming the project's main checkout.
- **Step 3 - the routine** - pass: the rendered blocks, run in a throwaway project with ignored settings and hooks, made `proj.feature-export-reports` on `feature/export-reports` with the spec, settings, hooks and a linked `node_modules`; after the reset the main checkout's spec was the stub, `status --json` there reported nothing active and the item in flight with `here` false, and `doctor` in the worktree failed only the two checks the main checkout also fails (setup and overview, never run there); a rerun stopped with `already exists`, a run from the worktree with `not the main checkout`, and uncommitted work with `uncommitted changes outside religion/`. With the state directory ignored, every state file but `.state/` was copied and `doctor` there reported `state is local only` and all 16 required files.
- **Step 4 - implement uses it** - pass: the rendered `implement` skill names the routine and the in-flight stop; routing corpus 26 skills, 184 cases, no structural problems.
- **Steps 5 and 6 - repairs** - pass: 39c/F-1 to F-14 closed by independent re-reviews that ran each rendered block in its own fresh bash and zsh shell, in throwaway projects with spaces and a quote in their names, tracked and ignored state, uncommitted settings, forced failures and reruns before and after the reset; no order of runs lost either spec. 39c/F-11 stays fixed behind 39c/F-15, a P3 left open.
- **Goal** - pass: the runs above, plus `npm test` exit 0.

## Findings

### 39c/F-1 [P1] closed - The routine's later blocks use variables only the first block's subshell had

**File:** src/skills/implement/reference/item-worktree.md:44
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Why it matters:** Each tool runs a command in a fresh shell, so `$root` and `$tree` are empty in blocks 2 to 4: reproduced, block 2 copied nothing and exited 0, and block 4 failed on `/religion/context/current-work.md`.
**Suggested fix:** Start every block by setting `root` from `git rev-parse` and `tree` from the path block 1 printed.
**Resolution:** 2026-10-25, every block runs in its own subshell and sets `root` and `tree` itself; run block by block in fresh bash and zsh shells, the worktree got the settings, hooks, link and spec. Re-reviewed 2026-10-25: blocks run in fresh bash and zsh shells filled the worktree, with a space in the path.

### 39c/F-2 [P1] closed - The state copy block fails whenever the state directory is committed

**File:** src/skills/implement/reference/item-worktree.md:52
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Why it matters:** `git check-ignore -q religion && ...` returns 1 when the directory is tracked, the usual case, so the routine stops after creating the worktree and before moving the spec. Reproduced.
**Suggested fix:** Use an `if` so a tracked state directory is a no-op.
**Resolution:** 2026-10-25, the state copy is an `if`, a no-op when the state directory is tracked; block 2 printed `copied` and exited 0 in that case. Re-reviewed 2026-10-25: block 2 printed `copied` with the state directory tracked.

### 39c/F-3 [P1] closed - Uncommitted changes inside the state directory stay behind

**File:** src/skills/implement/reference/item-worktree.md:16
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Why it matters:** The dirty check excludes all of `religion/`, so an uncommitted `config.json` or plan edit stays in the main checkout while the worktree runs from `HEAD`; reproduced, the worktree read `git.mode` as trunk.
**Suggested fix:** Exclude only the spec and the generated handoff.
**Resolution:** 2026-10-25, the dirty check excludes only the spec and the handoff; an uncommitted `config.json` stopped block 1 with `uncommitted changes beyond the spec`. Re-reviewed 2026-10-25: an uncommitted setting, plan edit and untracked state file each stopped block 1.

### 39c/F-4 [P1] closed - The linked dependency directory would be committed from the worktree

**File:** src/skills/implement/reference/item-worktree.md:58
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Why it matters:** `node_modules/` with a trailing slash does not match a link, so the worktree showed `?? node_modules`, and `complete` stages everything. Reproduced.
**Suggested fix:** After linking, add the path to the repository's exclude file unless git already ignores it.
**Resolution:** 2026-10-25, a link git would not ignore is added to the repository's exclude file; the worktree's status then showed only the spec, with the exclude entry written once across two runs. Re-reviewed 2026-10-25: the exclude entry is written once and the worktree's status shows only the spec.

### 39c/F-5 [P2] closed - A start that stops halfway has no way to finish

**File:** src/skills/implement/reference/item-worktree.md:20
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Why it matters:** With the worktree made and the spec not yet moved, block 1 refuses `already exists` and the resume line cannot check the branch out, since the worktree holds it.
**Suggested fix:** Make the copy and move block safe to repeat and say to rerun it when block 1 already succeeded.
**Resolution:** 2026-10-25, block 2 is safe to repeat and the routine says to go on to it when block 1 already made the worktree on this branch; a second run printed `copied` with nothing duplicated. Re-reviewed 2026-10-25: recovery works, but an unconditional rerun could overwrite the moved spec; stays fixed while 39c/F-11 and 39c/F-12 are unresolved. Closed 2026-10-25: a forced failure halfway was finished by a rerun, and both findings its repair surfaced are closed or, for 39c/F-11, re-reviewed with the defect gone.

### 39c/F-6 [P2] closed - An automated run cannot land an item built in its own worktree

**File:** src/skills/implement/SKILL.md:63
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Why it matters:** `auto` deletes each item branch after landing, which git refuses while a worktree holds it, and removing the worktree is first tier, so every item would leave one behind.
**Suggested fix:** Keep the plain branch during an automated run.
**Resolution:** 2026-10-25, implement keeps the plain branch during an automated run and the routine names that condition. Re-reviewed 2026-10-25: implement and the routine both keep the plain branch during an automated run.

### 39c/F-7 [P2] closed - The later blocks exit the calling shell on failure

**File:** src/skills/implement/reference/item-worktree.md:46
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Why it matters:** Top-level `exit 1` ends a shell a tool keeps between commands; reproduced under zsh.
**Suggested fix:** Run every block in a subshell, as the first one is.
**Resolution:** 2026-10-25, every block runs in a subshell, and the state file list is read from a file rather than a pipe; zsh and bash runs both returned to the caller. Re-reviewed 2026-10-25: failing blocks run through `eval` left both shells alive, and a forced copy failure left the main spec intact.

### 39c/F-8 [P2] closed - The spec's evidence carried a path the state check flags

**File:** religion/context/current-work.md:123
**Found:** 2026-10-25 by audit (scope: current; lens: tests)
**Why it matters:** An absolute `/private/tmp/...` path in the Evidence section matched the invocation pattern, turning `npm test` red with the work uncommitted.
**Suggested fix:** Name the throwaway project without its path.
**Resolution:** 2026-10-25, the evidence names the throwaway project without its path; `npm run verify` passes. Re-reviewed 2026-10-25: no temporary path in the spec, and `npm test` exits 0.

### 39c/F-9 [P3] closed - A branch name with a quote breaks the routine's quoting

**File:** src/skills/implement/reference/item-worktree.md:18
**Found:** 2026-10-25 by audit (scope: current; lens: security)
**Why it matters:** `'` is legal in a ref name and is spliced into single quotes.
**Suggested fix:** Refuse such a name before the block runs.
**Resolution:** 2026-10-25, the routine refuses a branch name holding a quote before any block runs. Re-reviewed 2026-10-25: the branch guard holds; stays fixed while 39c/F-13 is unresolved. Closed 2026-10-25: block 2 fills in only the branch, and 39c/F-13 is closed.

### 39c/F-10 [P3] closed - implement does not say where creating the worktree sits in the authority tiers

**File:** src/skills/implement/SKILL.md:63
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Why it matters:** It writes beside the project, which the free tier does not list, and nothing says whether to ask.
**Suggested fix:** Say it is part of positioning the work, as creating the branch is, and that removing it asks.
**Resolution:** 2026-10-25, implement says creating the worktree is part of positioning the work, as creating the branch is, and that removing it asks. Re-reviewed 2026-10-25: implement and the routine agree on the tier.

### 39c/F-12 [P3] closed - A rerun nests the hooks directory

**File:** src/skills/implement/reference/item-worktree.md:45
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39c/F-5
**Why it matters:** `cp -RPp` of a directory onto an existing one copies into it, giving `.claude/hooks/hooks/`. Reproduced.
**Suggested fix:** Copy into the parent directory.
**Resolution:** 2026-10-25, the copy targets the parent; after two runs `.claude/hooks` holds the four scripts and no nested directory. Re-reviewed 2026-10-25: after two runs `.claude/hooks` held the four scripts and no nested directory.

### 39c/F-13 [P3] closed - A project name holding a quote breaks the copy block

**File:** src/skills/implement/reference/item-worktree.md:45
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39c/F-9
**Why it matters:** Block 2 spliced the printed path into single quotes, so a project directory named with `'` left a worktree the block could not fill. Reproduced.
**Suggested fix:** Rebuild the path from the branch in block 2.
**Resolution:** 2026-10-25, block 2 rebuilds the path from the branch and checks the worktree is on it; a project named `nate's` was filled and its spec moved. Re-reviewed 2026-10-25: projects named `nate's` and `my proj` were filled in bash and zsh, with clean statuses.

### 39c/F-14 [P3] closed - A stopped state copy leaves its file list beside the worktree

**File:** src/skills/implement/reference/item-worktree.md:45
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39c/F-7
**Why it matters:** The list written instead of a pipe is removed only by a later successful run.
**Suggested fix:** Say so in the routine.
**Resolution:** 2026-10-25, the routine says a stopped block leaves `<worktree>.files` and the rerun removes it. Re-reviewed 2026-10-25: a stopped run left the list and the successful rerun removed it.

## Landed

**Base:** e0547b59c6e7d446c01e54a030b59a38f6c975d1
**Commits:** 7421bcf55417a67f48dfd7b7e59eab3ed1c33c0a, 89de1eaef0417ecddd2b83fca8d9aa84fe66d234, 27cbf505875b5278827558dd3221cde9b7897dd8, 36c836cc43cb12789bb4fca215f635c54d3dcf81, cd87e137382d77329d8ca57d6ac92fcbb6b50c94, 17a5832337843a1e236aa9c34ef0f596690cb013, 47279890aa02417afdf4a1ad27d6063d3e2176ed
**Product paths:** .agents/skills/implement/SKILL.md, .agents/skills/implement/reference/item-worktree.md, .changeset/items-start-in-own-worktree.md, .claude/skills/implement/SKILL.md, .claude/skills/implement/reference/item-worktree.md, docs/architecture/config.md, docs/doctor.md, docs/stability.md, packages/create-religion/lib/doctor.test.ts, packages/create-religion/lib/doctor.ts, packages/create-religion/lib/settings.test.ts, packages/create-religion/lib/settings.ts, packages/create-religion/lib/state.ts, packages/create-religion/surface.json, src/skills/implement/SKILL.md, src/skills/implement/reference/item-worktree.md, src/state/config.json
