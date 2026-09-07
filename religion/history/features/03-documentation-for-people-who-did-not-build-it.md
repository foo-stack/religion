# Documentation for people who did not build it

**Type:** Feature
**From build plan:** item 3
**Status:** verified

## Goal

Everything under `docs/` today is written for someone who already knows Religion:
`config.md`, `enforcement.md`, `releasing.md`, `state-model.md`, a decision log and twelve
decision records. They explain how it is built. Nothing explains how it is used.

`README.md` has a Getting started section, but it is four numbered lines naming four skills.
It tells someone what to type and nothing about what happens next, what they will be asked
to approve, or what to do when something is wrong.

When this is done, a person who has never seen Religion can install it onto a repository
they already have, understand what the loop will ask of them before they commit to it, and
recover on their own when `doctor` reports a problem. Each of the three documents is written
from a real run rather than from the skill sources, because a guide derived from the
instructions describes what should happen, and that is exactly the claim this project does
not accept anywhere else.

## In scope

- `docs/getting-started.md` - install onto an existing repository through to a generated
  overview, walked rather than listed
- `docs/the-loop.md` - one work item start to finish: what you see, what you approve, what
  it costs you, worked from a real archived item in this repository
- `docs/doctor.md` - each of the seven checks, what a failure means, and the fix that
  clears it
- `docs/README.md` - an index separating the guides from the architecture notes, since the
  two have different readers
- Reconciling `README.md` and `packages/create-religion/README.md` so they point at the
  guides instead of half-duplicating them

## Out of scope

- **Rewriting the README.** Only its Getting started section changes, to point at the
  walkthrough rather than restate it. The rest is a landing page and works as one.
- **The architecture notes.** `config.md`, `enforcement.md`, `releasing.md` and
  `state-model.md` are correct for the reader they have. They get an index entry and
  nothing else.
- **A documentation site.** Nextra, Vocs, a generator, a theme. These are four markdown
  files in a repository and nobody asked for more.
- **A link-checking verification check.** It would be cheap and it is not this item.
  Verifying links stays manual, in each step's evidence.
- **Screen recordings or terminal casts.** Text only.
- **The stale check count** in `CLAUDE.md:198` and `AGENTS.md:233`, which say nine
  verification checks where there are ten. Real, and a fix rather than part of this feature.
- **The update path.** `religion update`, its conflict detection, and what to do when a
  managed file was edited locally. It belongs to a person who did not build this, but the
  item names three documents and this is a fourth. Worth its own line in the build plan.
- **The inbox note** on `parseWork.nextStep` truncating a step title. Still in the inbox.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - getting started, walked rather than listed** - write
  `docs/getting-started.md` covering install onto a repository that already exists, through
  `setup`, the two plans, and `overview`, stopping where the first item is ready to spec.
  Cover both branches `setup` takes, since a newcomer does not know which one they are: an
  existing codebase, where the plans are drafted from a survey, and a fresh scaffold, where
  they are written by hand or through `discovery`. Cover what the installer does when a
  `CLAUDE.md` or `AGENTS.md` is already there, what `setup` does when the README answers
  nothing, and the choice between committing the workflow files and keeping them local. Write it from a run against a scratch clone of a
  repository nobody here wrote, not from the skill sources. *Done when:* the walkthrough has
  been executed start to finish against a real repository, every command shown is one that
  was actually run, every quoted output matches what that command printed, and the run ends
  with `doctor` reporting healthy.
- [x] **Step 2 - what the loop actually feels like** - write `docs/the-loop.md` covering one
  item from `feature` to `complete`: the spec arriving before any code, the per-step diff and
  the evidence under it, what the four review options do and what saying no looks like, how
  progress survives a cleared context, what the findings ledger blocks, and what `complete`
  archives and commits. Use an item already archived under `religion/history/features/` as
  the worked example. *Done when:* every artifact shown is quoted from a real file in this
  repository with the path it came from, every such path resolves to a file that exists, and
  the document names which archived item it is walking.
