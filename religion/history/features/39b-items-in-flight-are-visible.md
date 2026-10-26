# Items in flight are visible

**Type:** Feature
**From build plan:** item 39b
**Status:** verified
**Approved:** 2026-10-25, cf3e2a6a5d952180

## Goal

`religion status` and the handoff report every work item active in any worktree of the
repository, read from `git worktree list` and each worktree's own spec, so a session in one
worktree knows what the others are building and no plan item gets started twice. The report is
a new `inFlight` field; `work` stays the single object it is today, so the change is additive
and releases as a minor version.

Grounded in `religion/history/spikes/does-resuming-two-items-cost-less-than-finishing-one.md`,
where the main checkout offered the next plan line while two items were already in flight
elsewhere, and `git worktree list` with each worktree's spec named both.

## In scope

- Reading the worktree list and each worktree's spec into the project state
- `status --json` gains `inFlight`; text `status` lists it; the next plan item passes over one
  already in flight in another worktree
- The surface record and the stability statement gain the field
- The handoff lists items in flight elsewhere
- `feature`, picking with no argument, passes over an item in flight elsewhere

## Out of scope

- Starting an item in its own worktree (39c) and landing one at a time (39d)
- A dashboard view of items in flight
- Branches checked out nowhere: an item lives in a worktree or it is not in flight

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - read the worktree list** - in `packages/create-religion/lib/state.ts`,
  `listWorktrees(root)` reads git's own worktree records (each `worktrees/<id>/gitdir` and
  `HEAD` under the common git directory) into resolved paths and branches, without running
  git; tests in `state.test.ts` against a real temporary repository. *Done when:* tests pass
  for a main and a linked worktree, a detached one (branch `null`), a path with spaces, a
  removed worktree directory and a bare repository's missing main entry, from a subdirectory
  and from outside a repository, and `npm test` exits 0.
- [x] **Step 2 - read the items in flight** - in the same file, `readInFlight(root)` takes that
  list, skips any wave step worktree (a `step-<n>` directory with a `base` file beside
  it), reads each remaining worktree's `current-work.md`, and returns the active ones;
  `readProjectState` carries them as `inFlight`. Outside a git repository it returns an
  empty list. Tests use a real temporary repository with `git worktree add`.
  *Done when:* with the main checkout idle and two linked worktrees each holding a spec, both
  are returned with their branch, plan item, title and step counts, the one the root sits in is
  marked `here`, a wave step worktree is not returned, a directory that is not a repository
  returns an empty list, and `npm test` exits 0.
- [x] **Step 3 - status reports them** - in `packages/create-religion/lib/status.ts`,
  `Status.inFlight` carries the list; the next plan item passes over one in flight in another
  worktree, with a warning naming the item and its branch; `renderStatus` prints an
  `In flight:` line per item elsewhere; tests in `status.test.ts`. *Done when:* with item 2 in
  flight elsewhere, `next` offers item 3 and the warning names item 2's branch, the text output
  lists it, with nothing in flight the output is unchanged, and `npm test` exits 0.
- [x] **Step 4 - record the field** - `packages/create-religion/surface.json` and the
  `status` list in `docs/stability.md` gain `inFlight` with its shape. *Done when:* the surface
  check and the docs check pass in `npm test`.
- [x] **Step 5 - the handoff lists them** - `src/hooks/write-handoff.mjs` repeats the same
  worktree read, standalone, and adds a line per item in flight elsewhere under "Where the work
  sits", passing each title through the same cleaning it gives ledger titles; cases in
  `scripts/hooks.test.ts`. *Done when:* in a repository with another worktree holding a spec,
  the handoff names that item and its branch, a title carrying control characters is cleaned,
  outside a repository the handoff is as before, and `npm test` exits 0.
- [x] **Step 6 - feature passes over items in flight** - in `src/skills/feature/SKILL.md`,
  Step 1's no-argument pick passes over an item that `religion status --json` reports in flight
  in another worktree, naming it with its branch, as it names an item that waits. *Done when:*
  the rendered skill says so, the routing corpus passes unchanged, and `npm test` exits 0.
- [x] **Step 7 - Repair 39b/F-1 and 39b/F-2** - both readers read another worktree's spec
  only when it is a regular file under 256 KB. *Done when:* a spec linked to `/dev/zero` leaves
  the hook quick and the handoff without it, a spec linked to another file is not listed by
  `readInFlight`, and the tests pass.
