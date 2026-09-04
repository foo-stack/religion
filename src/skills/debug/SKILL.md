---
name: debug
summary: reproduce and isolate a failure without changing anything
description: "Diagnose a failing test, broken build, crash, error, regression, or unexpected behavior without editing source or project state. Reproduces the symptom with the smallest reliable command, localizes the failing path, then tests competing hypotheses in parallel subagents and reports the root cause with the evidence that established it. Hands confirmed repair work to {{cmd:fix}} or {{cmd:implement}}. Use when the user runs {{cmd}}, asks why something is failing or broken, wants a root-cause investigation, or wants to understand a failure before fixing it."
---

# debug - find out what is actually wrong

Diagnosis is separate from repair on purpose. An agent that is allowed to fix while it
looks will fix three things on the way to understanding one, and none of those changes were
reviewed against a spec.

This skill changes nothing: no source edits, no state files, no commits, no installs.

## Step 1 - reproduce

Find the smallest command that reliably shows the failure, and run it. Record the exact
command, the output, and the exit status.

If it does not reproduce, that is the finding. Say what you ran and what happened instead,
and ask what differs about the environment where it fails. An intermittent failure is
reported as intermittent, with how many attempts of what kind, rather than treated as
fixed because the second run passed.

## Step 2 - localize

Narrow to the smallest region that still fails. Read the stack trace properly, including
the parts pointing into dependencies. Check what changed recently in that area.

State what you have ruled out, and how. A localization that cannot say what it excluded has
not narrowed anything.

## Step 3 - test hypotheses in parallel

List the plausible causes. For each one, state what would be true if it were the cause and
what would disprove it. A hypothesis that nothing could disprove is not a hypothesis.

Run each as its own subagent, given the reproduction command, the localized region, and one
hypothesis. Each returns evidence for or against; none of them edits anything. Then weigh
what comes back.

Parallel matters here because hypotheses are independent and reproduction is often slow.
Four subagents that each run a two-minute reproduction cost two minutes, not eight.

Do not stop at the first plausible story. A hypothesis that explains the symptom is not the
cause until the evidence rules the others out, and the cheapest place to notice that is
before a repair has been built on it.

## Step 4 - report

- **What fails**, and the exact command that shows it.
- **The cause**, when the evidence supports one, at a specific file and line.
- **The evidence**, per hypothesis: what was tested, what came back, what it ruled in or
  out.
- **What is still unknown**, when the evidence was not conclusive. Say that plainly rather
  than presenting the best guess as the answer.
- **The repair**, described but not made: what would need to change, and roughly how large
  it is.
- **Next action**: {{cmd:fix}} for an unplanned repair, {{cmd:implement}} when it belongs to
  work already in progress.

## Rules

- Change nothing. No source, no state, no commits, no dependency installs.
- Report the cause you can prove, not the one you like.
- A reproduction that fails to reproduce is a result worth reporting.
- Never present a hypothesis as a conclusion.

## Formatting

Match the conventions in `{{state}}/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