- [x] **Step 3 - what to do when doctor complains** - write `docs/doctor.md` covering each
  of the seven checks in `packages/create-religion/lib/doctor.ts`: required files,
  configuration, adapters, entry file commands, overview freshness, visibility, and git.
  For each, what the check is protecting, what the failure text means, and the fix. Include
  what a healthy report does not prove. *Done when:* every failure mode documented has been
  triggered deliberately in a scratch copy, the exact failure text is quoted from that run,
  and the stated fix has been shown to clear it.
- [x] **Step 4 - an index, and entry points that agree** - write `docs/README.md` naming
  every document under `docs/` and who each is for, separating the three guides from the
  architecture notes. Replace the body of `README.md`'s Getting started section with a short
  orientation and a link to the walkthrough, and add a guides link to
  `packages/create-religion/README.md`. *Done when:* every file under `docs/` appears in the
  index, every relative link in all four new files resolves to a file that exists, `README.md`
  no longer restates the walkthrough, and `npm test` passes.

## Files and areas

- `docs/getting-started.md`, `docs/the-loop.md`, `docs/doctor.md`, `docs/README.md` - new
- `README.md` - the Getting started section only
- `packages/create-religion/README.md` - a link to the guides
- No TypeScript, no skill sources, no rendered trees. This item is prose

## Data and contracts

- **The four document paths are load-bearing** once this is on the default branch. They
  become public URLs the moment they are pushed, and `README.md`, the package readme and the
  index all link to them. Renaming one later breaks inbound links that this repository cannot
  see. The four names are fixed by this spec rather than chosen while writing, and Step 4
  must not rename anything it is indexing.
- No types, stored shapes, or configuration keys change.

## Testing

The gate is on: the entry file declares `Test: npm test` and `Verify: npm test`, which runs
the ten verification checks, the command-line tool's unit tests, and the routing corpus.

This item adds no logic, so it adds no unit tests. The coding standards exempt interface and
integration surfaces, and a test asserting that a markdown file contains a phrase pins
wording rather than behaviour.

None of the verification checks read `docs/`, so `npm test` cannot catch a wrong command, a
stale output, or a broken link in any of these files. It only proves nothing else regressed.
What proves each step is the run behind it:

| Step | Evidence |
| --- | --- |
| 1 | a real install and onboarding run, with every shown command executed and its output matched |
| 2 | every example traced to a path in `religion/history/features/` |
| 3 | each of the seven failures triggered in a scratch copy, with the fix shown to clear it |
| 4 | every link resolved by hand, and `npm test` green |

Step 3 is the one most likely to be written from the source instead of from a run. It is
also the one where that would matter most, because a fix nobody tried is a fix that does not
work, offered to someone whose install is already broken.

## Notes for the agent

- **Write from runs, not from sources.** Reading `doctor.ts` tells you what the check tests.
  It does not tell you what the message looks like, what a person should do about it, or
  whether the fix works. Every command and every quoted output in these documents must come
  from something that was actually executed. This is the project's evidence rule applied to
  its own documentation, and it is the whole reason this item is worth doing.
- **The reader has not read anything else.** No knowledge of the skills, the state files, the
  authority tiers, or the vocabulary. Introduce a term before using it, or link to where it is
  defined. Do not assume the README was read first.
- **Keep the two audiences apart.** `docs/architecture/` is for someone extending Religion.
  The three new guides are for someone using it. The index in Step 4 is what makes the
  separation visible; do not blur it by cross-linking architecture notes into the guides
  where a guide should simply say the thing.
- **Do not duplicate the README.** Where the README already says something correctly, link to
  it. Where the walkthrough needs to say it properly, move it and leave a link behind.