- [x] **Step 8 - Repair 39b/F-3, 39b/F-4 and 39b/F-5** - the hook's step counts stop crossing
  lines, both readers lowercase the item number and keep only its letters and digits, and both
  skip a record whose `.git` file is gone. *Done when:* tests show `Item 2B.` matching plan item
  `2b` and a worktree with its `.git` removed left out, and the hook's counts use `[ \t]*`.
- [x] **Step 9 - Repair 39b/F-6** - the state and hook tests run git through one helper with
  `GIT_` variables dropped and global and system config ignored. *Done when:* the suites pass
  with `GIT_DIR` pointing elsewhere and that repository is untouched.
- [x] **Step 10 - Repair 39b/F-16 and 39b/F-17** - both readers open another worktree's spec
  without following a link or blocking, check the open handle and read at most the cap, and
  `readInFlight` reads this worktree's own spec as `work` reads it. *Done when:* the link and
  `/dev/zero` cases still pass, a FIFO spec leaves the hook quick, and this worktree's linked
  spec appears with `here` true.
- [x] **Step 11 - Repair 39b/F-18 and 39b/F-19** - both readers resolve another worktree's
  spec path and read it only inside that worktree, and `readPlain` returns nothing on any error
  from the open handle. *Done when:* a linked context directory is left out by both readers and
  the tests pass.
- [x] **Step 12 - Repair 39b/F-20 and 39b/F-2** - both readers resolve only the folder of
  another worktree's spec and open the spec by its own name, so a linked spec is refused
  wherever it points. *Done when:* a spec linked to a file inside its own worktree is left out by
  both readers, the earlier cases still pass, and the tests pass.
- [x] **Step 13 - Repair 39b/F-21** - both readers, after opening another worktree's spec,
  read it only when its name is still a plain file with the open handle's device and inode.
  *Done when:* with `O_NOFOLLOW` taken away, a linked spec is still left out, and the tests pass.

## Files and areas

- `packages/create-religion/lib/state.ts`, `state.test.ts`
- `packages/create-religion/lib/status.ts`, `status.test.ts`
- `packages/create-religion/surface.json`, `docs/stability.md`
- `src/hooks/write-handoff.mjs`, `scripts/hooks.test.ts`
- `src/skills/feature/SKILL.md`, rendered by `npm run build:skills:link`

## Data and contracts

**An item in flight (load-bearing).** 39c starts items into worktrees and 39d lands them, and
both read this.

    inFlight: [{
      worktree: string,        // absolute, resolved path
      branch: string | null,   // short name; null when detached
      item: string | null,     // the spec's "From build plan" number, such as "39b"; null for unplanned work
      title: string | null,
      stepsDone: number,
      stepsTotal: number,
      here: boolean            // true for the worktree the command ran in
    }]

- Only worktrees whose spec is active are listed. The current worktree's item appears both
  here, with `here: true`, and in `work`, which keeps its shape.
- Paths are compared resolved, so `/var` and `/private/var` forms of one directory match.
- The list is empty, never absent, outside a repository.

## Testing

- The gate is `npm test`: the verification checks, the unit tests and the routing corpus.
- In-scope logic with tests: the porcelain parser (Step 1), the worktree read against a real
  temporary repository (Step 2), the next-item rule and text output (Step 3), and the hook's
  handoff lines (Step 5). The tests need git, which CI and this machine have.
- Steps 4 and 6 are records and prose, held by the surface, docs, drift and routing checks.
- `check` proves the whole in a throwaway repository with two linked worktrees: `status`,
  `status --json` and the handoff from the main checkout and from inside one worktree.

## Notes for the agent

- Shipped code runs no subprocess: `verify` holds its imports to an allowlist without
  `node:child_process`, which backs the no-network promise. Worktrees are read from git's files.
- The hook stays standalone, importing nothing from the package.
- A spec in another worktree is text written by whoever works there; treat its title as
  untrusted in the handoff, which every session loads.
- No em dashes, en dashes or ellipsis characters, and no plan or item numbers in source
  comments or commit messages.

## Amendments

- 2026-10-25 - Steps 1, 2 and 5 read git's worktree records from its files instead of running
  `git worktree list`: `verify` refuses `node:child_process` in shipped code, since a subprocess
  could reach the network, and the hook is held to the same rule. The porcelain parser and the
  timeout note are dropped; the `inFlight` contract is unchanged.
