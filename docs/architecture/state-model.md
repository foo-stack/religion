# State model

Religion keeps project state in files, not in a conversation. This document defines
what those files are, who is allowed to write each one, and the invariants the whole
workflow depends on.

## Layout

A project that has Religion installed looks like this. Everything the workflow owns
lives under `religion/`, except the entry files and skill trees, which have to sit
where each tool looks for them.

```text
.                            (the app: src/, package.json, README.md, ...)
├── AGENTS.md                (cross-tool entry point)
├── CLAUDE.md                (Claude Code entry; imports AGENTS.md + context)
├── .claude/skills/          (rendered tree, read by Claude Code)
├── .agents/skills/          (rendered tree, read by Codex, Copilot, OpenCode)
└── religion/
    ├── config.json          (deterministic workflow settings)
    ├── project-plan.md      (you write: what and why)
    ├── build-plan.md        (you write: ordered feature checklist)
    ├── context/
    │   ├── project-overview.md   (generated source of truth)
    │   ├── coding-standards.md   (your conventions)
    │   ├── ai-interaction.md     (how the agent works with you)
    │   ├── current-work.md       (the one active spec)
    │   ├── findings.md           (the findings ledger)
    │   └── handoff.md            (generated: where we are, read first, gotchas)
    ├── history/
    │   ├── features/        (completed feature specs)
    │   ├── fixes/           (completed fix specs)
    │   └── rollbacks/       (rollback records)
    ├── learning/
    │   ├── journal.md       (raw observations)
    │   └── lessons.md       (curated, loaded)
    └── .state/
        ├── manifest.json    (installed version + managed-file hashes)
        └── run.json         (current command activity)
```

One app, one `religion/`, at the repository root. Workspaces are not modelled: a
monorepo installs Religion per package or treats one package as the project.

## Ownership

Every file has exactly one writer. A file with two writers is a merge conflict waiting
to happen, and a file with no writer is documentation nobody updates.

| File | Owner | Written by | Read by |
| --- | --- | --- | --- |
| `project-plan.md` | You | You, or `discovery` with your approval | `overview` |
| `build-plan.md` | You | You; `complete` ticks boxes | `overview`, `feature`, `auto`, `status` |
| `config.json` | You | You; `setup` proposes edits | every workflow skill |
| `context/coding-standards.md` | You | You; `setup` tunes it | `feature`, `implement`, `audit` |
| `context/ai-interaction.md` | You | You; `setup` tunes it | every skill, for output shape |
| `context/project-overview.md` | Generated | `overview` only | every skill |
| `context/current-work.md` | Generated | `feature`, `fix`, `rollback`; reset by `complete` | `implement`, `check`, `audit`, `complete` |
| `context/findings.md` | Generated | `audit` appends and re-statuses; `implement` marks repairs; `complete` prunes | `complete` gate, `status` |
| `context/handoff.md` | Generated | The session-stop hook, or `complete` where hooks are unavailable | humans, and the next session |
| `history/**` | Archive | `complete` only | `rollback`, `status`, humans |
| `learning/journal.md` | Generated | any skill, append-only | `distill` |
| `learning/lessons.md` | Generated | `distill` only | every skill |
| `.state/manifest.json` | Machine | installer and updater only | updater, `doctor` |
| `.state/run.json` | Machine | every mutating skill, as its first action | dashboard, `status` |

`findings.md` is the one file with several writers, and each writes a different thing:
reviews append entries and change status, repairs mark an entry repaired, completion
removes resolved entries. No two of them run at once.

## Invariants

**One work item at a time.** `context/current-work.md` holds exactly one feature, fix,
or rollback. Finish it, archive it, reset the file, start the next. There is no queue and
no registry, so "what is being built right now" always has one answer.

**Subagents read; the parent writes.** Reviews fan out across lenses and diagnosis fans
out across hypotheses, but those agents only read code and return findings. The parent
merges the results, assigns identifiers, and performs the single write. A subagent never
touches a state file, so parallelism cannot corrupt the ledger or race a spec.

**Progress lives in checkboxes.** Build steps in the active spec are checkboxes. The
build skill ticks each one as it lands and resumes from the first unchecked step. A
cleared context costs nothing, because the file already knows where the work stopped.

**Generated files are downstream.** When a plan changes, regenerate; never hand-edit a
generated file to paper over a stale plan.

**Configuration tunes strictness, never authority.** Settings can make review stricter,
change branch naming, or bound an automated run. Nothing in `config.json` grants
permission to commit, merge, push, deploy, publish, delete data, waive a failing check,
or accept a finding.

## Archive naming

Completed work is archived under `history/` with a numbered filename that preserves the
build-plan link and sorts in build order:

```text
history/features/03-user-authentication.md
history/fixes/password-reset-email.md
history/rollbacks/2026-09-03-03-user-authentication.md
```

The number lives in the path, never in the commit message. A commit message describes
what the change does, so that reading `git log` needs no other document open. Fixes have
no build-plan number and use a slug alone.

Numbers are never reused or renumbered, because archives refer back to them.

## Handoff

`context/handoff.md` is regenerated from the other state files. It answers three
questions for whoever picks the project up next, human or agent: where the work
currently sits, what to read first, and which gotchas are live.

A session-stop hook regenerates it, so it cannot go stale through forgetfulness. Tools
without hook support fall back to writing it at work-item boundaries. It is derived
output: nothing reads it to make a decision, and losing it costs nothing but convenience.

## Visibility

Whether these files are committed is asked at install time with no default. Committing
them makes the workflow portable and reviewable; ignoring them keeps it off a shared
repository at the cost of portability. Both are supported, and neither is assumed.

## Skill sources and rendered trees

Skills are authored once under `src/skills/<name>/SKILL.md` in the Religion repository
and rendered into each adapter tree by the build. Rendering substitutes a small token
vocabulary so each tool reads its own invocation syntax rather than a file that hedges
between several.

| Token | Renders as |
| --- | --- |
| `{{cmd:feature}}` | `/feature` for Claude Code, `$feature` for the shared tree |
| `{{cmd}}` | the current skill's own invocation |
| `{{tool}}` | the tool or tools reading that tree |
| `{{dir}}` | `.claude/skills` or `.agents/skills` |
| `{{state}}` | the state directory name |
| `{{product}}` | the product name |

An unrecognised token fails the build rather than shipping to a user as literal braces.
`npm run check:skills` verifies that every rendered tree matches its source, covering
both the shipped template and any tree rendered into this repository.

Never edit a rendered tree. Edit the source and rebuild.
