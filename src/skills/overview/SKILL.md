---
name: overview
summary: distill the two planning documents into the project's source of truth
description: "Validate the two user-owned planning documents and generate {{state}}/context/project-overview.md from them, the single source of truth every session loads. Proposes a normalized checkbox build plan when the plan is still loose bullets, separates what the product already does from what is queued, derives a concrete domain model and a code map, and records contradictions as open questions that can block work in the areas they affect. Also runs automatically when the plans have changed since the overview was generated. Use when the user runs {{cmd}}, has just written or edited the plans, asks to regenerate the project overview, or when another skill finds the overview stale."
---

# overview - turn the two plans into the source of truth

Where this sits:

    project-plan.md  +  build-plan.md  ->  [this skill]  ->  project-overview.md
    (what and why)      (what order)                          (what everything reads)

The plans are yours: long, rough, written in whatever order made sense at the time. The
overview is the distilled version every skill reads every session. Regenerating it is
cheap; working from a stale one is not.

## When this runs

**Explicitly**, when the user asks.

**Automatically**, when a skill that reads the overview finds it stale. Any skill in that
position follows the steps below first, reports what changed, and then continues with what
it was asked to do. Nothing acts on a stale overview.

## Staleness

The generated file carries a hash of the two plans it was built from:

    <!-- {{state}}:source-hash <16 hex characters> -->

Compute it exactly this way, so that two runs never disagree and report a false change:
concatenate the raw bytes of `{{state}}/project-plan.md` then `{{state}}/build-plan.md`
with nothing between them, take the SHA-256, and use the first 16 characters of the
lowercase hexadecimal digest.

    cat {{state}}/project-plan.md {{state}}/build-plan.md | shasum -a 256 | cut -c1-16

Recompute it over the current plans. A mismatch means the plans moved and the overview did
not. A missing stamp means an overview generated before this mechanism existed, or one
hand-edited; treat both as stale.

## Step 1 - read the plans

Read `{{state}}/project-plan.md` and `{{state}}/build-plan.md` in full, plus the existing
overview when there is one, so that a regeneration can report what changed rather than
just replacing the file.

Sections 6 through 8 of the project plan are optional. A plan that deleted them has not
made a mistake, and the corresponding overview headings are omitted rather than filled
with "not applicable".

## Step 2 - validate, and propose fixes for approval

Check both plans are usable before generating from them:

- **Required sections.** Sections 1 through 5 of the project plan are answered, not left
  as the placeholder prompts they ship with.
- **Build plan shape.** The build plan is a checkbox list. The loop reads those boxes to
  know what is next and what is done, so a plain bullet list breaks progress tracking.
- **Item sizing.** Each build-plan item is a feature-sized outcome, not a whole product
  area ("Auth, billing, and dashboard") or a loose task ("Database").
- **Item kind.** The build plan is for features. An item that describes something broken
  ("search ranking is bad", "the switcher does not remember") is a fix, and an item that
  describes reviewing rather than building ("audit the hook types") is a review pass.
  Both have their own path and their own place in the history, and neither belongs in the
  plan. Point them at {{cmd:fix}} and {{cmd:audit}}, and propose removing them.
- **Numbering.** Completed items keep their numbers, since archives refer back to them.

When something is wrong, show the exact proposed replacement and ask before writing. These
two files are the user's. Never edit them silently, and never rewrite prose that is merely
rough: a plan can be informal and still be usable, and only shape problems that actually
break the loop are worth proposing a change for.

If the user declines a proposed fix, say what will not work as a result and generate
anyway.

## Step 3 - generate the overview

Write `{{state}}/context/project-overview.md` following
`reference/project-overview-template.md`. Stamp the freshly computed source hash.

Three sections are real work rather than distillation.

**What it does** and **Roadmap** are deliberately separate. The first is the product's
identity, taken from section 3; the second is the queue, taken from the build plan. On a
new project they are nearly the same list. On an established one they barely overlap, and
collapsing them produces an overview claiming the product's features are whatever three
small things happen to be queued. Never merge them, and never fill one from the other.

**Domain model** turns the plan's list of nouns into concrete shapes with fields and
relationships. What that means depends on the project: persisted entities for something
with a database, the shapes read and emitted for a compiler or CLI, the public types and
their contracts for a library. A project with no database still has a domain model. Write
what it actually works with and say what kind it is.

**Code map** records where things live, derived by looking at the repository rather than
the plans, since neither plan describes layout. For several packages, name the boundary
each one owns. Without this, every spec re-derives the layout from scratch.

Mark any shape later work will depend on as load-bearing.

Derive, do not invent. If the plans do not determine something a section needs, that is an
open question, not a gap to fill with a plausible guess. The code map is the one exception:
it is read from the repository, because that is where the answer actually is.

## Step 4 - record open questions

Contradictions and gaps go in the **Open questions** section, and each one names what it
affects:

    - **Storage engine** (affects: data model, features 3 and 7) - section 5 names
      Postgres while section 4 describes local SQLite files. Resolve in the plans and
      regenerate.

The "affects" list is load-bearing, not decoration. Work touching a named area is blocked
while the question is open, and work elsewhere proceeds normally. Scope each one as
narrowly as the evidence allows: a question marked as affecting everything stops the
project, so only write that when it is true.

Raise a question only for a real conflict or a real gap that later work will hit. Stylistic
thinness is not an open question.

## Step 5 - report

Lead with what changed, then the questions:

- **generated** or **regenerated**, and on a regeneration, what moved: sections added or
  removed, shapes or fields that changed, items that entered or left the roadmap
- open questions, by title, and what each blocks
- any plan fix that was proposed, and whether it was applied
- the next action

On a first generation, say so plainly rather than reporting a diff against nothing.

## Rules

- The two plans belong to the user. Propose, show the exact change, and wait. Never edit
  them without approval.
- The overview is derived. Never hand-edit it, and never patch it to work around a plan
  that says something different; fix the plan and regenerate.
- Derive from the plans only. An overview that states something neither plan supports is
  worse than one with an open question, because nothing later will question it.
- Do not turn a rough plan into a polished one. Distil what is there.
- Scope every open question to what it genuinely affects.

## Formatting

Match the conventions in `{{state}}/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
