---
name: feature
summary: turn a build-plan item into a reviewed, buildable spec
description: "Turn a feature from the build plan into a buildable spec in religion/context/current-work.md. With no argument it specs the first unchecked item; given a number or name it specs that one; add `preview` to get a read-only briefing that writes nothing. A genuinely new feature goes through an intake that proposes the plan line, waits for approval, and refreshes the overview before spec'ing. Sizes the work and splits anything too large into sub-items, writes small build steps with observable outcomes, then red-teams its own draft and reports what the critique changed before stopping for review. Use when the user runs /feature, names or numbers a feature, asks to start or break down the next feature, or asks what an upcoming feature involves."
---

# feature - turn a build-plan item into a buildable spec

Where this sits:

    build-plan.md  ->  [feature]  ->  current-work.md  ->  implement
    (one line)         (spec it)      (the spec)          (build it)

The build plan is deliberately thin: one line per item, no detail. Turning one of those
lines into something buildable is this skill's whole job. It plans; it never builds.

## Input

- **No argument** - the first unchecked item in the build plan, including the first
  unchecked sub-item under an item that was split.
- **A number or name** - `/feature 3`, `/feature "login"`.
- **A description with no match in the plan** - goes through **New work intake** below.
- **`preview`** appended to any of the above - a read-only briefing, writing nothing.

Read `religion/context/inbox.md` before choosing. When it holds anything and no argument
named a specific item, list what is in it alongside the plan item you would otherwise take,
and let the user pick. A note that is specced leaves the inbox with the line removed; the
rest stay. An inbox nobody reads is a list of things nobody did.

## Step 0 - make sure the ground is solid

Two checks before anything else.

**Overview freshness.** Recompute the source hash over the two plans. If it does not match
the stamp in `religion/context/project-overview.md`, or the stamp is missing, follow the
`/overview` skill first, report what changed, then continue here. A spec written
against a stale overview encodes a data model the plans no longer describe.

**Open questions.** Read the overview's Open questions section. If any of them lists an
area this item touches in its `affects` line, the contradiction would be resolved by
guessing while writing the spec. Instead:

1. Name the question and quote what the two plans each say.
2. Ask the user to decide.
3. Show the exact edit their answer implies, in the plan section that is wrong.
4. On approval, write it, follow `/overview` to regenerate, then continue.

Only the user's own answer may resolve an open question, and only the edit they approved
is written. If they would rather not decide now, stop and say which item remains blocked.

An open question whose `affects` list does not cover this item does not block it.

## Step 1 - pick the target

Given a number or name that matches a build-plan item, use it. With no argument, read the
plan top to bottom and take the first unchecked leaf. State which item you are spec'ing
before going further.

If the build plan is not a checklist yet, treat every item as unchecked, take the first,
and offer to convert the list so progress can be tracked from here on. Proceed either way.

### New work intake

For a genuinely new capability, not a bug or small change. Those go to /fix.

1. Search checked and unchecked items for an existing or near-duplicate item. If the
   wording might just be a different name for something already planned, show the closest
   matches instead of creating new scope.
2. If it is genuinely new, propose one feature-sized checkbox line and where it belongs.
   Preserve completed items and their numbers; take the next unused number.
3. Check whether it materially changes product direction, users, data, stack, or
   deployment. Include the exact proposed project-plan edits only when it does. Most
   incremental work changes only the build plan.
4. Stop for approval, showing the complete proposed plan change.
5. After approval, write it, follow `/overview` to regenerate, then resume here with
   the new item as the target.

Never add scope to a plan the user owns without showing the exact change and waiting.

## Step 2 - size it, and split if it is too big

Read the target line, then take full context from the project overview: the data model,
the stack, the conventions. Then decide how big this is.

**Small enough to build and review as one unit** goes to Step 3.

**Too big for one reviewable spec** gets split. Propose a short list of sub-items, title
and one line each, let the user adjust it, then write them under the parent as an indented
checklist (`4a`, `4b`, `4c`). Spec only the first now; the rest are picked up later.