- 2026-10-25 - Steps 7 to 9 added to repair 39b/F-1 to 39b/F-6, raised by the audit of this
  item: symlinked specs in other worktrees, quadratic step counts in the hook, item numbers not
  normalised, prunable worktrees listed, and test git calls reaching the caller's repository.
- 2026-10-25 - Step 10 added to repair 39b/F-16 and 39b/F-17, surfaced by the re-review of
  39b/F-1's repair: a race between the type check and the read, and this worktree's own linked
  spec missing from `inFlight`.
- 2026-10-25 - Step 11 added to repair 39b/F-18 and 39b/F-19, surfaced by the re-review of
  39b/F-16's repair: a linked directory leading outside the worktree, and an unguarded read error.
- 2026-10-25 - Step 12 added to repair 39b/F-20, surfaced by the re-review of 39b/F-18's repair,
  which reopened 39b/F-2: resolving the whole spec path followed the spec's own link.
- 2026-10-25 - Step 13 added to repair 39b/F-21, surfaced by the re-review of 39b/F-20's
  repair: on Windows, with no `O_NOFOLLOW`, nothing refused a linked spec.

## Evidence

Checked 2026-10-25 at 292b28f, tree clean.

- **Step 1 - read the worktree list** - pass: `npm test` exit 0, 189 unit tests passing; the listWorktrees test covers main, linked, detached, a path with spaces, a removed directory, a record whose `.git` file is gone, a bare repository, a subdirectory root and outside a repository.
- **Step 2 - read the items in flight** - pass: in a throwaway repository with an idle main checkout and worktrees `second` (item 2) and `third tree` (a fix), `status --json` from main listed both with branch, item, title and step counts and `here` false; from `second`, entered through the unresolved `/tmp` path, it marked that one `here` true; a directory outside any repository gave `[]`.
- **Step 3 - status reports them** - pass: from main, `plan.nextItem` was `Third - x`, the warning read `passed over plan items in flight in another worktree: 2 (feature/second)`, and text status printed one `In flight:` line per item elsewhere.
- **Step 4 - record the field** - pass: the surface check ok in `npm test`, with the busy sample project returning one `inFlight` element.
- **Step 5 - the handoff lists them** - pass: the hook from main listed both items under "In flight in other worktrees", from `second` only the fix; the hooks tests show titles cleaned and nothing added outside a repository.
- **Step 6 - feature passes over items in flight** - pass: the rendered `feature` skill carries the rule; `npm test` exit 0 including the routing corpus.
- **Steps 7 to 13 - repairs** - pass: 39b/F-1 to F-6 and F-16 to F-21 closed by independent re-reviews, which reproduced specs linked to `/dev/zero`, to files inside and outside the worktree, FIFOs, oversized specs, linked directories and prunable records; the state and hooks tests for each fail without the repair.
- **Goal** - pass: the runs above, plus `npm test` exit 0.
- **Observed, not asked for** - the handoff's "Next up" line still names an item another worktree is building; recorded as 39b/F-15.

## Findings

### 39b/F-1 [P1] closed - A symlinked spec in another worktree hangs the handoff hook

**File:** src/hooks/write-handoff.mjs:102
**Found:** 2026-10-25 by audit (scope: current; lens: security)
**Why it matters:** A branch checked out in another worktree that commits `religion/context/current-work.md` as a link to `/dev/zero` makes `readFileSync` read forever; reproduced, the hook was still running when killed after 25 seconds. The hook runs at the end of every turn with no timeout, so any branch in any worktree can stall every session.
**Suggested fix:** `lstat` the spec and read it only when it is a regular file under a size cap, in the hook and in `readInFlight`.
**Resolution:** 2026-10-25, the hook reads another worktree's spec only when `lstat` shows a regular file under 256 KB; a hooks test with a spec linked to `/dev/zero` returns at once. Re-reviewed 2026-10-25: the hook returned in 0.037 s with a spec linked to `/dev/zero`; it stays fixed while 39b/F-16 and 39b/F-17, surfaced by this repair, are unresolved. Re-reviewed again 2026-10-25: `/dev/zero`, FIFO and oversized specs all left out at once; it stays fixed while 39b/F-16 is unresolved. Re-reviewed 2026-10-25 a third time: `/dev/zero`, FIFO and oversized specs left out in both readers, the hook returning in 0.034 s; the defect is gone, and it closes once 39b/F-16 does. Re-reviewed 2026-10-25 a fourth time, against 469043d: a spec linked to `/dev/zero` left out by both readers, the hook returning in 0.03 s; it closes once the chain through 39b/F-21 does. Closed 2026-10-25: every finding its repairs surfaced, 39b/F-16 through 39b/F-21, is closed.

