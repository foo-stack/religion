# Religion - Project Overview

<!-- religion:source-hash 6f467f39ddf33549 -->

> A file-backed, spec-driven development workflow for AI coding agents, shipped as an npm
> package that installs into someone else's repository.

## Problem

Coding agents lose state when a conversation is cleared, produce more diff than anyone can
actually review, claim things work without having run them, and widen a job one reasonable
step at a time until it is not the job that was asked for. The four compound: unreviewed work
built on unverified claims, with no durable record of what was finished.

Religion answers each with a mechanism rather than with care: steps ticked on disk, one small
diff per step behind a review gate, a rule that nothing may be called passing without naming
what proves it, and a spec written before code that is the boundary drift is measured against.

## Users

Developers using AI coding agents on real projects, who want the agent's work reviewable and
its progress durable. No access tiers: Religion runs locally against files and there is
nothing to sign into.

- **Adopting** - install onto a repository that already exists without losing what is there,
  and understand the loop before committing to it
- **Daily** - the loop itself, and state that survives a cleared context or a new session
- **Maintaining Religion** - author a skill once and render it per adapter, with drift caught
  before it ships

## What it does

- **The loop** (headline) - `feature`, `implement`, `check`, `audit`, `complete`, one work
  item at a time, each step a diff to read and evidence that its outcome was met
- **Skills authored once** - rendered into one tree per adapter, so each tool reads its own
  invocation syntax instead of one file hedging between four
- **Four adapters** - Claude Code, Codex, GitHub Copilot, OpenCode
- **Three authority tiers** - what always asks, what an automated run may grant, and what is
  free. No mode or setting can widen them
- **A findings ledger** - durable identifiers and severities, where a repaired finding still
  blocks completion until a review has looked at the repair
- **Hooks for Claude Code** - each backing prose that applies to all four tools, never a rule
  of its own
- **A command-line tool** - install, update with conflict detection, status, doctor, and a
  local read-only dashboard
- **Entry-file merge** - installs into a repository that already carries agent instructions,
  keeping what is there
- **Optional waves** - steps a spec marks as independent build concurrently, off by default

## Roadmap

1. **Tests for the command-line tool** - a runner, and coverage for manifest hashing,
   conflict detection, and the marker surgery that merges entry files
2. **Setup drafts usable plans from an existing codebase** - survey an unfamiliar repository
   with real history and produce two plans a person would keep
3. **Documentation for people who did not build it** - a getting-started walkthrough, what
   the loop feels like in practice, and what to do when `doctor` complains
4. **A path to 1.0** - state what is stable, what an update guarantees, and what counts as a
   breaking change

## Domain model

Religion **transforms input**: it reads authored markdown and renders it per adapter, and it
reads and writes a project's state files. There is no database. Every state file has exactly
one writer, which is what makes subagent fan-out safe.

### Skill (load-bearing)

The authored unit, one directory under `src/skills/`.

- `name` (string) - the invocation, and must equal the directory name
- `summary` (string) - short clause used to build the roster in the entry files
- `description` (string) - the long routing text a request is matched against
- `allowed-tools` (string, optional) - declared where a skill's contract is read-only
- body (markdown) - steps and rules, written in the token vocabulary rather than one tool's syntax

Renders into one `SKILL.md` per adapter tree. **Load-bearing:** `description` is what routing
runs on, and changing it moves requests between skills.

### Adapter tree (load-bearing)

- `id`, `dir`, `entryFile`, `tools`, `toolLabel`, `command(skill)` - how one tool is addressed
- Renders every skill plus one entry file. **Load-bearing:** adding one changes every
  rendered path and the drift check's coverage.

### Work item

The single thing in progress, in `context/current-work.md`.

- kind (feature, fix, rollback, or refactor campaign)
- steps (checkbox list) - ticked as each passes, which is what survives a cleared context
- a step may be marked as running with an earlier one, forming a wave
- archives to `history/<kind>/` on completion

### Finding (load-bearing)

- `id` (durable identifier) - referenced by repairs and archives, so it never changes
- `severity` (P0 to P3), `status` (open, fixed, closed, accepted, invalid, unverified)
- **Load-bearing:** an open or fixed P0 or P1 blocks completion, and `fixed` blocking is
  deliberate.

### Install manifest (load-bearing)

- `version`, `adapters`, `managed` (path to hash of what was **installed**, not what is on disk)
- **Load-bearing:** recording the working copy instead makes conflict protection work exactly
  once.

## Code map

- `src/skills/` - the 25 authored skills, one directory each. The single source; never edit a
  rendered tree
- `src/entry/` - the entry-file sources and the partials shared between them
- `src/state/` - the state files a project is seeded with, written once and never re-rendered
- `src/hooks/` - four Claude Code hooks, copied rather than rendered
- `src/lib/` - the token vocabulary and adapter definitions, and the skill frontmatter reader
- `scripts/` - the renderer, the package staging step, and the nine-check verification suite
- `evals/routing/` - the routing corpus, one file per skill, positive and negative cases
- `packages/create-religion/` - the published package: `bin/` for the command-line entry
  point, `lib/` for install, update, merge, status, doctor, and the dashboard
- `docs/` - architecture notes, the twelve decision records, and the full decision log
- `.claude/skills/`, `.agents/skills/`, `CLAUDE.md`, `AGENTS.md` - rendered output, committed
  so the skills are readable here, and byte-compared by the drift check
- `religion/` - this project's own installation, used to build itself

## Tech stack

- **TypeScript, ESM, Node 22 or later** - the command-line tool, build scripts, verification
- **tsx** - runs the scripts directly, so there is no build step between editing and running
- **Markdown** - the skills themselves. Prose any capable agent can read is what lets one
  workflow serve four tools
- **npm, Changesets, GitHub Actions** - released over OIDC trusted publishing, no token anywhere
- **No runtime dependencies** in the published package

## Open questions

- **Extensibility, runtime coverage, and reaching outside the repository** (affects: roadmap
  item 4) - the project plan records these as deliberately open rather than ruled out. A 1.0
  stability statement has to say something about each, since each would be a breaking change
  to make later. Resolve in the plans and regenerate.
