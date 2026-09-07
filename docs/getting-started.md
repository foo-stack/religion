# Getting started

Religion is a workflow your AI coding agent reads. It installs a directory of markdown into
your repository: skills the agent runs, and state files it writes as work progresses. There
is no service, no account, and nothing running in the background.

This walks from an empty install to the point where your first piece of work is ready to be
specced. It takes about ten minutes, most of it spent reading two files you own.

You need a git repository and Node 20 or later. Scaffold your application first and install
on top of it; Religion describes work on a codebase rather than creating one.

## Install

```bash
npx create-religion@latest
```

It asks which tools you use, then writes:

```text
Adapters: Claude Code
  create   53
  update   0
  keep     0  (your files, never overwritten)
  conflict 0

Wrote 53 file(s).
Wired the enforcement hooks into .claude/settings.json.

Next: run the setup skill in your AI tool, then fill in the two plans.
```

**If you already have a `CLAUDE.md` or `AGENTS.md`**, it does not overwrite them. It offers
to append its own sections inside markers, so everything you wrote stays exactly where it
is and a later `update` replaces only what is between those markers:

```text
Wrote 33 file(s).
Merged 1 entry file(s), keeping what you wrote.
Backed up 1 conflicting file(s).
```

Decline and the file is left untouched and reported as a conflict. Either way the original
is backed up under `religion/.state/backups/`.

## How to run a skill

Skills are written once and rendered for each tool, so the name is the same everywhere and
only the way you type it differs:

| Tool | How you invoke `setup` |
| --- | --- |
| Claude Code | `/setup` |
| Codex | `$setup` |
| GitHub Copilot, OpenCode | ask for it by name |

The rest of this guide uses the bare name in backticks, like `setup`, and leaves the typing
to you. You can also just describe what you want: the skills are selected from the request,
so "help me set this up" reaches the same place.

## Then: `setup`

Run `setup` first. It replaces the shipped assumptions with what is true in your repository,
and it takes one of two paths depending on what it finds.

### If your codebase already exists

It surveys the repository and drafts both plans from what is actually there: the README and
any docs for the problem, authentication and entry points for the users, routes and exported
surface for the features, schema and model definitions for the data, the dependency manifest
for the stack, and the git history for what shipped and in what order.

Three things worth knowing before you read the draft.

**Everything it concluded is marked.** A claim read straight out of the repository is
written plainly. A claim it worked out is marked `(inferred)`. The code says what was built
and never why, so anything about intent, audience or motivation is inferred at best.

**It leaves gaps as questions rather than filling them.** A section the repository does
not answer is written as a question addressed to you, in this shape:

```text
## 1. Problem

> Not found in the repository. What problem does this solve, and what is broken or
> missing without it?
```

The draft then says what it looked at and what it did not find, so you can tell a genuine
gap from a source it missed.

This is not a failure mode, it is the point. Tried against a repository whose `README.md`
was still the unmodified starter template and whose only two root commits were both titled
`init`, the drafting left that section as a question rather than assembling a problem
statement out of the implementation. A confident answer with nothing behind it is worse
than a blank, because nothing later will question it.

**The build plan starts from reality.** Work that already shipped goes in checked, in the
order the history suggests it was built, so the numbering is honest from the first day
rather than pretending the project starts now.

Nothing is written until you have seen it. `setup` proposes, shows the exact content, and
waits.

### If your project is a fresh scaffold

There is nothing in a scaffold to derive intent from, so `setup` does not try. It fills in
the entry file's commands and the coding standards from what it can see, then leaves both
plans as templates for you to write. Run `discovery` if you would rather be asked questions
than face a blank file.

### Either way

`setup` also asks whether the workflow files should be committed or kept local, and does not
pick a default:

- **Committed** puts the plans, specs and history in the repository: portable across
  machines, visible to collaborators, reviewable in a pull request.
- **Local** adds them to `.gitignore`, so nothing about the workflow reaches a shared
  repository. Another machine needs it installed again.

## The two files you own

Everything else Religion keeps is generated from these two or archived from finished work.

| File | What it holds |
| --- | --- |
| `religion/project-plan.md` | The what and why: problem, users, features, data, stack |
| `religion/build-plan.md` | The ordered checklist of work, one line each |

The project plan has five required sections and three optional ones. The build plan is a
checkbox list, and the checkboxes are load-bearing: they are how the loop knows what is done
and what is next.

```text
- [x] 1. **A counter** - name it, increment it, reset it
- [ ] 2. **Several at once** - more than one tally on screen
```

Keep each item feature-sized. Not "Database", not "Make it faster", and not one line holding
three unrelated things.

## Then: `overview`

The plans are yours: long, rough, in whatever order made sense. `overview` distils them into
`religion/context/project-overview.md`, which is the file every session actually loads.

Run it whenever the plans change. It stamps a hash of the two plans it was built from, so
anything reading a stale overview notices and regenerates first.

It also records contradictions it finds as open questions, each naming what it affects. Work
touching a named area waits; work elsewhere carries on.

## Check it worked

```bash
npx create-religion@latest doctor
```

Before `setup` runs, expect it to complain, and expect it to be right:

```text
2 problem(s).

  FAIL  entry file commands (blocks work)
          still the shipped placeholder; setup has not run
  FAIL  overview freshness (blocks work)
          not generated yet

  ok    required files: all 16 present
  ok    configuration: valid
  ok    adapters: .claude/skills with 25 skills
  ok    visibility: state is committed
  ok    git: repository present
```

Once the commands are filled in and the overview is generated:

```text
Healthy.

  ok    required files: all 16 present
  ok    configuration: valid
  ok    adapters: .claude/skills with 25 skills
  ok    entry file commands: filled in
  ok    overview freshness: current
  ok    visibility: state is committed
  ok    git: repository present
```

`doctor` is read-only and safe to run at any time. When it complains, see
[what to do when doctor complains](doctor.md).

## Where you are now

```bash
npx create-religion@latest status
```

```text
Next:     /feature  (next in the plan: A counter - name it, increment it, reset it)

Active:   nothing in progress
Plan:     0/3 complete (0%)
Findings: none
Overview: current
```

`status` is read-only too, and it is the thing to run when you come back after a break or a
cleared context. It reads the files rather than remembering anything, which is why a cleared
conversation costs nothing.

## What happens next

Run `feature` and the loop starts: a spec written before any code exists, then one small
reviewed diff at a time. [What the loop actually feels like](the-loop.md) walks one item all
the way through, so you know what you are agreeing to before you start.
