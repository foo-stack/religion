# AGENTS.md

Instructions for AI coding agents working in this project. This is the cross-tool entry
point, read by {{tool}}, and by any other agent that looks for `AGENTS.md`. Claude Code
reads `CLAUDE.md`, which covers the same workflow.

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

The workflow is defined by the skills in `{{dir}}`. Each one is a `SKILL.md` you can read
and follow directly.

{{roster}}

Invoke a skill with its name, as `{{cmd:feature}}`, or ask in plain language, such as
"spec the next feature." In tools without a dedicated invocation syntax, ask the agent to
follow the matching `SKILL.md`. The conventions in `{{state}}/context/` apply however a
step is invoked.

These commands are the structured path, not a cage. You can describe a feature, fix, or
change directly at any time; the same conventions still apply, because they are always in
context. Use the skills when you want the repeatable loop, the review gates, and the
written history.

## Authority

{{include:authority}}

## Git

{{include:git-modes}}

## Review cadence

`workflow.stepReview` decides how often implementation stops for you. It ships as
`every`: each step ends with a diff to read and approve before the next one starts. Set
it to `item` to collect the steps into one review packet at the end.

Either way, implementation stops early and asks whenever a check fails, a decision is
needed, a conflict appears, the work drifts outside its spec, or something in the first
tier of the authority rules comes up.

## Activity

{{include:activity}}

## Commands

{{include:commands}}
