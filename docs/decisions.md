# Decisions

Every decision taken while building Religion, in the order it was taken. One line each.

This is the complete record, kept because the reasoning behind a small choice is the part
that disappears first, and because a decision nobody can find gets remade differently six
months later. The dozen that had real alternatives, and where the alternative still has
advocates, are written up in full under `architecture/decisions/`.

A later entry that reverses an earlier one says so and names it. The earlier entry stays
exactly as it was: the record is what was decided at the time, not a tidy account of what
survived.

| # | Decision |
| --- | --- |
| 1 | **Name: Religion.** The repo name is the product name. |
| 2 | **State directory: `religion/`** at repo root. |
| 3 | **Bare command namespace** (`/feature`, `/implement`,...), same as the source. Justified by decision 4: a shippable package should not force a prefix on its users. |
| 4 | **Shippable npm package.** `npx create-religion@latest`, `update`, and a global `religion` read-only CLI. Full parity with the source's distribution tier. |
| 5 | **All four adapters:** Claude Code, Codex, GitHub Copilot, OpenCode. |
| 6 | **Adapter trees are generated, not hand-maintained.** A consequence of decision 5: supporting four adapters means authoring once and emitting four trees, or hand-maintaining four copies of every skill forever. |
| 7 | **Skill triage: item by item.** Walking all 23 in batches of 4. |
| 8 | **Self-improvement loop: adopted.** A journal + curated lessons pack, promoted by a `distill` capability. |
| 9 | **Subagents / parallel work: adopted.** Fan-out for at least the audit lenses. Forces a change to the singleton-work-item model. |
| 10 | **Skill authoring: adopted.** The system can write new skills for itself. |
| 11 | **Claude Code hooks: adopted.** Harness-enforced gates, not prose-requested ones. Claude Code only - the other three adapters keep the prose fallback. |
| 12 | **Railway: adopted.** First-class `/release` target alongside Render and Vercel. |
| 13 | **Chrome MCP: adopted.** Browser evidence without a Playwright install. |
| 14 | **Design system binding: adopted.** `/prototype` builds in Motif/Vorge instead of throwaway HTML. |
| 15 | **Monorepo awareness: adopted.** Per-package or scoped state, not one app at the repo root. |
| 16 | **Installer + update manifest: BUILD.** (Already implied by decision 4.) |
| 17 | **Status CLI: BUILD.**. |
| 18 | **Local dashboard: BUILD.**. |
| 19 | **Routing evals + e2e scenarios: BUILD.**. |
| 20 | **`onboard` + `adopt` -> one `setup` skill.** Detects repo maturity and branches internally: greenfield tunes and prompts for plans, brownfield surveys and infers plans from existing code. |
| 21 | **`doctor` splits in two.** `religion doctor --json` in the CLI owns every deterministic check; the `/doctor` skill shells out to it and explains + offers fixes. No duplicated check logic. |
| 22 | **`discovery`: keep as optional.** Never required, never the default next action. |
| 23 | **`overview`: keep, and auto-refresh when stale.** The source-hash mismatch triggers regeneration and shows a diff of what changed, instead of telling the user to re-run it. Hook-enforceable (decision 11). |
| 24 | **`brief` -> a preview flag on `feature`.** `/feature 5 preview` does the read-only pass. Skill cut. |
| 25 | **`feature`: keep as-is.** Sizing, sub-feature splitting, the self red-team pass, and the "what the critique changed" report all survive intact. |
| 26 | **`fix`: keep separate from `feature`.**. |
| 27 | **`debug`: keep, and make it a subagent fan-out case.** Competing hypotheses are tested concurrently in isolated agents; evidence is merged. Still edits nothing. |
| 28 | **`rollback`: keep full,** including SHA validation, dependency-risk scan, and the pathspec-excluded three-way reverse patch. |
| 29 | **`implement`: keep as-is,** including the four-way checkpoint prompt and checkbox resumption. |
| 30 | **`check`: keep; evidence source chosen by project type.** Chrome MCP for web, command capture for CLI, request/response for APIs, plus any configured harness. Nothing assumed. |
| 31 | **`try`: keep, and auto-generate it at `/complete`.** The guide is emitted for every completed work item, not only on request. |
| 32 | **`audit`: keep, and fan the four lenses out to subagents.** Each lens returns findings; the ledger merges them. Needs a concurrent-write strategy for `findings.md`. |
| 33 | **`complete`: git mode is configurable, `trunk` is the default.** Resolves the clash between the source's automatic branching and keeping branch creation the user's call. Ships working on the current branch; `branch-per-item` is opt-in per project. |
| 34 | **`status`: CLI computes, skill explains.** Same split as `doctor` (decision 21). |
| 35 | **`tests`: keep, plus a `backfill` mode** that writes coverage for logic-bearing code that already exists. Lifts the source's deliberate "setup only" restriction. |
| 36 | **`browser-tests`: keep separate.** Chrome MCP is ad-hoc evidence for one check; a harness is repeatable CI regression coverage. Different jobs. |
| 37 | **`ci`: keep as-is,** GitHub Actions only, built around one `Verify` command. |
| 38 | **`prototype`: throwaway HTML by default, Motif mode when the project has it.** Stack-agnostic default matters for a shipped package. |
| 39 | **`release`: keep, add Railway** as a third first-class target beside Render and Vercel. |
| 40 | **`autopilot` + `continuous` -> one `auto` skill with explicit bounds.** `/auto` = one item, stop before complete. `/auto all` = whole plan. `/auto 3` = next three. Git behavior follows `git.mode` (decision 33). ~300 lines saved. |
| 41 | **Learning is per-project only.** `<project>/religion/learning/{journal,lessons}.md`. No global state, nothing compounds across repos. |
| 42 | **Skill generator with per-tool substitution.** Author once in `src/skills/<name>/SKILL.md` using invocation tokens; the build emits four adapter trees, each carrying that tool's own syntax. Codex users read `$feature`, Claude users read `/feature` - no file hedges with "or". Replaces the source's hand-maintained byte-identical trees and its CI parity check. |
| 43 | **No monorepo awareness. Source behaviour kept:** one app at the repo root, one `religion/` state directory. Reverses decision 15. Removes workspace detection from `setup` and per-package state from the model. |
| 44 | **Singleton work item survives. Subagents are read-only.** Lens and hypothesis agents read code and *return* findings; the parent merges, assigns sequential IDs, and performs the single write. Preserves every source invariant, and answers the `findings.md` race flagged. |
| 45 | **Religion replaces the ad-hoc plan, progress and handoff scratch-file habit.** `build-plan.md` is the plan, `history/` is the progress record, and a new generated `context/handoff.md` carries "where we are / read first / gotchas". Resolves the recorded conflict. |
| 46 | **Numbered archives, numberless commits.** `history/features/03-user-authentication.md` keeps the build-plan link and sort order; commit messages describe the change only. Resolves the recorded conflict. |
| 47 | **Visibility asked at install with no default.** Neither committing nor ignoring is preselected. |
| 48 | **A session-stop hook writes `context/handoff.md`.** Claude Code only; other adapters fall back to writing it at work-item boundaries. |
| 49 | **Repo mirrors the source's shape:** `src/skills/` authored, `template/` generated, `packages/create-religion/`, `scripts/`, `evals/`, and a dogfood `religion/`. |
| 50 | **PROPOSED: `current-feature.md` -> `current-work.md`.** The file holds features, fixes, and rollbacks; the source's name is a misnomer that its own skills have to work around. Needs your ruling. |
| 51 | **Both entry files are generated per tool** from `src/entry/`, sharing prose through `src/entry/partials/` via an `{{include:name}}` token. `CLAUDE.md` uses `@` imports and relies on skill auto-discovery; `AGENTS.md` spells out the roster. |
| 52 | **Load everything every session** (source parity), now also including `context/handoff.md` and `learning/lessons.md`. Seven files, not five. |
| 53 | **Roster is per tool and generated.** `{{roster}}` is derived from the authored skill sources' `summary` frontmatter, so it cannot drift from the skills that exist. Claude's entry file points at the tree instead. |
| 54 | **`learning/lessons.md` loads every session.** An empty file costs nothing, so it grows only once the system has learned something. |
| 55 | **Skills declare `summary` alongside `name` and `description`.** `description` stays long for routing; `summary` is the short clause the roster uses. Missing frontmatter fails the build. |
| 56 | **Three authority tiers.** Tier 1 (merge, push, deploy/publish/send, delete or rewrite history, remote service changes) always asks and is granted by nothing. Tier 2 (commit, install dependencies, remote network calls) asks in normal work; an automated run's invocation grants it for that run only, and never reaches tier 1. Tier 3 (read, local build/test/lint, drive the app locally, write state files) is free. |
| 57 | **Merge is tier 1, so an automated run stops to ask before every merge.** In `trunk` mode there is no merge, so an automated run is unattended; in `branch-per-item` it pauses once per item. |
| 58 | **Evidence discipline kept.** No claim of passed, verified, or working without naming the proof. A required check that cannot run is a blocker, not a pass. |
| 59 | **`git.checkpoints` is configurable:** `none`, `every-step`, or `squash`, orthogonal to `git.mode`. Under `trunk`, `squash` rewrites local history and is therefore tier 1. |
| 60 | **Prose is authoritative; hooks are belt-and-braces.** A hook may only enforce what the prose already requires. A rule existing solely as a hook is a bug, since only Claude Code runs hooks. |
| 61 | **Four hooks:** block tier-1 Bash commands, regenerate the handoff on stop, inject a stale-overview notice, and block writes to rendered adapter trees in a Religion checkout. Implementations come later; the manifest is settled. |
| 62 | **`workflow.stepReview` ships as `every`.** Configurable to `item`. Either way, implementation stops early on a failed check, a needed decision, a conflict, scope drift, or a tier-1 action. |
| 63 | **One set of quality gates for all work,** automated or not: `qualityGates.audit` (default `when-sensitive`) and `qualityGates.check` (default `when-behavioral`). No try-guide gate, since the walkthrough is generated for every completed item. Six settings become two. |
| 64 | **`project-plan.md` keeps 8 sections, 5 required.** Monetization, UI/UX, and deployment are optional and may be deleted outright rather than answered "not applicable". |
| 65 | **`coding-standards.md` ships universal rules only** (~77 lines: testing gate, code quality, comments, writing, errors and inputs). A `Stack conventions` section is left empty for `setup` to write from real detection. |
| 66 | **`ai-interaction.md` kept in full,** including the loop narrative. It defers to the entry file for authority rather than restating it, so the two cannot contradict each other. |
| 67 | **State templates render through a shared target.** One `religion/` directory serves every installed adapter, so state files cannot carry one tool's syntax. `{{cmd:feature}}` renders there as a backticked bare name, and the entry files teach invocation. |
| 68 | **Config is 13 settings, down from 14,** redistributed: the source spent six on quality gates and none on git mode. |
| 69 | **Overview mirrors the plan's sections plus a concrete data model.** Optional plan sections that were deleted are omitted from the overview rather than filled with "not applicable". |
| 70 | **Stale overview regenerates on next use and reports what changed.** Any skill reading it recomputes the source hash first; nothing acts on stale context. The prompt hook nudges the same in Claude Code. |
| 71 | **Plan validation proposes, never edits.** Shape problems that break the loop get an exact proposed replacement and wait for approval. Declining is allowed; the skill says what will not work and generates anyway. |
| 72 | **Open questions persist and block work in the areas they affect.** Each records an `affects` list, so work touching a named area is blocked while work elsewhere proceeds. Requires narrow scoping. |
| 73 | **Spec template keeps all ten sections,** including `Build loop`. The process is repeated in the spec so it is in front of the reviewer at the moment of review. |
| 74 | **Design reference: prototypes first, image second.** Static mockups make token-porting the first build step; real components are built on directly with no porting step. Absent prototypes, visual work asks for an image before spec'ing. |
| 75 | **`feature <n> preview` emits a prose briefing:** what it is, dependencies, what it touches, size, likely split, and anything worth deciding first. Writes nothing. Replaces the source's separate briefing skill. |
| 76 | **A blocking open question is resolved in place.** The skill names the contradiction, asks the user, shows the exact plan edit their answer implies, writes it on approval, regenerates the overview, then continues. Only the user's own answer may resolve one. |
| 77 | **`npm run verify` added.** Four checks: no unrendered tokens, rendered output matches source, typecheck, and no tool-specific invocation in state templates. Written after ad-hoc shell checks reported success three times while real problems sat unexamined. |
| 78 | **Verification is scoped per step; the full `Verify` runs once before completion.** A full suite after every step costs minutes per diff on a real project. A step still runs the full command early when it could plausibly break something distant. |
| 79 | **The step prompt adapts to config.** The commit option appears only when `git.checkpoints` allows one, and choosing it is the approval that authorizes the commit. Under `stepReview: item` there is no prompt at all. |
| 80 | **Stop after two or three failed attempts and offer handoff to `debug`,** which reproduces and tests competing hypotheses in parallel. |
| 81 | **Repairs are extra reviewed steps, marked `fixed`, then re-reviewed by `audit` running in a subagent with fresh context.** The subagent restores the independence the source protects by refusing to self-close: a review that did not write the repair is what makes it `closed`. |
| 82 | **Completion makes a separate bookkeeping commit, then offers to squash.** Nothing is rewritten by default; squashing is opt-in per item, needs an explicit yes, and is refused when any of the commits was already pushed. |
| 83 | **The safety pass blocks on three things only:** the full `Verify` passed, no P0/P1 finding is `open` or `fixed`, and every build step is ticked. Unrelated changes in the working tree are **reported prominently but do not block**. |
| 84 | **Commit messages: conventional prefix, subject saying what the change does, body naming what changed.** Never a plan number, roadmap reference, or AI attribution. |
| 85 | **Ledger pruning: resolved entries archive under a work-item prefix; unresolved stay live.** Item 12's `F-03` archives as `12/F-03`. `open`, `fixed`, and `unverified` keep their identifiers in the ledger so nothing is silently dropped. |
| 86 | **Skill references are validated against a planned roster.** A reference to a planned-but-unauthored skill is a legitimate forward reference; a reference to anything else is a typo and fails the build. Two checks added to `verify`. |
| 87 | **Overview splits `What it does` from `Roadmap`.** Product identity and work queue are different things that only coincide on a new project. Found by the dry run, which produced an overview claiming vorge's features were three small queued items. |
| 88 | **`Data model` becomes `Domain model`,** with explicit guidance for projects that store nothing: shapes read and emitted for a compiler or CLI, public types and contracts for a library. |
| 89 | **Overview gains a `Code map`.** Read from the repository rather than the plans, since neither plan describes layout and every spec was otherwise re-deriving it. |
| 90 | **Plan validation checks item kind,** routing bugs to `fix` and review tasks to `audit` instead of letting them be spec'd as features. |
| 91 | **`complete` records a `## Landed` section** with the base commit, the item's commits, and its product paths. This is what makes reversal possible under `trunk`, where an item's commits sit among others on the same branch. Closes the rollback follow-up. |
| 92 | **The activity contract lives in the entry files, not in 22 skills.** One statement covering every skill, rather than a repeated first line that would drift. |
| 93 | **State files are seeded once, never re-rendered.** They hold real work after a project starts; re-rendering would destroy it and drift-checking would flag every real edit. |
| 94 | **Three hooks ship:** a tier-one command guard, a rendered-output guard, and a handoff writer. Wired into settings only when a project has none, never merged into existing settings. |
| 95 | **The manifest records installed hashes, not on-disk hashes.** Recording the working copy makes a preserved local edit look like the installed version, so conflict protection would work exactly once. |
| 96 | **Routing evals validate structure and description discriminativeness** rather than calling a model: every skill has negative cases, no two claim a case, and no pair shares more than half its distinctive vocabulary. Current worst pair is 15%. |
| 97 | **Named the authoring skill `extend`.** It argues against adding a skill before adding one, since a roster that grows carelessly routes worse for every later request. |
