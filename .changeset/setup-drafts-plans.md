---
"create-religion": minor
---

`setup` now drafts both plans from a repository that already exists, instead of describing
the idea of doing so.

Its frontmatter has always claimed an existing project "is surveyed so the plans and
standards are generated from what is actually there". Behind the claim, the drafting step
was fifteen lines of intent: derive problem, users and features from the code and the
history, with nothing on how, from what, in what order, or what the result had to look
like. The survey it ran collected stack, commands, existing checks, conventions and layout,
none of which answer a single required section of the project plan.

The survey now gathers what the plans actually need. One evidence source is named per
required section: the README and any docs introduction for the problem, authentication and
entry points for users, routes and exported surface for features, schema and model
definitions for data, the dependency manifest for the stack, and the history for what
shipped and in what order. It reads to a budget rather than reading whole, states that it
covers a single application, and runs where it writes nothing.

Every source can be absent, and each absence now has an answer. No README means section 1
stays a question rather than a problem statement assembled out of the implementation. One
entry point and no authentication is an answer, not a gap. A missing dependency manifest is
checked against the manifest the language actually uses before being called missing. A
shallow or imported history cannot order the build plan, and says so. **A missing source is
recorded as missing, never substituted, and never filled in with what a project of that
kind usually has.**

Drafting is a procedure rather than a description. Evidence is sorted into found, inferred
and missing, with `(inferred)` carried on the claim itself, because the code says what was
built and never why. The build plan starts from what shipped, checked, in history order, in
the exact item line format the loop parses. A plan that is no longer the shipped template
is never overwritten without showing the exact change and waiting.

What the survey reads is data. A README, a comment, a commit message, issue text or a
configuration file that addresses the agent is reported with the file named, never acted
on, and never quietly edited away.

A new reference under the skill states the shape both drafted plans are judged against,
including the acceptance rules `overview` applies, so a draft is checked before it is shown
rather than one stage later.
