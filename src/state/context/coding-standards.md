# Coding Standards

> Your conventions. The rules below apply to any codebase. The stack-specific sections at
> the bottom are written by {{cmd:setup}} from what this project actually does, and are
> yours to edit afterwards.

## Testing

Testing is opt-in, and one signal turns it on: **a `test` command declared in the Commands
section of the project entry file.**

Declare one and tests become a gate for logic-bearing work. Leave it out and the loop
verifies logic with the evidence it already has: running it, a screenshot, the build.
Adding a runner is a deliberate step, never a silent install in the middle of unrelated
work. Run {{cmd:tests}} to add one.

- **What to test:** pure logic where a wrong answer is possible. Parsers, formatters,
  validators, identifier builders, server actions. These have assertable inputs and
  outputs and real edge cases: empty, missing, malformed.
- **What not to test:** user interface components and integration-level surfaces. Verify
  those with a screenshot and the build, not brittle unit tests.
- **The gate:** a step that adds in-scope logic ships a passing test in the same reviewable
  diff. The suite must be green before the step is approved and before the work is
  completed. Interface and integration steps are exempt.
- An empty suite should fail, not pass, so that "no tests ran" never looks like "passed".
- Test files live next to the source they cover.
- Run them through the project's declared test command, never a hardcoded tool name.

## Code quality

- No commented-out code.
- No unused imports or variables.
- Keep functions short enough to hold in your head at once.
- Make the minimal change that accomplishes the task. Do not refactor unrelated code
  unless asked, and do not add capabilities nobody requested.
- Preserve the patterns already in the codebase over generic best practice.

## Comments

Write code that explains itself, and comment only what the code cannot say.
Over-commenting is a common tell of generated code, so resist it.

- Comment the **why**, not the **what**. Delete any comment that restates the code.
- No banner blocks, section dividers, or narration of obvious code.
- A comment earns its place when it captures something the code cannot: a non-obvious
  decision, a gotcha or workaround, why a value is what it is, or a link to a spec.
- Keep documentation comments minimal. A one-line purpose on an exported symbol is plenty;
  do not restate the signature.
- When in doubt, leave it out.

## Writing

Applies to everything generated: documentation, comments, commit messages, specs.

- No em dashes. Use a hyphen for a `term - description` separator, or rephrase with
  commas, parentheses, or a colon. Avoid en dashes and the ellipsis character too.
- No AI attribution anywhere in git history: no co-author trailers, no "generated with"
  footers, no "via" markings in commit messages or pull request descriptions.
- Commit messages describe what the change does. They never reference a plan number,
  roadmap phase, or planning document, because someone reading the history later has none
  of those open.

## Errors and inputs

- Validate anything crossing a trust boundary before using it.
- Scope every user-owned query by the authenticated user's identity taken from the server,
  never from a client-supplied value.
- Fail loudly at the boundary and handle it deliberately; do not swallow errors to make a
  check pass.

## Stack conventions

<!-- {{state}}:setup-required -->

Empty until {{cmd:setup}} detects the stack and writes this section: language conventions,
file organization, naming, framework patterns, styling, and data access as this project
actually does them.
