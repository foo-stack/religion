# Does resuming two work items cost less than finishing one?

**For:** item 39
**Settled:** yes

## Question

If each active work item lives in its own git worktree on its own branch, can a fresh session
resume either item at today's cost, and do two items finished side by side land without
conflicts in the state files they share? The answer is yes, no, or yes for named files under
named conditions.

Good enough meant two items taken through the files the loop really writes (a spec, an audit
finding, then `complete`'s bookkeeping), each in its own worktree of a throwaway copy of this
repository, then landed on one branch, with every conflicting file named, plus what a session in
each place loads and what `religion status` reports there.

## Answer

Resuming two costs no more than resuming one. Finishing two side by side does not land cleanly.
The cost ADR 9 describes moves from resuming to landing.

- **Resuming is free.** A worktree is the item: inside it, `current-work.md` holds that item's
  spec and nothing else, so the session needs no state saying which item it is in. Each worktree's
  `status` named its own item and next step.
- **Landing conflicts every time.** Four of the five shared files `complete` writes conflict when
  a second item lands after the first. All four are bookkeeping that can be derived again, not
  clashes in content:

  | File | Why it conflicts | Avoidable by text merge |
  | --- | --- | --- |
  | `context/project-overview.md` | each item restamps the source hash from its own plan | no, the hash must be recomputed |
  | `build-plan.md` | ticks on neighbouring lines | only when the items are not adjacent |
  | `context/findings.md` | both items assign the same next identifier | no, identifiers collide |
  | `learning/journal.md` | both append at the end | yes, with a union merge |

  Each item's archive under `history/` merged cleanly, because the paths differ. Landed partway
  through, the active spec and the ledger also conflict.
- **Finding identifiers collide before anything lands.** Both worktrees assigned `F-189`, because
  "one past the highest present" is computed from each branch's own copy of the ledger.
- **The main checkout cannot see items in flight** through `status`. It offered the next plan line
  as if nothing were active, so a session there could start an item that is already being built.
  But `git worktree list` is shared by every worktree of a repository. Read from the main checkout,
  it and each worktree's own `current-work.md` named both items and their progress, with no new
  state file.

## Evidence

Run on 2026-10-24 against `6d1196f`, in a throwaway clone with two worktrees on branches `item-a`
and `item-b`, simulating items 22 and 23.

| Probe | Result |
| --- | --- |
| Audit in each worktree | both assigned `F-189` |
| `religion status` in `item-a` and `item-b` | each reported its own item, step 2 of 2 next |
| `religion status` in the main checkout | no active item; next was the first plan line, item 21a |
| Always-loaded context from the entry file's imports | 21,891 and 21,899 bytes in the worktrees, against 22,122 with no item |
| Land `item-a`, then `item-b` | `item-a` fast-forwarded; `item-b` conflicted in `build-plan.md`, `project-overview.md`, `findings.md`, `journal.md`; its archive merged cleanly |
| Land both after only the spec and audit commits | conflicted in `current-work.md` and `findings.md` |
| `git worktree list` plus each worktree's spec, read from the main checkout | named both items and showed 1 of 2 steps done for each |

## What this means for item 39

- **Build in parallel, land serially.** Steps run in parallel, one item per worktree, but
  `complete`'s writes to the shared state files happen one item at a time at landing: the plan
  tick, the overview with its hash, the journal and the ledger prune, derived again on top of
  whatever landed before. The plan line's "each on its own branch or worktree" should say
  worktree; a branch alone gives no separate working copy of the spec.
- **Identifiers scoped to an item from the start.** The archive prefix (`27/F-03`) already exists;
  using it when a finding is raised, not when it is archived, removes the collision.
- **The registry is git's own.** The set of items in flight can be read from `git worktree list`
  and each worktree's spec, so `status` and `feature` can see them without a new state file. That
  answers ADR 9's "state about state" objection for discovering items, though not for deciding
  which item a session in the main checkout should take up.
- **Off the table:** text-merging the shared state files; a single shared `current-work.md` that
  names several items.

## Not tested

- Real `complete`, `audit` and `implement` runs. The simulation wrote the same shapes, but did
  not run the skills.
- Two items that touch the same source files, which is a real merge conflict rather than
  bookkeeping.
- The pull-request mode's flow, where landing happens on the host and the shared state files are
  derived again in a second pull request or after the merge.
- The open question the project overview records: the non-goals settle "no parallel execution
  across work items", and item 39 builds it. This spike shows it is feasible under the conditions
  above. It does not decide whether the non-goal should change; that decision is yours, when
  `/feature 39` raises it.

Budget: one hour; took about 30 minutes.
