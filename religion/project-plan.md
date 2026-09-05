# Project Plan

> One of the two planning documents you own. When it changes, re-run `overview`.

## 1. Problem

Coding agents fail in four ways, and the four compound:

- **State dies with the conversation.** Work is redone because the only record of what was
  finished lived in a context window that got cleared or compacted. The agent restarts
  something already built, or half-rebuilds it differently.
- **More diff than anyone reads.** A feature-sized change arrives at once and review becomes
  a rubber stamp, because reading it properly costs more than writing it did.
- **Confident claims that were never checked.** "It works now" with nothing behind it: the
  build was never run, the test never executed, the route never opened.
- **Scope drifts without anyone deciding.** A fix becomes a redesign, one reasonable step at
  a time, and nobody chose that.

Each is answered by a specific mechanism rather than by general care. Steps are ticked on
disk as they pass, so a cleared context costs nothing. Work lands one small diff at a time,
each with a review gate. Nothing may be called passing without naming what proves it. A spec
is written before code and is the boundary that drift is measured against.

## 2. Users

Developers using AI coding agents on real projects, who want the agent's work reviewable and
its progress durable.

| | What they need |
| --- | --- |
| **Adopting** | Install onto a repository that already exists without losing what is there. Understand the loop before committing to it. |
| **Daily** | The loop itself, and state that survives a cleared context or a new session. |
| **Maintaining Religion** | Author a skill once and render it per adapter, with drift caught before it ships. |

There are no access tiers. Religion runs locally against files and there is nothing to sign
into.

## 3. Features

- **The loop** - `feature` into `implement` into `check` into `audit` into `complete`, one
  work item at a time
- **Skills authored once**, rendered into one tree per adapter so each tool reads its own
  invocation syntax
- **Four adapters** - Claude Code, Codex, GitHub Copilot, OpenCode
- **Three authority tiers** that no mode or setting can widen
- **A findings ledger** with durable identifiers, where a repaired finding still blocks
  completion until a review has looked at the repair
- **Hooks for Claude Code**, each backing prose that applies to all four tools
- **A command-line tool** - install, update with conflict detection, status, doctor, and a
  local read-only dashboard
- **Entry-file merge** for repositories that already carry agent instructions
- **Optional waves** - steps a spec marks as independent build concurrently, off by default

## 4. Data

No database. State is markdown and JSON under `religion/`, with exactly one writer per file.

| File | Holds | Written by |
| --- | --- | --- |
| `project-plan.md`, `build-plan.md` | the two plans | you |
| `context/project-overview.md` | the generated source of truth | `overview` |
| `context/current-work.md` | the one active work item, with its steps ticked | `feature`, `fix`, `rollback`, `refactor` |
| `context/findings.md` | findings with severity and status | `audit` |
| `context/inbox.md` | notes taken mid-build | `capture` |
| `history/` | archives by kind: features, fixes, rollbacks, refactors, spikes | `complete`, and `spike` for its own |
| `learning/` | the journal, and the lessons distilled from it | `distill` |
| `.state/` | the install manifest and the activity record, never committed | the command-line tool |

The one-writer rule is what makes fan-out safe: subagents read and return, and the parent
performs the single write.

## 5. Tech

- **TypeScript, ESM, Node 22 or later** - the command-line tool, the build scripts, the
  verification suite
- **tsx** - runs the scripts directly, so there is no build step between editing and running
- **Markdown** - the skills themselves. Every rule is prose that any capable agent can read,
  which is what makes the same workflow work across four tools
- **npm, Changesets, GitHub Actions** - released over OIDC trusted publishing, with no token
  anywhere
- **No runtime dependencies** in the published package

## 6. Non-goals

**Religion will not grow a skill for every situation.** The current count is not sacred; the
argument before each addition is. A mode or an argument beats a sibling, and being argued out
of a skill counts as a success rather than a failure.

Already settled, with the reasoning in `docs/architecture/decisions/`:

- no monorepo awareness: predictably simple beats usually clever
- no independent-review mechanism
- no parallel execution across work items, which would need a different state shape

**Deliberately left open**, rather than ruled out: whether Religion becomes extensible by
third parties, whether it supports more runtimes, and whether it ever reaches outside the
repository.
