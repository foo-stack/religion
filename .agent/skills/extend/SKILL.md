---
name: extend
summary: author a new skill for this workflow, with its routing tests
description: "Add a capability to Religion itself: interview for what the skill must do, write its source with the required frontmatter, add routing tests that prove the right skill is selected for a request, render it into every adapter tree, and verify. Refuses to add a skill whose job an existing one already does, since an overlapping roster routes badly and the cost lands on every later request. Use when the user runs /extend, asks to add a skill or command to the workflow, or asks to extend Religion."
---

# extend - add a capability to the workflow

This edits the workflow itself, not a project built with it. Run it in a Religion source
checkout, where `src/skills/` exists. In an installed project there is nothing here to edit.

## Step 1 - argue against it first

A new skill is a permanent addition to a roster that every request is routed against. The
cost is paid by every later request, not just the ones that use it.

Read the existing roster and ask:

- **Does an existing skill already own this?** If so, extend that one. A mode or an
  argument is nearly always better than a sibling: it keeps related behavior together and
  adds no routing ambiguity.
- **Would this be selected reliably?** If a request that should reach it would plausibly
  reach another skill, both get worse. Overlapping descriptions are the main way a roster
  degrades.
- **Is it a skill at all?** A deterministic check belongs in the command-line tool. A rule
  belongs in the constitution or the standards. A one-off belongs in the conversation.

Say what you concluded. If an existing skill should absorb it, propose that instead and
stop. Being talked out of a new skill is a successful outcome here.

## Step 2 - establish what it does

- **The job**, in one sentence. If that takes two, it is two skills or it is a mode.
- **When it should be selected**, and just as importantly when it should not, named against
  the skills it sits closest to.
- **What it reads and what it writes.** Every state file has exactly one writer; a new
  writer for an existing file needs a reason and a rule for the overlap.
- **What it must never do**, beyond the authority tiers.
- **Where it sits in the loop**, and which skills hand to it or receive from it.

## Step 3 - write the source

Create `src/skills/<name>/SKILL.md` with frontmatter carrying `name` matching the
directory, `summary` as a short clause for the roster, and `description` as the long
routing text.

**The description is what routing runs on.** Write it as the situations that should select
this skill, in the words a user would actually use, and name the neighbours it must not be
confused with. A description written as a feature list routes badly.

Reference other skills and paths through the token vocabulary rather than writing literal
syntax: the command token takes a skill name and renders that tool's own invocation, and
the state token renders the state directory. A literal slash is correct for one tree and
wrong for the others, and a literal directory name breaks if the system is ever renamed.
The vocabulary is defined in `src/lib/adapters.ts`.

Then the body: where it sits, its steps, its rules, and the formatting pointer. Match the
existing skills, which say **why** a rule exists rather than only stating it, because a rule
whose reason is written survives contact with a case its author did not foresee.

## Step 4 - register and render

Add the name to the planned roster in `src/lib/skills.ts`, or the reference check will
reject every mention of it.

Run the build, which renders it into every adapter tree, then run the verification, which
confirms the frontmatter is complete, no token is unrendered, every reference resolves, and
nothing drifted.

## Step 5 - prove it routes

Add `evals/routing/<name>.json`: prompts that must select this skill, and prompts belonging
to neighbouring skills that must not.

The negative cases matter more. A skill that fires when it should is easy; a skill that
stays quiet when a neighbour should have fired is what keeps a large roster usable. Write
the confusable cases deliberately, not the obvious ones.

Run the routing evaluation. A regression in a **neighbouring** skill's score is the expected
failure mode: the new description pulled requests away from it. Fix it by narrowing the
descriptions until each request has one clear owner.

## Step 6 - wire it in

A skill nobody reaches is not a capability. Update whatever should point at it: the entry
files if it changes the loop, the interaction guide if it changes the sequence, the skills
that should hand off to it.

Report what was added, what it routes on, its eval results, and every file changed.

## Rules

- Argue against it first, honestly.
- One job per skill. Two sentences means two skills, or a mode on one.
- The description is routing, not marketing.
- Never ship a skill without its routing tests.
- Never edit a rendered tree. Edit the source and rebuild.

## Formatting

Match the conventions in `religion/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
