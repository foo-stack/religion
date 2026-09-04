# Project Name

Agent instructions for this project. The files below are imported so they stay loaded
every session: {{product}} keeps project state in files rather than in the conversation,
which is what makes a cleared context survivable.

@{{state}}/context/project-overview.md
@{{state}}/context/coding-standards.md
@{{state}}/context/untrusted-input.md
@{{state}}/context/ai-interaction.md
@{{state}}/context/current-work.md
@{{state}}/context/handoff.md
@{{state}}/learning/lessons.md

## What this is

A description of your project and the problem it solves.

{{include:overlay}}

## Workflow

{{include:workflow}}

## Skills

The workflow is defined by the skills in `{{dir}}`, which Claude Code discovers on its
own. Run one as `{{cmd:feature}}`, or just describe what you want; the right skill is
selected from the request.

`{{state}}/config.json` holds this project's deterministic workflow settings. Read it
before acting. A missing file means built-in defaults. If it exists but cannot be parsed,
stop and run `{{cmd:doctor}}` rather than guessing past it.

These commands are the structured path, not a cage. You can describe a feature, fix, or
change directly at any time; the same conventions still apply, because they are always in
context.

## Authority

{{include:authority}}

## Git

{{include:git-modes}}

## Review cadence

{{include:review-cadence}}
## Activity

{{include:activity}}

## Commands

{{include:commands}}
