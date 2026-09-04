---
name: check
summary: prove the current work does what its spec says, against the running project
description: "Prove the current work actually does what its spec says by running the real project and observing behavior against each stated outcome. Picks its evidence from what the project is: a live browser for web work, captured command output for a CLI, request and response for an API, plus any configured test harness. Reports pass or fail per outcome with the evidence that decided it. Never edits source, never commits; fixing belongs to {{cmd:implement}}. Use when the user runs {{cmd}}, asks to confirm the work behaves correctly, wants proof before completing, or wants a change checked in the running project rather than only in the build."
---

# check - prove the work against the running project

Where this sits:

    implement  ->  [check]  ->  complete
    (built it)     (prove it)   (close it out)

The build passing means the code compiles. This skill answers a different question: does it
actually do what the spec said it would. Those are not the same question, and only one of
them is what the user asked for.

It observes. It never edits source, installs anything, commits, or fixes what it finds.

## Step 1 - read what must be true

Read `{{state}}/context/current-work.md` and take the stated outcome from every build step,
plus anything in the Goal and Testing sections that makes a claim about behavior. Those
outcomes are the checklist. Nothing else is in scope.

If the spec is still the stub, say so and stop.

## Step 2 - pick the evidence

Choose by what the project actually is. Never assume a harness exists, and never install one.

| Project shape | Evidence |
| --- | --- |
| Web interface | Drive a real browser: navigate, interact, screenshot each outcome, and read the console and network for errors the page does not show |
| Command line tool | Run the real command with real arguments and capture stdout, stderr, and exit status |
| Service or API | Issue real requests and record status, headers, and body |
| Library | Exercise the public interface the way a consumer would, not through internals |
| Background work | Trigger it and observe its effect, not just that it was scheduled |

When the entry file declares a browser test command, run it too, as one source among
several. Do not treat it as proof of visual fidelity, real signed-in behavior, browser
chrome, or anything else it does not actually observe.

Start the project the way its own commands say to. If it cannot start, that is the finding:
report it and stop rather than reasoning about what would have happened.

## Step 3 - check each outcome

For each one, state what you did, what you observed, and whether it matched.

- **Pass** needs observed behavior. Not a passing build, not code that looks correct, not
  a plausible argument.
- **Fail** names what happened instead, with the evidence.
- **Could not check** is its own result, with the reason. It is never a pass. A required
  outcome that cannot be checked is a blocker.

Check the unhappy paths the spec named: empty and malformed input, the error and empty
states, the first-run case. A feature that works only on the happy path is not done, and
this is where that gets caught rather than after it ships.

## Step 4 - report

Lead with the verdict, then the evidence.

- each outcome, with pass, fail, or could not check, and what proved it
- what was run, exactly
- anything observed that the spec did not ask about but that looks wrong
- next action: {{cmd:implement}} when something failed, {{cmd:complete}} when everything
  passed

Never say passed, verified, or working without naming the command, route, screenshot, or
output behind it.

## Rules

- Observe, never repair. A failure is reported, not fixed.
- Never install a runner, a browser, or a dependency to make a check possible. Report the
  gap.
- Do not widen scope beyond the spec's stated outcomes, except to report something clearly
  broken that you happened to see.
- A check that could not run is a blocker, never a pass.

## Formatting

Match the conventions in `{{state}}/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
