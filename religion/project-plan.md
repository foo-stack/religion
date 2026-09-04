# Project Plan

> One of the two planning documents you own. Use as much detail as the project needs,
> including rationale, constraints, examples, edge cases, and the exclusions that should
> guide later work. Write it directly, develop it through any AI conversation, or run the
> `discovery` skill for a guided session. When it is filled in, run
> `overview` to generate the project overview from this and `build-plan.md`.

Sections 1 through 5 are required: the overview generator maps them, and later work reads
the result. Sections 6 through 8 are optional, and a library, CLI, or internal tool can
delete them outright rather than writing "not applicable".

## 1. Problem

What problem this solves and why it matters. What is broken or missing today.

## 2. Users

Who this is for, and what each kind of user needs from it. Note any access tiers, such as
anonymous versus signed in.

## 3. Features

A high-level list of what the first version needs. One line each, no deep detail; the
detail belongs in each work item's spec.

## 4. Data

What gets stored: the entities, roughly what they hold, and how they relate. Enough that
the overview can turn it into a concrete data model.

## 5. Tech

The stack, one line each on what it is for.

## 6. Monetization (optional)

How this makes money, if it does. Delete this section if it does not apply.

## 7. UI and UX (optional)

The look and feel, and the main routes or screens. Delete this section for a project with
no user interface.

## 8. Deployment (optional)

Target host, app type, build and start commands, output directory, environment variables
by name, database or storage needs, background jobs, health check path, and domain notes.
Delete this section until deployment is a real question.
