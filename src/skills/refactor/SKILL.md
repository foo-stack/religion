---
name: refactor
summary: simplify existing code in one behaviour-preserving campaign at a time
description: "Simplify code that already exists, one behaviour-preserving campaign at a time. Takes a target that must be named (a single file, a folder, one package, or a monorepo root) and surveys it across five lenses: bloat, structure, over-implementation, duplication, and reinvention of what the language, the standard library, or an installed dependency already provides. Specs one lens in one area into {{state}}/context/current-work.md and stops, leaving {{cmd:implement}} to build it. Refuses to start when no test reaches the target, since a change meant to preserve behaviour needs something able to notice when it does not. Use when the user runs {{cmd}}, asks to simplify, shrink, tidy, consolidate, or clean up existing or inherited code, says something is bloated or over-engineered, or wants a hand-rolled implementation replaced by something already available."
---

# refactor - simplify what is already there

Refactoring is the one kind of change defined by what it must **not** do. The code gets
smaller; what it does stays identical. That constraint is the whole skill, and every rule
below exists to protect it.

This skill surveys and plans. It writes one campaign into
`{{state}}/context/current-work.md` and stops, the same as {{cmd:feature}} and {{cmd:fix}}.
{{cmd:implement}} builds it under the usual review gates.

## Input

A **target is required**, and may be any size:

    {{cmd}} src/lib/date.ts        a single file
    {{cmd}} src/legacy             a folder
    {{cmd}} packages/api           one package
    {{cmd}} .                      a monorepo root

There is no default and no implicit whole-project mode. Refactoring without a named target
is how a work item becomes unbounded. If no target is given, ask for one rather than
guessing at what looks worst.

A **lens** may follow, to survey only that axis: `{{cmd}} packages/api duplication`.

## The five lenses

Ordered as the campaign order is ordered, by how much each depends on a judgement about
equivalence. The earlier ones are safe because nothing has to be judged equal to anything.

| Lens | Finds | The judgement it rests on |
| --- | --- | --- |
| `bloat` | comments restating the code, banner blocks and section dividers, dead code, unreachable branches, unused imports, variables and exports | none: the code is not reached |
| `structure` | files and functions past the configured size, god objects, control flow nested past following | none: a move preserves behaviour by construction |
| `over-implementation` | abstraction layers, configuration options, generality and extension points nothing calls | that nothing calls it |
| `duplication` | the same utility, type, component or constant defined repeatedly, when one definition would serve | that the copies are actually the same |
| `reinvention` | hand-rolled implementations of what the language, the standard library, or an already-installed dependency provides | that the replacement matches every edge case |

`structure` reads its thresholds from `refactor.maxFileLines` and
`refactor.maxFunctionLines` in `{{state}}/config.json`. They are defaults rather than a
standard this project agreed to, so a project that has set its own limits in a linter
should have those numbers copied into the configuration and used instead.

## Step 1 - resolve the target

Establish what was named: a file, a folder, a package, or a workspace root holding several.
For a package or a workspace, read the manifests to learn where each package begins and
what each one publishes. That boundary matters twice over, in Step 4 and in Step 5.

Exclude what is not the project's to simplify: dependencies, generated files, build output,
caches, vendored code, minified assets, and anything the project's ignore rules already
exclude. State the exclusions before surveying, so nobody mistakes a skipped directory for
a clean one.

## Step 2 - establish the safety net, or stop

**A declared test command is not the gate. Tests that reach the target are the gate.**

Run the project's declared test command and confirm the suite both passes and exercises the
target. A suite of six hundred green tests proves nothing about a directory none of them
import, and proceeding on it is worse than proceeding on nothing, because it feels safe.

When no test command is declared, or none reaches the target, stop and say so plainly:
name the target, say what the suite does cover, and point at {{cmd:tests}} to cover the
target first. A required check that cannot run is a blocker, not a pass.

