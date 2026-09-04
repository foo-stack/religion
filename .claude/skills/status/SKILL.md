---
name: status
summary: say where the work stands and what to do next
description: "Report where the project stands: build-plan progress, the active spec and which of its steps are done, open findings, git state, and the one action that makes sense next. Uses the religion command-line tool when it is installed, since the parsing is deterministic, and reads the state files directly when it is not. Read-only. Use when the user runs /status, asks where things stand, what is next, what is in progress, or is picking work back up after a break or a cleared context."
---

# status - where things stand

Read-only. It reports; it never advances anything.

## Step 1 - get the state

If the `religion` command is available, run `religion status --json` and use it. The
parsing is deterministic and a program does it more reliably than a reading of the files.

Otherwise read them directly: `religion/build-plan.md` for progress,
`religion/context/current-work.md` for the active spec and its ticked steps,
`religion/context/findings.md` for the ledger, `religion/context/project-overview.md` for
its source hash, and the git branch and working-tree state.

## Step 2 - report

Lead with the next action, because that is the question actually being asked.

- **Next** - the single command that makes sense now, and why in one clause.
- **Active work** - the item, and which step it is on out of how many. "Nothing in
  progress" when the spec is the stub.
- **Plan** - items complete out of total, and the next unchecked one.
- **Findings** - counts by status, naming any P0 or P1 that is `open` or `fixed`, since
  those block completion.
- **Git** - branch, whether the tree is dirty, and unpushed commits.
- **Warnings** - only real ones: a stale overview, an open question blocking queued work,
  a spec whose steps are all ticked but which was never completed, a dirty tree with no
  active spec.

Say "up to date" rather than inventing a warning when there is nothing wrong.

## Choosing the next action

| State | Next |
| --- | --- |
| Plans not filled in | Write them, or run /discovery |
| Overview missing or stale | /overview |
| No active spec, plan has unchecked items | /feature |
| Active spec, steps unticked | /implement |
| All steps ticked, not verified | /check |
| Verified, findings blocking | /audit, or repair via /implement |
| Verified, nothing blocking | /complete |
| Plan complete | Add to the plan, or /release |

When two apply, take the one further along: finishing beats starting.

## Rules

- Read-only. Never write a state file, tick a step, or advance anything.
- One next action. A list of options is not an answer to "what now".
- Do not guess at what is happening. If the state is contradictory, say what is
  contradictory.

## Formatting

Match the conventions in `religion/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
