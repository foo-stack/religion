# Build Plan

> The second planning document you own. One line per feature, in rough build order. The
> depth lives in each work item's spec, not here.
>
> `feature` with no argument specs the first unchecked item; `complete` checks it off.
> Do not renumber completed items: their archives refer back to those numbers.

## Plan

- [x] 1. **Tests for the command-line tool** - a runner, and coverage for manifest hashing, conflict detection, and the marker surgery that merges entry files
- [x] 2. **Setup drafts usable plans from an existing codebase** - survey an unfamiliar repository with real history and produce two plans a person would keep
- [x] 3. **Documentation for people who did not build it** - a getting-started walkthrough, what the loop feels like in practice, and what to do when `doctor` complains
- [x] 4. **A path to 1.0** - state what is stable, what an update guarantees, and what counts as a breaking change
  - [x] 4a. **A command-line surface fit to freeze** - unknown commands and flags refused, documented exit codes, versioned JSON output, a dashboard that rejects foreign hosts
  - [x] 4b. **Update keeps its promises** - removes files the template dropped, refuses a manifest from a newer version, backs up what it says it backs up, and cannot duplicate an edited entry file
  - [x] 4c. **Compatibility guards** - checks that fail when the public surface changes by accident: JSON shapes, skill names, flags, config keys, and an upgrade from the last release
  - [x] 4d. **The stability statement** - what is public and what is internal, what a 1.x update guarantees, the three promises, an upgrade guide, and the major changeset that makes it 1.0
