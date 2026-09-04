---
name: spike
summary: answer one feasibility question with throwaway code, then delete it
description: "Answer a single question about whether an approach will work, by building the smallest throwaway thing that settles it inside a stated time budget, then deleting the code and recording the answer under religion/history/spikes/. Nothing it writes ever ships. Use when the user runs /spike, asks whether something is possible or feasible, wants to know which of two approaches to take, says to try something and see, or is about to spec work that rests on an assumption nobody has tested. Not for a failure that already exists, which is /debug, and not for how something should look, which is /prototype."
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, WebFetch
---

# spike - find out, then throw it away

A spec written against an untested assumption is expensive twice: once when it is written and
reviewed, and again when implementation discovers the approach does not work and the whole
thing is revised. A spike moves that discovery in front of the spec, where it costs a
morning instead of a work item.

The code is not the output. The answer is.

## Where it sits

    a question the plans do not answer
        |
      [spike]  -> answer recorded, code deleted
        |
    /feature or /fix, now speccing something known to work

## Input

One question, and ideally a budget:

    /spike "can we stream these updates over the platform's own APIs, or is a worker needed"
    /spike "is the vendor SDK usable from an edge runtime" --budget 1h

With no question, ask for one. A spike without a question is just unplanned work.

**One question per spike.** Two questions is two spikes, because the answer to the first
usually changes whether the second is worth asking.

## Step 1 - state the question and the budget

Write both down before touching anything: the question in a form that has a yes, a no, or a
named alternative as its answer, and what a good enough answer looks like. A question that
cannot be answered wrongly is not a question.

The budget defaults to something small. Say it out loud, and say what happens when it runs
out, which is that the answer becomes "not settled in the time given" and that is a real
result rather than a failure.

## Step 2 - build the smallest thing that settles it

Write the least code that produces evidence. It may be ugly, it may be hardcoded, it may
have no error handling and no tests, because none of it is going to exist tomorrow.

Keep it out of the way of real code: a scratch directory, a single file, a branch you will
not merge. Never build the spike inside the shape the real work will take, because that is
how a spike quietly becomes the implementation.

Do not install anything the project has not agreed to. A spike that needs a new dependency to
answer its question has found part of its answer.

## Step 3 - answer, with evidence

State the answer, the evidence that decided it, and what you did not test. Evidence is a
command and its output, a request and its response, a measurement. "It seemed to work" is not
an answer.

Then say what this means for the work that prompted it: which approach the spec should take,
and what is now known to be off the table.

## Step 4 - delete the code, keep the answer

Delete what you built. This is the step that makes a spike a spike, and the one most often
skipped, because working code is hard to throw away. Keeping it means an unreviewed, untested
sketch becomes load-bearing later, which is worse than having no answer at all.

Record the result under `religion/history/spikes/`, named for the question: what was asked,
what the answer was, the evidence, the budget it took, and what is still unknown. That file
is what stops the same question being asked again in six months.

Deleting files is a first-tier action, so ask before removing anything that is not clearly
the throwaway you just made.

## Rules

- One question, one spike, one answer.
- The code never ships. If it turns out to be worth keeping, that is a spec, not a spike.
- A budget that runs out produces "not settled", which is reported, not hidden.
- Never spike something the plans already answer.
- Never write to the findings ledger. A spike answers a question; it does not review code.

## Formatting

Match the conventions in `religion/context/ai-interaction.md`: concise, scannable markdown,
lists for enumerations and tables for matrices rather than dense paragraphs.
