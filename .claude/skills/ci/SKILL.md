---
name: ci
summary: define one Verify command and the GitHub workflow that runs it
description: "Set up automatic checks around one documented Verify command. Detects the real stack, package manager, default branch, and existing workflows; combines only the checks the project actually has into one command; records it in the entry file; creates .github/workflows/verify.yml when that does not overwrite existing continuous integration; runs the command locally; and stops before pushing or changing any remote setting. Use when the user runs /ci, asks to add continuous integration, GitHub Actions, or pull-request checks."
---

# ci - one command, run automatically

The mental model, in three parts:

- **Verify is the recipe.** One local command running the checks this project already has,
  in order: typecheck, then tests, then build.
- **The workflow is the worker.** It runs that same command on pull requests and on the
  default branch.
- **A branch rule is the lock.** Requiring the check before merge is a remote setting, and
  a separate decision this skill does not make.

The recipe turns nothing on by magic. A project with typechecking and a build but no test
runner gets a Verify command with two parts, and gains the third when /tests adds a
runner.

## Step 1 - detect

The stack and runtime version, the package manager and its install command, the checks that
actually exist, the default branch, and any workflows already present.

Never assume. A `test` script that runs `echo "no tests"` is not a test command, and
treating it as one produces a green check that means nothing.

## Step 2 - define Verify

Combine only checks that exist, in order: typecheck, tests, build. Never invent one to fill
the recipe.

For a JavaScript or TypeScript project, prefer a package script named `verify` using the
detected package manager. For other stacks, use the native task runner or the exact
combined command.

Record it in the Commands section of the entry file as `Verify`. That is what
implementation and completion will run, so it has to be exactly right.

## Step 3 - the workflow

Write `.github/workflows/verify.yml` running that same command on pull requests and on
pushes to the default branch.

- Use the project's real runtime version and install command.
- Grant `contents: read` and nothing more.
- Cache the package manager's store if that is straightforward.

**Never overwrite existing continuous integration.** If a workflow already runs these
checks, say so, show where they overlap, and stop. Two workflows running the same suite
doubles the cost and halves the trust in both.

## Step 4 - run it locally

Run the Verify command exactly as written. If it fails, the recipe is wrong or the project
is broken, and either way it must not be committed in that state.

## Step 5 - report and stop

The command, where it is recorded, the workflow created or the overlap found, the local
result, and what remains a separate decision.

Stop before pushing. Requiring the check in the repository's settings is a remote change
and needs its own yes, on top of the push.

## Rules

- Only real checks go in Verify.
- Never overwrite an existing workflow.
- No git hooks, coverage thresholds, browser tests, security scanners, or version matrices.
  Those are later choices, made deliberately.
- Do not push, and do not change any remote setting.

## Formatting

Match the conventions in `religion/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
