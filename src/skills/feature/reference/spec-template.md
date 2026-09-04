# <Feature name>

**Type:** Feature
**From build plan:** item <n>
**Status:** not started

## Goal

What this delivers, in a sentence or two, and why it matters. Someone reading only this
section should know what will be true when the work is done.

## Design reference

For visual or replication work, link the reference here: the mockups under `prototypes/`
when they exist, or an image saved under `{{state}}/reference/`. Prose underspecifies a
visual target, and the approximation costs more to correct than the reference costs to
obtain. Delete this section when the work has no visual target.

## In scope

- The specific things this work includes.

## Out of scope

- What it deliberately does not touch, and which later item picks it up.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

Small, reviewable units. Each ends with something that works, and each carries an
observable outcome that can be checked. These boxes are ticked as the steps land, which is
what lets a cleared context resume from the first unchecked one.

- [ ] **Step 1 - <what it builds>** - what changes. *Done when:* <observable outcome>.
- [ ] **Step 2 - <what it builds>** - what changes. *Done when:* <observable outcome>.

## Files and areas

- The files or modules this creates or changes.

## Data and contracts

- Types, stored shapes, or interface shapes involved, or "none".
- Mark anything later work will depend on as load-bearing.

## Testing

- How the outcomes are verified, per step.
- When a test command is declared, name the in-scope logic that needs a test: parsers,
  formatters, validators, server actions. Not components or integration surfaces.
- When no runner is configured, say so and rely on running it, a screenshot, and the build.

## Notes for the agent

- Conventions and constraints this work must respect, drawn from the coding standards and
  the project overview. Anything that would be wrong in a way review would not catch.