### 39b/F-2 [P2] closed - A symlinked spec copies the first heading of any readable file into the handoff and status

**File:** packages/create-religion/lib/state.ts:686
**Found:** 2026-10-25 by audit (scope: current; lens: security)
**Why it matters:** Reproduced: a spec linked to a file whose first line was a `# ` heading carrying a token put that line in `inFlight[].title` and in the handoff, which is tracked and loaded every session.
**Suggested fix:** The same regular-file check as 39b/F-1, in both readers.
**Resolution:** 2026-10-25, `readInFlight` makes the same regular-file check; a state test with a spec linked to another file leaves it out. Re-reviewed 2026-10-25: a spec linked to a file with a secret heading was absent from the handoff and `inFlight`; it stays fixed with 39b/F-1 while 39b/F-16 is unresolved. Re-reviewed again 2026-10-25: a spec linked to another file is not read by either reader. Reopened 2026-10-25: the repair for 39b/F-18 resolves the spec's whole path, so a spec linked to any file inside its own worktree, such as an untracked `.env.local`, is read again by both readers and its first line becomes the title. See 39b/F-20. Repaired again 2026-10-25 with 39b/F-20. Re-reviewed 2026-10-25 against 469043d: specs linked to `../../.env.local` and to an outside file are absent from `inFlight` and the handoff, where the hook before that commit leaked the inner one.

### 39b/F-3 [P2] closed - The hook's step counts are quadratic on blank lines

**File:** src/hooks/write-handoff.mjs:106
**Found:** 2026-10-25 by audit (scope: current; lens: performance)
**Why it matters:** `^\s*- \[x\]` crosses newlines, the pattern `parseWork` already dropped for this reason; measured 966 ms per regex at 40k blank lines, run twice on every turn for a spec someone else writes.
**Suggested fix:** Use `^[ \t]*` in both counts.
**Resolution:** 2026-10-25, both step counts in the hook match `^[ \t]*`, as `parseWork` does. Re-reviewed 2026-10-25: a 40k blank-line spec in another worktree took the hook 0.037 s and still counted correctly.

### 39b/F-4 [P2] closed - The spec's item number is not normalised the way plan numbers are

**File:** packages/create-religion/lib/state.ts:689
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Why it matters:** `parsePlan` lowercases numbers, but `item` keeps the spec's text, so `item 2B.` or `Item 39B` never matches and status offers that item as next, the double start this item exists to prevent. Reproduced.
**Suggested fix:** Capture `[0-9A-Za-z]+` and lowercase it, in both readers.
**Resolution:** 2026-10-25, both readers take letters and digits straight after `item` and lowercase them; a state test reads `Item 2B.` as `2b`, and fails without the change. Re-reviewed 2026-10-25: `Item 2B.` reads as `2b` in both readers, and status passed over a plan item written `Item 2.` in another worktree.

### 39b/F-5 [P2] closed - Prunable worktrees are still listed

**File:** packages/create-religion/lib/state.ts:652
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Why it matters:** Both readers check only that the worktree directory exists; git calls an entry prunable when the `.git` file its record points at is gone. Reproduced: after `rm wt3/.git` status and the handoff still listed its item, and status passed over it. The spec promises to skip prunable entries.
**Suggested fix:** Require the recorded `.git` path itself to exist, in both readers.
**Resolution:** 2026-10-25, both readers keep a record only while the `.git` file it points at exists; a state test removes one and it is left out, and fails without the change. Re-reviewed 2026-10-25: after `rm prune/.git` the worktree was absent from the handoff and from `inFlight`.

### 39b/F-6 [P2] closed - Test git calls inherit the caller's GIT_ variables and global config

