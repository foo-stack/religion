---
name: tests
summary: set up unit testing, or backfill coverage for logic that already exists
description: "Set up unit testing for this project: detect the stack, reuse an existing runner or install the stack-native one, add a small example test, record the command in the entry file, and run it. Declaring that command is what turns testing into a gate for logic-bearing work. Given `backfill`, instead writes tests for logic that already exists, worst-covered first. Use when the user runs $tests, asks to add or set up unit tests, or asks to cover existing code with tests."
---

# tests - turn the testing gate on, or backfill coverage

Two modes. `$tests` sets the runner up. `$tests backfill` covers logic that already
exists. Setup comes first; backfilling into no runner is not a thing.

## Setup mode

### Step 1 - look before installing

If a runner is already configured, use it. Adding a second is how a project ends up with
two test commands and no idea which one is authoritative.

If there is none, choose the stack-native one: vitest for a TypeScript or JavaScript
project, pytest for Python, the built-in tooling for Go or Rust. Do not import a preference
the ecosystem does not share.

Say what you found and what you propose before installing anything. Installing a dependency
needs a yes.

### Step 2 - wire it up

Install the runner, add the script or task, and add **one** small test that genuinely
exercises something real in this project. Not a test that asserts true is true: a test that
would fail if the thing it covers broke.

### Step 3 - record the command

Add the exact command to the Commands section of the entry file as `Test`.

**This is the switch.** Once that command is declared, a build step that adds logic ships a
passing test in the same diff, and completion will not finish while the suite is red. Say
that plainly, because it changes how every later work item behaves.

If a `Verify` command exists, add the test command to it in the right order: typecheck,
then tests, then build.

### Step 4 - prove it

Run the test command and show the output. Then run it again with the example test
deliberately broken, to show it actually fails. A suite that cannot fail is not a gate, and
an empty suite reporting success is the specific failure worth ruling out here.

Restore it, and report what changed.

## Backfill mode

For logic that shipped without tests. Deliberate, bounded, and never automatic.

### Step 1 - find what is worth covering

Only in-scope logic: parsers, formatters, validators, identifier builders, server actions,
anything with assertable inputs and outputs and real edge cases. Not components, not
integration surfaces, not anything whose test would just mirror the implementation.

Rank by risk, not by convenience: how badly a wrong answer would hurt, how likely a wrong
answer is, how often the code changes. Present the ranked list and how many to do now. Do
not attempt the whole project in one pass.

### Step 2 - write them, in reviewed batches

One module at a time, each as its own reviewable diff. For each, cover the normal case, the
edges the code actually handles, and the edges it does not.

**When a test fails, stop.** A backfilled test that fails has found a bug, and that is the
valuable outcome. Do not adjust the test to match the behavior: report it, and let it
become a fix. Writing the test around the bug destroys the only reason to have written it.

### Step 3 - report

What was covered, what was skipped and why, and every discrepancy found. Discrepancies are
the point; coverage is the side effect.

## Rules

- Never install a runner during unrelated work. This is a deliberate setup step.
- One runner per project.
- Never write a test that cannot fail.
- Never change behavior to make a backfilled test pass.
- Setup adds one example test, not a suite.

## Formatting

Match the conventions in `religion/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
