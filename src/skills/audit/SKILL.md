---
name: audit
summary: review the code itself across four lenses, recording findings in the ledger
description: "Read-only code review across four lenses (quality, security, performance, tests) and four scopes (current work, changed files, a path, or the whole project), fanning the lenses out to subagents that read and return findings while this skill performs the single write. Records each finding in {{state}}/context/findings.md with a durable identifier, a severity from P0 to P3, and a status, where an open or fixed P0 or P1 blocks completion. Use when the user runs {{cmd}}, asks for a code, quality, security, performance, or test review, wants dead code or duplication found, or wants a repair re-reviewed before it closes."
allowed-tools: Read, Grep, Glob, Bash, Agent, Write, Edit
---

# audit - review the code, and record what you find

{{cmd:check}} proves the work behaves as promised. This skill reviews the code itself.

It changes nothing except the findings ledger. It never edits source, installs anything,
commits, merges, or starts repair work.

## Input

Scope and lens are separate, and may appear in either order: `{{cmd}} security current`,
`{{cmd}} src/auth tests`.

**Scope**, defaulting to `current` when work is active, else `changed` when the tree is
dirty, else `full`:

- `current` - the active spec, everything the work item has changed so far, and the code
  around it that the change affects
- `changed` - staged, unstaged, and untracked source, plus nearby code
- `full` - all project-owned source, tests, and configuration, excluding dependencies,
  generated files, build output, caches, vendored code, and minified assets
- a path - that area, plus the tests and callers needed to understand it

**Lens**, defaulting to all four:

- `quality` - duplication, dead code, unreachable paths, oversized modules, abstractions
  that do not pay for themselves, inconsistency, drift from the project's standards
- `security` - missing authorization, client-controlled ownership, injection, unsafe
  parsing, data exposure, secret handling, insecure defaults, trust-boundary mistakes
- `performance` - repeated queries and network calls, unnecessary rendering, blocking work
  on hot paths, unbounded loops and collections, memory growth, oversized payloads,
  missing pagination, unsafe concurrency
- `tests` - important logic with no coverage, weak assertions, tests that only mirror the
  implementation, excessive mocking, shared state, order or time dependence, skipped or
  focused tests, swallowed failures

State the scope and lens you chose before reviewing.

## Step 1 - gather context

Read the project overview, the coding standards, the active spec, the existing findings
ledger (for identifiers and statuses), the configuration, and the relevant source.

For `current`, resolve the comparison base without touching the network: a base named by
the spec or project instructions, else the recorded default branch, else a local `main`
then `master`. Find the merge base and inspect the committed range through `HEAD`, then add
staged, unstaged, and untracked work. If no reliable base exists, say so and review the
spec plus local changes, without claiming committed work was covered.

For `full`, state the excluded paths before reviewing, so generated or third-party code
does not consume the review.

## Step 2 - run the signals that exist

Use only commands the project already has. Do not install tools, and do not fetch.

Lint and typecheck when relevant; the test command for the tests lens or to validate a
suspected risk; the build when the lens needs compilation evidence. A useful command that
does not exist is a gap worth reporting, not a reason to add one.

## Step 3 - review, one subagent per lens

Run each selected lens as its own subagent over the resolved scope. They read code and
**return** findings; they never write. This skill merges what comes back, assigns
identifiers, and performs the single write in Step 4. Parallel reviewers cannot race a
file that only one of them writes.

Give each subagent the scope, the file list, the standards, and its own lens only. A lens
that wanders into another lens produces duplicates that then have to be reconciled.

**The ledger never scopes the review.** Review the code fresh, then record what was found.
Working from the open findings as a checklist and verifying only those is the exact failure
the ledger exists to prevent: a repair can introduce a defect no existing entry points at.

Ground every finding in reachable code. Prefer a short list of real findings to a long list
of guesses, and do not report style differences that are merely different.

Do not broaden a focused pass because another lens looks interesting. If an obvious P0
appears outside the selected lens, record it as an out-of-lens critical risk, but do not
start searching that lens.

If a possible secret appears, never quote its value, paste the matching line, or include
raw output containing it. Report the redacted category, file, line, risk, and remediation.

## Step 4 - write the ledger

`{{state}}/context/findings.md` is the durable record. Chat does not survive a cleared
context; this does. Create it with a `# Findings` heading if it is missing.

One block per finding. The header line is the machine-readable part and keeps this exact
shape; the prose below it is for people.

    ### F-03 [P0] open - Retained auth volumes carry the run label

    **File:** ops/compose.yaml:86
    **Found:** 2026-09-04 by audit (scope: current; lens: security)
    **Why it matters:** ...
    **Suggested fix:** ...
    **Resolution:**

Identifiers are sequential within the ledger, one past the highest present, never reused
and never renumbered while their entries live there. Completion archives resolved entries
under a work-item prefix, and that prefixed form is the permanent reference.

| Status | Meaning | Blocks completion at P0/P1 |
| --- | --- | --- |
| `unverified` | Suspected, no confirming evidence yet | No |
| `open` | Confirmed, not yet repaired | Yes |
| `fixed` | Repaired, not yet re-reviewed | Yes |
| `closed` | Repaired and re-reviewed against the new code | No |
| `accepted` | Not fixing, by the user's explicit decision, reason recorded | No |
| `invalid` | Re-examination proved it wrong, evidence recorded | No |

After reviewing:

- Append each new confirmed finding as `open`.
- Record a lead worth tracking as `unverified`. It never gates anything.
- Update entries this pass re-examined, noting the evidence in **Resolution**.
- Move `fixed` to `closed` only when all three hold: this pass covered the finding's file,
  re-examining the repaired code confirmed the defect is gone and nothing worse replaced
  it, and the report names it as closed. An unrelated new problem in the same file gets its
  own entry. Never close implicitly.
- Set `accepted` only on the user's explicit decision, with their reason. Never on their
  behalf.
- Set `invalid` only when re-examination shows the finding was wrong, with that evidence.
  It is a review verdict, never a shortcut past a gate.

`fixed` blocking completion is deliberate: a repair is done when a review has looked at the
result, not when the code changed.

## Step 5 - report

Findings first, ordered by severity, using the identifiers just assigned.

Severity: **P0** data loss, a security break, or code that cannot ship. **P1** a likely bug,
a broken contract, a missing guard. **P2** a maintainability problem worth fixing before
the work closes. **P3** a small cleanup or follow-up.

P0 and P1 require a concrete code path, a violated contract or boundary, a failing command,
or reproducible behavior. Incomplete evidence goes under **Unverified risks** with what is
missing, never presented as a confirmed high-severity finding.

Then report: ledger changes by identifier; commands run and their results; the scope and
lens chosen; the commit range for `current`; the paths reviewed and excluded; checks that
could not run; and a suggested repair order.

A focused lens is not a broad review. Say what was not reviewed, and never imply the
omitted lenses passed. For `full`, say whether coverage was complete or partial.

## Rules

- The ledger is the only file this skill writes.
- The ledger reports status; it never defines what the review looks at.
- Never reproduce a secret or sensitive value.
- Ground every finding in a file and line where possible.
- Recommend the smallest fix that removes the risk, not a rewrite.
- Respect the project's existing patterns over generic advice.
- The goal is code that is understandable, consistent, tested where it matters, and safe to
  keep building on. Not perfection.

## Formatting

Match the conventions in `{{state}}/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
