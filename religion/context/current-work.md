# Accessibility as evidence

**Type:** Feature
**From build plan:** item 35
**Approved:** 2026-10-21, bb8fdebd1f437bf7
**Status:** in progress

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
