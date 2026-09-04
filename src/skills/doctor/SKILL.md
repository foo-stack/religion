---
name: doctor
summary: check the setup is healthy and explain anything that is not
description: "Read-only health check of the installation: required files present, adapter trees in sync, the entry file's commands accurate, configuration valid, plans usable, overview fresh, ignore rules sane, and git state workable. Runs the religion command-line tool for the deterministic checks when it is installed, then explains what any failure means and offers the fix. Use when the user runs {{cmd}}, asks whether the setup is correct, wants a health check, or says something feels wrong before starting or resuming work."
allowed-tools: Read, Grep, Glob, Bash
---

# doctor - is this set up correctly

{{cmd:status}} says where the work stands. This says whether the machinery around it is
sound. Read-only.

## Step 1 - run the checks

If the `religion` command is available, run `religion doctor --json`. Every check it
performs is deterministic, so a program should perform it.

Otherwise check directly:

- **Files** - `{{state}}/config.json`, both plans, the four context files, and the history
  and reference directories exist.
- **Configuration** - `config.json` parses, and every key and value is one the schema
  allows. An unknown key is usually a typo, and a typo silently means the default.
- **Adapters** - for each installed tree, the skills present and, when more than one tree
  exists, whether they hold the same skills.
- **Entry file** - the Commands section is filled in rather than the shipped placeholder,
  and the commands it names exist in the project.
- **Plans** - required sections answered, build plan is a checkbox list.
- **Overview** - present, and its source hash matches the current plans.
- **Ignore rules** - the state directory is either committed or ignored deliberately, not
  half of each, and nothing secret is about to be committed.
- **Git** - a repository exists, and it is not in a detached or mid-operation state that
  will surprise the loop.

## Step 2 - explain, do not just list

For each failure, say what it means and what it will cause. "Overview hash mismatch" is
not useful on its own; "the plans changed after the overview was generated, so the next
spec would be written against a data model that no longer matches" is.

Order by what actually blocks work. A missing history directory blocks the first
completion; an unfilled Commands section blocks verification; a cosmetic gap blocks nothing
and should be reported last or not at all.

Offer the fix, and where it is a single obvious action, offer to make it. Regenerating a
stale overview or creating a missing directory needs no deliberation. Anything touching the
plans, the configuration, or git is proposed and waits.

## Step 3 - report

- **Healthy** or **N problems**, stated first.
- Each problem: what is wrong, what it will cause, how to fix it.
- What was checked, briefly, so the absence of a warning means something.
- Next action.

## Rules

- Read-only by default. Fixes are offered and only made with a yes.
- Do not report a problem that is a deliberate choice. A project with no test runner has
  not failed a check; testing is opt-in.
- Never claim a check passed that could not run.

## Formatting

Match the conventions in `{{state}}/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
