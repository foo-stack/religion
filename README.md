# Religion

A file-backed, spec-driven workflow for building software with AI while staying in control.

You write two planning documents. The workflow turns them into project context, work-item
specs, and small reviewable build steps. You review every spec before code exists, and
every diff before it lands.

```bash
npx create-religion@latest
```

## What this is

The problem with letting an AI build is not that the code is bad. It is that after a few
hours nobody knows what is in the repository, why any of it is shaped the way it is, or
what breaks if it changes.

Religion is a control system for that:

| Principle | What it means |
| --- | --- |
| Spec before code | A spec is written and reviewed before a line is built. |
| Small diffs | One reviewed step at a time, each with evidence that it works. |
| One work item | Exactly one feature, fix, or rollback is in progress. Finish it, archive it, move on. |
| State in files | Plans, specs, findings, and history are markdown. A cleared context costs nothing. |
| Findings with teeth | Review findings get durable identifiers, and a serious one blocks completion until a fresh review confirms the repair. |
| Authority is fixed | Configuration can make review stricter. Nothing in it authorizes a merge, a push, or a deploy. |

## The loop

```text
feature -> review the spec -> implement -> check -> audit -> complete
```

For an unplanned bug, `fix` replaces `feature`. When the cause is unclear, `debug` isolates
it first without changing anything. To remove completed work, `rollback` plans a guarded
reversal that preserves the record that it existed.

## Getting started

Scaffold your application first, then install on top of it.

```bash
npx create-religion@latest    # add the workflow
```

Then, in your AI tool:

1. **`setup`** tunes the installation to your project. On an existing codebase it surveys
   what is there and drafts the plans from it.
2. **Fill in the two plans**, or run `discovery` for a guided session.
3. **`overview`** distils them into the source of truth every session loads.
4. **`feature` → `implement` → `check` → `complete`**, one item at a time.

## The two files you own

| File | What it holds |
| --- | --- |
| `religion/project-plan.md` | The what and why: problem, users, features, data, stack. |
| `religion/build-plan.md` | The ordered checklist of work, one line each. |

Everything else is generated from those, or archived from finished work.

## Commands

Twenty-two skills. The loop is `feature`, `implement`, `check`, `audit`, `complete`.
Around it: `setup`, `discovery`, `overview`, `fix`, `debug`, `rollback`, `try`, `status`,
`doctor`, `tests`, `browser-tests`, `ci`, `prototype`, `release`, `auto`, `distill`,
`extend`.

Invoke them however your tool does: `/feature` in Claude Code, `$feature` in Codex, or
plain language anywhere.

```bash
religion status      # where the work stands, and the one thing to do next
religion doctor      # is the setup healthy
religion dashboard   # a local read-only view
religion update      # update the workflow files, preserving yours
```

## Tool support

| Tool | Reads |
| --- | --- |
| Claude Code | `CLAUDE.md` and `.claude/skills/` |
| Codex | `AGENTS.md` and `.agents/skills/` |
| GitHub Copilot | `AGENTS.md` and `.agents/skills/` |
| OpenCode | `AGENTS.md` and either tree |

Each tool's files are generated from one source, so they carry that tool's own invocation
syntax rather than a file hedging between four.

## Working on Religion itself

Skills are authored once in `src/skills/` and rendered into every adapter tree. Never edit
a rendered tree.

```bash
npm run build          # render skills, entry files, and state templates
npm test               # verification and routing checks
npm run verify         # tokens, drift, types, state-file hygiene
npm run test:routing   # routing corpus, plus description overlap
```

Design decisions live in `docs/architecture/`: the state model and its invariants, how
enforcement splits between prose and hooks, and the configuration schema.

## License

MIT.
