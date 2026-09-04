# Project configuration

`religion/config.json` is user-owned project policy. Workflow skills read it before
acting. A missing file means the built-in defaults. An invalid file falls back to defaults
for read-only reporting, but a skill that is about to change something stops and points at
the health check rather than guessing.

Configuration can make review and verification stricter, tune local branch naming, and
bound an automated run. It never grants authority: the tiers in the entry file's Authority
section are not configurable, and no value here permits a merge, push, deploy, publication,
deletion, waived check, or accepted finding.

| Setting | Values | Default |
| --- | --- | --- |
| `workflow.stepReview` | `every`, `item` | `every` |
| `workflow.parallelSteps` | `true`, `false` | `false` |
| `git.mode` | `trunk`, `branch-per-item`, `pull-request` | `trunk` |
| `git.checkpoints` | `none`, `every-step`, `squash` | `every-step` |
| `git.featureBranchPrefix` | lowercase prefix ending in `/` | `feature/` |
| `git.fixBranchPrefix` | lowercase prefix ending in `/` | `fix/` |
| `git.rollbackBranchPrefix` | lowercase prefix ending in `/` | `rollback/` |
| `git.refactorBranchPrefix` | lowercase prefix ending in `/` | `refactor/` |
| `git.integrationBranchPrefix` | lowercase prefix ending in `/` | `auto/` |
| `verification.logicTests` | `when-configured`, `required` | `when-configured` |
| `verification.uiEvidence` | `when-available`, `required` | `when-available` |
| `qualityGates.audit` | `manual`, `when-sensitive`, `always` | `when-sensitive` |
| `qualityGates.check` | `manual`, `when-behavioral`, `always` | `when-behavioral` |
| `auto.maxItems` | positive integer, or `null` for no limit | `null` |
| `auto.maxRepairAttempts` | integer from 0 through 10 | `2` |
| `auto.finalAudit` | `true`, `false` | `false` |
| `security.blockInjection` | `true`, `false` | `false` |
| `refactor.maxFileLines` | positive integer | `400` |
| `refactor.maxFunctionLines` | positive integer | `50` |

Thirteen settings, down from the source's fourteen, with a different distribution: the
source spent six on quality gates and none on git mode.

## Quality gates

One set of gate policies applies to all work, automated or not. The source kept two
parallel sets; a single set means there is one answer to "when does the audit run" rather
than two that can disagree.

`manual` means the skill stays available but never runs on its own. `when-sensitive` runs
the audit for authentication, authorization, payments, secrets, personal data, migrations,
destructive operations, external side effects, security boundaries, and unusually broad
changes. `when-behavioral` runs the check when an outcome needs observed runtime behavior:
a click, a request, a download, a background job, or a flow across screens. `always`
applies the gate to every work item.

There is no try-guide gate. The manual walkthrough is generated for every completed work
item, so there is nothing to configure.

## Parallel steps

`workflow.parallelSteps` ships `false`, and while it is off a spec's parallel markers are
ignored entirely. That is deliberate: a spec carrying markers has to build identically in a
project that never opted in, or the markers become a way to change how somebody else's
project executes.

Turned on, steps marked as running with an earlier step form a wave and are built
concurrently, each in its own subagent that returns rather than writes. The parent performs
every write, and the wave is reviewed as one packet. `workflow.stepReview` still decides
when that review happens.

## Branch prefixes

One prefix per kind of work item, plus one for the branch an automated run integrates on.
They take effect under `branch-per-item` and `pull-request`. Under `trunk` they are inert,
and kept so that switching modes does not require reconfiguring.

`git.integrationBranchPrefix` is used only by an automated run under `pull-request`, which
creates one branch of that name per run, dated, and lands every item into it before opening
a single aggregate pull request.

## Injection scanning

`security.blockInjection` decides what happens when content read into context carries
three or more known injection signatures. It ships `false`, which warns and carries on,
because a false positive that halts real work costs more than a warning nobody needed. Set
it `true` to block the read instead.

The rule it enforces is in `religion/context/untrusted-input.md` and applies to every tool.
The hook is a net for the one tool that runs hooks.

## Refactor thresholds

`refactor.maxFileLines` and `refactor.maxFunctionLines` are what the `structure` lens
measures against. They are defaults rather than a standard any project agreed to, so a
project with its own limits configured in a linter should copy those numbers here.

## Automated runs

`auto.maxItems` bounds how many work items one run may complete. `auto.maxRepairAttempts`
bounds repeated attempts to repair the same finding before the run stops and reports.
`auto.finalAudit` adds one review across everything the run produced.

None of these change what an automated run is permitted to do. That is set by the
authority tiers, where an automated invocation grants routine actions for the run and
never grants a merge.
