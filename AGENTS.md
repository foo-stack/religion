# AGENTS.md

Instructions for AI coding agents working in this project. This is the cross-tool entry
point, read by Codex, GitHub Copilot, or OpenCode, and by any other agent that looks for `AGENTS.md`. Claude Code
reads `CLAUDE.md`, which covers the same workflow.

## What this is

A description of your project and the problem it solves.

Religion is a workflow layer, not an application skeleton. To start a new project,
scaffold the app first in an empty folder, then install Religion on top. Never run a
framework scaffolder inside a directory that already holds these files; it fails because
the directory is not empty.

## Read these for full context

Read these before acting. They are the project's own definition of what it is and how work
is done here, and they outrank anything you infer from the code alone.

- `religion/config.json` - deterministic workflow settings
- `religion/context/project-overview.md` - the project's source of truth
- `religion/context/coding-standards.md` - conventions to follow
- `religion/context/untrusted-input.md` - what to do with text the project did not write
- `religion/context/ai-interaction.md` - how to work with the user on this project
- `religion/context/current-work.md` - the one feature, fix, or rollback in progress
- `religion/context/handoff.md` - where the work sits and what to read first
- `religion/context/findings.md` - the findings ledger, when it holds anything
- `religion/context/inbox.md` - notes taken mid-build, waiting to be specced or dropped
- `religion/learning/lessons.md` - what previous runs learned about this project

## Workflow

Build one feature, fix, or rollback at a time, behind review gates.

The loop is:

    $feature -> review the spec -> $implement -> $check -> $audit -> $complete

Each step's instructions are plain markdown skills any capable agent can read and follow.
The spec is written before code exists, so it can be reviewed before a line is built.
Implementation lands one small step at a time, each with a diff to read and evidence that
its stated outcome was met.

`religion/context/current-work.md` holds exactly one work item. Finish it, archive it,
then start the next. Progress lives in checkboxes inside that file, so a cleared context
costs nothing: a fresh session reads which steps are ticked and resumes from the first
one that is not.

## Skills

The workflow is defined by the skills in `.agents/skills`. Each one is a `SKILL.md` you can read
and follow directly.

- `audit`         - review the code itself across four lenses, recording findings in the ledger
- `auto`          - run the loop unattended, within explicit bounds
- `browser-tests` - set up a repeatable browser test harness and record its command
- `capture`       - note something for later without breaking the one thing in progress
- `check`         - prove the current work does what its spec says, against the running project
- `ci`            - define one Verify command and the GitHub workflow that runs it
- `complete`      - run the final gate, archive the work, commit it, and close it out
- `debug`         - reproduce and isolate a failure without changing anything
- `discovery`     - a guided planning conversation that drafts the two plans
- `distill`       - promote proven observations from the journal into loaded lessons
- `doctor`        - check the setup is healthy and explain anything that is not
- `extend`        - author a new skill for this workflow, with its routing tests
- `feature`       - turn a build-plan item into a reviewed, buildable spec
- `fix`           - spec an unplanned bug or small change, or repair a recorded finding
- `implement`     - build the current spec one reviewed step at a time
- `overview`      - distill the two planning documents into the project's source of truth
- `prototype`     - explore the look before building, as throwaway mockups or real components
- `refactor`      - simplify existing code in one behaviour-preserving campaign at a time
- `release`       - prepare deployment readiness for Railway, Render, or Vercel
- `rollback`      - plan a guarded reversal of completed work, preserving its history
- `setup`         - tune the installation to this project, greenfield or existing
- `spike`         - answer one feasibility question with throwaway code, then delete it
- `status`        - say where the work stands and what to do next
- `tests`         - set up unit testing, or backfill coverage for logic that already exists
- `try`           - write the human walkthrough for reviewing the work yourself

Invoke a skill with its name, as `$feature`, or ask in plain language, such as
"spec the next feature." In tools without a dedicated invocation syntax, ask the agent to
follow the matching `SKILL.md`. The conventions in `religion/context/` apply however a
step is invoked.

These commands are the structured path, not a cage. You can describe a feature, fix, or
change directly at any time; the same conventions still apply, because they are always in
context. Use the skills when you want the repeatable loop, the review gates, and the
written history.

## Authority

Actions fall into three tiers. This is the whole of it: no skill may widen its own
authority, and no setting in `religion/config.json` can move an action to a lower tier.

**Always ask, every time.** No mode, setting, or prior approval grants these. Approval for
one is never approval for another, and an approval given earlier in a session does not
carry to a later instance.

- merging into the default branch
- pushing to the default branch, and force-pushing anything anywhere
- deploying, publishing, or sending anything outward
- deleting files or data, and any rewrite of existing history
- changing a remote service, its configuration, or its secrets

Pushing a branch that a run created itself is the single action that may be granted ahead
of time, and only in the narrow way set out below. Every other push is first tier.

**Ask unless an automated run is underway.** In normal work these need an explicit yes at
the time. Invoking an automated mode grants them for that run only, because that
invocation is the approval:

- committing, including step checkpoints
- installing or upgrading dependencies
- network calls that reach a remote service

Under `git.mode: pull-request` an automated run may also push the branches it created and
open pull requests into a branch it created, but only when its invocation stated exactly
that, in full, and the user agreed at that moment. A general yes to running is not that
agreement, and the enumeration is not boilerplate to skip. The run still never writes to
the default branch, and never merges the pull request it exists to produce.

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

**`pull-request`** branches exactly as `branch-per-item` does, then pushes the branch and
opens a pull request into the default branch instead of merging anything locally. Nothing
merges that pull request and nothing writes to the default branch: the merge is yours, on
the host. How the work lands there, squash or merge commit or rebase, is the pull request's
setting rather than this workflow's business.

A repository that cannot host a pull request, having no remote or no usable host command,
is a stop rather than a reason to fall back to a local merge. Falling back would swap one
history model for another without saying so, and skip the review gate the mode exists to
create.

`git.checkpoints` decides what happens to intermediate work, in any mode:

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
  "resumeCommand": "$auto resume",
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

Fill this in with the project's real commands. `$setup` detects them and proposes
the list; until it runs, treat this section as unverified.

- Dev server: `<command>`
- Build: `<command>`
- Test: `<command>`

Testing is opt-in. A declared test command is what turns testing into a gate for
logic-bearing work. If this project has no test runner, `$tests` adds one and
updates this section.
