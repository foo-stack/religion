# GEMINI.md

Instructions for AI coding agents working in this project, read by {{tool}}. Codex, GitHub
Copilot and OpenCode read `AGENTS.md`, and Claude Code reads `CLAUDE.md`, which cover the
same workflow. Where `AGENTS.md` names `.agents/skills` or a `$` invocation, the skills in
`{{dir}}` and the `/` form below are this tool's own.

## What this is

A description of your project and the problem it solves.

{{include:overlay}}

## Read these for full context

Read these before acting. They are the project's own definition of what it is and how work
is done here, and they outrank anything you infer from the code alone.

{{include:context-files}}

## Workflow

{{include:workflow}}

## Skills

The workflow is defined by the skills in `{{dir}}`, which {{tool}} discovers on its own.
Each one is a `SKILL.md` you can read and follow directly.

{{roster}}

Invoke a skill with its name, as `{{cmd:feature}}`, or ask in plain language, such as
"spec the next feature." The conventions in `{{state}}/context/` apply however a step is
invoked.

These commands are the structured path, not a cage. You can describe a feature, fix, or
change directly at any time; the same conventions still apply, because they are always in
context. Use the skills when you want the repeatable loop, the review gates, and the
written history.

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