- **Decide the invocation syntax once, in Step 1.** These documents are written by hand and
  are not rendered per adapter, so they cannot use the token vocabulary the skills use.
  Religion supports four tools whose invocation differs, and a guide that writes `/feature`
  throughout is wrong for three of them. Pick one convention in Step 1, state it where the
  reader first meets a skill name, and hold it across all four files.
- **Coding standards apply to prose.** No em dashes. No reference to plan numbers, roadmap
  items, or planning documents in anything that lands in git, which includes these files.
- **Use a scratch directory for every trial run.** Nothing in these steps writes into a
  repository that matters, and the clone is what makes the doctor failures safe to trigger.
- **Steps 1 through 3 write separate files and look independent.** They are deliberately
  sequential anyway: each document sets the voice and the vocabulary the next one inherits,
  and writing them together is how three guides end up disagreeing about what a work item is
  called.

## Outcome

Three guides and an index, written from runs rather than from the skill sources.

`docs/getting-started.md` walks install through to a generated overview, covering both
branches `setup` takes. `docs/the-loop.md` walks one archived item from spec to commit, with
every artifact quoted from a file in this repository. `docs/doctor.md` covers every check,
what each failure means, and the fix. `docs/README.md` indexes them and separates the guides
from the architecture notes, which have a different reader.

Two full onboarding runs stand behind the first document: a scaffold built in a scratch
directory, and the clone surveyed for the previous item. Both ended with `doctor` reporting
healthy, and every command and output quoted was checked against a live run rather than
transcribed.

### What went wrong on the way

**Three documented facts were wrong, and only running them found it.**

The first draft of the walkthrough introduced a `## 1. Problem` block as output from a
drafting run. It was verbatim from `src/skills/setup/reference/drafted-plans.md`: a real
quote, attributed to a run that never produced it. Reframed as the shape the drafting
produces.

The troubleshooting guide said `update` restores a missing entry file. It does not. It
restores the file as the shipped template, so the failure changes from `no entry file found`
to `still the shipped placeholder` rather than clearing. The fix is two steps and the guide
now shows the intermediate state.

The same guide said deleting `config.json` was a valid way to start over, on the reasoning
that a missing file means built-in defaults. That is true for the skills and false for the
command-line tool, which locates a project by that file. Deleting it makes the project
invisible to `doctor` itself.

**The spec overcounted the failing checks.** It called for all seven `doctor` checks to have
their failure modes triggered. `visibility` is hardcoded to pass and only ever reports which
choice is in force, so six can fail. Eleven distinct failure messages were triggered across
those six, and every stated fix was run and shown to clear.

**A shell variable expanded before it was set**, so one verification `update` ran against
this repository rather than the scratch copy. No tracked file changed, the generated state
directory is not committed, and the suite and `doctor` were both clean afterwards. The
verification was redone rather than trusted.

### Deferred

- **The guides describe unreleased behaviour.** They document the drafting rewrite from the
  previous item, which is committed but not yet published. Anyone installing from npm today
  gets the older `setup`. The pending changeset closes the gap on the next release.
- **Nothing verifies documentation.** No check reads `docs/`, so a wrong command, a stale
  output or a broken link would pass. Each was verified by hand here. A link check would be
  cheap and was deliberately left out rather than added unasked.
- **The update path is still undocumented.** `update`, its conflict detection, and what to do
  when a managed file was edited locally. It belongs to the same reader and wants its own
  line in the build plan.
- **One count corrected outside the item's scope.** The published package readme claimed
  twenty-two skills where there are twenty-five. Fixed while editing that file. The entry
  files still understate the verification checks, which remains a separate fix.

## Landed

**Base:** 3afaaaee5171c7903f46affd0abe204bbc403397
**Commits:** 73226c12514a5e13ab544bf142cc24a6be8d2c3f
**Product paths:** docs/getting-started.md, docs/the-loop.md, docs/doctor.md,
docs/README.md, README.md, packages/create-religion/README.md

The changeset at `.changeset/docs-for-newcomers.md` travels with this item and is consumed
by the next release rather than being part of what it delivers.
