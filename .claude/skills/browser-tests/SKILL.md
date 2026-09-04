---
name: browser-tests
summary: set up a repeatable browser test harness and record its command
description: "Add or normalize a repeatable browser test harness, reusing an existing runner where there is one and otherwise preferring Playwright for web and browser-extension projects. Adds one project-relevant smoke test, records the command in the entry file, and proves it runs. Distinct from live browser evidence during a check: this is regression coverage that runs unattended and for other people. Use when the user runs /browser-tests, asks to add browser or end-to-end tests, or asks to make browser behavior repeatable."
---

# browser-tests - repeatable browser coverage

/check drives a real browser to prove one work item behaves. This sets up a harness
that keeps proving it, unattended, for everyone.

Different jobs. Live browser evidence answers "does this work now", with no setup and full
fidelity. A harness answers "did we break it", forever, and runs where nobody is watching.
A project can want either, both, or neither.

## Step 1 - look first

Reuse a compatible runner if one exists. If not, prefer Playwright for web and
browser-extension projects: it installs its own browsers, runs headless, and is the
ecosystem default.

Say what you propose, including that it downloads browser binaries, before installing.

## Step 2 - set it up minimally

Install it, add the configuration, and write **one** smoke test that exercises something
this project actually does. Not a test that loads a page and asserts the title: a test that
would fail if the project's main path broke.

Keep the configuration small. Base URL, one browser, a way to start the project. Sharding,
matrices, and visual snapshots are later choices, and adding them now means maintaining
them from a position of no evidence that they help.

## Step 3 - record the command

Add it to the Commands section of the entry file as `Browser tests`.

Once declared, specs can include focused browser coverage for stable behavioral outcomes,
and checks can run it as one evidence source. It does not prove visual fidelity, real
signed-in behavior, or browser chrome, and must never be described as though it did.

## Step 4 - prove it

Run the command and show the output. Then break the assertion and show it failing, so the
harness is known to be wired to the project rather than passing vacuously.

## Step 5 - report

What was installed, the exact command, what the smoke test covers, and what it does not.

Say explicitly that this is **not** added to `Verify` or to continuous integration unless
the user asks. Browser tests are slow and flakier than unit tests; putting them in the
default gate is a real cost and should be a decision, not a side effect.

## Rules

- One harness per project. Reuse before installing.
- One smoke test, not a suite. Coverage grows with the work that needs it.
- Never claim the harness proves something it does not observe.
- Not in `Verify` or continuous integration without an explicit yes.

## Formatting

Match the conventions in `religion/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