Two levels of breakdown, easily confused:

- **Sub-items** are each big enough to stand alone: their own spec, review, and archive.
- **Build steps** are small diffs inside one item.

"Authentication" is too big for one spec, so it becomes `4a` registration, `4b` login,
`4c` route protection. Inside `4a`, the page and its server action are steps, not items.

This sizing call is exactly why the build plan stays high level.

### Preview mode

When the request ended in `preview`, stop here and report, writing nothing:

- what the item is, in a sentence
- what it depends on, and whether those are done
- what it will touch: routes, models, modules
- rough size, and how many steps it is likely to need
- whether it will split, and into what
- anything worth deciding before spec'ing it

That is the whole of preview mode. Do not write the spec, touch the plans, or create files.

## Step 3 - write the spec

Write `religion/context/current-work.md` following `reference/spec-template.md`, filling
every section.

**Design reference.** If `prototypes/` exists, it is the reference and no image is needed.
Check what is in it:

- **Static mockups sharing a theme file** are throwaway. Link the relevant ones, treat the
  theme as the source of truth for colour, type, and spacing, and make the **first build
  step** port those tokens into the application's real stylesheet before any component is
  built against them.
- **Real components** are not throwaway. Link them and build on them directly. There is no
  token-porting step, because the tokens are already the project's.

If there are no prototypes and the work is visual or a replication of an existing design,
ask for a screenshot, save it under `religion/reference/`, and link it. Do not write a
visual spec from words alone when an image could exist.

**Build steps** are the core of the file. Each is a small diff, ends with something that
works, depends only on earlier steps, and carries an outcome that can actually be observed.

Where two steps genuinely do not depend on each other, mark the later one `(with N)`. It is
an assertion, not a hint: that these steps touch different files and neither needs the
other's result. Mark nothing you are unsure of. An unmarked spec is sequential, which is
always correct and never wrong, and a project with `workflow.parallelSteps` off ignores the
markers entirely.
Read the Commands section of the entry file while writing the Testing section, so predicted
coverage matches the gate that is actually on.

When writing the spec needed a broad read of the codebase first, run that read in a subagent
and have it return what it found. A survey large enough to be worth doing is large enough to
crowd out the context that has to write the spec from it. The subagent reads and returns; this
skill writes, as it always does.

This is a draft. Do not present it yet.

## Step 4 - red-team the draft, then tighten

Turn on your own spec and try to break it. The cheapest place to catch a scope problem or
an oversized step is here, before any code exists.

- **Coverage.** What does this need that no step delivers? Push on what the happy path
  skipped: empty, missing, or malformed input; the error, loading, and empty states; the
  first-run case; failure of anything external it calls.
- **Step size.** Would any step's diff be too large to read in one sitting? Split it.
  Oversized steps defeat the review gate, which is the point of the whole loop.
- **Order.** Does each step leave the project working, and depend only on earlier ones?
- **Contracts.** Is any type, route, or stored shape that later work will touch left
  undefined? Lock it now and mark it load-bearing.
- **Scope honesty.** Is anything creeping in that belongs to a later item? Is anything
  pushed out of scope that this item genuinely cannot ship without?
- **Outcomes.** Is each one observable and checkable, or is it a vague "it works"?
- **Visual fidelity.** If this is visual work, is a reference linked, or is it about to be
  built blind from prose?
- **Testing.** Does the predicted coverage match the gate that is on?

Apply the fixes. Then stop and present the spec, leading with a short **what the critique
changed** note: the splits, gaps, or scope cuts made, or "nothing, the draft held up".

That note is the point. It shows the gate working before a line of code exists.

## Rules

- Small, reviewable steps. A diff too large to read means the step was too large.
- Build in order. Each step leaves the project working.
- Lock data contracts early and mark load-bearing shapes.
- Scope honestly. State what is deferred so the item stays contained.
- The plans belong to the user. Propose, show the exact change, and wait.
- This skill plans. It never writes product code, and never starts building.

## Formatting

Match the conventions in `religion/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