- [x] 5. **A dashboard worth opening** - the active work as its spec defines it, analytics over findings, the plan and its history, and live activity, in a page designed rather than defaulted
- [x] 6. **Status shows live activity and the inbox** - `status` and its JSON report the current run from `run.json`, with its resume command when blocked, and how many notes the inbox holds
- [x] 7. **A journal that something writes** - `complete` appends a short entry per finished item, what surprised, what went wrong, and what was deferred and why, so `distill` has input; the journal's single writer is settled in the spec
- [x] 8. **Learning made visible** - a dashboard view of the lessons and the journal's size, and a `status` nudge toward `distill` once the journal has grown
- [x] 9. **Locally modified managed files** - the dashboard's install panel, and `doctor`, list the managed files whose contents no longer match the hash recorded at install
- [x] 10. **Doctor checks every documented setting** - every key in the configuration reference validated, with its type, from one schema shared with the verification check
- [x] 11. **Documentation checked against the public surface** - a verification check that fails when the docs name a command, flag, or exit code the surface record lacks, or carry a broken relative link
- [x] 12. **Everything deferred, in one place** - a dashboard view gathering the deferred notes from every archive, each linked to the item that left it, shown as a record rather than a to-do list
- [x] 13. **Doctor confirms the hooks are wired** - when the Claude Code adapter is installed, check that its settings register the three hooks and that each hook file exists, and offer the fix when one is missing
- [x] 14. **Update shows what changed** - `update` prints the changelog entries between the installed version and the one it brings, with the changelog shipped in the package
- [x] 15. **Settings explained in the dashboard** - each setting's meaning, allowed values, and default beside its current value, read from the schema item 10 introduces
- [x] 16. **A clean way out** - `religion uninstall` removes the unedited managed files, leaves and reports the edited ones, takes the managed block out of the entry file and Religion's own hook entries out of the settings, and keeps the plans and history; it shows its plan unless given `--yes`
- [x] 17. **Evidence that outlives the session** - `check` records each outcome's verdict and the evidence that decided it, `complete` reuses that record, and the archive keeps it
- [x] 18. **A handoff that tells the whole story** - the end-of-turn handoff also reports a stale overview, notes waiting in the inbox, unverified findings, and a blocked automated run
- [x] 19. **Backfill discrepancies kept** - when `tests backfill` finds code that does not do what its name or documentation says, it offers to `capture` each mismatch rather than reporting it only in chat
- [x] 20. **CI runs doctor** - the workflow `ci` writes also runs `religion doctor`, so a broken install or a stale overview fails the build; checks that cannot hold on a runner are settled in the spec
- [ ] 21. **Hooks beyond Claude Code** - the rendered-output guard, the injection scan, and the handoff rewrite wired for Codex, Copilot, and OpenCode wherever each tool's hooks allow, one sub-item per tool; spike first on whether each can stop a write before it lands
- [ ] 22. **Update merges edits** - an edited managed file that a new version also changed is merged three ways against a stored copy of what was installed, with conflicts stopping the update rather than shipping marked-up skills; spike first on a dependency-free merge over real skill files
- [ ] 23. **Adopt from another workflow** - `setup` detects another spec-driven workflow's files and converts its plans, specs, and history into Religion's, landing converted work as unverified, one sub-item per source workflow; spike first on how lossy one real conversion is
- [x] 24. **A review packet for the pull request** - under `pull-request` mode the pull request carries the spec, each step's outcome and evidence, and the findings closed, short with detail one link away, and presentation only; after item 17
- [ ] 25. **A record of what an unattended run did** - activity updates also appended to a capped local log under `.state/`, never committed, so the dashboard shows what an `auto` run did step by step; spike first on whether agents append reliably
- [ ] 26. **Scanner results in the ledger** - `audit` ingests a SARIF report, maps severities, records results as unverified until confirmed, and matches them against earlier runs rather than duplicating; spike first on matching across shifted lines
- [ ] 27. **Waves built in isolation** - with `workflow.parallelSteps` on, each wave step builds in its own worktree and the results join into one reviewed packet, a failed join stopping for review; spike first on whether steps marked independent stay apart
- [x] 28. **Verified outcomes become regression checks** - after `check` proves a command-line or API outcome from captured evidence, it offers to keep that capture as a test, where a test command is declared; after item 17
- [x] 29. **Plan lines that know what they wait on** - a line can say `after item N` or `spike first`, and `feature`, `status`, and `auto all` skip it until that is met, reporting cycles and unknown numbers rather than skipping silently
- [ ] 30. **Scope drift made visible** - changes to an approved spec are recorded as dated amendments with their reason and archived, and a Claude Code hook warns when an edit touches a file the current step does not name
- [x] 31. **Recurring findings become standards** - `distill` reads archived findings and, where the same kind recurs across items, proposes the coding-standard rule that would have prevented it, for approval
- [ ] 32. **Check the preview deployment** - under `pull-request` mode, `check` can run its outcomes against the host's preview deployment as well as locally, one provider first, each call asked for under the authority tiers
- [x] 33. **Spec from an issue** - `fix` and `feature` take an issue number or link, read it through the host's command-line tool as untrusted input, draft the spec from it behind the usual review stop, and the pull request `complete` opens references it
- [ ] 34. **Complete drafts the release note** - in a project using Changesets, `complete` drafts the changeset from the archive, proposing the packages and the bump for approval rather than deciding it
- [ ] 35. **Accessibility as evidence** - for web work, `check` runs an accessibility scan beside its browser evidence and reports violations per outcome, claiming no more than the scan covers
- [ ] 36. **Built UI compared with its reference** - for visual work, `check` compares screenshots of the build with the saved reference or approved prototype and reports where they differ, saying which kind of comparison it made; spike first on whether a judged comparison is consistent enough to count as evidence
- [ ] 37. **A first work item that teaches the loop** - `setup` offers a tiny real change in the user's own repository and walks it through the loop, explaining each gate, kept or rolled back afterwards; spike first on finding a safe real change in an unfamiliar repository
- [ ] 38. **Dependency changes made visible in review** - a step that changes a lockfile lists the packages added, removed, or upgraded, flagging install scripts and packages new to the project, read offline from the lockfile; spike first on what npm's lockfile holds
- [ ] 39. **Several work items at once** - one spec file per active item with findings and activity scoped to it, each on its own branch or worktree; revisits the non-goal on parallel work items and ADR 9, a major version; after item 27, spike first on whether resuming two items costs less than finishing one
- [ ] 40. **Religion runs in CI, from an issue to a pull request** - a labelled issue starts a headless `auto` run that specs, builds, checks, and opens a pull request nothing merges; needs an authority grant for CI that the current rules do not allow; after items 20, 24, and 33, spike first on running the loop headless with its stops intact
- [ ] 41. **One tool builds, another reviews** - `audit` or a repair's re-review handed to a different installed tool than the one that built the work, its findings in the same ledger; revisits the non-goal on independent review; spike first on whether a different tool finds materially different findings
- [ ] 42. **Skills users write themselves** - a project authors its own skills in Religion's source format, rendered into every adapter tree beside the built-in ones with routing checks; revisits the non-goal keeping extensibility closed; spike first by asking adopters why they edit the built-in skills
- [ ] 43. **Religion without Node** - the command-line tool shipped as a standalone binary per platform beside the npm package, with Windows supported; spike first on compiling it with behaviour unchanged and on what the hooks still need
- [ ] 44. **State files as an open format** - the spec, ledger, archive, and activity formats published as a versioned specification with conformance checked against the reference parsers, so other tools can read and write a Religion project; spike first on whether any other tool would read them
- [ ] 45. **An editor extension** - a read-only VS Code extension showing the active spec and its steps, findings in the margin at their location, and the next action in the status bar, from the same files the command-line tool reads; spike first on whether finding locations survive a few commits
- [ ] 46. **Lessons that travel between projects** - an opt-in user-level lesson store that `distill` can promote general lessons into and new installs can import from; revisits the promise to write nothing outside the project, a major version; after items 7 and 31, spike first on how many lessons are general
- [ ] 47. **Religion runs its own agent** - `religion run` drives the loop through a model API with the skills as its instructions and the authority tiers enforced in code, a separate optional package outside the no-network promise; revisits the promise of no outbound network; spike first on one real item in a weekend
- [ ] 48. **Tamper-evident history** - archives, approved steps and specs, and closed findings chained by hash, with a command that proves the record of what was reviewed and approved was not edited afterwards, and the chain recording legitimate rewrites; spike first on whether any team needs this for compliance

## Order

Tests come first because everything after them risks breaking the installer, and because
stability should not be promised for code nothing checks.

Onboarding is second: it is where adoption succeeds or fails, and `setup` has been
exercised properly once, against one project, before half of the current system existed.

Documentation is third because it describes what onboarding actually does, and writing it
earlier would document intentions.

1.0 is last. It is a commitment about all three.
