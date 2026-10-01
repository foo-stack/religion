---
name: scout
summary: propose new features grounded in what the codebase already has
description: "Read-only brainstorm of new features to build, grounded in what the codebase, the plans and the shipped history already contain, at one of three levels of ambition: normal for low-risk extensions of what exists, ambitious for new capabilities that combine existing pieces or serve a new kind of user, super-ambitious for bets that would change the product's direction, stack or deployment. Proposes a short list of ideas, each tied to the files it builds on, sized and with its risks, then hands the one picked to {{cmd:feature}} to become a plan line. Writes nothing. Use when the user runs {{cmd}}, asks for feature ideas or opportunities, wants suggestions for what new capabilities could be built on this code, or asks what this project could grow into."
allowed-tools: Read, Grep, Glob, Bash, Agent
---

# scout - ideas for what to build next, grounded in what exists

Where this sits:

    shipped code + plans  ->  [scout]  ->  one idea picked  ->  feature
    (what exists)             (propose)                        (plan line, spec)

The build plan says what is queued. This answers a different question: what could be
queued, given what the project already has. It proposes; it never plans, specs or builds.

## Input

- **No argument** - normal.
- **`ambitious`** or **`super-ambitious`** - the level.

| Level | What qualifies | Ideas |
| --- | --- | --- |
| normal | extends what exists, within the current architecture, low risk | 5 |
| ambitious | a new capability that combines existing pieces or serves a new kind of user, on the same stack, with real uncertainty | 3 |
| super-ambitious | would change the product's direction, stack, or where it runs; may not be feasible without a spike | 2 |

Fewer ideas as the level rises, each with more depth, because a bigger idea is only useful
with its risks and its first unknown named.

## Step 1 - read what exists

The overview, both plans, the archives under `{{state}}/history/`, and the inbox. Then the
code itself: the modules, the data each one holds, the surfaces users reach. When that read
is broad, run it in a subagent and have it return what exists and where, so the context that
has to generate ideas is not spent holding files.

## Step 2 - generate, then cut

Generate more than the count, then cut to it. Drop:

- **Anything already planned, shipped, or in the inbox.** Name it instead, in one line, so
  the user sees it was considered.
- **Repairs.** A finding, a bug or a limitation is work for {{cmd:fix}}, not a feature.
- **Anything a settled non-goal in the project plan rules out.** Super-ambitious may
  propose revisiting one, but only by naming the non-goal and saying why now.
- **Anything not grounded.** An idea that cannot point at the code or data it builds on is
  a guess about some other project.

## Step 3 - report

For each idea:

- **What** - one sentence a user would recognise as a feature
- **Builds on** - the files, modules or data it reuses, named
- **Why it fits** - what in the project makes it worth doing here
- **Size** - fits one spec, or would split into sub-items
- **Risk** - what could make it not work or not be worth it

Ambitious and super-ambitious ideas also say what would change in the plans, and
super-ambitious ones name the first assumption to test.

## Step 4 - hand off

Ask which idea, if any, to take forward. The one picked goes to {{cmd:feature}} as a
description, whose intake proposes the plan line and waits for approval. An idea resting on
an untested assumption goes to {{cmd:spike}} first. If none fits, say so and stop: a report
that leads nowhere has still told the user what was considered.

## Rules

- Read-only. Never write the plans, the inbox, a spec, or code.
- Every idea names what it builds on. No idea from nowhere.
- Stay within the level asked for: a normal run that drifts into rewrites is a different
  run, and the user chose the level.
- Never pad to the count. Fewer grounded ideas beat the full number of thin ones.

## Formatting

Match the conventions in `{{state}}/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