**File:** packages/create-religion/lib/state.test.ts:817
**Found:** 2026-10-25 by audit (scope: current; lens: tests)
**Why it matters:** Reproduced: with `GIT_DIR` set to another repository, `init` and `commit` in the tests acted on that repository, so `npm test` run from a git hook or `rebase --exec` could commit into the developer's repo; a global `commit.gpgsign` or `core.hooksPath` also reaches the test commits.
**Suggested fix:** One test helper that drops `GIT_` variables and sets `GIT_CONFIG_GLOBAL` and `GIT_CONFIG_NOSYSTEM`, used by the state and hook tests.
**Resolution:** 2026-10-25, the state and hook tests run git with every `GIT_` variable dropped and `GIT_CONFIG_GLOBAL` and `GIT_CONFIG_NOSYSTEM` set; with `GIT_DIR` pointing at another repository both suites passed and it kept its one commit and one worktree. Re-reviewed 2026-10-25: with `GIT_DIR` and `GIT_WORK_TREE` on a scratch repository both suites passed and it was untouched; all four test git calls pass the cleaned environment.

### 39b/F-16 [P3] closed - The spec's type check can be raced before the read

**File:** packages/create-religion/lib/state.ts:691
**Found:** 2026-10-25 by audit (scope: current; lens: security)
**Surfaced by:** 39b/F-1
**Why it matters:** `lstat` and the read are separate calls and the read follows links, so a spec replaced by a link to `/dev/zero` between them, during a checkout in that worktree, hangs the hook again. The same holds in `src/hooks/write-handoff.mjs:106`.
**Suggested fix:** Open without following links and without blocking, check the open handle, and read at most the cap from it, in both readers.
**Resolution:** 2026-10-25, both readers open with `O_NOFOLLOW` and `O_NONBLOCK`, check the open handle with `fstat`, and read at most 256 KB from it; a FIFO spec in another worktree left the hook returning at once. Re-reviewed 2026-10-25: check and read share one handle, a file that grows or shrinks after `fstat` is bounded, and a FIFO does not block; it stays fixed while 39b/F-18 and 39b/F-19, surfaced by this repair, are unresolved. Re-reviewed 2026-10-25 a second time: the defect is gone, and it stays fixed only while 39b/F-18, surfaced by its repair, is unresolved. Re-reviewed 2026-10-25 against 469043d: the defect is gone; it closes once 39b/F-21, at the end of this chain, does. Closed 2026-10-25: the finding its repair surfaced is closed.

### 39b/F-17 [P3] closed - This worktree's own item drops out of inFlight when its spec is a link

**File:** packages/create-religion/lib/state.ts:692
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39b/F-1
**Why it matters:** `readProjectState` follows the link for `work`, so status shows the item active while `inFlight` has no `here` entry, breaking the contract that the current item appears in both.
**Suggested fix:** Apply the plain-file read only to other worktrees, reading this one as `work` is read.
**Resolution:** 2026-10-25, `readInFlight` reads this worktree's own spec as `work` reads it; a state test with this worktree's spec linked to a file lists it with `here` true. Re-reviewed 2026-10-25: run from a worktree whose own spec is a link, `inFlight` gave that item with `here` true.

### 39b/F-18 [P3] closed - A linked directory still brings an outside spec's title in

**File:** packages/create-religion/lib/state.ts:686
**Found:** 2026-10-25 by audit (scope: current; lens: security)
**Surfaced by:** 39b/F-16
**Why it matters:** `O_NOFOLLOW` checks only the last part of the path, so another worktree's branch that makes `religion/context` a link to some other project's context directory put that project's title into `inFlight` and the handoff. Reproduced. The same holds in `src/hooks/write-handoff.mjs:89`.
**Suggested fix:** Resolve the spec's path and read it only while it stays inside that worktree, in both readers.
**Resolution:** 2026-10-25, both readers resolve the spec's path and skip it unless it lies inside the worktree's resolved root; a state test and a hooks test with a linked context directory leave it out, and both fail without the change. Re-reviewed 2026-10-25: a directory linked outside the worktree is left out; a directory linked inside it is still read, which is right. It stays fixed while 39b/F-20, surfaced by this repair, is open. Re-reviewed 2026-10-25 against 469043d: the defect is gone; it closes once 39b/F-21, at the end of this chain, does. Closed 2026-10-25: the finding its repair surfaced is closed.

### 39b/F-19 [P3] closed - A read error after opening another worktree's spec rejects the project state

