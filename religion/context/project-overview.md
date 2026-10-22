# Religion - Project Overview

<!-- religion:source-hash 9344f11b75113d0e -->

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

Nineteen items queued, and every one waits on a spike, so `status` points at `spike` until one
is settled. Several also say which items they follow; item 29 made the tooling honour both.

**Status, learning and health**


**Bigger capabilities, mostly spike-first**

21. **Hooks beyond Claude Code** - the three hooks for Codex, Copilot and OpenCode, per tool
22. **Update merges edits** - three-way merge against a stored copy of what was installed
23. **Adopt from another workflow** - `setup` converts another workflow's plans and specs,
    landing them unverified
25. **A record of what an unattended run did** - a capped local activity log
26. **Scanner results in the ledger** - SARIF ingested as unverified findings, matched
    across runs
27. **Waves built in isolation** - one worktree per wave step, joined into one packet
36. **Built UI compared with its reference** - against saved screenshots or the prototype
37. **A first work item that teaches the loop** - a tiny real change walked through by `setup`
38. **Dependency changes made visible in review** - lockfile changes listed per step, offline

**Direction changes, all spike-first**

39. **Several work items at once** - one spec per active item; after 27, a major version
40. **Religion runs in CI** - a labelled issue to a pull request nothing merges; after 20,
    24 and 33
41. **One tool builds, another reviews** - review handed to a different installed tool
42. **Skills users write themselves** - project skills rendered beside the built-in ones
43. **Religion without Node** - a standalone binary per platform, Windows supported
44. **State files as an open format** - a versioned specification with conformance checks
45. **An editor extension** - read-only VS Code view of the spec, findings and next action
46. **Lessons that travel between projects** - an opt-in user-level store; after 7 and 31
47. **Religion runs its own agent** - `religion run` through a model API, a separate optional
    package outside the no-network promise
48. **Tamper-evident history** - records chained by hash, with a command that verifies them

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
- evidence - the verdict and proof for each outcome, in a section `check` writes
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

- `src/skills/` - the 26 authored skills, one directory each. The single source; never edit a
  rendered tree
- `src/entry/` - the entry-file sources and the partials shared between them
- `src/state/` - the state files a project is seeded with, written once and never re-rendered
- `src/hooks/` - four Claude Code hooks, copied rather than rendered
- `src/lib/` - the token vocabulary and adapter definitions, and the skill frontmatter reader
- `scripts/` - the renderer, the package staging step, and the verification suite
- `evals/routing/` - the routing corpus, one file per skill, positive and negative cases
- `packages/create-religion/` - the published package: `bin/` for the command-line entry
  point, `lib/` for install, update, merge, status, doctor, and the dashboard, with each
  module's tests beside it as `*.test.ts`
- `docs/` - architecture notes, the twelve decision records, and the full decision log
- `template/` - the install tree the build stages, copied into the published package. Generated
  output; never edited by hand
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

Each is deferred to its item's spike, which can run while the item is blocked. The spike's
answer decides whether the project plan changes.

- **Parallel work items** (affects: item 39, the work item shape) - the non-goals settle "no
  parallel execution across work items", and item 39 builds it. Decided by item 39's spike.
- **Independent review** (affects: item 41) - the non-goals settle "no independent-review
  mechanism", and item 41 hands review to a second tool. Decided by item 41's spike.
- **Closed extensibility** (affects: item 42, the skill shape) - skill sources, tokens and
  adapter definitions stay internal, and item 42 makes them a format users author in.
  Decided by item 42's spike.
- **Writing outside the project** (affects: item 46) - the plan promises to write nothing
  outside the project directory, and item 46 adds a user-level store. Decided by item 46's
  spike, after items 7 and 31.
- **An authority grant for CI** (affects: item 40) - section 3 says no mode or setting can
  widen the authority tiers, and item 40 needs a grant that applies with no person present.
  Decided by item 40's spike on headless operation.
