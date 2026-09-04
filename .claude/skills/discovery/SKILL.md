---
name: discovery
summary: a guided planning conversation that drafts the two plans
description: "An optional multi-turn planning conversation that develops a project plan and build plan through adaptive questioning, then drafts both files and writes them only after explicit approval. Never required: the plans can always be written directly or developed in any conversation. Use only when the user runs /discovery, asks for a guided planning session, or wants help thinking a product through before writing the plans. Do not suggest it merely because the plans are empty."
---

# discovery - think the project through, then draft the plans

Optional. The plans can be written directly, and often should be. This exists for when
someone wants the questions asked.

Never suggest this as the default next step after installation. An empty plan is not a
reason to start an interview.

## How this runs

A conversation over as many turns as it takes, then a draft. Nothing is written until the
user says the drafts are right.

Ask a few questions at a time, not a form. Follow what the answers actually say: a project
with no users to speak of does not need three questions about user tiers, and a project
whose whole difficulty is the data model deserves more than one.

## What to establish

Enough to fill the required plan sections, and nothing more.

**The problem.** What is broken or missing, and for whom. Push past the first answer, which
is usually a solution wearing a problem's clothes: "people need a dashboard" is a solution.
Ask what goes wrong today without it.

**The users.** Who specifically, and what each needs. If the answer is "everyone", the
project has no users yet and that is worth knowing now.

**The features.** What the first version has to do. Then ask what it deliberately does not
do, which is the more useful question and the one nobody volunteers.

**The data.** What the project works with: stored entities, or the shapes it reads and
emits, or the interface it exposes. Ask what shape later work will depend on, since that is
what becomes expensive to change.

**The stack.** What it is built with, and anything already decided or already ruled out.

Then the optional sections, only where they apply: how it makes money, how it should look
and feel, where it deploys.

## Things worth pushing on

- **Vagueness that will become a decision later.** "Some kind of auth" becomes a spec
  someone has to write. Ask now.
- **Scope that grew during the conversation.** Say so, and ask what the first version drops.
- **Contradictions.** Note them as they appear rather than collecting them for the end,
  where they will be an unpleasant list.
- **The build order.** What has to exist before what. That is what the build plan encodes.

## Drafting

When the user says they are ready, show both drafts **in full, in the conversation**, before
writing anything.

- **Project plan** - as much depth as the answers support. Include the rationale,
  constraints, and exclusions, since those are what later work needs and what a plan
  usually loses.
- **Build plan** - a numbered checkbox list of feature-sized items in rough build order. No
  detail; the depth belongs in each spec.

Mark anything you supplied rather than heard. A draft that quietly invents a monetization
model reads as though the user decided it.

Then ask for changes, and iterate. Write both files only after an explicit yes.

## Rules

- Nothing is written before approval, including a partial draft "to make it concrete".
- The plans are the user's. Draft in their terms, not in yours.
- Do not fill a section the conversation did not cover. Leave it, and say what is missing.
- Stop when the plans are usable, not when they are exhaustive. /overview will flag
  what is genuinely too thin.

## Formatting

Match the conventions in `religion/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