**File:** packages/create-religion/lib/state.ts:690
**Found:** 2026-10-25 by audit (scope: current; lens: quality)
**Surfaced by:** 39b/F-16
**Why it matters:** Only the open was guarded, so an error from `stat` or `read` on the handle, such as an unreachable network file, rejected `readProjectState` where the earlier read skipped it, breaking the promise that the list is empty rather than absent.
**Suggested fix:** Catch around the handle's use and return nothing, closing it either way.
**Resolution:** 2026-10-25, `readPlain` catches any error from the open handle and returns nothing, and its close cannot throw; not reproduced in a test, since a read error on a regular file cannot be produced portably. Re-reviewed 2026-10-25: every step after the open sits in a catch that returns nothing and the handle closes on every path, so `readProjectState` cannot reject from here.

### 39b/F-20 [P2] closed - Resolving the whole spec path follows the spec's own link again

**File:** packages/create-religion/lib/state.ts:686
**Found:** 2026-10-25 by audit (scope: current; lens: security)
**Surfaced by:** 39b/F-18
**Why it matters:** `realpath` on the full path resolves a linked spec before the open, so `O_NOFOLLOW` never sees the link. Reproduced: another worktree's branch committing the spec as a link to `../../../.env.local` in that worktree put `SECRET_TOKEN=abc123` into `inFlight` and the handoff, which the reader before this repair left out. The same holds in `src/hooks/write-handoff.mjs:89`.
**Suggested fix:** Resolve only the parent directory and keep the spec's own name, so the open still refuses a linked spec; add a state and a hooks case with a spec linked to a file inside the same worktree.
**Resolution:** 2026-10-25, both readers resolve only the spec's folder and open the spec by its own name, so `O_NOFOLLOW` refuses a linked spec again; a state and a hooks case with a spec linked to `.env.local` in its own worktree leave it out, and both fail without the change. Re-reviewed 2026-10-25 against 469043d: the defect is gone; it closes once 39b/F-21, at the end of this chain, does. Closed 2026-10-25: the finding its repair surfaced is closed.

### 39b/F-21 [P3] closed - Without O_NOFOLLOW a linked spec is followed wherever it points

**File:** packages/create-religion/lib/state.ts:689
**Found:** 2026-10-25 by audit (scope: current; lens: security)
**Surfaced by:** 39b/F-20
**Why it matters:** Node defines no `O_NOFOLLOW` on Windows, so once only the folder is resolved nothing refuses a spec that is a link; a checkout with `core.symlinks=true` could bring any file's first heading in as a title. Reasoned from Node's win32 constants, not run on Windows. The same holds in `src/hooks/write-handoff.mjs:90`.
**Suggested fix:** After the open, `lstat` the name and read only when it is a plain file whose device and inode match the open handle, in both readers.
**Resolution:** 2026-10-25, both readers make that check; a scratch copy of the hook with `O_NOFOLLOW` removed still left a spec linked to `.env.local` out of the handoff, and leaked it once the check was also removed. Re-reviewed 2026-10-25 against 292b28f: with `O_NOFOLLOW` removed both readers still refused specs linked inside and outside the worktree, and leaked them only once the check was also removed.

## Landed

**Base:** 4e26b04e5ad186ce38d6af8ab78cf1c1530d6055
**Commits:** d695c31573ee0823b5cd6a9308f9b868d297bb06, dca45205652cbedf4461f2edb30bd265e799372c, 71d914f74a725f9240266cdb4564c507cd99ba38, 944f2ad8395d4cde34157c37b096fd6c9c178380, e4e941a25645a73c06ec3d7edddeebb0eb9827fd, 978313043986d252671b7ad81b2ccf7beb4e237c, 309620684e2d9f7c2bf26f86593f7c5d3b581266, b7d39da9828eeaf49798cf9e3d485d5d390a5cf0, d6629ef23351fd8960e6c88f65972013358e8343, 9002c4d8842e03875e5c38eeb6fb8d9a972cebcf, c0f9f3cf8398db5eb95c0c36226b1a39aceb893f, 469043d8f2e6802f06b328dcb6f009f91ecb8866, 292b28f9fb77f24d595d1da41ef3e9837cf6495b, 9d0c8ba22706be1f5ae684c66d2a87f0b7e1559f
**Product paths:** .agents/skills/feature/SKILL.md, .changeset/items-in-flight-visible.md, .claude/skills/feature/SKILL.md, docs/stability.md, packages/create-religion/lib/state.test.ts, packages/create-religion/lib/state.ts, packages/create-religion/lib/status.test.ts, packages/create-religion/lib/status.ts, packages/create-religion/surface.json, scripts/hooks.test.ts, scripts/surface-current.ts, src/hooks/write-handoff.mjs, src/skills/feature/SKILL.md
