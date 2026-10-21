# Accessibility as evidence

**Type:** Feature
**From build plan:** item 35
**Approved:** 2026-10-21, bb8fdebd1f437bf7
**Status:** verified

## Goal

For web work, `check` scans each interface outcome for accessibility alongside its browser
evidence and reports what it found per outcome, naming exactly what the scan covered. A
screenshot proves a page rendered, not that a keyboard or screen-reader user can use it, and an
automated scan covers only part of that, so the report must not claim more than it checked.

## In scope

- `src/skills/check/SKILL.md`: for web outcomes, an accessibility scan with what the project
  already has, a configured `axe` through the browser-test harness first, otherwise a review of
  the page's accessibility tree and its keyboard focus order through the browser being driven.
  Violations listed per outcome by rule and element; the method and its limits named in the
  report and in the Evidence line; serious violations pointed at `audit` rather than recorded
  by `check`.
- A routing case, and a minor changeset.

## Out of scope

- Installing a scanner, which `check` never does; `browser-tests` is where one is added.
- A setting that makes the scan required, a later decision about the configuration's surface.
- Recording violations as findings, which only `audit` does.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - the scan** - `src/skills/check/SKILL.md` and `evals/routing/check.json`. *Done
  when:* the rendered skill scans each web outcome with the project's axe when present or the
  accessibility tree and focus order otherwise, installs nothing, lists violations per outcome,
  states the method and what it does not cover, records it in Evidence, and points serious ones at
  `audit`; the routing corpus passes; `npm test` exits 0.
- [x] **Step 2 - the release note** - a minor changeset. *Done when:* `npm test` exits 0.

## Files and areas

- `src/skills/check/SKILL.md` and its rendered copies
- `evals/routing/check.json`
- `.changeset/`

## Data and contracts

- An Evidence line for a web outcome may carry its scan: `- **Step 2 - the form** - pass: ...;
  accessibility (axe 4.10, WCAG 2.1 AA rules): 0 violations.` or `...; accessibility (tree and focus
  review, no contrast or motion): 2 issues, the email field has no name.`

## Testing

- `npm test` is declared, but this changes skill prose and a routing case only.

## Notes for the agent

- A clean scan is evidence of the absence of the issues that scan detects, nothing more; the line
  says which.
- Contrast, motion and reading order beyond focus need tools or judgement the fallback does not
  have; name them as not covered.

## Evidence

Checked 2026-10-21 at 0731bce, tree clean.

- **Step 1 - the scan** - pass: the rendered `.claude/skills/check/SKILL.md` scans each web outcome with the project's axe or, without one, the accessibility tree and focus order, installs nothing, lists violations per outcome, names the method and its limits, records it in Evidence and points serious issues at audit; the fallback, tried on the running dashboard's Deferred view, found its selectable items exposed as `generic` with no role (recorded as F-160); the routing corpus passed with 184 cases.
- **Step 2 - the release note** - pass: `.changeset/a11y-evidence.md` present; `npm test` exited 0 with 183 unit tests.

## Outcome

For each interface outcome, `check` scans the state the outcome describes for accessibility beside
its screenshots: with the project's own axe through its browser-test harness when there is one,
otherwise by reading the page's accessibility tree for unnamed controls, missing alternative text,
unlabelled fields and heading order, and walking it with the keyboard. It lists violations under
their outcome, names the method and what it leaves uncovered (the fallback sees no contrast or
motion), records the method in Evidence, installs nothing, and leaves findings to `audit`. Trying
the fallback on this repository's dashboard found a real issue, recorded as F-160.

### What went wrong on the way

Nothing.

### Deferred

- **F-160**, open: the dashboard's selectable items have no role for assistive technology.
- **A setting that makes the scan required.**

## Landed

**Base:** e17c5b62681839facc62fa414c4a35cab94955ba
**Commits:** b157ac79fd1ad5468132115d83daf344599eabf0, 0731bce6b7e05be610e3f52eabc1631e1b7882e1, b36db4f9aa54a6ecaca68c3a031ba6b0b0516118
**Product paths:** .agents/skills/check/SKILL.md, .changeset/a11y-evidence.md, .claude/skills/check/SKILL.md, evals/routing/check.json, src/skills/check/SKILL.md