When the net holds, record the exact command and its result. That green baseline goes into
the spec in Step 5, so every step can be measured against the state before anything moved.

## Step 3 - survey

Read the target across the selected lenses, or all five when none was named. Read
`{{state}}/context/findings.md` as well: quality findings recorded by {{cmd:audit}} against
this area are candidates already identified, and folding them in avoids rediscovering them
under a second name. **Never write to the ledger.** {{cmd:audit}} owns that file, and a
finding's status stays its to change.

Report what was found as counts per area and per lens, densest first:

    packages/api      bloat 41   structure  7   duplication 12
    packages/shared   bloat  6   structure  2   duplication 21
    packages/cli      bloat  3   structure  0   duplication  1

For a single file the map is one row, which is fine. The point is that the size of the job
is visible before anyone commits to it.

## Step 4 - choose one lens, in one area

**A campaign is one lens in one area.** Not five lenses, not the whole monorepo. A spec
mixing safe deletions with semantic replacements cannot be reviewed as one thing, because
the reviewer's attention is spent on the easy half.

Propose the widest win, say why, and let the user choose. Everything else stays in the
report, unspecced, waiting for the next run after this campaign completes.

Two boundaries constrain what may enter the campaign:

- **The published surface stops and asks.** Anything reachable only from inside the project
  can be merged, renamed or reshaped freely, which is what makes the duplication lens work
  at all. Anything a consumer can import, taken from the manifest's entry points, is a
  breaking change wearing a refactor's clothes. Name it, say what would break, and let the
  user decide whether it belongs in this campaign or in a feature.
- **A new dependency needs its own yes, and has to earn it.** When the language and the
  installed dependencies genuinely cannot replace hand-rolled code, a new dependency may be
  proposed, never assumed. Propose one only when it would be used in **several places**. A
  dependency that saves fifty lines in a single file is a bad trade: the code leaves and the
  supply chain stays.

## Step 5 - write the campaign

Write the spec into `{{state}}/context/current-work.md`: the target, the lens, the green
baseline from Step 2, and the change broken into steps small enough to read as diffs.

Order the steps so each one stands alone and can be verified against the baseline. Record
what would prove the behaviour unchanged, which is the test command from Step 2 for logic,
and for anything with a visible surface a route to walk and what should appear.

Candidates that were found but not specced go in as a short list at the end, so the next run
has them and nothing is rediscovered from scratch.

Completion archives the campaign under `{{state}}/history/refactors/`. Refactor campaigns
are their own kind of work: they are not build-plan items, they tick nothing, and keeping
them separate is what makes the refactoring history of an area readable later.

## Step 6 - report and stop

The target and what it resolved to, the baseline and the command that produced it, the
density map, the lens and area chosen and why, what the campaign contains, what was deferred,
and any published-surface or dependency decision waiting on the user.

Then stop. This skill does not build. {{cmd:implement}} does.

## Rules

- **Behaviour is the invariant.** Every step must leave the target doing exactly what it did.
- **Never fix a bug in a refactor step.** A refactor that uncovers a genuine defect stops and
  points at {{cmd:fix}}. Discovering that four copies of a function behave differently means
  choosing one is a behaviour change, not a merge, and the reviewer cannot see it inside a
  diff that also moves code.
- **Never delete a comment that carries a why.** The bloat lens removes comments restating
  the code. A comment recording a decision, a gotcha, a workaround, or a link to a spec is
  the opposite of bloat, and it is unrecoverable once gone.
- **Never reformat alongside a change.** Whitespace, import order and style churn never share
  a step with a structural edit. A diff where fifteen real lines hide among three hundred
  cosmetic ones gets rubber-stamped, which costs more than the formatting saved.
- One lens, one area, one campaign.
- A target is always named. Never scan the project hoping to find something worth doing.
- Read the findings ledger; never write it.

## Formatting

Match the conventions in `{{state}}/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
