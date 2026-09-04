---
name: setup
summary: tune the installation to this project, greenfield or existing
description: "Set up Religion after installing it into a project. Detects whether the project is newly scaffolded or already has shipped work, and branches: a new project gets its entry file, standards, and configuration tuned before you write the plans, while an existing one is surveyed so the plans and standards are generated from what is actually there. Documents the real commands, reports existing checks, decides whether workflow files are committed, and says what to do next. Use when the user runs $setup, has just installed Religion, or asks what to do first."
---

# setup - make the installation match this project

Run once, after installing. It replaces the shipped assumptions with what is true here.

## Step 0 - which project is this

Look before asking. Count source files, read the git history, check whether the project has
shipped anything.

- **New** - a scaffold, little or no history, no meaningful features yet. The plans are
  written from intent, by the user, after this runs.
- **Existing** - real features, real history, real users possibly. The plans are generated
  from what already exists, in this run.

State which you concluded and why, and let the user correct you. Guessing wrong is
recoverable but wasteful: the existing path does substantially more work.

## Step 1 - survey the project

Both paths need this.

- **Stack** - languages, framework, package manager, module system, versions.
- **Commands** - the real ones, from the package manifest or task runner: dev, build, test,
  lint, typecheck. Never invent one. A command that does not exist is worse than a missing
  one, because it will be run.
- **Checks that already exist** - test runner, typecheck, lint, continuous integration.
  Report them; do not add any.
- **Conventions** - file organization, naming, how components and modules are actually
  structured, how data is accessed, how errors are handled. What the code does, not what a
  style guide would say.
- **Layout** - the directories that matter and what each owns.

## Step 2 - write what you learned

**The entry file's Commands section.** Replace the placeholder with the real commands. If
the project has a single command that runs its checks in order, record it as `Verify`. If
it does not, leave that out; $ci defines one deliberately later.

**The coding standards' Stack conventions section.** Fill it from the survey: language
conventions, file organization, naming, framework patterns, data access, as this project
actually does them. Do not import opinions the project does not hold. If the project is
inconsistent, say so and pick the dominant pattern, noting that it was a choice.

**The project title** in the entry files, and the one-line description.

## Step 3 - the plans

**New project.** Leave both plans as templates and tell the user to fill them in, or to run
$discovery for a guided session. Do not write plans from a scaffold; there is
nothing there to derive intent from.

**Existing project.** Generate both, then have them reviewed:

- **Project plan** - problem, users, and features derived from the code, the README, and
  the history. Tech and data from what is actually there. Mark anything you inferred rather
  than found, because inferring intent from an implementation is exactly where this goes
  wrong: the code says what was built, never why.
- **Build plan** - shipped features listed as **checked** items, so the history is honest
  and numbering starts from reality. Unshipped work goes in unchecked, if the user names
  any.

Ask for the intent the code cannot reveal: who this is for, what problem it solves, what
was deliberately excluded. That conversation is the whole value of this path. Then stop for
review before anything downstream runs.

## Step 4 - visibility

Ask whether the workflow files should be committed or kept local. Do not pick a default.

- **Committed** - plans, specs, and history are part of the repository: portable across
  machines, visible to collaborators, reviewable.
- **Local** - added to `.gitignore`, so nothing about the workflow enters a shared
  repository. Not portable: another machine needs it installed again.

If those paths are already tracked and the user chooses local, say that `.gitignore` alone
will not untrack them, and ask before running anything that would.

## Step 5 - report

- what was detected: stack, commands, existing checks
- what was changed, file by file
- what the user must do next, exactly: fill in the plans, or review generated ones
- optional things worth knowing about, without pushing: $tests if there is logic and
  no runner, $ci if there are checks and no automation

Then stop. The next step is $overview, once the plans are real.

## Rules

- Detect before asking, then let the user correct the detection.
- Never invent a command, a convention, or a feature.
- Mark inferred intent as inferred.
- Do not install anything, add a test runner, or create continuous integration here.
- Generated plans are a draft for review, never a finished artifact.

## Formatting

Match the conventions in `religion/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
