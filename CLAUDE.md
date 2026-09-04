# Project Name

Agent instructions for this project. The files below are imported so they stay loaded
every session: Religion keeps project state in files rather than in the conversation,
which is what makes a cleared context survivable.

@religion/context/project-overview.md
@religion/context/coding-standards.md
@religion/context/ai-interaction.md
@religion/context/current-work.md
@religion/context/handoff.md
@religion/learning/lessons.md

## What this is

A description of your project and the problem it solves.

Religion is a workflow layer, not an application skeleton. To start a new project,
scaffold the app first in an empty folder, then install Religion on top. Never run a
framework scaffolder inside a directory that already holds these files; it fails because
the directory is not empty.

## Workflow

Build one feature, fix, or rollback at a time, behind review gates.

The loop is:

    /feature -> review the spec -> /implement -> /check -> /audit -> /complete

Each step's instructions are plain markdown skills any capable agent can read and follow.
The spec is written before code exists, so it can be reviewed before a line is built.
Implementation lands one small step at a time, each with a diff to read and evidence that
its stated outcome was met.

`religion/context/current-work.md` holds exactly one work item. Finish it, archive it,
then start the next. Progress lives in checkboxes inside that file, so a cleared context
costs nothing: a fresh session reads which steps are ticked and resumes from the first
one that is not.

## Skills

The workflow is defined by the skills in `.claude/skills`, which Claude Code discovers on its
own. Run one as `/feature`, or just describe what you want; the right skill is
selected from the request.

`religion/config.json` holds this project's deterministic workflow settings. Read it
before acting. A missing file means built-in defaults. If it exists but cannot be parsed,
stop and run `/doctor` rather than guessing past it.

These commands are the structured path, not a cage. You can describe a feature, fix, or
change directly at any time; the same conventions still apply, because they are always in
context.

## Authority

Actions fall into three tiers. This is the whole of it: no skill may widen its own
authority, and no setting in `religion/config.json` can move an action to a lower tier.

**Always ask, every time.** No mode, setting, or prior approval grants these. Approval for
one is never approval for another, and an approval given earlier in a session does not
carry to a later instance.

- merging into the default branch
- pushing to any remote
- deploying, publishing, or sending anything outward
- deleting files or data, and any rewrite of existing history
- changing a remote service, its configuration, or its secrets

**Ask unless an automated run is underway.** In normal work these need an explicit yes at
the time. Invoking an automated mode grants them for that run only, because that
invocation is the approval:

- committing, including step checkpoints
- installing or upgrading dependencies
- network calls that reach a remote service

An automated run's grant never reaches the first tier. It commits freely and still stops
to ask before it merges.

**Free.** Reading files, searching, running the project's own build, tests, linters, and
type checks, driving the app locally, and writing the workflow's own state files under
`religion/`.

## Evidence

Never claim that something passed, is verified, or works without naming what proves it:
the exact command and its result, the route and what appeared, the screenshot, or the
output. "It should work" is not evidence, and neither is a summary of what the code
intends to do.

A required check that cannot run is a blocker, not a pass. Say so plainly and stop.

## Git

`git.mode` decides where work lands. It ships as `trunk`.

**`trunk`** keeps work on the branch you already have checked out. Nothing is branched,
nothing is merged, and the first tier of the authority rules stays dormant because there
is no merge to ask about. This is the default because creating branches is a decision
that belongs to you, not to a workflow.

**`branch-per-item`** creates a branch per work item using the configured prefix, then
squash-merges it once the work is done and you have said yes. The merge and any push are
asked for separately: agreeing to a merge is never agreement to push.

`git.checkpoints` decides what happens to intermediate work, in either mode:

| Value | Behavior |
| --- | --- |
| `none` | Steps accumulate in the working tree; completion makes one commit for the whole item. |
| `every-step` | Each approved step becomes its own commit, left in place. |
| `squash` | Each approved step is committed, then completion collapses them into one. |

In `trunk` mode, `squash` collapses commits on the branch you are working on, which
rewrites local history. That is a first-tier action: it is never done without asking, and
never done at all when any of those commits has already been pushed.

## Review cadence

`workflow.stepReview` decides how often implementation stops for you. It ships as
`every`: each step ends with a diff to read and approve before the next one starts. Set
it to `item` to collect the steps into one review packet at the end.

Either way, implementation stops early and asks whenever a check fails, a decision is
needed, a conflict appears, the work drifts outside its spec, or something in the first
tier of the authority rules comes up.

## Activity

Any skill that changes something writes an activity record to
`religion/.state/run.json` as its **first action**, before inspecting the project or
calling anything else, and replaces it at meaningful milestones. Read-only skills do not.

This is generated local state. It is never committed, never part of a work commit, and
never contains secrets, raw output, prompts, or user content.

```json
{
  "schemaVersion": 1,
  "command": "auto",
  "status": "running",
  "summary": "Building the remaining plan",
  "detail": "Implementing item 3.",
  "boundary": "local-only",
  "startedAt": "<ISO-8601>",
  "updatedAt": "<ISO-8601>",
  "resumeCommand": "/auto resume",
  "progress": { "current": 2, "total": 5, "label": "items" },
  "item": { "id": "3", "title": "Export reports" }
}
```

`status` is `running`, `blocked`, `ready`, or `completed`. Use `ready` when a skill reached
its intended handoff, such as an unattended run waiting for review. Use `blocked` with the
exact recovery command when work can resume. `boundary` is `read-only`, `reviewed`, or
`local-only`. Everything after `updatedAt` is optional.

Writing this record grants nothing and bypasses nothing. A failure to write it is reported
and ignored: reporting must never turn into a workflow failure.

## Commands

<!-- religion:setup-required -->

Fill this in with the project's real commands. `/setup` detects them and proposes
the list; until it runs, treat this section as unverified.

- Dev server: `<command>`
- Build: `<command>`
- Test: `<command>`

Testing is opt-in. A declared test command is what turns testing into a gate for
logic-bearing work. If this project has no test runner, `/tests` adds one and
updates this section.
