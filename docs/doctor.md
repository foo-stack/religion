# What to do when doctor complains

```bash
npx create-religion@latest doctor
```

`doctor` checks that the installation is intact and that the workflow can actually run. It
is read-only: it never edits, never installs, and is safe at any moment, including in the
middle of a build.

Every failure below was triggered deliberately against a real install, and every fix here
was run and shown to clear it.

## Reading the output

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

Failures come first, worst first, each labelled with what it stops:

| Label | Meaning |
| --- | --- |
| `blocks work` | the loop cannot run correctly until this is fixed |
| `blocks completion` | you can build, but finishing an item will fail |
| `cosmetic` | nothing is blocked; it is untidy |

Seven checks run. Six can fail. `visibility` only ever reports.

## required files

**Protects:** the sixteen files and directories the loop reads and writes. A missing one is
not an error at the moment it goes missing; it is an error later, when something tries to
read it.

```text
  FAIL  required files (blocks work)
          missing: context/coding-standards.md
```

Something under `religion/` was deleted or was never installed. The detail names exactly
what is gone.

```bash
npx create-religion@latest update
```

`update` restores anything missing and never overwrites a file you have edited. If it
reports a conflict instead, that file is present and locally changed, which is a different
situation and not this failure.

A missing archive directory is the milder version, because nothing reads it until an item is
completed:

```text
  FAIL  required files (blocks completion)
          missing: history/rollbacks
```

Same fix. These are empty directories, so `git` will not have preserved them on a fresh
clone unless they carry a placeholder file.

## configuration

**Protects:** `religion/config.json`. A skill that is about to change code must not guess
past broken settings, so this blocks rather than falling back to defaults.

Two ways it fails. The file does not parse:

```text
  FAIL  configuration (blocks work)
          config.json does not parse
```

A trailing comma or an unclosed brace. Fix the JSON.

Do not delete the file to start over. The command-line tool locates a project by
`religion/config.json`, so removing it makes the project invisible to `doctor` itself:

```text
No Religion project found here or in any parent directory.
Run `religion install` from the project root to add one.
```

Restore it from `update` instead, or copy the shipped defaults back in.

Or it parses and a value is not one of the allowed ones:

```text
  FAIL  configuration (blocks work)
          git.mode is "trunkk", expected one of trunk, branch-per-item, pull-request
```

The message names the key, what it found, and every value that would work. Every setting and
its allowed values are in [the configuration reference](architecture/config.md).

## adapters

**Protects:** the rendered skill trees your tool reads. `.claude/skills` for Claude Code,
`.agents/skills` for Codex, GitHub Copilot and OpenCode.

```text
  FAIL  adapters (blocks work)
          no skill tree installed
```

The state files are there but no skills are, so nothing can be invoked. This is what a
half-finished install looks like.

```bash
npx create-religion@latest update
```

The other version is cosmetic, and only possible with both trees installed:

```text
  FAIL  adapters (cosmetic)
          .claude/skills and .agents/skills hold different skills
```

One tree has skills the other does not, usually because a directory was deleted by hand or
an install was interrupted. Nothing is blocked, because whichever tool you are using reads
its own tree and finds what it needs. `update` re-renders both.

## entry file commands

**Protects:** the `Commands` section of `CLAUDE.md` or `AGENTS.md`. Those commands are what
the loop runs to verify work, so a placeholder here means every step would be verified
against a command that does not exist.

```text
  FAIL  entry file commands (blocks work)
          still the shipped placeholder; setup has not run
```

Expected on a fresh install, and it is the first thing to clear. Run `setup`, which detects
the real commands and proposes them. You can also write them by hand: replace the
placeholder block with your project's actual dev, build and test commands.

Never write a command that does not exist. A wrong command is worse than a missing one,
because it will be run.

```text
  FAIL  entry file commands (blocks work)
          no entry file found
```

Neither `CLAUDE.md` nor `AGENTS.md` is present, so your tool is loading nothing at all and
the skills are effectively invisible.

This one takes two steps, and `update` alone is not enough:

```bash
npx create-religion@latest update
```

restores the file, but it comes back as the shipped template, so the failure changes rather
than clears:

```text
  FAIL  entry file commands (blocks work)
          still the shipped placeholder; setup has not run
```

Then run `setup`, or fill the commands in by hand as above, and it goes healthy.

## overview freshness

**Protects:** `religion/context/project-overview.md`, the file every session loads. It
carries a hash of the two plans it was generated from.

```text
  FAIL  overview freshness (blocks work)
          not generated yet
```

Expected before your first `overview` run. Fill in the two plans, then run `overview`.

```text
  FAIL  overview freshness (blocks work)
          the plans changed after it was generated
```

You edited `religion/project-plan.md` or `religion/build-plan.md` and the overview still
describes the old ones. Run `overview` again. It is cheap, and working from a stale one is
not: a spec written against it encodes a model the plans no longer describe.

This is the one failure that appears during normal use rather than during setup. Editing a
plan is supposed to cause it.

## visibility

**Never fails.** It reports which choice is in force and blocks nothing either way:

```text
  ok    visibility: state is committed
  ok    visibility: state is local only
```

`state is committed` means `religion/` is in the repository: portable, shared, reviewable.
`state is local only` means `.gitignore` excludes it, so nothing about the workflow reaches
a shared repository and another machine needs it installed again.

If this says the opposite of what you intended, edit `.gitignore`. Adding the line does not
untrack files that are already tracked, so if the state is committed and you want it local,
that takes a deliberate `git rm --cached` as well.

## git

**Protects:** completion, which makes a commit.

```text
  FAIL  git (blocks completion)
          not a git repository
```

You can install and build without git, but there is no history to review and nothing for
`complete` to commit into.

```bash
git init
```

## What a healthy report does not prove

```text
Healthy.
```

This means the installation is intact. It does not mean your project is.

`doctor` never runs your build, your tests, or your linter. It does not read your code, and
it does not check that the commands recorded in the entry file still work. It reads the
plans only well enough to hash them, so a plan that is present and nonsense passes.

For where the work actually stands, use `status`. For whether the project builds, run the
verify command your entry file names.

## What to read next

- [Getting started](getting-started.md) to install and set up
- [What the loop actually feels like](the-loop.md) once it is healthy
