# Drafted plans - the target shape

What $setup writes into `religion/project-plan.md` and `religion/build-plan.md` when it
surveys a project that already exists. This is the shape to aim at, and the standard the
draft is judged against before it is shown.

A drafted plan is a **reading of the repository offered for correction**, not a finished
plan. The person reviewing it knows why the project exists; the code does not. The draft's
job is to save them the typing they would resent, and to be obviously wrong in the places
it guessed, so they correct it instead of trusting it.

## Found, inferred, and missing

Three states, and conflating them is the failure this whole reference exists to prevent.

| State | Meaning | How it is written |
| --- | --- | --- |
| Found | read directly out of the repository | plainly, as a statement |
| Inferred | concluded from what was read | the claim, then `(inferred)` |
| Missing | the repository does not answer it | a question addressed to the reader |

The code says what was built and never why. Every sentence about intent, audience, or
motivation is inferred at best, so mark it. A section with no evidence behind it is left as
a question:

    ## 1. Problem

    > Not found in the repository. What problem does this solve, and what is broken or
    > missing without it?

That is a better draft than a confident paragraph assembled from a README's opening line.
An unmarked guess is worse than a blank, because nothing downstream will question it.

## The project plan, section by section

Sections 1 through 5 are required and $overview validates that they are answered
rather than left as the prompts they ship with. Sections 6 through 8 are optional and are
deleted rather than filled with "not applicable".

### 1. Problem

- **Derived from:** the README's opening, any `docs/` introduction, the repository
  description, and the earliest commits, which are often the clearest statement of intent
  the project ever made.
- **Aim for:** what is broken or missing without this, in a few sentences.
- **Do not:** restate what the software does. "A CLI that renders markdown" is section 3.

### 2. Users

- **Derived from:** authentication and authorization code, roles and permissions, distinct
  entry points, and any onboarding or pricing copy.
- **Aim for:** the kinds of user the code actually distinguishes, and what each needs. Note
  access tiers where they exist, such as anonymous against signed in.
- **Do not:** invent personas. A project with one unauthenticated entry point has one kind
  of user, and saying so is a finding.

### 3. Features

- **Derived from:** entry points, routes, commands, exported surface, and the directory
  layout.
- **Aim for:** one line each, high level, describing what the software already does. This
  is identity, not a queue.
- **Do not:** list every function, or promote a helper into a feature.

### 4. Data

- **Derived from:** schema and migration files, type and model definitions, serialization
  code, and the shapes written to disk or across the wire.
- **Aim for:** the entities, roughly what they hold, and how they relate, in enough detail
  that $overview can turn it into a concrete model. A project with no database still
  has one: the shapes it reads and emits.
- **Do not:** copy the schema verbatim. Distil it.

### 5. Tech

- **Derived from:** the dependency manifest, lockfile, language version files, build and
  task configuration, and continuous integration workflows.
- **Aim for:** the stack, one line each on what it is for here.
- **Do not:** list transitive dependencies, or record a version the manifest does not pin.

### 6. Monetization, 7. UI and UX, 8. Deployment

Optional. Draft one only where the repository actually answers it: billing or payment code
for 6, routes and design tokens for 7, deployment configuration, container files, or host
workflows for 8. Delete the heading otherwise rather than leaving a prompt behind.

## The build plan

An existing project's build plan starts from reality: what shipped is checked, so numbering
and history are honest from the first day.

### The item line

    - [x] 1. **Skill submission** - upload a package and save its metadata
    - [ ] 2. **Validation result** - run checks and show pass or fail per submission

This exact form is load-bearing. The loop parses these lines to count progress, to find the
first unchecked item, and to tick items off at completion. A drafted plan that does not
match it leaves the project unable to track its own work.

- checkbox, number, full stop
- title in bold
- ` - ` then one line on what it delivers
- all of it under the `## Plan` heading

### What goes in it

- **Shipped work, checked.** One item per feature the survey found, in the order the
  history suggests they were built. This is where most of a mature project's plan comes
  from.
- **Unshipped work, unchecked**, only where the reader names it or the repository states it
  outright, in a roadmap file or issue text.
- **Nothing else.** Do not queue refactors, cleanups, or fixes that the survey noticed.
  Those have their own paths, and a plan that opens with someone else's cleanup reads as an
  agent's backlog rather than the reader's.

Feature-sized outcomes only: not "Database", not "Make it faster", and not one line holding
three unrelated capabilities.

## Before it is shown

$overview validates the plans and will reject a draft that fails these, so check
them here rather than one stage later:

- sections 1 through 5 answered, or explicitly left as questions, and never left as the
  shipped prompts
- the build plan is a checkbox list under `## Plan`, matching the item line above
- every item is a feature-sized outcome
- nothing in the build plan describes a bug or a review pass rather than a feature
- every inferred claim carries its marker, and every gap reads as a question

Then stop and show both drafts in full. The plans belong to the reader: propose, show the
exact content, and wait.
